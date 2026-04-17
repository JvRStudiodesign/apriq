import { rateLimit, getClientIP } from './_rate-limit.js';
// api/payfast-itn.js — PayFast ITN with signature verification
import crypto from 'crypto';

function verifyPayFastSignature(body, passphrase) {
  // Build the signature string from all fields except 'signature'
  const fields = Object.keys(body)
    .filter(k => k !== 'signature' && body[k] !== '')
    .sort()
    .map(k => `${k}=${encodeURIComponent(body[k]).replace(/%20/g, '+')}`)
    .join('&');
  const strToHash = passphrase
    ? `${fields}&passphrase=${encodeURIComponent(passphrase).replace(/%20/g, '+')}`
    : fields;
  return crypto.createHash('md5').update(strToHash).digest('hex');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method not allowed');
  // Rate limit: max 20 ITN calls per minute per IP
  const ip = getClientIP(req);
  const rl = rateLimit(`itn:${ip}`, 20, 60000);
  if (!rl.allowed) return res.status(429).end('Too many requests');

  const serviceKey   = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const passphrase   = process.env.PAYFAST_PASSPHRASE || '';
  const supabaseUrl  = 'https://cocugdgelatgjzgkyhpz.supabase.co';

  if (!serviceKey) {
    console.error('SUPABASE_SERVICE_ROLE_KEY not set');
    return res.status(500).end('Server configuration error');
  }

  try {
    const body = req.body || {};

    // 1. Verify PayFast signature
    const receivedSig  = body.signature;
    const expectedSig  = verifyPayFastSignature(body, passphrase);
    if (!receivedSig || receivedSig !== expectedSig) {
      console.error('PayFast ITN signature mismatch', { received: receivedSig, expected: expectedSig });
      return res.status(400).end('Invalid signature');
    }

    // 2. Validate required fields
    const paymentStatus = body.payment_status;
    const userId        = body.custom_str1;
    const plan          = body.custom_str2;
    const amountGross   = parseFloat(body.amount_gross || 0);

    if (!userId || typeof userId !== 'string' || userId.length < 10) {
      console.error('ITN: invalid userId', userId);
      return res.status(400).end('Invalid user ID');
    }
    if (!['COMPLETE', 'CANCELLED', 'FAILED'].includes(paymentStatus)) {
      console.error('ITN: unexpected payment_status', paymentStatus);
      return res.status(400).end('Unexpected status');
    }

    // 3. Validate amount matches expected plan price (prevent amount manipulation)
    if (paymentStatus === 'COMPLETE') {
      const expectedAmount = plan === 'annual' ? 1490.00 : 149.00;
      if (Math.abs(amountGross - expectedAmount) > 1) {
        console.error('ITN: amount mismatch', { received: amountGross, expected: expectedAmount, plan });
        return res.status(400).end('Amount mismatch');
      }
    }

    // 4. Verify user actually exists in DB before updating
    const checkRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=id`, {
      headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` },
    });
    const checkUsers = await checkRes.json();
    if (!Array.isArray(checkUsers) || checkUsers.length === 0) {
      console.error('ITN: user not found', userId);
      return res.status(400).end('User not found');
    }

    // 5. Update tier
    let tier = 'free';
    if (paymentStatus === 'COMPLETE') tier = 'pro';

    const updateRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ tier, updated_at: new Date().toISOString() }),
    });

    if (!updateRes.ok) {
      console.error('Supabase update failed:', await updateRes.text());
      return res.status(500).end('DB update failed');
    }

    console.log(`ITN: user ${userId} → ${tier} (${paymentStatus}, plan: ${plan}, amount: ${amountGross})`);

    // 6. Send email — fire-and-forget, errors are non-fatal
    const userRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=full_name,email`, {
      headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` },
    });
    const users = await userRes.json();
    const u = users?.[0];
    if (u?.email && process.env.INTERNAL_API_SECRET) {
      const emailEndpoint = paymentStatus === 'COMPLETE' ? '/api/send-payment-confirmed'
                          : paymentStatus === 'CANCELLED' ? '/api/send-cancelled'
                          : '/api/send-payment-failed';
      const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://apriq.vercel.app';
      fetch(`${baseUrl}${emailEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': process.env.INTERNAL_API_SECRET || 'missing-secret',
        },
        body: JSON.stringify({ to: u.email, name: u.full_name, amount: body.amount_gross }),
      }).catch(e => console.error('Email send failed:', e));
    }

    return res.status(200).end('OK');
  } catch (err) {
    console.error('ITN error:', err.message);
    console.error('Internal error in ' + process.env.VERCEL_URL + ':', err?.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
