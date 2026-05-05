// api/payfast-itn.js
// PayFast Instant Transaction Notification (ITN) handler.
// Verifies signature, validates with PayFast server, updates Supabase.

import crypto from 'crypto';
import https  from 'https';
import { createClient } from '@supabase/supabase-js';

// Service role client — bypasses RLS for tier updates
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  try {
    const params = req.body; // Vercel parses x-www-form-urlencoded automatically

    // ── Step 1: Verify signature ─────────────────────────────────────────────
    const { signature, ...rest } = params;
    const passphrase = process.env.PAYFAST_PASSPHRASE;

    const paramString = Object.keys(rest)
      .sort()
      .filter(k => rest[k] !== '')
      .map(k => `${k}=${encodeURIComponent(rest[k]).replace(/%20/g, '+')}`)
      .join('&');

    const stringToHash = passphrase
      ? `${paramString}&passphrase=${encodeURIComponent(passphrase).replace(/%20/g, '+')}`
      : paramString;

    const expectedSig = crypto.createHash('md5').update(stringToHash).digest('hex');

    if (expectedSig !== signature) {
      console.error('PayFast ITN: Signature mismatch — possible tampering');
      return res.status(400).end();
    }

    // ── Step 2: Validate with PayFast server ─────────────────────────────────
    const isSandbox = process.env.PAYFAST_SANDBOX === 'true';
    const validateHost = isSandbox
      ? 'sandbox.payfast.co.za'
      : 'www.payfast.co.za';

    const isValid = await validateWithPayFast(validateHost, paramString);
    if (!isValid) {
      console.error('PayFast ITN: Server validation failed');
      return res.status(400).end();
    }

    // ── Step 3: Update Supabase ───────────────────────────────────────────────
    const {
      payment_status,
      m_payment_id,
      custom_str1: userId,
    } = params;

    if (!userId) {
      console.error('PayFast ITN: No userId in custom_str1');
      return res.status(400).end();
    }

    if (payment_status === 'COMPLETE') {
      const { error } = await supabase
        .from('users')
        .update({
          user_tier:               'pro',
          subscription_id:         m_payment_id,
          subscription_status:     'active',
          subscription_updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        console.error('Supabase update error (COMPLETE):', error);
      } else {
        console.log(`PayFast ITN: Upgraded user ${userId} to Pro`);
      }

    } else if (payment_status === 'CANCELLED') {
      // Start 3-day grace period — do not immediately lock out
      const graceExpiry = new Date();
      graceExpiry.setDate(graceExpiry.getDate() + 3);

      const { error } = await supabase
        .from('users')
        .update({
          subscription_status:     'cancelled',
          grace_period_expires_at: graceExpiry.toISOString(),
          subscription_updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        console.error('Supabase update error (CANCELLED):', error);
      } else {
        console.log(`PayFast ITN: Cancelled user ${userId}, grace until ${graceExpiry.toISOString()}`);
      }

    } else if (payment_status === 'FAILED') {
      // Same grace logic as cancellation
      const graceExpiry = new Date();
      graceExpiry.setDate(graceExpiry.getDate() + 3);

      const { error } = await supabase
        .from('users')
        .update({
          subscription_status:     'failed',
          grace_period_expires_at: graceExpiry.toISOString(),
          subscription_updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        console.error('Supabase update error (FAILED):', error);
      } else {
        console.log(`PayFast ITN: Failed payment for user ${userId}, grace until ${graceExpiry.toISOString()}`);
      }
    }

    // PayFast requires a 200 response to acknowledge receipt
    return res.status(200).end();

  } catch (err) {
    console.error('PayFast ITN unexpected error:', err);
    return res.status(500).end();
  }
}

// Validates the ITN data against PayFast's own server
function validateWithPayFast(host, paramString) {
  return new Promise((resolve) => {
    const options = {
      host,
      port: 443,
      path: '/eng/query/validate',
      method: 'POST',
      headers: {
        'Content-Type':   'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(paramString),
      },
    };

    const request = https.request(options, (response) => {
      let data = '';
      response.on('data', chunk => { data += chunk; });
      response.on('end', () => {
        resolve(data === 'VALID');
      });
    });

    request.on('error', (err) => {
      console.error('PayFast validate request error:', err);
      resolve(false);
    });

    request.write(paramString);
    request.end();
  });
}
