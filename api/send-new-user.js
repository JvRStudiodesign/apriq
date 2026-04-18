import { rateLimit, getClientIP } from './_rate-limit.js';
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  if (!process.env.RESEND_API_KEY) return res.status(503).json({ error: 'Email not configured' });
  const { name, email, profession } = req.body || {};
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'AprIQ Notifications <apriq@apriq.co.za>',
      to: ['apriq@apriq.co.za'],
      subject: `New user signed up — ${name || email}`,
      html: `<body style="font-family:-apple-system,sans-serif;background:#f5f5f3;margin:0;padding:2rem 1rem"><div style="max-width:520px;margin:0 auto;background:#fff;border-radius:14px;padding:2rem;border:1px solid #eee"><strong style="font-size:1.1rem">AprIQ</strong><h2 style="font-size:1.1rem;margin:1rem 0">New user signed up</h2><table style="width:100%;border-collapse:collapse"><tr><td style="padding:5px 0;color:#aaa;font-size:0.8rem;width:120px">Name</td><td style="padding:5px 0;font-size:0.875rem">${name||'-'}</td></tr><tr><td style="padding:5px 0;color:#aaa;font-size:0.8rem">Email</td><td style="padding:5px 0;font-size:0.875rem">${email||'-'}</td></tr><tr><td style="padding:5px 0;color:#aaa;font-size:0.8rem">Profession</td><td style="padding:5px 0;font-size:0.875rem">${profession||'-'}</td></tr></table><div style="margin-top:1.5rem;padding-top:1rem;border-top:1px solid #eee;font-size:0.75rem;color:#aaa">AprIQ &mdash; apriq.co.za</div></div></body>`,
    }),
  });
  const json = await r.json();
  if (!r.ok) console.error('send-new-user error:', json);
  return res.status(r.ok ? 200 : 500).json(r.ok ? { ok: true } : json);
}