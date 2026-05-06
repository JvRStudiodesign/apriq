// api/payfast-sign.js
// Builds PayFast Custom-Integration payment params + MD5 signature.
//
// IMPORTANT (per PayFast staff, github.com/Payfast/payfast-php-sdk/issues/1):
//   - For the Custom/Onsite form-post integration (what we use), fields must
//     be signed and POSTed in the documented Custom-Integration order, NOT
//     alphabetically. Alphabetical (ksort) is only for the API integration.
//   - The `params` declaration below is already in the correct order:
//     merchant_id, merchant_key, return_url, cancel_url, notify_url,
//     name_first, name_last, email_address, m_payment_id, amount,
//     item_name, item_description, custom_str1, subscription_type,
//     billing_date, recurring_amount, frequency, cycles.
//   - Signature is md5( key=urlencode(trim(val)) joined by & + &passphrase=… )
//   - Empty/blank values are omitted from both the form post and the signature.
import crypto from 'crypto';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
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
      console.error('payfast-sign: PAYFAST_MERCHANT_ID / PAYFAST_MERCHANT_KEY env vars missing');
      return res.status(500).json({ error: 'Payment configuration error.' });
    }

    const { userId, email, firstName = '', lastName = '' } = req.body || {};

    if (!userId || !email) {
      console.error('payfast-sign: missing userId or email in body');
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    const mPaymentId = `${userId}-${Date.now()}`;

    // PayFast Custom-Integration documented field order (DO NOT REORDER).
    const params = {
      merchant_id:       merchantId,
      merchant_key:      merchantKey,
      return_url:        `${appUrl}/payment-success`,
      cancel_url:        `${appUrl}/payment-cancel`,
      notify_url:        `${appUrl}/api/payfast-itn`,
      name_first:        String(firstName).trim(),
      name_last:         String(lastName).trim(),
      email_address:     String(email).trim(),
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

    // Drop empty / null / undefined values — preserves insertion order.
    const cleaned = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
    );

    // Sign in insertion order. NO ksort — that's for the API integration only.
    const { signature, getString } = generateSignature(cleaned, passphrase || null);

    const payfastUrl = isSandbox
      ? 'https://sandbox.payfast.co.za/eng/process'
      : 'https://www.payfast.co.za/eng/process';

    // Visible in Vercel function logs — paste back if signatures still mismatch.
    console.log(
      `payfast-sign OK — user=${userId} sandbox=${isSandbox} ` +
      `passphrase=${passphrase ? 'yes' : 'no'} sig=${signature.substring(0, 12)}...`
    );
    console.log(`payfast-sign string-to-hash: ${getString}`);

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
 * Replicates PayFast PHP SDK's pfGenerateSignature() — caller is responsible
 * for passing data in the order it will be POSTed (we do NOT re-sort here).
 */
function generateSignature(data, passPhrase = null) {
  let pfOutput = '';
  for (const [key, val] of Object.entries(data)) {
    const trimmed = String(val).trim();
    if (trimmed !== '') {
      pfOutput += `${key}=${phpUrlencode(trimmed)}&`;
    }
  }

  let getString = pfOutput.slice(0, -1); // drop trailing &

  if (passPhrase !== null && passPhrase !== '') {
    getString += `&passphrase=${phpUrlencode(String(passPhrase).trim())}`;
  }

  const signature = crypto.createHash('md5').update(getString).digest('hex');
  return { signature, getString };
}

/**
 * PHP urlencode():
 *  - space → +
 *  - !  '  (  )  *  → %21 %27 %28 %29 %2A
 *  - everything else uses encodeURIComponent (matches RFC 3986).
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
