// api/payfast-sign.js
// Builds PayFast payment params + MD5 signature server-side.
// Passphrase never leaves the server.

import crypto from 'crypto';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      userId,
      email,
      firstName,
      lastName,
    } = req.body;

    if (!userId || !email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const merchantId  = process.env.PAYFAST_MERCHANT_ID;
    const merchantKey = process.env.PAYFAST_MERCHANT_KEY;
    const passphrase  = process.env.PAYFAST_PASSPHRASE;
    const appUrl      = process.env.APP_URL || 'https://apriq.vercel.app';
    const isSandbox   = process.env.PAYFAST_SANDBOX === 'true';

    const notifyUrl = `${appUrl}/api/payfast-itn`;
    const returnUrl = `${appUrl}/payment-success`;
    const cancelUrl = `${appUrl}/payment-cancel`;

    // Unique payment reference — userId + timestamp
    const mPaymentId = `${userId}-${Date.now()}`;

    const params = {
      merchant_id:       merchantId,
      merchant_key:      merchantKey,
      return_url:        returnUrl,
      cancel_url:        cancelUrl,
      notify_url:        notifyUrl,
      name_first:        firstName || '',
      name_last:         lastName  || '',
      email_address:     email,
      m_payment_id:      mPaymentId,
      amount:            '79.00',
      item_name:         'AprIQ Pro — Monthly',
      item_description:  'Full access to all AprIQ Pro features',
      custom_str1:       userId,          // passed back in ITN for Supabase lookup
      // Subscription fields
      subscription_type: '1',
      billing_date:      getTodayISO(),
      recurring_amount:  '79.00',
      frequency:         '3',            // 3 = monthly
      cycles:            '0',            // 0 = indefinite
    };

    // Remove empty values
    const cleaned = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== '' && v != null)
    );

    // Build param string — alphabetical order, URL-encoded
    const paramString = Object.keys(cleaned)
      .sort()
      .map(k => `${k}=${encodeURIComponent(cleaned[k]).replace(/%20/g, '+')}`)
      .join('&');

    // Append passphrase if set
    const stringToHash = passphrase
      ? `${paramString}&passphrase=${encodeURIComponent(passphrase).replace(/%20/g, '+')}`
      : paramString;

    const signature = crypto.createHash('md5').update(stringToHash).digest('hex');

    const payfastUrl = isSandbox
      ? 'https://sandbox.payfast.co.za/eng/process'
      : 'https://www.payfast.co.za/eng/process';

    return res.status(200).json({
      payfastUrl,
      params: { ...cleaned, signature },
    });

  } catch (err) {
    console.error('payfast-sign error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

function getTodayISO() {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}
