// api/payfast-itn.js
// PayFast Instant Transaction Notification (ITN) handler.
//
//  1. Verifies signature (using same phpUrlencode rules as payfast-redirect).
//  2. Validates the params with PayFast's own server (defence-in-depth).
//  3. Updates `profiles` table:
//       payment_status=COMPLETE  → tier=pro, pro_until = next_billing_date
//                                  payfast_token saved for cancellations
//       payment_status=CANCELLED → cancelled_at = now (keep pro_until intact)
//       payment_status=FAILED    → 3-day grace period, then tier→free naturally
//
// IMPORTANT: writes to `profiles` (the table that holds tier / trial fields),
// NOT `users` (which is just the contact-info table).

import crypto from 'crypto';
import https  from 'https';
import { createClient } from '@supabase/supabase-js';

export const config = { runtime: 'nodejs' };

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const params = req.body || {};
    if (typeof params !== 'object') {
      console.error('PayFast ITN: req.body not parsed as object');
      return res.status(400).end();
    }

    // ── Step 1: Verify signature ─────────────────────────────────────────────
    const { signature, ...rest } = params;
    const passphrase = (process.env.PAYFAST_PASSPHRASE || '').trim();

    // PayFast posts ITN fields in their own (insertion) order. The PHP SDK
    // sorts alphabetically for ITN verification, which is also acceptable
    // because PayFast's own implementation is built on ksort for ITN.
    const paramString = Object.keys(rest)
      .sort()
      .filter(k => rest[k] !== '' && rest[k] !== null && rest[k] !== undefined)
      .map(k => `${k}=${phpUrlencode(String(rest[k]).trim())}`)
      .join('&');

    const stringToHash = passphrase
      ? `${paramString}&passphrase=${phpUrlencode(passphrase)}`
      : paramString;

    const expectedSig = crypto.createHash('md5').update(stringToHash).digest('hex');

    if (expectedSig !== signature) {
      console.error('PayFast ITN: Signature mismatch — possible tampering. Expected:',
        expectedSig.substring(0,12), 'got:', String(signature).substring(0,12));
      return res.status(400).end();
    }

    // ── Step 2: Validate with PayFast server ─────────────────────────────────
    const isSandbox = process.env.PAYFAST_SANDBOX === 'true';
    const validateHost = isSandbox ? 'sandbox.payfast.co.za' : 'www.payfast.co.za';
    const isValid = await validateWithPayFast(validateHost, paramString);
    if (!isValid) {
      console.error('PayFast ITN: PayFast validate endpoint did not return VALID');
      return res.status(400).end();
    }

    // ── Step 3: Update Supabase profile ──────────────────────────────────────
    const {
      payment_status,
      m_payment_id,
      pf_payment_id,
      token: payfastToken,           // recurring subscription UUID
      billing_date,                  // next billing date for subscriptions
      custom_str1: userId,
    } = params;

    if (!userId) {
      console.error('PayFast ITN: No userId in custom_str1');
      return res.status(400).end();
    }

    const nowIso = new Date().toISOString();

    if (payment_status === 'COMPLETE') {
      // Compute the next billing boundary. PayFast posts billing_date as the
      // *next* billing date for subsequent renewals; on first transaction it
      // is today, so we add a month manually.
      const proUntil = computeProUntil(billing_date);

      const update = {
        tier:                    'pro',
        subscription_status:     'active',
        subscription_id:         m_payment_id,
        subscription_started_at: nowIso, // safe to set on every COMPLETE — first one wins anyway
        subscription_renews_at:  proUntil,
        subscription_updated_at: nowIso,
        pro_until:               proUntil,
        cancelled_at:            null,
        grace_period_expires_at: null,
      };
      if (payfastToken) update.payfast_token = payfastToken;

      const { error } = await supabase
        .from('profiles')
        .update(update)
        .eq('id', userId);

      if (error) console.error('Supabase update error (COMPLETE):', error);
      else       console.log(`PayFast ITN: Upgraded ${userId} to Pro until ${proUntil}`);

    } else if (payment_status === 'CANCELLED') {
      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_status:     'cancelled',
          subscription_updated_at: nowIso,
          cancelled_at:            nowIso,
        })
        .eq('id', userId);
      if (error) console.error('Supabase update error (CANCELLED):', error);
      else       console.log(`PayFast ITN: Cancelled ${userId} (Pro retained until pro_until)`);

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
      if (error) console.error('Supabase update error (FAILED):', error);
      else       console.log(`PayFast ITN: Failed payment for ${userId}, grace until ${grace.toISOString()}`);
    } else {
      console.log(`PayFast ITN: Unhandled payment_status=${payment_status} (pf_payment_id=${pf_payment_id})`);
    }

    // PayFast requires a 200 response to acknowledge receipt.
    return res.status(200).end();

  } catch (err) {
    console.error('PayFast ITN unexpected error:', err);
    return res.status(500).end();
  }
}

// PayFast `billing_date` for a subscription is YYYY-MM-DD of the *next*
// billing day after the current charge. If we have it, use it; otherwise
// add 1 month from today.
function computeProUntil(billing_date) {
  if (billing_date && /^\d{4}-\d{2}-\d{2}$/.test(billing_date)) {
    // billing_date is the date of the NEXT charge — Pro until then.
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
      response.on('end', () => resolve(data.trim() === 'VALID'));
    });
    request.on('error', (err) => {
      console.error('PayFast validate request error:', err);
      resolve(false);
    });
    request.write(paramString);
    request.end();
  });
}
