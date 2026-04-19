import { rateLimit, getClientIP } from './_rate-limit.js';

const TEMPLATES = {
  welcome: (d) => ({
    subject: `Welcome to AprIQ — your 30-day Pro trial starts now`,
    html: `<body style="font-family:-apple-system,sans-serif;background:#f5f5f3;margin:0;padding:2rem 1rem"><div style="max-width:520px;margin:0 auto;background:#fff;border-radius:14px;padding:2rem;border:1px solid #eee"><strong style="font-size:1.1rem">AprIQ</strong><h2 style="font-size:1.25rem;font-weight:700;margin:1rem 0 0.75rem">Welcome, ${d.name||'there'}.</h2><p style="color:#555;line-height:1.6;margin:0 0 1rem">Your AprIQ account is active and your <strong>30-day <span style="color:#FF8210;font-weight:600">Pro</span> trial</strong> has started.</p><a href="https://www.apriq.co.za" style="display:inline-block;padding:0.75rem 1.5rem;background:#111;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:0.875rem">Open AprIQ</a><div style="margin-top:2rem;padding-top:1rem;border-top:1px solid #eee;font-size:0.75rem;color:#aaa">AprIQ &mdash; apriq.co.za</div></div></body>`
  }),
  trial_warning: (d) => ({
    subject: `Your AprIQ Pro trial ends in 2 days`,
    html: `<body style="font-family:-apple-system,sans-serif;background:#f5f5f3;margin:0;padding:2rem 1rem"><div style="max-width:520px;margin:0 auto;background:#fff;border-radius:14px;padding:2rem;border:1px solid #eee"><strong>AprIQ</strong><h2 style="margin:1rem 0">Your trial ends soon, ${d.name||''}.</h2><p style="color:#555;line-height:1.6">Your 30-day <span style="color:#FF8210;font-weight:600">Pro</span> trial ends in 2 days. Upgrade to keep full access.</p><a href="https://www.apriq.co.za/upgrade" style="display:inline-block;padding:0.75rem 1.5rem;background:#111;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:0.875rem;margin-top:1rem">Upgrade to Pro</a><div style="margin-top:2rem;padding-top:1rem;border-top:1px solid #eee;font-size:0.75rem;color:#aaa">AprIQ &mdash; apriq.co.za</div></div></body>`
  }),
  trial_expired: (d) => ({
    subject: `Your AprIQ trial has ended`,
    html: `<body style="font-family:-apple-system,sans-serif;background:#f5f5f3;margin:0;padding:2rem 1rem"><div style="max-width:520px;margin:0 auto;background:#fff;border-radius:14px;padding:2rem;border:1px solid #eee"><strong>AprIQ</strong><h2 style="margin:1rem 0">Your trial has ended.</h2><p style="color:#555;line-height:1.6">Upgrade to Pro to continue using all features at R79/month.</p><a href="https://www.apriq.co.za/upgrade" style="display:inline-block;padding:0.75rem 1.5rem;background:#111;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:0.875rem;margin-top:1rem">Upgrade to Pro</a><div style="margin-top:2rem;padding-top:1rem;border-top:1px solid #eee;font-size:0.75rem;color:#aaa">AprIQ &mdash; apriq.co.za</div></div></body>`
  }),
  payment_confirmed: (d) => ({
    subject: `Payment confirmed — AprIQ Pro`,
    html: `<body style="font-family:-apple-system,sans-serif;background:#f5f5f3;margin:0;padding:2rem 1rem"><div style="max-width:520px;margin:0 auto;background:#fff;border-radius:14px;padding:2rem;border:1px solid #eee"><strong>AprIQ</strong><h2 style="margin:1rem 0">Payment confirmed.</h2><p style="color:#555;line-height:1.6">Thank you ${d.name||''}. Your AprIQ Pro subscription is active. Amount: R${d.amount||''}.</p><div style="margin-top:2rem;padding-top:1rem;border-top:1px solid #eee;font-size:0.75rem;color:#aaa">AprIQ &mdash; apriq.co.za</div></div></body>`
  }),
  payment_failed: (d) => ({
    subject: `Payment failed — AprIQ`,
    html: `<body style="font-family:-apple-system,sans-serif;background:#f5f5f3;margin:0;padding:2rem 1rem"><div style="max-width:520px;margin:0 auto;background:#fff;border-radius:14px;padding:2rem;border:1px solid #eee"><strong>AprIQ</strong><h2 style="margin:1rem 0">Payment failed.</h2><p style="color:#555;line-height:1.6">Hi ${d.name||''}, your payment could not be processed. Please update your payment details.</p><a href="https://www.apriq.co.za/billing" style="display:inline-block;padding:0.75rem 1.5rem;background:#111;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:0.875rem;margin-top:1rem">Update billing</a><div style="margin-top:2rem;padding-top:1rem;border-top:1px solid #eee;font-size:0.75rem;color:#aaa">AprIQ &mdash; apriq.co.za</div></div></body>`
  }),
  cancelled: (d) => ({
    subject: `Subscription cancelled — AprIQ`,
    html: `<body style="font-family:-apple-system,sans-serif;background:#f5f5f3;margin:0;padding:2rem 1rem"><div style="max-width:520px;margin:0 auto;background:#fff;border-radius:14px;padding:2rem;border:1px solid #eee"><strong>AprIQ</strong><h2 style="margin:1rem 0">Subscription cancelled.</h2><p style="color:#555;line-height:1.6">Hi ${d.name||''}, your AprIQ Pro subscription has been cancelled. You can resubscribe anytime.</p><div style="margin-top:2rem;padding-top:1rem;border-top:1px solid #eee;font-size:0.75rem;color:#aaa">AprIQ &mdash; apriq.co.za</div></div></body>`
  }),
  contact: (d) => ({
    to: 'apriq@apriq.co.za',
    reply_to: d.email,
    subject: `New contact message from ${d.name||''} ${d.surname||''}`,
    html: `<body style="font-family:-apple-system,sans-serif;background:#f5f5f3;margin:0;padding:2rem 1rem"><div style="max-width:520px;margin:0 auto;background:#fff;border-radius:14px;padding:2rem;border:1px solid #eee"><strong>AprIQ</strong><h2 style="margin:1rem 0">New contact message</h2><table style="width:100%;border-collapse:collapse;margin-bottom:1rem"><tr><td style="color:#aaa;font-size:0.8rem;width:100px;padding:5px 0">Name</td><td style="font-size:0.875rem;padding:5px 0">${d.name||''} ${d.surname||''}</td></tr><tr><td style="color:#aaa;font-size:0.8rem;padding:5px 0">Email</td><td style="font-size:0.875rem;padding:5px 0">${d.email||''}</td></tr></table><div style="background:#f9f9f9;border-radius:8px;padding:1rem;font-size:0.875rem;color:#333;white-space:pre-wrap">${d.message||''}</div><div style="margin-top:2rem;padding-top:1rem;border-top:1px solid #eee;font-size:0.75rem;color:#aaa">AprIQ &mdash; apriq.co.za</div></div></body>`
  }),
  feedback: (d) => ({
    to: 'apriq@apriq.co.za',
    reply_to: d.email||'apriq@apriq.co.za',
    subject: `New feedback [${d.topic||'General'}]`,
    html: `<body style="font-family:-apple-system,sans-serif;background:#f5f5f3;margin:0;padding:2rem 1rem"><div style="max-width:520px;margin:0 auto;background:#fff;border-radius:14px;padding:2rem;border:1px solid #eee"><strong>AprIQ</strong><h2 style="margin:1rem 0">New feedback</h2><table style="width:100%;border-collapse:collapse;margin-bottom:1rem"><tr><td style="color:#aaa;font-size:0.8rem;width:100px;padding:5px 0">Topic</td><td style="font-size:0.875rem;padding:5px 0">${d.topic||'-'}</td></tr><tr><td style="color:#aaa;font-size:0.8rem;padding:5px 0">From</td><td style="font-size:0.875rem;padding:5px 0">${d.email||'Anonymous'}</td></tr></table><div style="background:#f9f9f9;border-radius:8px;padding:1rem;font-size:0.875rem;color:#333;white-space:pre-wrap">${d.message||''}</div><div style="margin-top:2rem;padding-top:1rem;border-top:1px solid #eee;font-size:0.75rem;color:#aaa">AprIQ &mdash; apriq.co.za</div></div></body>`
  }),
  new_user: (d) => ({
    to: 'apriq@apriq.co.za',
    subject: `New user signed up — ${d.name||d.email}`,
    html: `<body style="font-family:-apple-system,sans-serif;background:#f5f5f3;margin:0;padding:2rem 1rem"><div style="max-width:520px;margin:0 auto;background:#fff;border-radius:14px;padding:2rem;border:1px solid #eee"><strong>AprIQ</strong><h2 style="margin:1rem 0">New user signed up</h2><table style="width:100%;border-collapse:collapse"><tr><td style="color:#aaa;font-size:0.8rem;width:120px;padding:5px 0">Name</td><td style="font-size:0.875rem;padding:5px 0">${d.name||'-'}</td></tr><tr><td style="color:#aaa;font-size:0.8rem;padding:5px 0">Email</td><td style="font-size:0.875rem;padding:5px 0">${d.email||'-'}</td></tr><tr><td style="color:#aaa;font-size:0.8rem;padding:5px 0">Profession</td><td style="font-size:0.875rem;padding:5px 0">${d.profession||'-'}</td></tr></table><div style="margin-top:2rem;padding-top:1rem;border-top:1px solid #eee;font-size:0.75rem;color:#aaa">AprIQ &mdash; apriq.co.za</div></div></body>`
  }),
  new_client: (d) => ({
    to: 'apriq@apriq.co.za',
    subject: `New client added — ${d.name||'-'}`,
    html: `<body style="font-family:-apple-system,sans-serif;background:#f5f5f3;margin:0;padding:2rem 1rem"><div style="max-width:520px;margin:0 auto;background:#fff;border-radius:14px;padding:2rem;border:1px solid #eee"><strong>AprIQ</strong><h2 style="margin:1rem 0">New client added</h2><table style="width:100%;border-collapse:collapse"><tr><td style="color:#aaa;font-size:0.8rem;width:120px;padding:5px 0">Client</td><td style="font-size:0.875rem;padding:5px 0">${d.name||'-'}</td></tr><tr><td style="color:#aaa;font-size:0.8rem;padding:5px 0">Email</td><td style="font-size:0.875rem;padding:5px 0">${d.email||'-'}</td></tr><tr><td style="color:#aaa;font-size:0.8rem;padding:5px 0">Company</td><td style="font-size:0.875rem;padding:5px 0">${d.company||'-'}</td></tr><tr><td style="color:#aaa;font-size:0.8rem;padding:5px 0">Added by</td><td style="font-size:0.875rem;padding:5px 0">${d.addedBy||'-'}</td></tr></table><div style="margin-top:2rem;padding-top:1rem;border-top:1px solid #eee;font-size:0.75rem;color:#aaa">AprIQ &mdash; apriq.co.za</div></div></body>`
  }),

  waitlist_confirm: (d) => ({
    subject: 'You are on the AprIQ waitlist',
    html: '<body style="font-family:-apple-system,sans-serif;background:#f5f5f3;margin:0;padding:2rem 1rem"><div style="max-width:520px;margin:0 auto;background:#fff;border-radius:14px;padding:2rem;border:1px solid #eee"><strong style="font-size:1.1rem">AprIQ</strong><h2 style="font-size:1.25rem;font-weight:700;margin:1rem 0 0.75rem">You are on the list.</h2><p style="color:#555;line-height:1.6;margin:0 0 1rem">Thanks for joining the AprIQ waitlist. We will be in touch as soon as we are ready to welcome you.</p><p style="color:#555;line-height:1.6;margin:0 0 1.5rem">AprIQ gives architects, quantity surveyors, and developers fast, structured early-stage construction cost estimates with professional PDF outputs included.</p><div style="margin-top:2rem;padding-top:1rem;border-top:1px solid #eee;font-size:0.75rem;color:#aaa">AprIQ &mdash; apriq.co.za</div></div></body>'
  }),
  feedback_confirm: (d) => ({
    subject: 'Thanks for your feedback — AprIQ',
    html: '<body style="font-family:-apple-system,sans-serif;background:#f5f5f3;margin:0;padding:2rem 1rem"><div style="max-width:520px;margin:0 auto;background:#fff;border-radius:14px;padding:2rem;border:1px solid #eee"><strong style="font-size:1.1rem">AprIQ</strong><h2 style="font-size:1.25rem;font-weight:700;margin:1rem 0 0.75rem">Thanks for your feedback.</h2><p style="color:#555;line-height:1.6;margin:0 0 1rem">We read every submission. Your input directly shapes how AprIQ improves, so thank you for taking the time.</p><p style="color:#555;line-height:1.6;margin:0 0 1.5rem">If you raised something that needs a response, we will follow up with you directly.</p><div style="margin-top:2rem;padding-top:1rem;border-top:1px solid #eee;font-size:0.75rem;color:#aaa">AprIQ &mdash; apriq.co.za</div></div></body>'
  }),
  contact_confirm: (d) => ({
    subject: 'We received your message — AprIQ',
    html: '<body style="font-family:-apple-system,sans-serif;background:#f5f5f3;margin:0;padding:2rem 1rem"><div style="max-width:520px;margin:0 auto;background:#fff;border-radius:14px;padding:2rem;border:1px solid #eee"><strong style="font-size:1.1rem">AprIQ</strong><h2 style="font-size:1.25rem;font-weight:700;margin:1rem 0 0.75rem">Message received.</h2><p style="color:#555;line-height:1.6;margin:0 0 1rem">Thanks for getting in touch. We have received your message and will respond within 1 business day.</p><p style="color:#555;line-height:1.6;margin:0 0 1.5rem">If your query is urgent, you can reply directly to this email.</p><div style="margin-top:2rem;padding-top:1rem;border-top:1px solid #eee;font-size:0.75rem;color:#aaa">AprIQ &mdash; apriq.co.za</div></div></body>'
  }),
  new_waitlist: (d) => ({
    to: 'apriq@apriq.co.za',
    subject: `New waitlist signup — ${d.name||d.email}`,
    html: `<body style="font-family:-apple-system,sans-serif;background:#f5f5f3;margin:0;padding:2rem 1rem"><div style="max-width:520px;margin:0 auto;background:#fff;border-radius:14px;padding:2rem;border:1px solid #eee"><strong>AprIQ</strong><h2 style="margin:1rem 0">New waitlist signup</h2><table style="width:100%;border-collapse:collapse"><tr><td style="color:#aaa;font-size:0.8rem;width:120px;padding:5px 0">Name</td><td style="font-size:0.875rem;padding:5px 0">${d.name||'-'}</td></tr><tr><td style="color:#aaa;font-size:0.8rem;padding:5px 0">Email</td><td style="font-size:0.875rem;padding:5px 0">${d.email||'-'}</td></tr><tr><td style="color:#aaa;font-size:0.8rem;padding:5px 0">Profession</td><td style="font-size:0.875rem;padding:5px 0">${d.profession||'-'}</td></tr></table><div style="margin-top:2rem;padding-top:1rem;border-top:1px solid #eee;font-size:0.75rem;color:#aaa">AprIQ &mdash; apriq.co.za</div></div></body>`
  }),
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const ip = getClientIP(req);
  const rl = rateLimit(`email:${ip}`, 20, 60000);
  if (!rl.allowed) return res.status(429).json({ error: 'Too many requests' });
  if (!process.env.RESEND_API_KEY) return res.status(503).json({ error: 'Email not configured' });
  const internalSecret = process.env.INTERNAL_API_SECRET;
  const { type, to, ...data } = req.body || {};
  if (!type || !TEMPLATES[type]) return res.status(400).json({ error: 'Invalid type' });

  // Notification types rate-limited strictly to prevent inbox spam
  const isNotification = ['contact','feedback','new_user','new_client','new_waitlist',
    'waitlist_confirm','feedback_confirm','contact_confirm'].includes(type);
  if (!isNotification && internalSecret && req.headers['x-internal-secret'] !== internalSecret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // Notification types: stricter rate limit (5/hour per IP) to prevent spam
  if (isNotification) {
    const notifRl = rateLimit(`notif:${ip}`, 5, 3600000);
    if (!notifRl.allowed) {
      console.warn('Notification email rate limited:', type, ip);
      return res.status(429).json({ error: 'Too many requests' });
    }
  }

  const tpl = TEMPLATES[type](data);
  const recipient = tpl.to || to;
  if (!recipient) return res.status(400).json({ error: 'Missing recipient' });

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'AprIQ <apriq@apriq.co.za>',
      to: [recipient],
      ...(tpl.reply_to ? { reply_to: tpl.reply_to } : {}),
      subject: tpl.subject,
      html: tpl.html,
    }),
  });
  const json = await r.json();
  if (!r.ok) { console.error('send-email error:', type, json); return res.status(500).json(json); }
  return res.status(200).json({ ok: true });
}