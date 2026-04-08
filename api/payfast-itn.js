// api/payfast-itn.js
// PayFast Instant Transaction Notification handler
// Activates when SUPABASE_SERVICE_ROLE_KEY env var is set in Vercel

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method not allowed');

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cocugdgelatgjzgkyhpz.supabase.co';

  if (!serviceKey) {
    console.error('SUPABASE_SERVICE_ROLE_KEY not set');
    return res.status(500).end('Server configuration error');
  }

  try {
    const body = req.body;
    const paymentStatus = body.payment_status;
    const userId        = body.custom_str1;
    const plan          = body.custom_str2; // 'monthly' or 'annual'

    if (!userId) return res.status(400).end('Missing user ID');

    let tier = 'free';
    if (paymentStatus === 'COMPLETE') tier = 'pro';
    if (paymentStatus === 'CANCELLED' || paymentStatus === 'FAILED') tier = 'free';

    // Update user tier in Supabase using service role key (bypasses RLS)
    const response = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ tier, updated_at: new Date().toISOString() }),
    });

    if (!response.ok) {
      console.error('Supabase update failed:', await response.text());
      return res.status(500).end('DB update failed');
    }

    console.log(`User ${userId} tier updated to ${tier} (${paymentStatus}, plan: ${plan})`);

    // Send payment email (fire-and-forget)
    const userRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=full_name,email`, {
      headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` },
    });
    const users = await userRes.json();
    const u = users?.[0];
    if (u?.email) {
      const emailEndpoint = paymentStatus === 'COMPLETE'   ? '/api/send-payment-confirmed'
                          : paymentStatus === 'CANCELLED'  ? '/api/send-cancelled'
                          : '/api/send-payment-failed';
      fetch(`${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : '${APP_URL}'}${emailEndpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: u.email, name: u.full_name, amount: body.amount_gross }),
      }).catch(() => {});
    }
    return res.status(200).end('OK');
  } catch (err) {
    console.error('ITN error:', err);
    return res.status(500).end('Server error');
  }
}
