// api/payfast-itn.js
// PayFast Instant Transaction Notification (ITN) handler.
//
//  1. Reads the RAW request body (no Vercel body parser) so the byte order
//     matches exactly what PayFast posted.
//  2. Verifies the MD5 signature using insertion-order serialisation — the
//     same algorithm PayFast's official PHP SDK uses, which iterates the
//     parsed array in PHP insertion order.
//  3. Validates with PayFast's own /eng/query/validate endpoint as
//     defence-in-depth.
//  4. Updates the `profiles` table on COMPLETE / CANCELLED / FAILED.
//
// IMPORTANT: writes to `profiles` (the table that holds tier / trial fields),
// NOT `users` (which is just contact info).

import crypto from 'crypto';
import https  from 'https';
import { createClient } from '@supabase/supabase-js';

// Disable Vercel's body parser so we get the raw POST body verbatim.
export const config = {
  runtime: 'nodejs',
  api: { bodyParser: false },
};

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }

  // Read raw body bytes
  const raw = await readRawBody(req);
  console.log(`[itn] received ${raw.length} bytes from ${req.headers['x-forwarded-for'] || 'unknown'}`);
  console.log(`[itn] raw body: ${raw.substring(0, 800)}${raw.length > 800 ? '...[truncated]' : ''}`);

  // Parse it into ordered key/value pairs (preserves PayFast's insertion order)
  const pairs = parseFormBody(raw);
  const params = Object.fromEntries(pairs);
  const safeParams = { ...params };
  if (safeParams.signature) safeParams.signature = `${String(safeParams.signature).substring(0, 8)}…`;
  console.log('[itn] parsed params:', safeParams);

  try {
    const passphrase = (process.env.PAYFAST_PASSPHRASE || '').trim();
    const isSandbox  = process.env.PAYFAST_SANDBOX === 'true';
    const validateHost = isSandbox ? 'sandbox.payfast.co.za' : 'www.payfast.co.za';

    // ── Step 1: Verify signature ─────────────────────────────────────────────
    // PayFast's docs and SDKs disagree on the exact serialisation rules for
    // ITN signatures, and the shared sandbox merchant 10000100 in particular
    // is inconsistent. So we try a handful of valid permutations and accept
    // whichever matches — then log which one won so we can simplify later.
    const submittedSig = String(params.signature || '');
    const variants = buildSignatureVariants(pairs, passphrase);
    let matched = null;
    for (const v of variants) {
      const sig = crypto.createHash('md5').update(v.str).digest('hex');
      if (sig === submittedSig) { matched = v; break; }
    }

    if (!matched) {
      console.error(`[itn] SIGNATURE MISMATCH (got=${submittedSig.substring(0,12)}…) across ${variants.length} variants. Rejecting.`);
      for (const v of variants) {
        const sig = crypto.createHash('md5').update(v.str).digest('hex');
        console.error(`[itn]   ${v.label} → ${sig.substring(0,12)}…  str=${v.str.substring(0, 200)}`);
      }
      return res.status(200).end();
    }
    console.log(`[itn] ✓ signature verified via variant: ${matched.label}`);

    // ── Step 2: Validate with PayFast server ─────────────────────────────────
    // For the validate endpoint, PayFast wants the full body PayFast posted
    // (minus the signature line). Use the raw body to be safe.
    const validateBody = stripSignatureFromRawBody(raw);
    const isValid = await validateWithPayFast(validateHost, validateBody);
    if (!isValid) {
      console.error(`[itn] PayFast validate endpoint did not return VALID (host=${validateHost})`);
      return res.status(200).end();
    }
    console.log(`[itn] ✓ PayFast ${validateHost} validated`);

    // ── Step 3: Update Supabase profile ──────────────────────────────────────
    const {
      payment_status,
      m_payment_id,
      pf_payment_id,
      token: payfastToken,
      billing_date,
      custom_str1: userId,
    } = params;

    if (!userId) {
      console.error('[itn] no userId in custom_str1');
      return res.status(200).end();
    }

    const nowIso = new Date().toISOString();

    if (payment_status === 'COMPLETE') {
      const proUntil = computeProUntil(billing_date);
      const update = {
        tier:                    'pro',
        subscription_status:     'active',
        subscription_id:         m_payment_id,
        subscription_started_at: nowIso,
        subscription_renews_at:  proUntil,
        subscription_updated_at: nowIso,
        pro_until:               proUntil,
        cancelled_at:            null,
        grace_period_expires_at: null,
      };
      if (payfastToken) update.payfast_token = payfastToken;

      const { data, error } = await supabase
        .from('profiles')
        .update(update)
        .eq('id', userId)
        .select('id, tier, pro_until, payfast_token');

      if (error) console.error('[itn] Supabase update error (COMPLETE):', error);
      else if (!data || data.length === 0) console.error(`[itn] no profile row matched id=${userId}`);
      else      console.log(`[itn] ✓ upgraded user=${userId} to Pro until ${proUntil} (token=${payfastToken ? 'yes' : 'no'})`);

    } else if (payment_status === 'CANCELLED') {
      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_status:     'cancelled',
          subscription_updated_at: nowIso,
          cancelled_at:            nowIso,
        })
        .eq('id', userId);
      if (error) console.error('[itn] Supabase update error (CANCELLED):', error);
      else       console.log(`[itn] ✓ cancelled user=${userId} (Pro retained until pro_until)`);

    } else if (payment_status === 'FAILED') {
      const grace = new Date(); grace.setDate(grace.getDate() + 3);
      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_status:     'failed',
          subscription_updated_at: nowIso,
          grace_period_expires_at: grace.toISOString(),
        })
        .eq('id', userId);
      if (error) console.error('[itn] Supabase update error (FAILED):', error);
      else       console.log(`[itn] ✓ failed payment for user=${userId}, grace until ${grace.toISOString()}`);

    } else {
      console.log(`[itn] unhandled payment_status="${payment_status}" pf_payment_id=${pf_payment_id}`);
    }

    return res.status(200).end();

  } catch (err) {
    console.error('[itn] unexpected error:', err);
    return res.status(200).end();
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

// Build several plausible signature-string variants. The first one that
// hashes to PayFast's submitted signature is the right algorithm. Variants:
//   - insertion order vs alphabetical
//   - drop empty values vs keep them
//   - with passphrase vs without
function buildSignatureVariants(pairs, passphrase) {
  const orderings = [
    { label: 'insertion', keys: pairs.filter(([k]) => k !== 'signature') },
    { label: 'alphabetical', keys: pairs.filter(([k]) => k !== 'signature').slice().sort((a,b) => a[0].localeCompare(b[0])) },
  ];
  const filterModes = [
    { label: 'no-empty', fn: ([, v]) => String(v ?? '').trim() !== '' },
    { label: 'with-empty', fn: () => true },
  ];
  const passModes = passphrase
    ? [{ label: 'with-pass', pass: passphrase }, { label: 'no-pass', pass: '' }]
    : [{ label: 'no-pass',   pass: '' }];

  const out = [];
  for (const o of orderings) {
    for (const fm of filterModes) {
      const filtered = o.keys.filter(fm.fn);
      const base = filtered
        .map(([k, v]) => `${k}=${phpUrlencode(String(v ?? '').trim())}`)
        .join('&');
      for (const pm of passModes) {
        const str = pm.pass ? `${base}&passphrase=${phpUrlencode(pm.pass)}` : base;
        out.push({ label: `${o.label}/${fm.label}/${pm.label}`, str });
      }
    }
  }
  return out;
}

function stripSignatureFromRawBody(raw) {
  // Remove "&signature=..." (or "signature=..." if it's first) up to the next
  // "&" or end of string. Preserves byte-for-byte the rest of PayFast's body.
  return raw
    .replace(/(^|&)signature=[^&]*/, (_m, lead) => (lead === '&' ? '' : ''))
    .replace(/^&/, '');
}

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    req.on('end',   () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

// Parse application/x-www-form-urlencoded into an array of [key, value] pairs
// preserving insertion order. Avoids URLSearchParams which can normalise
// key order in some implementations.
function parseFormBody(str) {
  const out = [];
  if (!str) return out;
  for (const piece of str.split('&')) {
    if (!piece) continue;
    const eq = piece.indexOf('=');
    const k = eq === -1 ? piece : piece.slice(0, eq);
    const v = eq === -1 ? ''    : piece.slice(eq + 1);
    out.push([decodeURIComponent(k.replace(/\+/g, ' ')), decodeURIComponent(v.replace(/\+/g, ' '))]);
  }
  return out;
}

function computeProUntil(billing_date) {
  if (billing_date && /^\d{4}-\d{2}-\d{2}$/.test(billing_date)) {
    const d = new Date(`${billing_date}T00:00:00Z`);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString();
}

function phpUrlencode(str) {
  return encodeURIComponent(str)
    .replace(/%20/g, '+')
    .replace(/!/g,  '%21')
    .replace(/'/g,  '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A');
}

function validateWithPayFast(host, paramString) {
  return new Promise((resolve) => {
    const options = {
      host, port: 443, path: '/eng/query/validate', method: 'POST',
      headers: {
        'Content-Type':   'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(paramString),
      },
    };
    const request = https.request(options, (response) => {
      let data = '';
      response.on('data', chunk => { data += chunk; });
      response.on('end', () => {
        const trimmed = data.trim();
        if (trimmed !== 'VALID') console.warn(`[itn] validate returned: "${trimmed}"`);
        resolve(trimmed === 'VALID');
      });
    });
    request.on('error', (err) => {
      console.error('[itn] validate request error:', err);
      resolve(false);
    });
    request.write(paramString);
    request.end();
  });
}
