// api/send-feedback.js — sends feedback to apriq@apriq.co.za
import { rateLimit, getClientIP } from './_rate-limit.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const ip = getClientIP(req);
  const rl = rateLimit(`feedback:${ip}`, 5, 60000);
  if (!rl.allowed) return res.status(429).json({ error: 'Too many requests' });
  if (!process.env.RESEND_API_KEY) return res.status(503).json({ error: 'Email not configured' });

  const { email, topic, message } = req.body || {};
  if (!message) return res.status(400).json({ error: 'Missing message' });

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'AprIQ Feedback <apriq@apriq.co.za>',
      to: ['apriq@apriq.co.za'],
      reply_to: email || 'apriq@apriq.co.za',
      subject: `New feedback [${topic || 'General'}] — AprIQ`,
      html: `<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f5f3;margin:0;padding:2rem 1rem">
        <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:14px;padding:2rem;border:1px solid #eee">
          <div style="margin-bottom:1.5rem"><strong style="font-size:1.1rem;letter-spacing:-0.03em">AprIQ</strong></div>
          <h2 style="font-size:1.1rem;font-weight:700;margin:0 0 1rem">New feedback received</h2>
          <table style="width:100%;border-collapse:collapse;margin-bottom:1.25rem">
            <tr><td style="padding:6px 0;color:#aaa;font-size:0.8rem;width:100px">Topic</td><td style="padding:6px 0;font-size:0.875rem">${topic || 'General'}</td></tr>
            <tr><td style="padding:6px 0;color:#aaa;font-size:0.8rem">From</td><td style="padding:6px 0;font-size:0.875rem">${email ? `<a href="mailto:${email}" style="color:#0F4C5C">${email}</a>` : 'Anonymous'}</td></tr>
          </table>
          <div style="background:#f9f9f9;border-radius:8px;padding:1rem;font-size:0.875rem;color:#333;line-height:1.6;white-space:pre-wrap">${message}</div>
          <div style="margin-top:2rem;padding-top:1rem;border-top:1px solid #eee;font-size:0.75rem;color:#aaa">AprIQ &mdash; apriq.co.za</div>
        </div>
      </body>`,
    }),
  });

  const json = await r.json();
  if (!r.ok) { console.error('send-feedback error:', json); return res.status(500).json(json); }
  console.log(`Feedback submitted by ${email || 'anonymous'}, topic: ${topic}`);
  return res.status(200).json({ ok: true });
}
