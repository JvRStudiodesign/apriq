// api/send-payment-failed.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  if (!process.env.RESEND_API_KEY) return res.status(503).json({ error: 'Email not configured' });  // Internal-only endpoint — require shared secret
  const internalSecret = process.env.INTERNAL_API_SECRET;
  if (internalSecret && req.headers['x-internal-secret'] !== internalSecret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { to, ...data } = req.body || {};
  if (!to) return res.status(400).json({ error: 'Missing to' });

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'AprIQ <apriq@apriq.co.za>',
      to: [to],
      subject: `AprIQ payment failed — action required`,
      html: `<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f5f3;margin:0;padding:2rem 1rem"><div style="max-width:520px;margin:0 auto;background:#fff;border-radius:14px;padding:2rem 2rem 1.5rem;border:1px solid #eee"><div style="margin-bottom:1.5rem"><strong style="font-size:1.1rem;letter-spacing:-0.03em">AprIQ</strong></div>
<h2 style="font-size:1.25rem;font-weight:700;margin:0 0 0.75rem">Payment failed.</h2>
<p style="color:#555;line-height:1.6;margin:0 0 1rem">Hi ${data.name || 'there'}, we were unable to process your AprIQ Pro payment.</p>
<p style="color:#555;line-height:1.6;margin:0 0 1.5rem">Please update your payment details to keep your Pro access.</p>
<a href="https://apriq.vercel.app/upgrade" style="display:inline-block;padding:0.75rem 1.5rem;background:#1a1a18;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:0.875rem">Update payment</a>
<p style="color:#aaa;font-size:0.8rem;margin-top:1.25rem">If you need help, reply to this email.</p>
<div style="margin-top:2rem;padding-top:1rem;border-top:1px solid #eee;font-size:0.75rem;color:#aaa">AprIQ &mdash; apriq.co.za &mdash; apriq@apriq.co.za</div></div></body>`,
    }),
  });
  const json = await r.json();
  if (!r.ok) { console.error('send-payment-failed error:', json); return res.status(500).json(json); }
  return res.status(200).json(json);
}
