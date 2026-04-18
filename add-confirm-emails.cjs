const fs = require('fs');

// 1. Add 3 new templates to send-email.js
let E = fs.readFileSync('api/send-email.js', 'utf8');
const newTemplates = `
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
  }),`;
E = E.replace('  new_waitlist: (d)', newTemplates + '\n  new_waitlist: (d)');
fs.writeFileSync('api/send-email.js', E, 'utf8');
console.log('✓ 3 templates added to send-email.js');

// 2. Wire into Layout.jsx — waitlist confirm + contact confirm
let L = fs.readFileSync('src/components/Layout.jsx', 'utf8');
L = L.replace(
  `if (!error) {
    fetch('/api/send-email', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ type:'new_waitlist', name, email, profession }) }).catch(()=>{});`,
  `if (!error) {
    fetch('/api/send-email', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ type:'new_waitlist', name, email, profession }) }).catch(()=>{});
    fetch('/api/send-email', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ type:'waitlist_confirm', to: email, name }) }).catch(()=>{});`
);
// Add contact_confirm after the existing contact send
L = L.replace(
  `.catch(e => console.error('send-contact failed:', e))`,
  `.catch(e => console.error('send-contact failed:', e));
    if (contactEmail) fetch('/api/send-email', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ type:'contact_confirm', to: contactEmail, name: contactName }) }).catch(()=>{})`
);
fs.writeFileSync('src/components/Layout.jsx', L, 'utf8');
console.log('✓ Layout.jsx wired');

// 3. Wire feedback_confirm into Calculator.jsx
let C = fs.readFileSync('src/pages/Calculator.jsx', 'utf8');
C = C.replace(
  `.then(r=>r.json()).then(d=>console.log('feedback email:',d)).catch(e=>console.error('feedback email failed:',e))`,
  `.then(r=>r.json()).then(d=>console.log('feedback email:',d)).catch(e=>console.error('feedback email failed:',e));
              if (user && user.email) fetch('/api/send-email', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ type:'feedback_confirm', to: user.email }) }).catch(()=>{})`
);
fs.writeFileSync('src/pages/Calculator.jsx', C, 'utf8');
console.log('✓ Calculator.jsx wired');

console.log('Done.');
