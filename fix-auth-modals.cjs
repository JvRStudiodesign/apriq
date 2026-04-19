const fs = require('fs');
let L = fs.readFileSync('src/components/Layout.jsx', 'utf8');

// Replace the entire WaitlistModal function with a fully fixed version
const oldModal = L.substring(L.indexOf('export function WaitlistModal('));
const endMarker = '\nconst m = {';
const modalBody = oldModal.substring(0, oldModal.indexOf(endMarker));
const afterModal = oldModal.substring(oldModal.indexOf(endMarker));

const newModal = `export function WaitlistModal({ open, onClose, mode = 'waitlist', openModal: _openModal }) {
  const navigate = typeof window !== 'undefined' ? (window.__reactNavigate || null) : null;
  const [currentMode, setCurrentMode] = React.useState(mode);
  React.useEffect(() => { setCurrentMode(mode); }, [mode]);

  // Waitlist state
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [profession, setProfession] = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [waitlistError, setWaitlistError] = React.useState('');

  // Signin state
  const [signEmail, setSignEmail] = React.useState('');
  const [signPassword, setSignPassword] = React.useState('');
  const [signError, setSignError] = React.useState('');
  const [signLoading, setSignLoading] = React.useState(false);

  // Contact state
  const [contactName, setContactName] = React.useState('');
  const [contactSurname, setContactSurname] = React.useState('');
  const [contactEmail, setContactEmail] = React.useState('');
  const [contactMessage, setContactMessage] = React.useState('');
  const [contactSent, setContactSent] = React.useState(false);
  const [contactSaving, setContactSaving] = React.useState(false);

  useEffect(() => { document.body.style.overflow = open ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [open]);

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: 'https://www.apriq.co.za' } });
  }

  async function handleSignIn(e) {
    e && e.preventDefault && e.preventDefault();
    if (!signEmail || !signPassword) return;
    setSignLoading(true);
    setSignError('');
    const { error } = await supabase.auth.signInWithPassword({ email: signEmail, password: signPassword });
    if (error) {
      setSignError(error.message);
      setSignLoading(false);
    } else {
      onClose();
      window.location.href = '/';
    }
  }

  async function handleWaitlist() {
    if (!email) return;
    setSaving(true);
    setWaitlistError('');
    const { error } = await supabase.from('waitlist').insert({ email, name, profession });
    if (error) { console.error('Waitlist error:', error); setWaitlistError('Something went wrong. Please try again.'); setSaving(false); return; }
    fetch('/api/send-email', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ type:'new_waitlist', name, email, profession }) }).catch(()=>{});
    fetch('/api/send-email', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ type:'waitlist_confirm', to: email, name }) }).catch(()=>{});
    setSaving(false);
    setSubmitted(true);
  }

  async function handleContact() {
    if (!contactEmail || !contactMessage) return;
    setContactSaving(true);
    await supabase.from('contact_submissions').insert({ name: contactName, surname: contactSurname, email: contactEmail, message: contactMessage });
    fetch('/api/send-email', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ type:'contact', name: contactName, surname: contactSurname, email: contactEmail, message: contactMessage }) }).catch(()=>{});
    fetch('/api/send-email', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ type:'contact_confirm', to: contactEmail, name: contactName }) }).catch(()=>{});
    setContactSaving(false);
    setContactSent(true);
  }

  if (!open) return null;
  const isWaitlist = currentMode === 'waitlist';
  const isContact = currentMode === 'contact';
  const isSignin = currentMode === 'signin';

  return (
    <div style={m.overlay} onClick={(e) => e.target === e.currentTarget && onClose()} role="dialog" aria-modal="true">
      <div style={m.panel}>
        <button onClick={onClose} style={m.close} aria-label="Close">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#979899" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        <span style={m.brand}>AprIQ</span>
        <h2 style={m.title}>{isContact ? 'Contact us' : isWaitlist ? 'Join the waiting list' : 'Sign in to AprIQ'}</h2>
        <p style={m.sub}>{isContact ? 'Send us a message and we will get back to you.' : isWaitlist ? 'Be among the first to access AprIQ when we launch.' : 'Welcome back. Enter your details below.'}</p>

        {isContact && (
          <div style={m.form}>
            {contactSent
              ? <p style={{fontFamily:"'Roboto',system-ui,sans-serif",fontSize:13,color:'#0F4C5C',padding:'12px 0'}}>Message sent. We will be in touch soon.</p>
              : <>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                    <input type="text" placeholder="Name" value={contactName} onChange={e=>setContactName(e.target.value)} style={m.input}/>
                    <input type="text" placeholder="Surname" value={contactSurname} onChange={e=>setContactSurname(e.target.value)} style={m.input}/>
                  </div>
                  <input type="email" placeholder="Email address" value={contactEmail} onChange={e=>setContactEmail(e.target.value)} style={m.input}/>
                  <textarea placeholder="Message" value={contactMessage} onChange={e=>setContactMessage(e.target.value)} rows={4} style={{...m.input,resize:'vertical',lineHeight:1.5}}/>
                  <button onClick={handleContact} disabled={contactSaving} style={{...m.submit,opacity:contactSaving?0.6:1}}>{contactSaving?'Sending...':'Send message'}</button>
                </>
            }
          </div>
        )}

        {isWaitlist && (
          <div style={m.form}>
            {submitted
              ? <p style={{fontFamily:"'Roboto',system-ui,sans-serif",fontSize:13,color:'#0F4C5C',textAlign:'center',padding:'12px 0'}}>You are on the list. We will be in touch.</p>
              : <>
                  {waitlistError && <p style={{fontSize:12,color:'#c0392b',margin:'0 0 4px'}}>{waitlistError}</p>}
                  <input type="text" placeholder="Full name" value={name} onChange={e=>setName(e.target.value)} style={m.input}/>
                  <input type="email" placeholder="Email address" value={email} onChange={e=>setEmail(e.target.value)} style={m.input}/>
                  <select value={profession} onChange={e=>setProfession(e.target.value)} style={m.input}>
                    <option value="">Select your profession</option>
                    <option>Architect</option>
                    <option>Quantity Surveyor</option>
                    <option>Developer</option>
                    <option>Contractor</option>
                    <option>Other</option>
                  </select>
                  <button onClick={handleWaitlist} disabled={saving} style={{...m.submit,opacity:saving?0.6:1}}>{saving?'Saving...':'Join the waiting list'}</button>
                </>
            }
            <div style={m.dividerRow}><span style={m.dividerLine}/><span style={m.dividerText}>or</span><span style={m.dividerLine}/></div>
            <button onClick={handleGoogle} style={m.googleBtn}>Continue with Google</button>
            <p style={m.toggle}>Already have an account?&nbsp;<button style={m.toggleLink} onClick={() => setCurrentMode('signin')}>Sign in</button></p>
          </div>
        )}

        {isSignin && (
          <div style={m.form}>
            {signError && <p style={{fontSize:12,color:'#c0392b',margin:'0 0 4px'}}>{signError}</p>}
            <input type="email" placeholder="Email address" value={signEmail} onChange={e=>setSignEmail(e.target.value)} style={m.input}/>
            <input type="password" placeholder="Password" value={signPassword} onChange={e=>setSignPassword(e.target.value)} style={m.input} onKeyDown={e=>e.key==='Enter'&&handleSignIn()}/>
            <button onClick={handleSignIn} disabled={signLoading} style={{...m.submit,opacity:signLoading?0.6:1}}>{signLoading?'Signing in...':'Sign in'}</button>
            <div style={m.dividerRow}><span style={m.dividerLine}/><span style={m.dividerText}>or</span><span style={m.dividerLine}/></div>
            <button onClick={handleGoogle} style={m.googleBtn}>Continue with Google</button>
            <p style={m.toggle}>No account?&nbsp;<a href="/signup" onClick={onClose} style={{...m.toggleLink,textDecoration:'none'}}>Start free trial</a>&nbsp;&middot;&nbsp;<a href="/login" onClick={onClose} style={{...m.toggleLink,textDecoration:'none'}}>Forgot password?</a></p>
          </div>
        )}
      </div>
    </div>
  );
}
`;

// Replace the modal and add React import if needed
const beforeModal = L.substring(0, L.indexOf('export function WaitlistModal('));
L = beforeModal + newModal + afterModal;

// Make sure React is imported (for React.useState in the modal)
if (!L.includes("import React")) {
  L = L.replace("import { useState", "import React, { useState");
}

fs.writeFileSync('src/components/Layout.jsx', L, 'utf8');
console.log('✓ WaitlistModal fully rewritten');
console.log('  - Sign in: calls signInWithPassword correctly');
console.log('  - Toggle buttons: wired to switch modes');
console.log('  - Waitlist email: type fields added');
console.log('  - Contact email: type fields fixed');
console.log('  - Google OAuth: redirectTo fixed');
