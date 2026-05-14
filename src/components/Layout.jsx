import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Link, Outlet, useLocation } from 'react-router-dom';
import UpgradeModal from './UpgradeModal';

/* ── Design tokens ── */
const T = {
  petrol:   '#0F4C5C',
  ink:      '#111111',
  paper:    '#F9FAFA',
  white:    '#FFFFFF',
  mist:     '#E4E5E5',
  grey:     '#979899',
  orange:   '#FF8210',
  paleBlue: '#BFD1D6',
  /* Updated: Plus Jakarta Sans replaces Aptos */
  fh: "'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif",
  fb: "'Roboto','Segoe UI',system-ui,sans-serif",
};

const NAV = [
  { label:'How it works', to:'/how-it-works' },
  { label:'Features',     to:'/features'     },
  { label:'About',        to:'/about'        },
  { label:'Contact us',   to:'/contact',  modal:'contact' },
];

function Header({ onOpenModal, isLoggedIn }) {
  const location  = useLocation();
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [signingOut,  setSigningOut]  = useState(false);
  /* ── Scroll-aware header ── */
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => { setMenuOpen(false); setProfileOpen(false); }, [location.pathname]);

  const active = (to) => location.pathname === to;

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    setProfileOpen(false);
    setMenuOpen(false);

    const localSignOut = supabase.auth.signOut({ scope: 'local' }).catch((e) => {
      console.warn('signOut error (continuing):', e);
    });
    await Promise.race([
      localSignOut,
      new Promise((r) => setTimeout(r, 1500)),
    ]);

    try {
      Object.keys(localStorage)
        .filter(k => k.startsWith('sb-') || k.startsWith('supabase'))
        .forEach(k => localStorage.removeItem(k));
      Object.keys(sessionStorage)
        .filter(k => k.startsWith('sb-') || k.startsWith('supabase'))
        .forEach(k => sessionStorage.removeItem(k));
    } catch { /* ignore */ }

    window.location.replace('/home');
  }

  /* Dynamic header style based on scroll position */
  const headerStyle = scrolled
    ? {
        ...h.root,
        background:           'rgba(249,250,250,0.92)',
        backdropFilter:       'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom:         '1px solid rgba(229,228,231,0.8)',
        boxShadow:            '0 2px 20px rgba(15,76,92,0.08)',
      }
    : h.root;

  return (
    <header style={headerStyle}>
      <div style={h.inner} className="wrap">
        <Link to="/home" style={h.logoWrap}>
          <img
            src="/logo-transparent.png"
            alt="AprIQ"
            style={{ height:72, width:'auto', objectFit:'contain', display:'block', mixBlendMode:'multiply' }}
          />
        </Link>

        <nav style={h.nav} className="nav-desktop">
          {NAV.map((link) => (
            link.modal
              ? <button
                  key={link.to}
                  onClick={() => { onOpenModal(link.modal); }}
                  style={{ ...h.navLink, color: T.grey, background:'none', border:'none', cursor:'pointer', fontWeight:400, padding:0 }}
                >{link.label}</button>
              : <Link
                  key={link.to}
                  to={link.to}
                  style={{
                    ...h.navLink,
                    color:      active(link.to) ? T.petrol : T.grey,
                    fontWeight: active(link.to) ? 600 : 400,
                  }}
                >{link.label}</Link>
          ))}

          {/* Account button */}
          <div style={{ position:'relative' }}>
            <button
              onClick={() => setProfileOpen((p) => !p)}
              style={h.profileBtn}
              aria-label="Account"
            >
              <svg width="18" height="18" fill="none" stroke="#FF8210" strokeWidth="1.5" viewBox="0 0 24 24">
                <circle cx="12" cy="8" r="4"/>
                <path d="M4 20c0-4 3.58-7 8-7s8 3 8 7" strokeLinecap="round"/>
              </svg>
            </button>

            {profileOpen && (
              <div style={h.dropdown}>
                {isLoggedIn ? (
                  <>
                    <Link to="/"          style={h.dropItem} onClick={() => setProfileOpen(false)}>Configurator</Link>
                    <Link to="/projects"  style={h.dropItem} onClick={() => setProfileOpen(false)}>Projects</Link>
                    <Link to="/clients"   style={h.dropItem} onClick={() => setProfileOpen(false)}>Clients</Link>
                    <hr style={h.dropDivider}/>
                    <Link to="/profile"   style={h.dropItem} onClick={() => setProfileOpen(false)}>Profile</Link>
                    <Link to="/plans"     style={h.dropItem} onClick={() => setProfileOpen(false)}>My Plan</Link>
                    <hr style={h.dropDivider}/>
                    <button
                      style={{ ...h.dropItem, ...h.dropBtn }}
                      onClick={handleSignOut}
                      disabled={signingOut}
                    >
                      {signingOut ? 'Signing out…' : 'Sign out'}
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/signup"
                      style={{ ...h.dropItem, ...h.dropBtn, textDecoration: 'none', display: 'block' }}
                      onClick={() => setProfileOpen(false)}
                    >Sign up</Link>
                    <button
                      style={{ ...h.dropItem, ...h.dropBtn, color:T.petrol, fontWeight:500 }}
                      onClick={() => { setProfileOpen(false); onOpenModal('signin'); }}
                    >Sign in</button>
                  </>
                )}
              </div>
            )}
          </div>
        </nav>

        {/* Hamburger */}
        <button
          className="hamburger"
          style={h.hamburger}
          onClick={() => setMenuOpen((m) => !m)}
          aria-label="Toggle menu"
        >
          <span style={{ ...h.bar, transform: menuOpen ? 'rotate(45deg) translate(5px,5px)' : 'none' }}/>
          <span style={{ ...h.bar, opacity: menuOpen ? 0 : 1 }}/>
          <span style={{ ...h.bar, transform: menuOpen ? 'rotate(-45deg) translate(5px,-5px)' : 'none' }}/>
        </button>
      </div>

      {menuOpen && (
        <div className="mobile-menu" style={h.mobileMenu}>
          {NAV.map((link) => (
            link.modal
              ? <button
                  key={link.to}
                  onClick={() => { setMenuOpen(false); onOpenModal(link.modal); }}
                  style={{ ...h.mobileLink, color: T.ink, background:'none', border:'none', cursor:'pointer', textAlign:'left', width:'100%', borderBottom:'1px solid #E4E5E5', padding:'11px 0' }}
                >{link.label}</button>
              : <Link
                  key={link.to}
                  to={link.to}
                  style={{ ...h.mobileLink, color: active(link.to) ? T.petrol : T.ink, fontWeight: active(link.to) ? 500 : 400 }}
                >{link.label}</Link>
          ))}
          {isLoggedIn && (<>
            <Link to="/"          style={h.mobileLink} onClick={() => setMenuOpen(false)}>Configurator</Link>
            <Link to="/projects"  style={h.mobileLink} onClick={() => setMenuOpen(false)}>Projects</Link>
            <Link to="/clients"   style={h.mobileLink} onClick={() => setMenuOpen(false)}>Clients</Link>
            <Link to="/profile"   style={h.mobileLink} onClick={() => setMenuOpen(false)}>Profile</Link>
            <Link to="/plans"     style={h.mobileLink} onClick={() => setMenuOpen(false)}>My Plan</Link>
            <div style={h.mobileDivider}/>
            <button
              style={{ ...h.mobileLink, ...h.mobileLinkBtn, color:'#cc3300' }}
              onClick={handleSignOut}
              disabled={signingOut}
            >{signingOut ? 'Signing out…' : 'Sign out'}</button>
          </>)}
          {!isLoggedIn && (<>
            <div style={h.mobileDivider}/>
            <button
              style={{ ...h.mobileLink, ...h.mobileLinkBtn, color:T.petrol, fontWeight:500 }}
              onClick={() => { setMenuOpen(false); onOpenModal('signin'); }}
            >Sign in</button>
            <Link
              to="/signup"
              style={{ ...h.mobileLink, color:T.petrol, fontWeight:500 }}
              onClick={() => setMenuOpen(false)}
            >Sign up</Link>
          </>)}
        </div>
      )}
    </header>
  );
}

const h = {
  root: {
    position: 'sticky',
    top: 0,
    zIndex: 200,
    background: '#F9FAFA',
    borderBottom: '1px solid #E4E5E5',
    minHeight: 80,
    /* CSS transition lives in globals.css `header { transition: ... }` */
  },
  inner:      { display:'flex', alignItems:'center', justifyContent:'space-between', maxWidth:960, margin:'0 auto', padding:'28px 24px' },
  logoWrap:   { display:'flex', flexDirection:'column', textDecoration:'none', lineHeight:1, gap:2 },
  nav:        { display:'flex', alignItems:'center', gap:28 },
  navLink: {
    fontFamily: "'Roboto','Segoe UI',system-ui,sans-serif",
    fontSize: 13,
    textDecoration: 'none',
    transition: 'color var(--ease-ui), opacity var(--ease-fade), transform var(--ease-lift)',
  },
  profileBtn: { width:36, height:36, borderRadius:10, border:'1px solid #E4E5E5', background:'#F9FAFA', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' },
  dropdown: {
    position: 'absolute', top:'calc(100% + 8px)', right:0,
    background: '#FFFFFF',
    border: '0.5px solid #E4E5E5',
    borderRadius: 16,
    padding: 8,
    minWidth: 210,
    boxShadow: '0 4px 24px rgba(15,76,92,0.10)',
    zIndex: 300,
  },
  dropItem: {
    display: 'block',
    padding: '10px 14px',
    fontSize: 13,
    color: '#111111',
    textDecoration: 'none',
    borderRadius: 10,
    fontFamily: "'Roboto','Segoe UI',system-ui,sans-serif",
    transition: 'background var(--ease-ui), color var(--ease-ui), transform var(--ease-lift)',
  },
  dropBtn:     { width:'100%', textAlign:'left', border:'none', background:'transparent', cursor:'pointer' },
  dropDivider: { border:'none', borderTop:'1px solid #E4E5E5', margin:'6px 8px' },
  hamburger:   { display:'flex', flexDirection:'column', gap:5, background:'none', border:'none', cursor:'pointer', padding:6 },
  bar:         { display:'block', width:22, height:1.5, background:'#111111', borderRadius:1, transition:'all 200ms ease' },
  mobileMenu:  { background:'#F9FAFA', borderTop:'1px solid #E4E5E5', padding:'12px 24px 20px', display:'flex', flexDirection:'column', gap:0 },
  mobileLink:  { display:'block', padding:'11px 0', fontSize:14, fontFamily:"'Roboto','Segoe UI',system-ui,sans-serif", textDecoration:'none', borderBottom:'1px solid #E4E5E5', transition:'color var(--ease-ui), padding-left var(--ease-ui)' },
  mobileLinkBtn:  { border:'none', background:'none', cursor:'pointer', textAlign:'left', width:'100%', borderBottom:'none', paddingTop:14 },
  mobileDivider:  { height:0 },
};

/* ── Footer ── */
function Footer() {
  return (
    <footer style={f.root}>
      <div style={f.inner} className="wrap">
        <div style={f.brand} className="footer-brand">
          <img
            src="/logo-transparent.png"
            alt="AprIQ"
            style={{ height:72, width:'auto', objectFit:'contain', display:'block', mixBlendMode:'multiply' }}
          />
          <p style={f.brandSub}>ROM cost estimates for South African construction projects.</p>
        </div>

        <div style={f.centre} className="footer-centre">
          <div style={{ display:'flex', alignItems:'center', gap:8, justifyContent:'center' }}>
            <span style={f.meta}>apriq@apriq.co.za</span>
            <span style={f.sep} className="footer-sep">|</span>
            <span style={f.meta}>South Africa</span>
          </div>
          <a
            href="/legal"
            style={{ fontFamily:"'Roboto','Segoe UI',system-ui,sans-serif", fontSize:11, color:'#C8C9CA', textDecoration:'none', display:'block', textAlign:'center', marginTop:6 }}
          >Terms of Service &amp; Privacy Policy</a>
        </div>

        <div style={f.right} className="footer-right">
          <Link to="/faq" style={f.faqPill}>FAQ's</Link>
          <span style={f.copy} className="footer-copy">© 2025 AprIQ.</span>
          <div style={f.socialRow} className="footer-social">
            {[
              { label:'Facebook',  href:'https://www.facebook.com/profile.php?id=61574287355312',
                icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="#979899"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg> },
              { label:'Instagram', href:'https://www.instagram.com/apriq.co.za/',
                icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#979899" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="#979899" stroke="none"/></svg> },
              { label:'LinkedIn',  href:'https://www.linkedin.com/company/apriq/?viewAsMember=true',
                icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="#979899"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg> },
            ].map(({ label, href, icon }) => (
              <a key={label} href={href} aria-label={label} target="_blank" rel="noreferrer" style={f.socialIcon}>
                {icon}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

const f = {
  root:      { borderTop:'1px solid #E4E5E5', background:'#F9FAFA', padding:'32px 0' },
  inner:     { display:'flex', alignItems:'center', justifyContent:'space-between', height:80, maxWidth:960, margin:'0 auto', padding:'0 24px' },
  brand:     { display:'flex', flexDirection:'column', gap:6, alignItems:'flex-start' },
  brandSub:  { fontFamily:"'Roboto','Segoe UI',system-ui,sans-serif", fontSize:11, color:'#979899', lineHeight:1.5, maxWidth:180 },
  centre:    { display:'flex', flexDirection:'column', alignItems:'center', gap:0, paddingTop:4, textAlign:'center' },
  meta:      { fontFamily:"'Roboto','Segoe UI',system-ui,sans-serif", fontSize:12, color:'#979899' },
  sep:       { fontSize:12, color:'#E4E5E5' },
  right:     { display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8, justifySelf:'end' },
  faqPill:   { display:'inline-flex', alignItems:'center', padding:'5px 16px', borderRadius:100, border:'1px solid #FF8210', background:'#F9FAFA', fontFamily:"'Roboto','Segoe UI',system-ui,sans-serif", fontSize:12, color:'#FF8210', textDecoration:'none', transition:'box-shadow var(--ease-ui), transform var(--ease-lift)' },
  copy:      { fontFamily:"'Roboto','Segoe UI',system-ui,sans-serif", fontSize:11, color:'#979899' },
  socialRow: { display:'flex', alignItems:'center', gap:8, marginTop:4 },
  socialIcon:{ width:30, height:30, borderRadius:10, border:'1px solid #FF8210', display:'flex', alignItems:'center', justifyContent:'center', textDecoration:'none' },
};

/* ── Sign-in / Contact modal ── */
export function SiteModal({ open, onClose, mode = 'contact' }) {
  const [currentMode, setCurrentMode] = React.useState(mode);
  React.useEffect(() => { setCurrentMode(mode); }, [mode]);

  /* Sign in */
  const [signEmail,    setSignEmail]    = React.useState('');
  const [signPassword, setSignPassword] = React.useState('');
  const [signError,    setSignError]    = React.useState('');
  const [signLoading,  setSignLoading]  = React.useState(false);

  /* Contact */
  const [contactName,    setContactName]    = React.useState('');
  const [contactSurname, setContactSurname] = React.useState('');
  const [contactEmail,   setContactEmail]   = React.useState('');
  const [contactMessage, setContactMessage] = React.useState('');
  const [contactSent,    setContactSent]    = React.useState(false);
  const [contactSaving,  setContactSaving]  = React.useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({ provider:'google', options:{ redirectTo:'https://www.apriq.co.za' } });
  }

  async function handleSignIn(e) {
    e && e.preventDefault && e.preventDefault();
    if (!signEmail || !signPassword) return;
    setSignLoading(true);
    setSignError('');
    const { error } = await supabase.auth.signInWithPassword({ email: signEmail, password: signPassword });
    if (error) { setSignError(error.message); setSignLoading(false); }
    else { onClose(); window.location.href = '/'; }
  }

  async function handleContact() {
    if (!contactEmail || !contactMessage) return;
    setContactSaving(true);
    const { error } = await supabase.from('contact_submissions').insert({ name: contactName, surname: contactSurname, email: contactEmail.trim().toLowerCase(), message: contactMessage });
    if (error) console.error('Contact submission DB error:', error);
    fetch('/api/send-email', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ type:'contact', name: contactName, surname: contactSurname, email: contactEmail, message: contactMessage }) }).catch(()=>{});
    fetch('/api/send-email', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ type:'contact_confirm', to: contactEmail, name: contactName }) }).catch(()=>{});
    setContactSaving(false);
    setContactSent(true);
  }

  if (!open) return null;
  const isContact  = currentMode === 'contact';
  const isSignin   = currentMode === 'signin';

  return (
    <div style={m.overlay} onClick={(e) => e.target === e.currentTarget && onClose()} role="dialog" aria-modal="true">
      <div style={m.panel}>
        <button onClick={onClose} style={m.close} aria-label="Close">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#979899" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        <img src="/logo-transparent.png" alt="AprIQ" style={m.brandLogo} />
        <h2 style={m.title}>{isContact ? 'Contact us' : 'Sign in to AprIQ'}</h2>
        <p style={m.sub}>{isContact ? 'Send us a message and we will get back to you.' : 'Welcome back. Enter your details below.'}</p>

        {isContact && (
          <div style={m.form}>
            {contactSent
              ? <p style={{ fontFamily:"'Roboto','Segoe UI',system-ui,sans-serif", fontSize:13, color:'#0F4C5C', padding:'12px 0' }}>Message sent. We will be in touch soon.</p>
              : <>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                    <input type="text"  placeholder="Name"    value={contactName}    onChange={e=>setContactName(e.target.value)}    style={m.input}/>
                    <input type="text"  placeholder="Surname" value={contactSurname} onChange={e=>setContactSurname(e.target.value)} style={m.input}/>
                  </div>
                  <input type="email" placeholder="Email address" value={contactEmail}   onChange={e=>setContactEmail(e.target.value)}   style={m.input}/>
                  <textarea           placeholder="Message"       value={contactMessage} onChange={e=>setContactMessage(e.target.value)} rows={4} style={{ ...m.input, resize:'vertical', lineHeight:1.5 }}/>
                  <button onClick={handleContact} disabled={contactSaving} style={{ ...m.submit, opacity:contactSaving?0.6:1 }}>{contactSaving?'Sending...':'Send message'}</button>
                </>
            }
          </div>
        )}

        {isSignin && (
          <div style={m.form}>
            {signError && <p style={{ fontSize:12, color:'#c0392b', margin:'0 0 4px' }}>{signError}</p>}
            <input type="email"    placeholder="Email address" value={signEmail}    onChange={e=>setSignEmail(e.target.value)}    style={m.input}/>
            <input type="password" placeholder="Password"      value={signPassword} onChange={e=>setSignPassword(e.target.value)} style={m.input} onKeyDown={e=>e.key==='Enter'&&handleSignIn()}/>
            <button onClick={handleSignIn} disabled={signLoading} style={{ ...m.submit, opacity:signLoading?0.6:1 }}>{signLoading?'Signing in...':'Sign in'}</button>
            <div style={m.dividerRow}><span style={m.dividerLine}/><span style={m.dividerText}>or</span><span style={m.dividerLine}/></div>
            <button onClick={handleGoogle} style={m.googleBtn}>Continue with Google</button>
            <p style={m.toggle}>No account?&nbsp;<a href="/signup" onClick={onClose} style={{ ...m.toggleLink, textDecoration:'none' }}>Start free trial</a>&nbsp;&middot;&nbsp;<a href="/login" onClick={onClose} style={{ ...m.toggleLink, textDecoration:'none' }}>Forgot password?</a></p>
          </div>
        )}
      </div>
    </div>
  );
}

const m = {
  overlay:    { position:'fixed', inset:0, background:'rgba(17,17,17,0.42)', backdropFilter:'blur(5px)', WebkitBackdropFilter:'blur(5px)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', padding:24 },
  panel:      { background:'#FFFFFF', border:'0.5px solid #E4E5E5', borderRadius:20, padding:'40px 36px', width:'100%', maxWidth:420, position:'relative', boxShadow:'0 8px 40px rgba(15,76,92,0.12)' },
  close:      { position:'absolute', top:16, right:16, width:30, height:30, borderRadius:10, border:'1px solid #E4E5E5', background:'#F9FAFA', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', transition:'background var(--ease-ui), border-color var(--ease-ui), transform var(--ease-lift)' },
  brandLogo:  { height: 34, width: 'auto', objectFit: 'contain', display: 'block', mixBlendMode: 'multiply', marginBottom: 16 },
  title:      { fontFamily:"'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif", fontSize:22, fontWeight:600, color:'#111111', marginBottom:8, letterSpacing:'-0.3px' },
  sub:        { fontFamily:"'Roboto','Segoe UI',system-ui,sans-serif", fontSize:13, color:'#979899', marginBottom:24 },
  form:       { display:'flex', flexDirection:'column', gap:10 },
  input:      { width:'100%', padding:'10px 14px', background:'#F9FAFA', border:'1.5px solid #E4E5E5', borderRadius:12, fontSize:13, color:'#111111', fontFamily:"'Roboto','Segoe UI',system-ui,sans-serif", outline:'none', transition:'border-color var(--ease-ui), box-shadow var(--ease-ui)' },
  submit:     { width:'100%', padding:'12px', background:'#111111', color:'#F9FAFA', border:'none', borderRadius:12, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:"'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif", marginTop:6, transition:'transform var(--ease-lift), box-shadow var(--ease-ui), background var(--ease-ui)' },
  toggle:     { fontFamily:"'Roboto','Segoe UI',system-ui,sans-serif", fontSize:12, color:'#979899', marginTop:16, textAlign:'center' },
  toggleLink: { background:'none', border:'none', color:'#0F4C5C', fontSize:12, fontFamily:"'Roboto','Segoe UI',system-ui,sans-serif", cursor:'pointer', textDecoration:'underline', padding:0, transition:'color var(--ease-ui)' },
  googleBtn:  { width:'100%', padding:'11px', background:'#F9FAFA', color:'#111111', border:'1px solid #E4E5E5', borderRadius:12, fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:"'Roboto','Segoe UI',system-ui,sans-serif", marginTop:4, transition:'border-color var(--ease-ui), background var(--ease-ui), box-shadow var(--ease-ui), transform var(--ease-lift)' },
  dividerRow: { display:'flex', alignItems:'center', gap:10, margin:'12px 0 4px' },
  dividerLine:{ flex:1, height:1, background:'#E4E5E5', display:'block' },
  dividerText:{ fontFamily:"'Roboto','Segoe UI',system-ui,sans-serif", fontSize:11, color:'#979899' },
};

/* ── Layout shell ── */
export default function Layout() {
  const [modalOpen,  setModalOpen]  = useState(false);
  const [modalMode,  setModalMode]  = useState('contact');
  const [showUpgrade,setShowUpgrade]= useState(false);
  const [upgradeMode,setUpgradeMode]= useState('upgrade');
  /** While on /upgrade, set true when user closes the upgrade modal so we do not auto-re-open it. */
  const [upgradeDismissedOnPage,setUpgradeDismissedOnPage]= useState(false);
  const { user, profile } = useAuth();
  const location  = useLocation();
  const isLoggedIn = !!user;

  const openModal = useCallback((mode = 'contact') => {
    setModalMode(mode);
    setModalOpen(true);
  }, []);

  const openUpgrade = useCallback((mode = 'upgrade') => {
    setUpgradeMode(typeof mode === 'string' ? mode : 'upgrade');
    setUpgradeDismissedOnPage(false);
    setShowUpgrade(true);
  }, []);

  const closeUpgradeModal = useCallback(() => {
    setShowUpgrade(false);
    if (location.pathname === '/upgrade') setUpgradeDismissedOnPage(true);
  }, [location.pathname]);

  useEffect(() => {
    const handler = () => openModal('contact');
    window.addEventListener('open-contact-modal', handler);
    window.__openContactModal = () => openModal('contact');
    return () => { window.removeEventListener('open-contact-modal', handler); };
  }, [openModal]);

  useEffect(() => {
    setModalOpen(false);
    if (location.pathname !== '/upgrade') {
      setShowUpgrade(false);
      setUpgradeDismissedOnPage(false);
    }
  }, [location.pathname]);

  const outletContext = useMemo(
    () => ({ openModal, openUpgrade, isLoggedIn, upgradeDismissedOnPage }),
    [openModal, openUpgrade, isLoggedIn, upgradeDismissedOnPage],
  );

  return (
    <>
      <Header onOpenModal={openModal} isLoggedIn={isLoggedIn}/>
      <main><Outlet context={outletContext}/></main>
      <Footer/>
      <SiteModal open={modalOpen} onClose={() => setModalOpen(false)} mode={modalMode}/>
      <UpgradeModal isOpen={showUpgrade} onClose={closeUpgradeModal} user={user} profile={profile} mode={upgradeMode}/>
    </>
  );
}
