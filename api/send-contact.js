// api/send-contact.js — sends contact form submission to apriq@apriq.co.za
import { rateLimit, getClientIP } from './_rate-limit.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const ip = getClientIP(req);
  const rl = rateLimit(`contact:${ip}`, 5, 60000);
  if (!rl.allowed) return res.status(429).json({ error: 'Too many requests' });
  if (!process.env.RESEND_API_KEY) return res.status(503).json({ error: 'Email not configured' });

  const { name, surname, email, message } = req.body || {};
  if (!email || !message) return res.status(400).json({ error: 'Missing required fields' });

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'AprIQ Contact <apriq@apriq.co.za>',
      to: ['apriq@apriq.co.za'],
      reply_to: email,
      subject: `New contact message from ${name || ''} ${surname || ''} — AprIQ`,
      html: `<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f5f3;margin:0;padding:2rem 1rem">
        <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:14px;padding:2rem;border:1px solid #eee">
          <div style="margin-bottom:1.5rem"><strong style="font-size:1.1rem;letter-spacing:-0.03em">AprIQ</strong></div>
          <h2 style="font-size:1.1rem;font-weight:700;margin:0 0 1rem">New contact message</h2>
          <table style="width:100%;border-collapse:collapse;margin-bottom:1.25rem">
            <tr><td style="padding:6px 0;color:#aaa;font-size:0.8rem;width:100px">Name</td><td style="padding:6px 0;font-size:0.875rem">${name || ''} ${surname || ''}</td></tr>
            <tr><td style="padding:6px 0;color:#aaa;font-size:0.8rem">Email</td><td style="padding:6px 0;font-size:0.875rem"><a href="mailto:${email}" style="color:#0F4C5C">${email}</a></td></tr>
          </table>
          <div style="background:#f9f9f9;border-radius:8px;padding:1rem;font-size:0.875rem;color:#333;line-height:1.6;white-space:pre-wrap">${message}</div>
          <div style="margin-top:2rem;padding-top:1rem;border-top:1px solid #eee;font-size:0.75rem;color:#aaa">AprIQ &mdash; apriq.co.za</div>
        </div>
      </body>`,
    }),
  });

  const json = await r.json();
  if (!r.ok) { console.error('send-contact error:', json); return res.status(500).json(json); }
  console.log(`Contact form submitted by ${email}`);
  return res.status(200).json({ ok: true });
}
