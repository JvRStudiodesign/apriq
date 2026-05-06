// api/payfast-sign.js
import crypto from 'crypto';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const merchantId  = process.env.PAYFAST_MERCHANT_ID;
    const merchantKey = process.env.PAYFAST_MERCHANT_KEY;
    const passphrase  = process.env.PAYFAST_PASSPHRASE || '';
    const appUrl      = process.env.APP_URL || 'https://www.apriq.co.za';
    const isSandbox   = process.env.PAYFAST_SANDBOX !== 'false';

    if (!merchantId || !merchantKey) {
      console.error('payfast-sign: merchant credentials not set');
      return res.status(500).json({ error: 'Payment configuration error.' });
    }

    const { userId, email, firstName = '', lastName = '' } = req.body || {};

    if (!userId || !email) {
      console.error('payfast-sign: missing userId or email');
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    const mPaymentId = `${userId}-${Date.now()}`;

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

    // Remove empty/null/undefined values
    const cleaned = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
    );

    // Signature string excludes merchant_key — PayFast verifies without it
    const sigParams = Object.fromEntries(
      Object.entries(cleaned).filter(([k]) => k !== 'merchant_key')
    );

    // PHP urlencode compatible — sort alphabetically
    const paramString = Object.keys(sigParams)
      .sort()
      .map(k => `${k}=${phpUrlencode(String(sigParams[k]))}`)
      .join('&');

    const stringToHash = passphrase
      ? `${paramString}&passphrase=${phpUrlencode(passphrase)}`
      : paramString;

    const signature = crypto.createHash('md5').update(stringToHash).digest('hex');

    const payfastUrl = isSandbox
      ? 'https://sandbox.payfast.co.za/eng/process'
      : 'https://www.payfast.co.za/eng/process';

    console.log(`payfast-sign OK — user=${userId} sandbox=${isSandbox}`);

    return res.status(200).json({
      payfastUrl,
      params: { ...cleaned, signature },
    });

  } catch (err) {
    console.error('payfast-sign error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Matches PHP urlencode: spaces as +, RFC 3986 encoding for others
function phpUrlencode(str) {
  return encodeURIComponent(str)
    .replace(/%20/g, '+')
    .replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}
