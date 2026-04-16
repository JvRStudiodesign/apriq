const fs = require('fs');

let app = fs.readFileSync('src/App.jsx', 'utf8');

app = app.replace(
  'return <ComingSoon />;',
  'return <Navigate to="/home" replace />;'
);

app = app.replace('          /* legal now via Layout */', '');

fs.writeFileSync('src/App.jsx', app, 'utf8');
console.log('fixed: App.jsx');

let layout = fs.readFileSync('src/components/Layout.jsx', 'utf8');

if (!layout.includes("from '../lib/supabase'")) {
  layout = layout.replace(
    "import { useState, useEffect } from 'react';",
    "import { useState, useEffect } from 'react';\nimport { supabase } from '../lib/supabase';"
  );
}

layout = layout.replace(
  `export function WaitlistModal({ open, onClose, mode = 'waitlist' }) {
  useEffect(() => { document.body.style.overflow = open ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [open]);`,
  `export function WaitlistModal({ open, onClose, mode = 'waitlist' }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [profession, setProfession] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    if (!email) return;
    setSaving(true);
    const { error } = await supabase.from('waitlist').insert({ email, name, profession });
    if (error) console.error('Waitlist error:', error);
    setSaving(false);
    setSubmitted(true);
  }

  useEffect(() => { document.body.style.overflow = open ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [open]);`
);

layout = layout.replace(
  `{isWaitlist && <input type="text" placeholder="Full name" style={m.input}/>}`,
  `{isWaitlist && <input type="text" placeholder="Full name" value={name} onChange={e => setName(e.target.value)} style={m.input}/>}`
);

layout = layout.replace(
  `<input type="email" placeholder="Email address" style={m.input}/>`,
  `<input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} style={m.input}/>`
);

layout = layout.replace(
  `<select style={m.input}>`,
  `<select value={profession} onChange={e => setProfession(e.target.value)} style={m.input}>`
);

layout = layout.replace(
  `<button style={m.submit}>{isWaitlist ? 'Join the waiting list' : 'Sign in'}</button>`,
  `{submitted && isWaitlist
            ? <p style={{fontFamily:"'Roboto',system-ui,sans-serif",fontSize:13,color:'#0F4C5C',textAlign:'center',marginTop:8}}>You are on the list. We will be in touch.</p>
            : <button onClick={handleSubmit} disabled={saving} style={{...m.submit,opacity:saving?0.6:1}}>{saving ? 'Saving...' : isWaitlist ? 'Join the waiting list' : 'Sign in'}</button>
          }`
);

fs.writeFileSync('src/components/Layout.jsx', layout, 'utf8');
console.log('fixed: Layout.jsx');
console.log('integration complete');
