// api/payfast-sign.js
import crypto from 'crypto';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const merchantId  = process.env.PAYFAST_MERCHANT_ID;
    const merchantKey = process.env.PAYFAST_MERCHANT_KEY;
    const passphrase  = (process.env.PAYFAST_PASSPHRASE || '').trim();
    const appUrl      = (process.env.APP_URL || 'https://www.apriq.co.za').trim();
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

    // Build params object — merchant_key included (required for signature)
    const params = {
      merchant_id:       merchantId.trim(),
      merchant_key:      merchantKey.trim(),
      return_url:        `${appUrl}/payment-success`,
      cancel_url:        `${appUrl}/payment-cancel`,
      notify_url:        `${appUrl}/api/payfast-itn`,
      name_first:        firstName.trim(),
      name_last:         lastName.trim(),
      email_address:     email.trim(),
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

    // Remove empty string / null / undefined values
    const cleaned = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
    );

    // Generate signature — matches PayFast PHP SDK exactly:
    // ksort → urlencode(trim(val)) → join with & → append passphrase → md5
    const signature = generateSignature(cleaned, passphrase || null);

    const payfastUrl = isSandbox
      ? 'https://sandbox.payfast.co.za/eng/process'
      : 'https://www.payfast.co.za/eng/process';

    console.log(`payfast-sign OK — user=${userId} sandbox=${isSandbox} sig=${signature.substring(0,8)}...`);

    return res.status(200).json({
      payfastUrl,
      params: { ...cleaned, signature },
    });

  } catch (err) {
    console.error('payfast-sign error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Replicates PayFast PHP SDK generateSignature() exactly.
 * Ref: pfpayments/payfast-php-sdk — PFPayment.php
 */
function generateSignature(data, passPhrase = null) {
  // ksort equivalent — alphabetical key sort
  const sorted = Object.keys(data).sort().reduce((acc, key) => {
    acc[key] = data[key];
    return acc;
  }, {});

  let pfOutput = '';
  for (const [key, val] of Object.entries(sorted)) {
    const trimmed = String(val).trim();
    if (trimmed !== '') {
      pfOutput += `${key}=${phpUrlencode(trimmed)}&`;
    }
  }

  // Remove trailing &
  let getString = pfOutput.slice(0, -1);

  if (passPhrase !== null && passPhrase !== '') {
    getString += `&passphrase=${phpUrlencode(passPhrase.trim())}`;
  }

  return crypto.createHash('md5').update(getString).digest('hex');
}

/**
 * PHP urlencode equivalent.
 * PHP encodes space as + and uses %XX for everything else.
 * encodeURIComponent leaves ! ' ( ) * unencoded — PHP encodes them.
 */
function phpUrlencode(str) {
  return encodeURIComponent(str)
    .replace(/%20/g, '+')
    .replace(/!/g,  '%21')
    .replace(/'/g,  '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A');
}
