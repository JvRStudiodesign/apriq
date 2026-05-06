// api/payfast-redirect.js
//
// Accepts a normal HTML form POST from UpgradeModal (userId, email,
// firstName, lastName), builds the PayFast Custom-Integration params +
// signature, then responds with a 303 See Other redirect to the PayFast
// /eng/process URL with the signed params on the query string.
//
// PayFast /eng/process accepts both POST and GET; the MD5 signature is
// computed identically. Earlier iterations used a self-submitting POST
// form, but POST navigations to PayFast were being blocked client-side
// (stale service worker / browser extension / CSP). 303 → GET sidesteps
// every one of those by simply navigating the browser via Location.
//
// Field order: PayFast Custom-Integration documented order (NOT
// alphabetical). Alphabetical (ksort) is for their API integration only.
import crypto from 'crypto';

export const config = { runtime: 'nodejs' };

export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).send('Method not allowed');
  }

  try {
    const merchantId  = (process.env.PAYFAST_MERCHANT_ID  || '').trim();
    const merchantKey = (process.env.PAYFAST_MERCHANT_KEY || '').trim();
    const passphrase  = (process.env.PAYFAST_PASSPHRASE   || '').trim();
    const appUrl      = (process.env.APP_URL || 'https://www.apriq.co.za')
                          .trim()
                          .replace(/\/+$/, '');
    const isSandbox   = process.env.PAYFAST_SANDBOX !== 'false';

    if (!merchantId || !merchantKey) {
      console.error('payfast-redirect: PAYFAST_MERCHANT_ID / PAYFAST_MERCHANT_KEY env vars missing');
      return errorPage(res, 500, 'Payment configuration error.');
    }

    const body = req.body || {};
    const userId    = String(body.userId    || '').trim();
    const email     = String(body.email     || '').trim();
    const firstName = String(body.firstName || '').trim();
    const lastName  = String(body.lastName  || '').trim();

    if (!userId || !email) {
      console.error('payfast-redirect: missing userId or email in body');
      return errorPage(res, 400, 'Missing required user details. Please log in again.');
    }

    const mPaymentId = `${userId}-${Date.now()}`;

    // PayFast Custom-Integration documented field order (DO NOT REORDER).
    const params = {
      merchant_id:       merchantId,
      merchant_key:      merchantKey,
      return_url:        `${appUrl}/payment-success`,
      cancel_url:        `${appUrl}/payment-cancel`,
      notify_url:        `${appUrl}/api/payfast-itn`,
      name_first:        firstName,
      name_last:         lastName,
      email_address:     email,
      m_payment_id:      mPaymentId,
      amount:            '79.00',
      item_name:         'AprIQ Pro Monthly',
      item_description:  'Full access to all AprIQ Pro features',
      custom_str1:       userId,
      subscription_type: '1',
      billing_date:      new Date().toISOString().split('T')[0],
      recurring_amount:  '79.00',
      frequency:         '3',
      cycles:            '0',
    };

    const cleaned = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
    );

    const { signature, getString } = generateSignature(cleaned, passphrase || null);

    const payfastUrl = isSandbox
      ? 'https://sandbox.payfast.co.za/eng/process'
      : 'https://www.payfast.co.za/eng/process';

    console.log(
      `payfast-redirect OK — user=${userId} sandbox=${isSandbox} ` +
      `passphrase=${passphrase ? 'yes' : 'no'} sig=${signature.substring(0, 12)}...`
    );
    console.log(`payfast-redirect string-to-hash: ${getString}`);

    const finalParams = { ...cleaned, signature };

    // PayFast /eng/process accepts both POST and GET; the MD5 signature is
    // computed identically for both. Earlier iterations used a self-
    // submitting form / 303 redirect, but multiple browser-side things
    // (stale SW, extensions, CSP) ate the navigation silently. The most
    // bullet-proof path is: return JSON with the fully-signed GET URL,
    // and let the client do `window.location.href = url`.
    const queryString = Object.entries(finalParams)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
    const url = `${payfastUrl}?${queryString}`;

    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ url });

  } catch (err) {
    console.error('payfast-redirect error:', err);
    return errorPage(res, 500, 'Internal server error');
  }
}

function generateSignature(data, passPhrase = null) {
  let pfOutput = '';
  for (const [key, val] of Object.entries(data)) {
    const trimmed = String(val).trim();
    if (trimmed !== '') {
      pfOutput += `${key}=${phpUrlencode(trimmed)}&`;
    }
  }
  let getString = pfOutput.slice(0, -1);
  if (passPhrase !== null && passPhrase !== '') {
    getString += `&passphrase=${phpUrlencode(String(passPhrase).trim())}`;
  }
  const signature = crypto.createHash('md5').update(getString).digest('hex');
  return { signature, getString };
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

function escapeAttr(v) {
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function errorPage(res, code, msg) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  return res.status(code).send(`<!doctype html>
<html><head><meta charset="utf-8"><title>Payment error</title></head>
<body style="font-family:system-ui;padding:2rem;color:#B91C1C">
  <h1>Couldn't start payment</h1>
  <p>${escapeAttr(msg)}</p>
  <p><a href="/plans">Back to plan</a></p>
</body></html>`);
}
