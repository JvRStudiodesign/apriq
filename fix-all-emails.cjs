const fs = require('fs');

// ── 1. Create all notification email endpoints ────────────────────────────────
const emailTemplate = (subject, rows, message) => `
// api/${subject}.js
import { rateLimit, getClientIP } from './_rate-limit.js';
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const ip = getClientIP(req);
  const rl = rateLimit(\`${subject}:\${ip}\`, 10, 60000);
  if (!rl.allowed) return res.status(429).json({ error: 'Too many requests' });
  if (!process.env.RESEND_API_KEY) return res.status(503).json({ error: 'Email not configured' });
  const body = req.body || {};
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': \`Bearer \${process.env.RESEND_API_KEY}\`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'AprIQ Notifications <apriq@apriq.co.za>',
      to: ['apriq@apriq.co.za'],
      subject: \`${rows}\`,
      html: \`<body style="font-family:-apple-system,sans-serif;background:#f5f5f3;margin:0;padding:2rem 1rem"><div style="max-width:520px;margin:0 auto;background:#fff;border-radius:14px;padding:2rem;border:1px solid #eee"><strong style="font-size:1.1rem">AprIQ</strong><h2 style="font-size:1.1rem;margin:1rem 0">${message}</h2><table style="width:100%;border-collapse:collapse;margin-bottom:1rem">\${Object.entries(body).filter(([k])=>k!=='_type').map(([k,v])=>\`<tr><td style="padding:5px 0;color:#aaa;font-size:0.8rem;width:120px">\${k}</td><td style="padding:5px 0;font-size:0.875rem">\${v||'-'}</td></tr>\`).join('')}</table><div style="margin-top:1.5rem;padding-top:1rem;border-top:1px solid #eee;font-size:0.75rem;color:#aaa">AprIQ &mdash; apriq.co.za</div></div></body>\`,
    }),
  });
  const json = await r.json();
  if (!r.ok) { console.error('${subject} error:', json); return res.status(500).json(json); }
  return res.status(200).json({ ok: true });
}`;

// send-new-user.js — triggered on signup
fs.writeFileSync('api/send-new-user.js', `
import { rateLimit, getClientIP } from './_rate-limit.js';
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  if (!process.env.RESEND_API_KEY) return res.status(503).json({ error: 'Email not configured' });
  const { name, email, profession } = req.body || {};
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': \`Bearer \${process.env.RESEND_API_KEY}\`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'AprIQ Notifications <apriq@apriq.co.za>',
      to: ['apriq@apriq.co.za'],
      subject: \`New user signed up — \${name || email}\`,
      html: \`<body style="font-family:-apple-system,sans-serif;background:#f5f5f3;margin:0;padding:2rem 1rem"><div style="max-width:520px;margin:0 auto;background:#fff;border-radius:14px;padding:2rem;border:1px solid #eee"><strong style="font-size:1.1rem">AprIQ</strong><h2 style="font-size:1.1rem;margin:1rem 0">New user signed up</h2><table style="width:100%;border-collapse:collapse"><tr><td style="padding:5px 0;color:#aaa;font-size:0.8rem;width:120px">Name</td><td style="padding:5px 0;font-size:0.875rem">\${name||'-'}</td></tr><tr><td style="padding:5px 0;color:#aaa;font-size:0.8rem">Email</td><td style="padding:5px 0;font-size:0.875rem">\${email||'-'}</td></tr><tr><td style="padding:5px 0;color:#aaa;font-size:0.8rem">Profession</td><td style="padding:5px 0;font-size:0.875rem">\${profession||'-'}</td></tr></table><div style="margin-top:1.5rem;padding-top:1rem;border-top:1px solid #eee;font-size:0.75rem;color:#aaa">AprIQ &mdash; apriq.co.za</div></div></body>\`,
    }),
  });
  const json = await r.json();
  if (!r.ok) console.error('send-new-user error:', json);
  return res.status(r.ok ? 200 : 500).json(r.ok ? { ok: true } : json);
}
`.trim());

// send-new-client.js
fs.writeFileSync('api/send-new-client.js', `
import { rateLimit, getClientIP } from './_rate-limit.js';
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  if (!process.env.RESEND_API_KEY) return res.status(503).json({ error: 'Email not configured' });
  const { name, email, company, phone, addedBy } = req.body || {};
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': \`Bearer \${process.env.RESEND_API_KEY}\`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'AprIQ Notifications <apriq@apriq.co.za>',
      to: ['apriq@apriq.co.za'],
      subject: \`New client added — \${name || '-'}\`,
      html: \`<body style="font-family:-apple-system,sans-serif;background:#f5f5f3;margin:0;padding:2rem 1rem"><div style="max-width:520px;margin:0 auto;background:#fff;border-radius:14px;padding:2rem;border:1px solid #eee"><strong style="font-size:1.1rem">AprIQ</strong><h2 style="font-size:1.1rem;margin:1rem 0">New client added</h2><table style="width:100%;border-collapse:collapse"><tr><td style="padding:5px 0;color:#aaa;font-size:0.8rem;width:120px">Client name</td><td style="padding:5px 0;font-size:0.875rem">\${name||'-'}</td></tr><tr><td style="padding:5px 0;color:#aaa;font-size:0.8rem">Email</td><td style="padding:5px 0;font-size:0.875rem">\${email||'-'}</td></tr><tr><td style="padding:5px 0;color:#aaa;font-size:0.8rem">Company</td><td style="padding:5px 0;font-size:0.875rem">\${company||'-'}</td></tr><tr><td style="padding:5px 0;color:#aaa;font-size:0.8rem">Phone</td><td style="padding:5px 0;font-size:0.875rem">\${phone||'-'}</td></tr><tr><td style="padding:5px 0;color:#aaa;font-size:0.8rem">Added by</td><td style="padding:5px 0;font-size:0.875rem">\${addedBy||'-'}</td></tr></table><div style="margin-top:1.5rem;padding-top:1rem;border-top:1px solid #eee;font-size:0.75rem;color:#aaa">AprIQ &mdash; apriq.co.za</div></div></body>\`,
    }),
  });
  const json = await r.json();
  if (!r.ok) console.error('send-new-client error:', json);
  return res.status(r.ok ? 200 : 500).json(r.ok ? { ok: true } : json);
}
`.trim());

// send-new-waitlist.js
fs.writeFileSync('api/send-new-waitlist.js', `
import { rateLimit, getClientIP } from './_rate-limit.js';
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  if (!process.env.RESEND_API_KEY) return res.status(503).json({ error: 'Email not configured' });
  const { name, email, profession } = req.body || {};
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': \`Bearer \${process.env.RESEND_API_KEY}\`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'AprIQ Notifications <apriq@apriq.co.za>',
      to: ['apriq@apriq.co.za'],
      subject: \`New waitlist signup — \${name || email}\`,
      html: \`<body style="font-family:-apple-system,sans-serif;background:#f5f5f3;margin:0;padding:2rem 1rem"><div style="max-width:520px;margin:0 auto;background:#fff;border-radius:14px;padding:2rem;border:1px solid #eee"><strong style="font-size:1.1rem">AprIQ</strong><h2 style="font-size:1.1rem;margin:1rem 0">New waitlist signup</h2><table style="width:100%;border-collapse:collapse"><tr><td style="padding:5px 0;color:#aaa;font-size:0.8rem;width:120px">Name</td><td style="padding:5px 0;font-size:0.875rem">\${name||'-'}</td></tr><tr><td style="padding:5px 0;color:#aaa;font-size:0.8rem">Email</td><td style="padding:5px 0;font-size:0.875rem">\${email||'-'}</td></tr><tr><td style="padding:5px 0;color:#aaa;font-size:0.8rem">Profession</td><td style="padding:5px 0;font-size:0.875rem">\${profession||'-'}</td></tr></table><div style="margin-top:1.5rem;padding-top:1rem;border-top:1px solid #eee;font-size:0.75rem;color:#aaa">AprIQ &mdash; apriq.co.za</div></div></body>\`,
    }),
  });
  const json = await r.json();
  if (!r.ok) console.error('send-new-waitlist error:', json);
  return res.status(r.ok ? 200 : 500).json(r.ok ? { ok: true } : json);
}
`.trim());

console.log('✓ 3 API endpoints created');

// ── 2. Wire into Clients.jsx ──────────────────────────────────────────────────
let C = fs.readFileSync('src/pages/Clients.jsx', 'utf8');
C = C.replace(
  `await supabase.from('clients').insert({ user_id: user.id, ...payload });`,
  `await supabase.from('clients').insert({ user_id: user.id, ...payload });
      fetch('/api/send-new-client', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name: payload.name, email: payload.email, company: payload.company, phone: payload.phone, addedBy: user.email }) }).catch(()=>{});`
);
fs.writeFileSync('src/pages/Clients.jsx', C, 'utf8');
console.log('✓ Clients.jsx wired');

// ── 3. Wire into Signup.jsx ───────────────────────────────────────────────────
let S = fs.readFileSync('src/pages/Signup.jsx', 'utf8');
// Add new-user notification after the welcome email send
S = S.replace(
  `await fetch('/api/send-welcome', {`,
  `fetch('/api/send-new-user', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name, email, profession }) }).catch(()=>{});
      await fetch('/api/send-welcome', {`
);
fs.writeFileSync('src/pages/Signup.jsx', S, 'utf8');
console.log('✓ Signup.jsx wired');

// ── 4. Wire waitlist into Layout.jsx ─────────────────────────────────────────
let L = fs.readFileSync('src/components/Layout.jsx', 'utf8');
L = L.replace(
  `const { error } = await supabase.from('waitlist').insert({ email, name, profession });`,
  `const { error } = await supabase.from('waitlist').insert({ email, name, profession });
    if (!error) fetch('/api/send-new-waitlist', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name, email, profession }) }).catch(()=>{});`
);

// ── 5. Fix feedback — remove silent catch, add proper error logging ────────────
L = L.replace(
  // Fix contact form fetch (already working but make robust)
  `fetch('/api/send-contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: contactName, surname: contactSurname, email: contactEmail, message: contactMessage }),
    }).catch(() => {})`,
  `fetch('/api/send-contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: contactName, surname: contactSurname, email: contactEmail, message: contactMessage }),
    }).catch(e => console.error('send-contact failed:', e))`
);
fs.writeFileSync('src/components/Layout.jsx', L, 'utf8');
console.log('✓ Layout.jsx — waitlist wired, contact error logging improved');

// Fix feedback in Calculator.jsx — remove silent catch
let Calc = fs.readFileSync('src/pages/Calculator.jsx', 'utf8');
Calc = Calc.replace(
  `fetch('/api/send-feedback', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email: user?.email, topic: fbTopic, message: fbText }) }).catch(()=>{})`,
  `fetch('/api/send-feedback', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email: user?.email, topic: fbTopic, message: fbText }) }).then(r=>r.json()).then(d=>console.log('feedback email:',d)).catch(e=>console.error('feedback email failed:',e))`
);
fs.writeFileSync('src/pages/Calculator.jsx', Calc, 'utf8');
console.log('✓ Calculator.jsx — feedback error logging improved');

console.log('\nAll done.');
