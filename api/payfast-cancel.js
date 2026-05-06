// api/payfast-cancel.js
// Cancels a user's active PayFast subscription via the Subscription
// Management API, then marks the profile as cancelled. Pro access is
// retained until `pro_until` (the end of the paid period) so users get
// what they paid for.
//
// Auth: requires a valid Supabase access token in Authorization: Bearer …
// We trust the JWT to identify the user; we then look up *their* PayFast
// token from `profiles` (never accept a token from the client).

import crypto from 'crypto';
import https  from 'https';
import { createClient } from '@supabase/supabase-js';

export const config = { runtime: 'nodejs' };

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // ── Step 1: Identify the caller via Supabase JWT ────────────────────────
    const authHeader = req.headers.authorization || '';
    const accessToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!accessToken) return res.status(401).json({ error: 'Not signed in.' });

    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(accessToken);
    if (authErr || !user) return res.status(401).json({ error: 'Invalid session.' });

    // ── Step 2: Look up the user's PayFast subscription token ────────────────
    const { data: profile, error: profErr } = await supabaseAdmin
      .from('profiles')
      .select('payfast_token, tier, cancelled_at, pro_until')
      .eq('id', user.id)
      .single();

    if (profErr || !profile) return res.status(404).json({ error: 'Profile not found.' });
    if (profile.cancelled_at)        return res.status(409).json({ error: 'Subscription is already cancelled.' });
    if (!profile.payfast_token)      return res.status(409).json({ error: 'No active PayFast subscription found.' });

    // ── Step 3: Call PayFast Subscription Management API ─────────────────────
    // PayFast's API host is api.payfast.co.za for BOTH live and sandbox.
    // For sandbox transactions, append `?testing=true` to the path. The
    // earlier sandbox.payfast.co.za is the *payment* site (Laravel app with
    // CSRF middleware) — hitting it returns 419 CSRF mismatch errors.
    const merchantId  = (process.env.PAYFAST_MERCHANT_ID  || '').trim();
    const passphrase  = (process.env.PAYFAST_PASSPHRASE   || '').trim();
    const isSandbox   = process.env.PAYFAST_SANDBOX === 'true';
    const apiHost     = 'api.payfast.co.za';
    const testingFlag = isSandbox ? '?testing=true' : '';
    const path        = `/subscriptions/${encodeURIComponent(profile.payfast_token)}/cancel${testingFlag}`;

    if (!merchantId) {
      console.error('payfast-cancel: PAYFAST_MERCHANT_ID env var missing');
      return res.status(500).json({ error: 'Payment configuration error.' });
    }

    const timestamp = new Date().toISOString();
    const version   = 'v1';

    // PayFast API signing: ksort over the headers (merchant-id, timestamp,
    // version) plus the optional passphrase, php-urlencode each value, join
    // with '&', then MD5. Identical algorithm to the form-post signature.
    const headerParams = { 'merchant-id': merchantId, version, timestamp };
    if (passphrase) headerParams.passphrase = passphrase;

    const sigSrc = Object.keys(headerParams).sort()
      .map(k => `${k}=${phpUrlencode(String(headerParams[k]).trim())}`)
      .join('&');
    const apiSignature = crypto.createHash('md5').update(sigSrc).digest('hex');

    console.log(`[cancel] PUT https://${apiHost}${path} sig=${apiSignature.substring(0,12)}…`);

    const pfResponse = await pfRequest({
      host: apiHost, path, method: 'PUT',
      headers: {
        'merchant-id': merchantId,
        version, timestamp,
        signature: apiSignature,
        accept:           'application/json',
        'x-requested-with': 'XMLHttpRequest', // belt-and-braces against any CSRF middleware
      },
    });

    // PayFast returns 200 with JSON. We treat any non-2xx as failure but
    // still proceed to mark as cancelled in our DB to avoid leaving the user
    // stranded — log so we can reconcile manually.
    if (pfResponse.statusCode < 200 || pfResponse.statusCode >= 300) {
      console.error(`[cancel] PayFast API ${pfResponse.statusCode}: ${pfResponse.body.substring(0, 400)}`);
    } else {
      console.log(`[cancel] PayFast API ${pfResponse.statusCode}: ${pfResponse.body.substring(0, 200)}`);
    }

    // ── Step 4: Mark the profile as cancelled ────────────────────────────────
    const nowIso = new Date().toISOString();
    const proUntil = profile.pro_until || nowIso; // keep existing if set

    const { error: updErr } = await supabaseAdmin
      .from('profiles')
      .update({
        subscription_status:     'cancelled',
        subscription_updated_at: nowIso,
        cancelled_at:            nowIso,
        pro_until:               proUntil,
      })
      .eq('id', user.id);

    if (updErr) {
      console.error('payfast-cancel: Supabase update failed', updErr);
      return res.status(500).json({ error: 'Cancellation succeeded at PayFast but local update failed. Please contact support.' });
    }

    console.log(`payfast-cancel OK — user=${user.id} pro_until=${proUntil}`);
    return res.status(200).json({
      ok: true,
      pro_until: proUntil,
      message: 'Subscription cancelled. Pro access retained until end of current billing period.',
    });

  } catch (err) {
    console.error('payfast-cancel unexpected error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
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

function pfRequest({ host, path, method, headers, body }) {
  return new Promise((resolve, reject) => {
    const opts = { host, port: 443, path, method, headers };
    const req = https.request(opts, (resp) => {
      let data = '';
      resp.on('data', c => { data += c; });
      resp.on('end', () => resolve({ statusCode: resp.statusCode || 0, body: data }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}
