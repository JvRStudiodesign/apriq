// api/payfast-redirect.js
//
// Accepts a normal HTML form POST from UpgradeModal (userId, email,
// firstName, lastName), builds the PayFast Custom-Integration params +
// signature, and responds with a self-submitting HTML page that POSTs to
// PayFast.
//
// Includes:
//   - explicit permissive CSP for this response so vercel.json's stricter
//     global CSP cannot block the redirect (we override it here on purpose).
//   - <button type="submit"> placed *inside* the form (most browser-
//     compatible — avoids the `form="id"` attribute fallback path).
//   - <a href> GET fallback that also works on /eng/process — useful if
//     anything still blocks form post.
//   - documented Custom-Integration field order — NOT alphabetical.
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

    const fields = Object.entries(finalParams)
      .map(([k, v]) => `<input type="hidden" name="${escapeAttr(k)}" value="${escapeAttr(v)}">`)
      .join('\n      ');

    // GET fallback URL (PayFast /eng/process accepts both POST and GET).
    const queryString = Object.entries(finalParams)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
    const getUrl = `${payfastUrl}?${queryString}`;

    // Override the global vercel.json CSP for this single response so it
    // cannot block form-action / inline script.
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "form-action 'self' https://sandbox.payfast.co.za https://www.payfast.co.za",
      "base-uri 'self'",
    ].join('; ');

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Security-Policy', csp);
    res.setHeader('X-Frame-Options', 'DENY');

    const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Redirecting to PayFast…</title>
<meta http-equiv="cache-control" content="no-store">
<style>
  body { font-family: Roboto, system-ui, sans-serif; background: #F9FAFA; color: #0F4C5C;
         display: flex; align-items: center; justify-content: center; height: 100vh;
         margin: 0; padding: 1rem; }
  .box { text-align: center; max-width: 440px; }
  .spinner { width: 36px; height: 36px; border: 3px solid #BFD1D6; border-top-color: #0F4C5C;
             border-radius: 50%; margin: 0 auto 16px; animation: spin 0.9s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .continue { display: inline-block; margin-top: 1.25rem; padding: 0.75rem 1.5rem;
              background: #0F4C5C; color: #F9FAFA; border: none; border-radius: 10px;
              font-size: 1rem; font-weight: 700; cursor: pointer; font-family: inherit;
              text-decoration: none; }
  .continue:hover { background: #0a3a47; }
  .alt { display: block; margin-top: 0.75rem; font-size: 0.85rem; color: #0F4C5C; text-decoration: underline; }
  .hint { font-size: 0.8rem; color: #979899; margin-top: 1rem; }
  form { margin: 0; }
</style>
</head>
<body>
  <div class="box">
    <div class="spinner"></div>
    <div>Redirecting to PayFast…</div>

    <form id="pf" method="POST" action="${escapeAttr(payfastUrl)}" target="_top">
      ${fields}
      <button type="submit" class="continue">Continue to PayFast</button>
    </form>

    <a class="alt" href="${escapeAttr(getUrl)}">Or click here if the button does not work</a>
    <p class="hint">If this page does not redirect automatically, click the button above.</p>
  </div>

  <script>
    (function(){
      try {
        var f = document.getElementById('pf');
        if (!f) { console.error('payfast-redirect: form not found'); return; }
        f.submit();
      } catch (e) { console.error('payfast-redirect submit (parse):', e); }
    })();
    document.addEventListener('DOMContentLoaded', function(){
      try {
        var f = document.getElementById('pf');
        if (f && !f._submitted) { f._submitted = true; f.submit(); }
      } catch (e) { console.error('payfast-redirect submit (DOMContentLoaded):', e); }
    });
  </script>
</body>
</html>`;

    return res.status(200).send(html);

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
  <p><a href="/billing">Back to billing</a></p>
</body></html>`);
}
