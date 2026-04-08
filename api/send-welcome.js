// api/send-welcome.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { to, ...data } = req.body || {};
  if (!to) return res.status(400).json({ error: 'Missing to' });

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer re_Cc3ibXuu_35CHshVGwZ9KFh1mocoEKNt6', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'AprIQ <hello@apriq.co.za>',
      to: [to],
      subject: `Welcome to AprIQ — your 7-day Pro trial starts now`,
      html: `<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f5f3;margin:0;padding:2rem 1rem"><div style="max-width:520px;margin:0 auto;background:#fff;border-radius:14px;padding:2rem 2rem 1.5rem;border:1px solid #eee"><div style="margin-bottom:1.5rem"><strong style="font-size:1.1rem;letter-spacing:-0.03em">AprIQ</strong></div>
<h2 style="font-size:1.25rem;font-weight:700;margin:0 0 0.75rem">Welcome, ${data.name || 'there'}.</h2>
<p style="color:#555;line-height:1.6;margin:0 0 1rem">Your AprIQ account is active and your <strong>7-day Pro trial</strong> has started. No card required.</p>
<p style="color:#555;line-height:1.6;margin:0 0 1.5rem">During your trial you have full access to:</p>
<ul style="color:#555;line-height:1.8;margin:0 0 1.5rem;padding-left:1.25rem">
<li>Unlimited cost estimates</li>
<li>PDF export with your logo</li>
<li>Mixed-use building projects</li>
<li>Shareable estimate links</li>
<li>Projects &amp; client management</li>
</ul>
<a href="https://apriq.vercel.app" style="display:inline-block;padding:0.75rem 1.5rem;background:#1a1a18;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:0.875rem">Open AprIQ</a>
<p style="color:#aaa;font-size:0.8rem;margin-top:1.25rem">Your trial ends in 7 days. After that you can upgrade to Pro (R149/month) or continue on the free tier.</p>
<div style="margin-top:2rem;padding-top:1rem;border-top:1px solid #eee;font-size:0.75rem;color:#aaa">AprIQ &mdash; apriq.co.za &mdash; hello@apriq.co.za</div></div></body>`,
    }),
  });
  const json = await r.json();
  if (!r.ok) { console.error('send-welcome error:', json); return res.status(500).json(json); }
  return res.status(200).json(json);
}
