import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Link, Outlet, useLocation } from 'react-router-dom';

const T = {
  petrol:'#0F4C5C', ink:'#111111', paper:'#F9FAFA', mist:'#E4E5E5',
  grey:'#979899', orange:'#FF8210', paleBlue:'#BFD1D6',
  fh:"'Aptos','Segoe UI',system-ui,sans-serif",
  fb:"'Roboto','Segoe UI',system-ui,sans-serif",
};

const NAV = [
  { label:'How it works', to:'/how-it-works' },
  { label:'Features',     to:'/features'     },
  { label:'About',        to:'/about'        },
  { label:'Contact us',   to:'/contact',  modal:'contact' },
];

function Header({ onOpenModal, isLoggedIn }) {
  const location = useLocation();
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => { setMenuOpen(false); setProfileOpen(false); }, [location.pathname]);

  const active = (to) => location.pathname === to;

  return (
    <header style={h.root}>
      <div style={h.inner} className="wrap">
        <Link to="/home" style={h.logoWrap}>
          <img src="/logo-transparent.png" alt="AprIQ" style={{ height:72, width:'auto', objectFit:'contain', display:'block', mixBlendMode:'multiply' }} />
        </Link>

        <nav style={h.nav} className="nav-desktop">
          {NAV.map((link) => (
            link.modal
              ? <button key={link.to} onClick={() => { onOpenModal(link.modal); }} style={{ ...h.navLink, color: T.grey, background:'none', border:'none', cursor:'pointer', fontWeight:400, padding:0 }}>{link.label}</button>
              : <Link key={link.to} to={link.to} style={{ ...h.navLink, color: active(link.to) ? T.petrol : T.grey, fontWeight: active(link.to) ? 500 : 400 }}>{link.label}</Link>
          ))}
          <div style={{ position:'relative' }}>
            <button onClick={() => setProfileOpen((p) => !p)} style={h.profileBtn} aria-label="Account">
              <svg width="18" height="18" fill="none" stroke="#FF8210" strokeWidth="1.5" viewBox="0 0 24 24">
                <circle cx="12" cy="8" r="4"/>
                <path d="M4 20c0-4 3.58-7 8-7s8 3 8 7" strokeLinecap="round"/>
              </svg>
            </button>
            {profileOpen && (
              <div style={h.dropdown}>
                {isLoggedIn ? (
                  <>
                    <Link to="/" style={h.dropItem} onClick={() => setProfileOpen(false)}>Configurator</Link>
                    <Link to="/projects" style={h.dropItem} onClick={() => setProfileOpen(false)}>Projects</Link>
                    <Link to="/clients" style={h.dropItem} onClick={() => setProfileOpen(false)}>Clients</Link>
                    <hr style={h.dropDivider}/>
                    <Link to="/profile" style={h.dropItem} onClick={() => setProfileOpen(false)}>Profile</Link>
                    <Link to="/plans" style={h.dropItem} onClick={() => setProfileOpen(false)}>My Plan</Link>
                    <hr style={h.dropDivider}/>
                    <button style={{ ...h.dropItem, ...h.dropBtn }} onClick={async () => { setProfileOpen(false); await supabase.auth.signOut(); }}>Sign out</button>
                  </>
                ) : (
                  <>
                    <button style={{ ...h.dropItem, ...h.dropBtn }} onClick={() => { setProfileOpen(false); onOpenModal('waitlist'); }}>Join the waiting list</button>
                    <button style={{ ...h.dropItem, ...h.dropBtn, color:T.petrol, fontWeight:500 }} onClick={() => { setProfileOpen(false); onOpenModal('signin'); }}>Sign in</button>
                  </>
                )}
              </div>
            )}
          </div>
        </nav>

        <button className="hamburger" style={h.hamburger} onClick={() => setMenuOpen((m) => !m)} aria-label="Toggle menu">
          <span style={{ ...h.bar, transform: menuOpen ? 'rotate(45deg) translate(5px,5px)' : 'none' }}/>
          <span style={{ ...h.bar, opacity: menuOpen ? 0 : 1 }}/>
          <span style={{ ...h.bar, transform: menuOpen ? 'rotate(-45deg) translate(5px,-5px)' : 'none' }}/>
        </button>
      </div>

      {menuOpen && (
        <div className="mobile-menu" style={h.mobileMenu}>
          {NAV.map((link) => (
            link.modal
              ? <button key={link.to} onClick={() => { setMenuOpen(false); onOpenModal(link.modal); }} style={{ ...h.mobileLink, color: T.ink, background:'none', border:'none', cursor:'pointer', textAlign:'left', width:'100%', borderBottom:'1px solid #E4E5E5', padding:'11px 0' }}>{link.label}</button>
              : <Link key={link.to} to={link.to} style={{ ...h.mobileLink, color: active(link.to) ? T.petrol : T.ink, fontWeight: active(link.to) ? 500 : 400 }}>{link.label}</Link>
          ))}
          {isLoggedIn && (<>
            <Link to="/" style={h.mobileLink} onClick={()=>setMenuOpen(false)}>Configurator</Link>
            <Link to="/projects" style={h.mobileLink} onClick={()=>setMenuOpen(false)}>Projects</Link>
            <Link to="/clients" style={h.mobileLink} onClick={()=>setMenuOpen(false)}>Clients</Link>
            <Link to="/profile" style={h.mobileLink} onClick={()=>setMenuOpen(false)}>Profile</Link>
            <Link to="/plans" style={h.mobileLink} onClick={()=>setMenuOpen(false)}>My Plan</Link>
            <div style={h.mobileDivider}/>
            <button style={{...h.mobileLink,...h.mobileLinkBtn,color:'#cc3300'}} onClick={async()=>{setMenuOpen(false);await supabase.auth.signOut();}}>Sign out</button>
          </>)}
          {!isLoggedIn && (<>
            <div style={h.mobileDivider}/>
            <button style={{ ...h.mobileLink, ...h.mobileLinkBtn, color:T.petrol, fontWeight:500 }} onClick={() => { setMenuOpen(false); onOpenModal('waitlist'); }}>
              Join the waiting list
            </button>
          </>)}
        </div>
      )}
    </header>
  );
}

const h = {
  root:{ position:'sticky', top:0, zIndex:200, background:'#F9FAFA', borderBottom:'1px solid #E4E5E5', minHeight:80 },
  inner:{ display:'flex', alignItems:'center', justifyContent:'space-between', maxWidth:960, margin:'0 auto', padding:'28px 24px' },
  logoWrap:{ display:'flex', flexDirection:'column', textDecoration:'none', lineHeight:1, gap:2 },
  logoMark:{ display:'none' },
  logoSub:{ display:'none' },
  nav:{ display:'flex', alignItems:'center', gap:28 },
  navLink:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:13, textDecoration:'none', transition:'color 150ms ease' },
  profileBtn:{ width:36, height:36, borderRadius:10, border:'1px solid #E4E5E5', background:'#F9FAFA', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' },
  dropdown:{ position:'absolute', top:'calc(100% + 8px)', right:0, background:'#F9FAFA', border:'1px solid #E4E5E5', borderRadius:16, padding:8, minWidth:210, boxShadow:'0 4px 24px rgba(17,17,17,0.07)', zIndex:300 },
  dropItem:{ display:'block', padding:'10px 14px', fontSize:13, color:'#111111', textDecoration:'none', borderRadius:10, fontFamily:"'Roboto',system-ui,sans-serif", transition:'background 120ms ease' },
  dropBtn:{ width:'100%', textAlign:'left', border:'none', background:'transparent', cursor:'pointer' },
  dropDivider:{ border:'none', borderTop:'1px solid #E4E5E5', margin:'6px 8px' },
  hamburger:{ display:'flex', flexDirection:'column', gap:5, background:'none', border:'none', cursor:'pointer', padding:6 },
  bar:{ display:'block', width:22, height:1.5, background:'#111111', borderRadius:1, transition:'all 200ms ease' },
  mobileMenu:{ background:'#F9FAFA', borderTop:'1px solid #E4E5E5', padding:'12px 24px 20px', display:'flex', flexDirection:'column', gap:0 },
  mobileLink:{ display:'block', padding:'11px 0', fontSize:14, fontFamily:"'Roboto',system-ui,sans-serif", textDecoration:'none', borderBottom:'1px solid #E4E5E5' },
  mobileLinkBtn:{ border:'none', background:'none', cursor:'pointer', textAlign:'left', width:'100%', borderBottom:'none', paddingTop:14 },
  mobileDivider:{ height:0 },
};

function Footer() {
  return (
    <footer style={f.root}>
      <div style={f.inner} className="wrap">
        <div style={f.brand} className="footer-brand">
          <img src="/logo-transparent.png" alt="AprIQ" style={{ height:72, width:'auto', objectFit:'contain', display:'block', mixBlendMode:'multiply' }} />
          <p style={f.brandSub}>ROM cost estimates for South African construction projects.</p>
        </div>
        <div style={f.centre} className="footer-centre">
          <div style={{display:'flex',alignItems:'center',gap:8,justifyContent:'center'}}>
            <span style={f.meta}>apriq@apriq.co.za</span>
            <span style={f.sep} className="footer-sep">|</span>
            <span style={f.meta}>South Africa</span>
          </div>
          <a href="/legal" style={{fontFamily:"'Roboto',system-ui,sans-serif",fontSize:11,color:'#C8C9CA',textDecoration:'none',display:'block',textAlign:'center',marginTop:6}}>Terms of Service &amp; Privacy Policy</a>
        </div>
        <div style={f.right} className="footer-right">
          <Link to="/faq" style={f.faqPill}>FAQ's</Link>
          <span style={f.copy} className="footer-copy">© 2025 AprIQ.</span>
          <div style={f.socialRow} className="footer-social">
            {[
              { label:'Facebook',  href:'https://www.facebook.com/profile.php?id=61574287355312',  icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="#979899"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg> },
              { label:'Instagram', href:'https://www.instagram.com/apriq.co.za/', icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#979899" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="#979899" stroke="none"/></svg> },
              { label:'LinkedIn',  href:'https://www.linkedin.com/company/apriq/?viewAsMember=true',  icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="#979899"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg> },
            ].map(({ label, href, icon }) => (
              <a key={label} href={href} aria-label={label} target="_blank" rel="noreferrer" style={f.socialIcon}>{icon}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

const f = {
  root:{ borderTop:'1px solid #E4E5E5', background:'#F9FAFA', padding:'32px 0' },
  inner:{ display:'flex', alignItems:'center', justifyContent:'space-between', height:80, maxWidth:960, margin:'0 auto', padding:'0 24px' },
  brand:{ display:'flex', flexDirection:'column', gap:6, alignItems:'flex-start' },
  logoMark:{ fontFamily:"'Aptos','Segoe UI',system-ui,sans-serif", fontSize:20, fontWeight:700, color:'#111111' },
  brandSub:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:11, color:'#979899', lineHeight:1.5, maxWidth:180 },
  centre:{ display:'flex', flexDirection:'column', alignItems:'center', gap:0, paddingTop:4, textAlign:'center' },
  meta:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:12, color:'#979899' },
  sep:{ fontSize:12, color:'#E4E5E5' },
  right:{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8, justifySelf:'end' },
  faqPill:{ display:'inline-flex', alignItems:'center', padding:'5px 16px', borderRadius:100, border:'1px solid #FF8210', background:'#F9FAFA', fontFamily:"'Roboto',system-ui,sans-serif", fontSize:12, color:'#FF8210', textDecoration:'none' },
  legalLink:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:11, color:'#C8C9CA', textDecoration:'none' },
  copy:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:11, color:'#979899' },
  socialRow:{ display:'flex', alignItems:'center', gap:8, marginTop:4 },
  socialIcon:{ width:30, height:30, borderRadius:10, border:'1px solid #FF8210', display:'flex', alignItems:'center', justifyContent:'center', textDecoration:'none' },
};

export function WaitlistModal({ open, onClose, mode = 'waitlist', openModal: _openModal }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [profession, setProfession] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
  }

  async function handleSubmit() {
    if (!email) return;
    setSaving(true);
    const { error } = await supabase.from('waitlist').insert({ email, name, profession });
    if (!error) fetch('/api/send-email', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name, email, profession }) }).catch(()=>{});
    if (error) console.error('Waitlist error:', error);
    setSaving(false);
    setSubmitted(true);
  }

  useEffect(() => { document.body.style.overflow = open ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [open]);
  const [contactName, setContactName] = useState('');
  const [contactSurname, setContactSurname] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSent, setContactSent] = useState(false);
  const [contactSaving, setContactSaving] = useState(false);

  async function handleContact() {
    if (!contactEmail || !contactMessage) return;
    setContactSaving(true);
    await supabase.from('contact_submissions').insert({
      name: contactName, surname: contactSurname,
      email: contactEmail, message: contactMessage,
    });
    // Send notification email to apriq@apriq.co.za
    fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: contactName, surname: contactSurname, email: contactEmail, message: contactMessage }),
    }).catch(e => console.error('send-contact failed:', e));
    setContactSaving(false);
    setContactSent(true);
  }

  if (!open) return null;
  const isWaitlist = mode === 'waitlist';
  const isContact = mode === 'contact';
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
        {!isContact && <div style={m.form}>
          {isWaitlist && <input type="text" placeholder="Full name" value={name} onChange={e => setName(e.target.value)} style={m.input}/>}
          <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} style={m.input}/>
          {isWaitlist ? (
            <select value={profession} onChange={e => setProfession(e.target.value)} style={m.input}>
              <option value="">Select your profession</option>
              <option>Architect</option>
              <option>Quantity Surveyor</option>
              <option>Developer</option>
              <option>Contractor</option>
              <option>Other</option>
            </select>
          ) : (
            <input type="password" placeholder="Password" style={m.input}/>
          )}
          {!isContact && submitted && isWaitlist
            ? <p style={{fontFamily:"'Roboto',system-ui,sans-serif",fontSize:13,color:'#0F4C5C',textAlign:'center',marginTop:8}}>You are on the list. We will be in touch.</p>
            : <button onClick={handleSubmit} disabled={saving} style={{...m.submit,opacity:saving?0.6:1}}>{saving ? 'Saving...' : isWaitlist ? 'Join the waiting list' : 'Sign in'}</button>
          }
        </div>}
        {!isContact && !submitted && (<div style={m.dividerRow}><span style={m.dividerLine}/><span style={m.dividerText}>or</span><span style={m.dividerLine}/></div>)}
        {!isContact && !submitted && (<button onClick={handleGoogle} style={m.googleBtn}>Continue with Google</button>)}
        {!isContact && <p style={m.toggle}>
          {isWaitlist ? <>Already have access?&nbsp;<button style={m.toggleLink}>Sign in</button></> : <>Don't have an account?&nbsp;<button style={m.toggleLink}>Join the waiting list</button></>}
        </p>}
      </div>
    </div>
  );
}

const m = {
  overlay:{ position:'fixed', inset:0, background:'rgba(17,17,17,0.42)', backdropFilter:'blur(5px)', WebkitBackdropFilter:'blur(5px)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', padding:24 },
  panel:{ background:'#F9FAFA', border:'1px solid #E4E5E5', borderRadius:20, padding:'40px 36px', width:'100%', maxWidth:420, position:'relative' },
  close:{ position:'absolute', top:16, right:16, width:30, height:30, borderRadius:10, border:'1px solid #E4E5E5', background:'#F9FAFA', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' },
  brand:{ display:'block', fontFamily:"'Aptos','Segoe UI',system-ui,sans-serif", fontSize:18, fontWeight:700, color:'#111111', marginBottom:16 },
  title:{ fontFamily:"'Aptos','Segoe UI',system-ui,sans-serif", fontSize:22, fontWeight:600, color:'#111111', marginBottom:8 },
  sub:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:13, color:'#979899', marginBottom:24 },
  form:{ display:'flex', flexDirection:'column', gap:10 },
  input:{ width:'100%', padding:'10px 14px', background:'#F9FAFA', border:'1px solid #E4E5E5', borderRadius:12, fontSize:13, color:'#111111', fontFamily:"'Roboto',system-ui,sans-serif", outline:'none' },
  submit:{ width:'100%', padding:'12px', background:'#111111', color:'#F9FAFA', border:'none', borderRadius:12, fontSize:14, fontWeight:500, cursor:'pointer', fontFamily:"'Roboto',system-ui,sans-serif", marginTop:6 },
  toggle:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:12, color:'#979899', marginTop:16, textAlign:'center' },
  toggleLink:{ background:'none', border:'none', color:'#0F4C5C', fontSize:12, fontFamily:"'Roboto',system-ui,sans-serif", cursor:'pointer', textDecoration:'underline', padding:0 },
  googleBtn:{ width:'100%', padding:'11px', background:'#F9FAFA', color:'#111111', border:'1px solid #E4E5E5', borderRadius:12, fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:"'Roboto',system-ui,sans-serif", marginTop:4 },
  dividerRow:{ display:'flex', alignItems:'center', gap:10, margin:'12px 0 4px' },
  dividerLine:{ flex:1, height:1, background:'#E4E5E5', display:'block' },
  dividerText:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:11, color:'#979899' },
};

export default function Layout() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('waitlist');
  const { user } = useAuth();
  const isLoggedIn = !!user;
  function openModal(mode = 'waitlist') { setModalMode(mode); setModalOpen(true); }
  useEffect(() => {
    const handler = () => openModal('contact');
    window.addEventListener('open-contact-modal', handler);
    window.__openContactModal = () => openModal('contact');
    return () => { window.removeEventListener('open-contact-modal', handler); };
  }, []);
  return (
    <>
      <Header onOpenModal={openModal} isLoggedIn={isLoggedIn}/>
      <main><Outlet context={{ openModal, isLoggedIn }}/></main>
      <Footer/>
      <WaitlistModal open={modalOpen} onClose={() => setModalOpen(false)} mode={modalMode}/>
    </>
  );
}
