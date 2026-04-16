const fs = require('fs');
const path = require('path');

function write(filePath, content) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✓', filePath);
}

// ─── globals.css ───────────────────────────────────────────────────────────
write('src/styles/globals.css', `/* AprIQ — Global Stylesheet | Brand Guide v1.2 */
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500&display=swap');

:root {
  --petrol:    #0F4C5C;
  --ink:       #111111;
  --paper:     #F9FAFA;
  --mist:      #E4E5E5;
  --grey:      #979899;
  --orange:    #FF8210;
  --pale-blue: #BFD1D6;
  --font-heading: 'Aptos', 'Segoe UI', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
  --font-body:    'Roboto', 'Segoe UI', -apple-system, system-ui, sans-serif;
  --s4:4px; --s8:8px; --s12:12px; --s16:16px; --s24:24px;
  --s32:32px; --s40:40px; --s48:48px; --s64:64px;
  --r-sm:10px; --r-md:12px; --r-lg:16px; --r-xl:20px;
  --max-w:960px; --pad-x:24px;
  --ease:150ms ease; --ease-fade:180ms ease;
}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
html{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;scroll-behavior:smooth;}
body{font-family:var(--font-body);background:var(--paper);color:var(--ink);font-size:14px;line-height:1.6;}
h1,h2,h3,h4,h5,h6{font-family:var(--font-heading);color:var(--ink);line-height:1.2;font-weight:600;}
p{font-family:var(--font-body);color:var(--grey);line-height:1.7;font-size:14px;}
a{color:var(--petrol);text-decoration:none;}
a:hover{text-decoration:underline;}
.wrap{max-width:var(--max-w);margin:0 auto;padding:0 var(--pad-x);}
.panel{background:var(--paper);border:1px solid var(--mist);border-radius:var(--r-lg);padding:var(--s32);}
.pill{display:inline-flex;align-items:center;padding:6px 16px;border-radius:100px;border:1px solid var(--mist);font-family:var(--font-body);font-size:13px;color:var(--ink);background:var(--paper);white-space:nowrap;}
.pill-row{display:flex;flex-wrap:wrap;gap:8px;margin-top:20px;}
.btn-ink{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:11px 26px;background:var(--ink);color:var(--paper);border:none;border-radius:var(--r-md);font-family:var(--font-body);font-size:14px;font-weight:500;cursor:pointer;transition:opacity var(--ease);text-decoration:none;}
.btn-ink:hover{opacity:0.86;text-decoration:none;}
.btn-outline{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:11px 26px;background:var(--paper);color:var(--ink);border:1px solid var(--mist);border-radius:var(--r-md);font-family:var(--font-body);font-size:14px;font-weight:500;cursor:pointer;transition:background var(--ease);text-decoration:none;}
.btn-outline:hover{background:var(--mist);}
.input{width:100%;padding:10px 14px;background:var(--paper);border:1px solid var(--mist);border-radius:var(--r-md);font-family:var(--font-body);font-size:13px;color:var(--ink);outline:none;transition:border-color var(--ease);appearance:none;}
.input::placeholder{color:var(--grey);}
.input:focus{border-color:var(--pale-blue);}
.fi{opacity:0;transform:translateY(7px);transition:opacity var(--ease-fade),transform 200ms ease;}
.fi.show{opacity:1;transform:translateY(0);}
.fi-group .fi:nth-child(1){transition-delay:0ms;}
.fi-group .fi:nth-child(2){transition-delay:55ms;}
.fi-group .fi:nth-child(3){transition-delay:110ms;}
.fi-group .fi:nth-child(4){transition-delay:165ms;}
.fi-group .fi:nth-child(5){transition-delay:220ms;}
.fi-group .fi:nth-child(6){transition-delay:275ms;}
.section{padding:56px 0;}
.section-sm{padding:32px 0;}
.divider{border:none;border-top:1px solid var(--mist);margin:32px 0;}
@media(max-width:700px){
  :root{--pad-x:16px;--s32:24px;}
  h1{font-size:24px!important;}
  h2{font-size:18px!important;}
  .panel{padding:24px 20px;}
  .nav-desktop{display:none!important;}
  .hamburger{display:flex!important;}
}
@media(min-width:701px){
  .hamburger{display:none!important;}
  .mobile-menu{display:none!important;}
}
`);

// ─── useFadeIn.js ───────────────────────────────────────────────────────────
write('src/hooks/useFadeIn.js', `import { useEffect, useRef } from 'react';

export function useFadeIn() {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('show');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.07, rootMargin: '0px 0px -32px 0px' }
    );
    const elements = ref.current.querySelectorAll('.fi');
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
  return ref;
}
`);

// ─── Layout.jsx ────────────────────────────────────────────────────────────
write('src/components/Layout.jsx', `import { useState, useEffect } from 'react';
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
  { label:'Contact us',   to:'/contact'      },
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
        <Link to="/" style={h.logoWrap}>
          <span style={h.logoMark}>AprIQ</span>
          <span style={h.logoSub}>Smarter Construction Feasibility</span>
        </Link>

        <nav style={h.nav} className="nav-desktop">
          {NAV.map((link) => (
            <Link key={link.to} to={link.to} style={{ ...h.navLink, color: active(link.to) ? T.petrol : T.grey, fontWeight: active(link.to) ? 500 : 400 }}>
              {link.label}
            </Link>
          ))}
          <div style={{ position:'relative' }}>
            <button onClick={() => setProfileOpen((p) => !p)} style={h.profileBtn} aria-label="Account">
              <svg width="18" height="18" fill="none" stroke={T.ink} strokeWidth="1.5" viewBox="0 0 24 24">
                <circle cx="12" cy="8" r="4"/>
                <path d="M4 20c0-4 3.58-7 8-7s8 3 8 7" strokeLinecap="round"/>
              </svg>
            </button>
            {profileOpen && (
              <div style={h.dropdown}>
                {isLoggedIn ? (
                  <>
                    <Link to="/billing" style={h.dropItem} onClick={() => setProfileOpen(false)}>My Plan</Link>
                    <Link to="/profile" style={h.dropItem} onClick={() => setProfileOpen(false)}>Profile</Link>
                    <hr style={h.dropDivider}/>
                    <button style={{ ...h.dropItem, ...h.dropBtn }}>Sign out</button>
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
            <Link key={link.to} to={link.to} style={{ ...h.mobileLink, color: active(link.to) ? T.petrol : T.ink, fontWeight: active(link.to) ? 500 : 400 }}>
              {link.label}
            </Link>
          ))}
          <div style={h.mobileDivider}/>
          <button style={{ ...h.mobileLink, ...h.mobileLinkBtn, color:T.petrol, fontWeight:500 }} onClick={() => { setMenuOpen(false); onOpenModal('waitlist'); }}>
            Join the waiting list
          </button>
        </div>
      )}
    </header>
  );
}

const h = {
  root:{ position:'sticky', top:0, zIndex:200, background:'#F9FAFA', borderBottom:'1px solid #E4E5E5' },
  inner:{ display:'flex', alignItems:'center', justifyContent:'space-between', height:60, maxWidth:960, margin:'0 auto', padding:'0 24px' },
  logoWrap:{ display:'flex', flexDirection:'column', textDecoration:'none', lineHeight:1, gap:2 },
  logoMark:{ fontFamily:"'Aptos','Segoe UI',system-ui,sans-serif", fontSize:22, fontWeight:700, color:'#111111', letterSpacing:'-0.3px' },
  logoSub:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:9, color:'#979899', letterSpacing:'0.1px' },
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
        <div style={f.brand}>
          <span style={f.logoMark}>AprIQ</span>
          <p style={f.brandSub}>ROM cost estimates for South African construction projects.</p>
        </div>
        <div style={f.centre}>
          <span style={f.meta}>apriq@apriq.co.za</span>
          <span style={f.sep}>|</span>
          <span style={f.meta}>South Africa</span>
        </div>
        <div style={f.right}>
          <Link to="/faq" style={f.faqPill}>FAQ's</Link>
          <Link to="/legal" style={f.legalLink}>Terms of Service &amp; Privacy Policy</Link>
          <span style={f.copy}>© 2026 AprIQ.</span>
          <div style={f.socialRow}>
            {[
              { label:'Facebook',  href:'https://facebook.com',  icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="#979899"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg> },
              { label:'Instagram', href:'https://instagram.com', icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#979899" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="#979899" stroke="none"/></svg> },
              { label:'LinkedIn',  href:'https://linkedin.com',  icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="#979899"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg> },
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
  inner:{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:24, maxWidth:960, margin:'0 auto', padding:'0 24px' },
  brand:{ display:'flex', flexDirection:'column', gap:6 },
  logoMark:{ fontFamily:"'Aptos','Segoe UI',system-ui,sans-serif", fontSize:20, fontWeight:700, color:'#111111' },
  brandSub:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:11, color:'#979899', lineHeight:1.5, maxWidth:180 },
  centre:{ display:'flex', alignItems:'center', gap:8, paddingTop:4 },
  meta:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:12, color:'#979899' },
  sep:{ fontSize:12, color:'#E4E5E5' },
  right:{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8 },
  faqPill:{ display:'inline-flex', alignItems:'center', padding:'5px 16px', borderRadius:100, border:'1px solid #E4E5E5', background:'#F9FAFA', fontFamily:"'Roboto',system-ui,sans-serif", fontSize:12, color:'#979899', textDecoration:'none' },
  legalLink:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:11, color:'#C8C9CA', textDecoration:'none' },
  copy:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:11, color:'#979899' },
  socialRow:{ display:'flex', alignItems:'center', gap:8, marginTop:4 },
  socialIcon:{ width:30, height:30, borderRadius:10, border:'1px solid #E4E5E5', display:'flex', alignItems:'center', justifyContent:'center', textDecoration:'none' },
};

export function WaitlistModal({ open, onClose, mode = 'waitlist' }) {
  useEffect(() => { document.body.style.overflow = open ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [open]);
  if (!open) return null;
  const isWaitlist = mode === 'waitlist';
  return (
    <div style={m.overlay} onClick={(e) => e.target === e.currentTarget && onClose()} role="dialog" aria-modal="true">
      <div style={m.panel}>
        <button onClick={onClose} style={m.close} aria-label="Close">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#979899" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        <span style={m.brand}>AprIQ</span>
        <h2 style={m.title}>{isWaitlist ? 'Join the waiting list' : 'Sign in to AprIQ'}</h2>
        <p style={m.sub}>{isWaitlist ? 'Be among the first to access AprIQ when we launch.' : 'Welcome back. Enter your details below.'}</p>
        <div style={m.form}>
          {isWaitlist && <input type="text" placeholder="Full name" style={m.input}/>}
          <input type="email" placeholder="Email address" style={m.input}/>
          {isWaitlist ? (
            <select style={m.input}>
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
          <button style={m.submit}>{isWaitlist ? 'Join the waiting list' : 'Sign in'}</button>
        </div>
        <p style={m.toggle}>
          {isWaitlist ? <>Already have access?&nbsp;<button style={m.toggleLink}>Sign in</button></> : <>Don't have an account?&nbsp;<button style={m.toggleLink}>Join the waiting list</button></>}
        </p>
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
};

export default function Layout() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('waitlist');
  const isLoggedIn = false;
  function openModal(mode = 'waitlist') { setModalMode(mode); setModalOpen(true); }
  return (
    <>
      <Header onOpenModal={openModal} isLoggedIn={isLoggedIn}/>
      <main><Outlet context={{ openModal, isLoggedIn }}/></main>
      <Footer/>
      <WaitlistModal open={modalOpen} onClose={() => setModalOpen(false)} mode={modalMode}/>
    </>
  );
}
`);

// ─── LandingPage.jsx ────────────────────────────────────────────────────────
write('src/pages/LandingPage.jsx', `import { Link, useOutletContext } from 'react-router-dom';
import { useFadeIn } from '../hooks/useFadeIn';

const WHY_PILLS = ['Faster Early Decisions','Structured Cost Guidance','Instant Cost Breakdown','Clearer Feasibility Planning'];
const HOW_STEPS = ['Add Project\\n& Client info','Add Project\\nArea','Select All\\nCost Factors','Generate/Export\\nSummary'];
const WHO_PILLS = ['Architects','QS','Developers','Contractors','Everyone'];
const FEATURE_PILLS = ['ROM Estimates','Feasibility Planning','Building Types','Project Types','Cost Adjustments','Element Breakdowns','Rate Summaries'];

export default function LandingPage() {
  const { openModal } = useOutletContext();
  const r1=useFadeIn(), r2=useFadeIn(), r3=useFadeIn(), r4=useFadeIn(), r5=useFadeIn();
  return (
    <div>
      <section style={s.hero}>
        <div style={s.heroWrap} className="wrap">
          <h1 style={s.h1}>Early-Stage Construction Cost Intelligence for South Africa</h1>
          <p style={s.heroSub}>AprIQ provides early-stage construction feasibility and Rough Order of Magnitude cost estimates, enabling faster budget structuring and clearer professional estimates for project teams.</p>
          <button onClick={() => openModal('waitlist')} style={s.cta}>Join the waiting list</button>
        </div>
      </section>

      <section style={s.section}><div className="wrap" ref={r1}><div style={s.panel} className="fi-group">
        <h2 style={s.panelH2} className="fi">Why AprIQ</h2>
        <p style={s.body} className="fi">AprIQ exists to reduce friction at the point where projects are still being tested. It gives architects, quantity surveyors, contractors, developers, homeowners, and general users a practical way to build an early cost position before detailed costing begins. The aim is not to replace later professional work, but to improve the speed and structure of the decisions that come first.</p>
        <div style={s.pillRow} className="fi">{WHY_PILLS.map((p) => <span key={p} style={s.pill}>{p}</span>)}</div>
      </div></div></section>

      <section style={s.section}><div className="wrap" ref={r2}><div style={s.panel} className="fi-group">
        <h2 style={s.panelH2} className="fi">What AprIQ does</h2>
        <p style={s.body} className="fi">AprIQ provides a structured way to approach early-stage construction cost planning. It helps users take the basic information available at the beginning of a project and turn it into a clearer cost picture that can support feasibility reviews, budget discussions, and early decision-making.</p>
        <p style={{...s.body,marginTop:12}} className="fi">AprIQ helps project teams generate early-stage construction cost estimates quickly and in a structured, professional format. It is built for feasibility and Rough Order of Magnitude planning, giving users a clearer cost direction before detailed quantity surveying or procurement work begins.</p>
      </div></div></section>

      <section style={s.section}><div className="wrap" ref={r3}><div style={s.panel} className="fi-group">
        <h2 style={s.panelH2} className="fi">How it works</h2>
        <p style={s.body} className="fi">AprIQ turns early project inputs into a structured ROM estimate. Select the building type and project type, enter the floor area and key project details, apply the relevant cost factors, and AprIQ generates a total project cost, rate summary, and elemental breakdown. You can then save the estimate, link it to a client, and export a professional PDF.</p>
        <div style={s.stepRow} className="fi">
          {HOW_STEPS.map((step,i) => <div key={i} style={s.step}><span style={s.stepLabel}>{step}</span></div>)}
          <Link to="/how-it-works" style={s.moreLink}>More info →</Link>
        </div>
      </div></div></section>

      <section style={s.section}><div className="wrap" ref={r4}><div style={s.panel} className="fi-group">
        <h2 style={s.panelH2} className="fi">Who is it for</h2>
        <p style={s.body} className="fi">AprIQ is built for architects, quantity surveyors, contractors, developers, homeowners, and anyone who needs fast, structured early-stage construction cost guidance.</p>
        <p style={{...s.body,marginTop:8}} className="fi">It is especially useful for feasibility planning, concept budgets, option testing, and early project decisions before detailed costing or construction begins.</p>
        <div style={s.pillRow} className="fi">{WHO_PILLS.map((p) => <span key={p} style={s.pill}>{p}</span>)}</div>
      </div></div></section>

      <section style={{...s.section,paddingBottom:72}}><div className="wrap" ref={r5}><div style={s.panel} className="fi-group">
        <h2 style={s.panelH2} className="fi">Core features</h2>
        <div style={s.pillRow} className="fi">{FEATURE_PILLS.map((p) => <span key={p} style={s.pill}>{p}</span>)}</div>
      </div></div></section>
    </div>
  );
}

const s = {
  hero:{ padding:'80px 0 64px', borderBottom:'1px solid #E4E5E5' },
  heroWrap:{ maxWidth:640 },
  h1:{ fontFamily:"'Aptos','Segoe UI',system-ui,sans-serif", fontSize:30, fontWeight:700, color:'#111111', lineHeight:1.18, letterSpacing:'-0.3px', marginBottom:20 },
  heroSub:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:15, color:'#979899', lineHeight:1.65, marginBottom:32, maxWidth:540 },
  cta:{ display:'inline-flex', alignItems:'center', padding:'11px 26px', background:'#111111', color:'#F9FAFA', border:'none', borderRadius:12, fontFamily:"'Roboto',system-ui,sans-serif", fontSize:14, fontWeight:500, cursor:'pointer' },
  section:{ padding:'48px 0' },
  panel:{ background:'#F9FAFA', border:'1px solid #E4E5E5', borderRadius:16, padding:32 },
  panelH2:{ fontFamily:"'Aptos','Segoe UI',system-ui,sans-serif", fontSize:20, fontWeight:600, color:'#111111', marginBottom:16 },
  body:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:14, color:'#979899', lineHeight:1.72 },
  pillRow:{ display:'flex', flexWrap:'wrap', gap:8, marginTop:20 },
  pill:{ display:'inline-flex', alignItems:'center', padding:'6px 16px', borderRadius:100, border:'1px solid #E4E5E5', fontFamily:"'Roboto',system-ui,sans-serif", fontSize:13, color:'#111111', background:'#F9FAFA', whiteSpace:'nowrap' },
  stepRow:{ display:'flex', alignItems:'center', flexWrap:'wrap', gap:8, marginTop:20 },
  step:{ padding:'8px 16px', border:'1px solid #E4E5E5', borderRadius:12, background:'#F9FAFA' },
  stepLabel:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:13, color:'#111111', whiteSpace:'pre-line', lineHeight:1.35, textAlign:'center', display:'block' },
  moreLink:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:13, color:'#FF8210', textDecoration:'none', marginLeft:4 },
};
`);

// ─── AboutPage.jsx ──────────────────────────────────────────────────────────
write('src/pages/AboutPage.jsx', `import { useFadeIn } from '../hooks/useFadeIn';

const VALUES = [
  { label:'Clarity',              desc:'AprIQ is built to make cost information easier to understand and communicate.' },
  { label:'Efficiency',           desc:'It is designed to reduce unnecessary abortive work and speed up early-stage decisions.' },
  { label:'Structure',            desc:'The platform turns early assumptions into a more ordered and professional cost framework.' },
  { label:'Accessibility',        desc:'AprIQ is intended to be useful to both industry professionals and general users.' },
  { label:'Professional integrity', desc:'AprIQ is clear about what it is and what it is not: an early-stage estimating tool, not a final pricing or contractual document.' },
];

export default function AboutPage() {
  const r1=useFadeIn(), r2=useFadeIn(), r3=useFadeIn(), r4=useFadeIn();
  return (
    <div>
      <div style={s.pageTop}/>
      <section style={s.section}><div className="wrap" ref={r1}><div style={s.panel} className="fi-group">
        <h1 style={s.h1} className="fi">About</h1>
        <p style={s.body} className="fi">AprIQ is a South African early-stage construction feasibility and cost estimation platform built to help users create structured budget direction at the beginning of a project. It is designed to support the stage where decisions need to be made quickly, often before detailed drawings, measured quantities, or full consultant input are available.</p>
        <p style={{...s.body,marginTop:12}} className="fi">AprIQ was developed out of necessity. In the initial stages of a project, clients often want an early budget indication almost immediately, while professionals are still working with limited information. That can lead to repeated preliminary pricing exercises, shifting assumptions, and abortive work when projects change, pause, or never proceed. AprIQ was created to help fast-track those early conversations by giving users a faster, more structured starting point for initial budget expectations and feasibility decisions.</p>
      </div></div></section>

      <section style={s.section}><div className="wrap" ref={r2}>
        <div style={s.mvGrid} className="fi-group">
          <div style={s.mvCard} className="fi">
            <h2 style={s.h2}>Mission</h2>
            <p style={{...s.body,marginTop:16}}>AprIQ's mission is to make early-stage construction budgeting faster, clearer, and more accessible by turning limited project information into structured cost guidance that can support better planning and earlier decisions.</p>
          </div>
          <div style={s.mvCard} className="fi">
            <h2 style={s.h2}>Vision</h2>
            <p style={{...s.body,marginTop:16}}>AprIQ's vision is to become a trusted early-stage construction feasibility platform that helps professionals and everyday users approach project budgeting with more clarity, less wasted time, and better alignment between expectations and likely cost direction from the outset.</p>
          </div>
        </div>
      </div></section>

      <section style={s.section}><div className="wrap" ref={r3}><div style={s.panel} className="fi-group">
        <h2 style={s.panelH2} className="fi">Values</h2>
        <div style={s.valuesGrid}>
          {VALUES.map((v) => (
            <div key={v.label} style={s.valueRow} className="fi">
              <span style={s.valueLabel}>{v.label}</span>
              <p style={s.valueDesc}>{v.desc}</p>
            </div>
          ))}
        </div>
      </div></div></section>

      <section style={{...s.section,paddingBottom:80}}><div className="wrap" ref={r4}><div style={s.panel} className="fi-group">
        <h2 style={s.panelH2} className="fi">Standards and accuracy</h2>
        <p style={s.body} className="fi">AprIQ is built around early-stage estimating, where limited project information is available and the purpose is to provide a high-level cost indication for feasibility planning, initial budgets, and early decision-making rather than final pricing. AACE International describes these as very early estimate classes used for strategic planning, screening, and evaluation of alternatives when project definition is still limited.</p>
        <p style={{...s.body,marginTop:12}} className="fi">Because these estimates are prepared so early, tolerances are naturally wider than later-stage estimates. AACE notes that typical Class 5 ranges can fall around −20% to −50% on the low side and +30% to +100% on the high side, depending on complexity, assumptions, and reference data.</p>
        <p style={{...s.body,marginTop:12}} className="fi">For AprIQ, this means the platform is intended for initial client budgets, expectation setting, concept-stage discussions, and feasibility planning. The goal is to deliver results faster than traditional early-stage workflows while still honestly recognising that the output remains an estimate, not a guarantee.</p>
        <div style={s.refBlock} className="fi">
          <p style={s.refText}>Reference: AACE International, 87R-14: Cost Estimate Classification System</p>
          <p style={s.refText}>Reference: AACE International, 18R-97: Cost Estimate Classification System</p>
        </div>
      </div></div></section>
    </div>
  );
}

const s = {
  pageTop:{ height:48 }, section:{ padding:'0 0 40px' },
  panel:{ background:'#F9FAFA', border:'1px solid #E4E5E5', borderRadius:16, padding:32 },
  h1:{ fontFamily:"'Aptos','Segoe UI',system-ui,sans-serif", fontSize:28, fontWeight:700, color:'#111111', marginBottom:20 },
  h2:{ fontFamily:"'Aptos','Segoe UI',system-ui,sans-serif", fontSize:22, fontWeight:600, color:'#111111' },
  panelH2:{ fontFamily:"'Aptos','Segoe UI',system-ui,sans-serif", fontSize:20, fontWeight:600, color:'#111111', marginBottom:24 },
  body:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:14, color:'#979899', lineHeight:1.72 },
  mvGrid:{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:16 },
  mvCard:{ background:'#F9FAFA', border:'1px solid #E4E5E5', borderRadius:16, padding:32 },
  valuesGrid:{ display:'flex', flexDirection:'column', gap:0 },
  valueRow:{ display:'grid', gridTemplateColumns:'180px 1fr', gap:24, padding:'16px 0', borderBottom:'1px solid #E4E5E5', alignItems:'flex-start' },
  valueLabel:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:13, fontWeight:500, color:'#111111', padding:'4px 16px', border:'1px solid #E4E5E5', borderRadius:100, display:'inline-flex', alignItems:'center', height:32, whiteSpace:'nowrap' },
  valueDesc:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:13, color:'#979899', lineHeight:1.65, paddingTop:6 },
  refBlock:{ marginTop:24, padding:16, background:'#F9FAFA', border:'1px solid #E4E5E5', borderRadius:12, display:'flex', flexDirection:'column', gap:6 },
  refText:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:11, color:'#979899', lineHeight:1.5 },
};
`);

// ─── HowItWorksPage.jsx ─────────────────────────────────────────────────────
write('src/pages/HowItWorksPage.jsx', `import { useFadeIn } from '../hooks/useFadeIn';

const STEPS = ['Add Project\\n& Client info','Add project\\nareas','Select all\\ncost factors','Generate\\nSummary','Export and\\nshare'];
const JOURNEY = [
  { id:'profile',      heading:'Add user profile information', desc:'Set up your professional profile, company details, and contact information. This populates your PDF exports automatically.' },
  { id:'project',      heading:'Add project information',      desc:'Define the project — name, location, building type, and nature of work. This forms the foundation of your estimate.' },
  { id:'client',       heading:'Add client information',       desc:'Link client details to the project for accurate, attribution-ready PDF exports and saved estimates.' },
  { id:'configurator', heading:'Project data input',           desc:'Enter floor area, select cost factors — quality, site access, project complexity — and apply escalation or renovation splits.' },
  { id:'export',       heading:'Export and share estimate',    desc:'Generate a professional PDF and share it with clients or colleagues. Each export carries your branding, a ROM disclaimer, and a reference number.' },
];

const ICONS = {
  profile:<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#BFD1D6" strokeWidth="1.2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.58-7 8-7s8 3 8 7"/></svg>,
  project:<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#BFD1D6" strokeWidth="1.2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>,
  client:<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#BFD1D6" strokeWidth="1.2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  configurator:<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#BFD1D6" strokeWidth="1.2"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>,
  export:<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#BFD1D6" strokeWidth="1.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="12" y1="18" x2="12" y2="12"/><polyline points="9,15 12,18 15,15"/></svg>,
};

export default function HowItWorksPage() {
  const r1=useFadeIn(), r2=useFadeIn(), r3=useFadeIn();
  return (
    <div>
      <div style={s.pageTop}/>
      <section style={s.section}><div className="wrap" ref={r1}><div style={s.panel} className="fi-group">
        <h1 style={s.h1} className="fi">What AprIQ does</h1>
        <p style={s.body} className="fi">AprIQ provides a structured way to approach early-stage construction cost planning. It helps users take the basic information available at the beginning of a project and turn it into a clearer cost picture that can support feasibility reviews, budget discussions, and early decision-making. Instead of relying on rough assumptions or time-consuming manual work, AprIQ gives users a faster way to generate organised cost guidance in a professional format.</p>
        <p style={{...s.body,marginTop:12}} className="fi">The platform is designed to support the stage where a project is still being tested, shaped, or discussed. At this point, teams often need to know whether a project is realistic, how big the budget may be, and how different choices could affect overall cost. AprIQ helps create that first level of cost direction in a way that is easier to review, compare, and communicate.</p>
        <p style={{...s.body,marginTop:12}} className="fi">It is especially useful for establishing an early budget framework, guiding concept-stage conversations, supporting client discussions, and reducing unnecessary abortive work before detailed costing or technical documentation begins.</p>
      </div></div></section>

      <section style={s.section}><div className="wrap" ref={r2}><div style={s.panel} className="fi-group">
        <h2 style={s.h2} className="fi">How it works</h2>
        <p style={s.body} className="fi">AprIQ works by guiding the user through the key project choices that shape an early-stage estimate. The process begins with defining the project clearly, including the type of building, the nature of the work, and the size of the project.</p>
        <p style={{...s.body,marginTop:12}} className="fi">As these variables are selected, AprIQ organises them into a structured estimating framework and produces a professional early-stage output. This allows the user to understand the likely cost direction of the project in a way that is practical and easy to interpret.</p>
        <div style={s.stepRow} className="fi">
          {STEPS.map((step,i) => <div key={i} style={s.step}><span style={s.stepLabel}>{step}</span></div>)}
        </div>
      </div></div></section>

      <section style={{...s.section,paddingBottom:80}}><div className="wrap" ref={r3}>
        <div style={s.journeyWrap} className="fi-group">
          {JOURNEY.map((item) => (
            <div key={item.id} style={s.journeyBlock} className="fi">
              <div style={s.journeyMeta}>
                <h3 style={s.h3}>{item.heading}</h3>
                <p style={{...s.body,marginTop:8}}>{item.desc}</p>
              </div>
              <div style={s.placeholder}>
                <div style={s.placeholderInner}>
                  <div style={s.placeholderIcon}>{ICONS[item.id]}</div>
                  <p style={s.placeholderLabel}>Screenshot / GIF — {item.heading}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div></section>
    </div>
  );
}

const s = {
  pageTop:{ height:48 }, section:{ padding:'0 0 40px' },
  panel:{ background:'#F9FAFA', border:'1px solid #E4E5E5', borderRadius:16, padding:32 },
  h1:{ fontFamily:"'Aptos','Segoe UI',system-ui,sans-serif", fontSize:28, fontWeight:700, color:'#111111', marginBottom:20 },
  h2:{ fontFamily:"'Aptos','Segoe UI',system-ui,sans-serif", fontSize:22, fontWeight:600, color:'#111111', marginBottom:16 },
  h3:{ fontFamily:"'Aptos','Segoe UI',system-ui,sans-serif", fontSize:17, fontWeight:600, color:'#111111' },
  body:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:14, color:'#979899', lineHeight:1.72 },
  stepRow:{ display:'flex', flexWrap:'wrap', gap:8, marginTop:24 },
  step:{ padding:'8px 16px', border:'1px solid #E4E5E5', borderRadius:12, background:'#F9FAFA' },
  stepLabel:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:13, color:'#111111', whiteSpace:'pre-line', lineHeight:1.35, display:'block', textAlign:'center' },
  journeyWrap:{ display:'flex', flexDirection:'column', gap:24 },
  journeyBlock:{ background:'#F9FAFA', border:'1px solid #E4E5E5', borderRadius:16, overflow:'hidden' },
  journeyMeta:{ padding:'28px 32px 20px' },
  placeholder:{ background:'#F9FAFA', borderTop:'1px solid #E4E5E5', padding:40, display:'flex', alignItems:'center', justifyContent:'center', minHeight:200 },
  placeholderInner:{ display:'flex', flexDirection:'column', alignItems:'center', gap:12, opacity:0.6 },
  placeholderIcon:{ width:56, height:56, borderRadius:16, border:'1px solid #E4E5E5', display:'flex', alignItems:'center', justifyContent:'center', background:'#F9FAFA' },
  placeholderLabel:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:12, color:'#979899', textAlign:'center' },
};
`);

// ─── FeaturesPage.jsx ───────────────────────────────────────────────────────
write('src/pages/FeaturesPage.jsx', `import { useFadeIn } from '../hooks/useFadeIn';

const BENEFIT_PILLS = ['Faster Early Decisions','Structured Cost Guidance','Instant Cost Breakdown','Clearer Feasibility Planning'];
const COMPARISON = [
  { feature:'Estimates',  desc:'Create structured early-stage cost estimates',      free:'Basic',   pro:'Full'    },
  { feature:'Projects',   desc:'Save and manage project workspaces',                free:'Limited', pro:'More'    },
  { feature:'Clients',    desc:'Manage client details for linked project use',      free:'Limited', pro:'More'    },
  { feature:'Exports',    desc:'Generate professional PDF estimates',               free:'No',      pro:'Yes'     },
  { feature:'Sharing',    desc:'Generate shareable link estimates for stakeholders',free:'No',      pro:'Yes'     },
  { feature:'Access',     desc:'Unlock the full AprIQ workflow',                    free:'Basic',   pro:'Full'    },
  { feature:'Storage',    desc:'Save more working data over time',                  free:'Limited', pro:'More'    },
];

export default function FeaturesPage() {
  const r1=useFadeIn(), r2=useFadeIn(), r3=useFadeIn();
  return (
    <div>
      <div style={s.pageTop}/>
      <section style={s.section}><div className="wrap" ref={r1}><div style={s.panel} className="fi-group">
        <h1 style={s.h1} className="fi">Features</h1>
        <p style={s.body} className="fi">AprIQ combines speed, structure, and clarity to support early-stage construction cost planning. Key features include building and project type selection, structured cost adjustments, rate summaries, elemental breakdowns, and clear total project cost outputs.</p>
        <p style={{...s.body,marginTop:12}} className="fi">AprIQ also supports practical workflow needs by allowing estimates to be saved, linked to projects and clients, and used to support early feasibility discussions, budget planning, and decision-making.</p>
        <div style={s.pillRow} className="fi">{BENEFIT_PILLS.map((p) => <span key={p} style={s.pill}>{p}</span>)}</div>
      </div></div></section>

      <section style={s.section}><div className="wrap" ref={r2}><div style={s.panel} className="fi-group">
        <h2 style={s.h2} className="fi">Free and Pro</h2>
        <p style={s.body} className="fi">Choose the plan that fits how you work.</p>
        <p style={{...s.body,marginTop:8}} className="fi">Free is designed for getting started with AprIQ and exploring the platform's early-stage estimating workflow. Pro is built for users who need a more complete working setup, with expanded access for ongoing project use, saved workflows, and professional output needs.</p>
        <div style={s.tableWrap} className="fi">
          <div style={s.tableHead}>
            <div style={s.colFeature}>Feature</div>
            <div style={s.colFree}>Free</div>
            <div style={s.colPro}>Pro</div>
          </div>
          {COMPARISON.map((row,i) => (
            <div key={row.feature} style={{...s.tableRow,background:i%2===0?'#F9FAFA':'#F4F4F2'}}>
              <div style={s.colFeature}><span style={s.rowFeature}>{row.feature}</span><span style={s.rowDesc}>{row.desc}</span></div>
              <div style={s.colFree}><span style={{fontFamily:"'Roboto',system-ui,sans-serif",fontSize:13,color:row.free==='No'?'#979899':'#111111'}}>{row.free}</span></div>
              <div style={s.colPro}><span style={{fontFamily:"'Roboto',system-ui,sans-serif",fontSize:13,color:['Yes','Full','More'].includes(row.pro)?'#0F4C5C':'#979899',fontWeight:500}}>{row.pro}</span></div>
            </div>
          ))}
        </div>
      </div></div></section>

      <section style={{...s.section,paddingBottom:80}}><div className="wrap" ref={r3}><div style={s.panel} className="fi-group">
        <h2 style={s.h2} className="fi">Core features</h2>
        <div style={s.pillRow} className="fi">
          {['ROM Estimates','Feasibility Planning','Building Types','Project Types','Cost Adjustments','Element Breakdowns','Rate Summaries'].map((p) => <span key={p} style={s.pill}>{p}</span>)}
        </div>
      </div></div></section>
    </div>
  );
}

const s = {
  pageTop:{ height:48 }, section:{ padding:'0 0 40px' },
  panel:{ background:'#F9FAFA', border:'1px solid #E4E5E5', borderRadius:16, padding:32 },
  h1:{ fontFamily:"'Aptos','Segoe UI',system-ui,sans-serif", fontSize:28, fontWeight:700, color:'#111111', marginBottom:20 },
  h2:{ fontFamily:"'Aptos','Segoe UI',system-ui,sans-serif", fontSize:22, fontWeight:600, color:'#111111', marginBottom:16 },
  body:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:14, color:'#979899', lineHeight:1.72 },
  pillRow:{ display:'flex', flexWrap:'wrap', gap:8, marginTop:20 },
  pill:{ display:'inline-flex', alignItems:'center', padding:'6px 16px', borderRadius:100, border:'1px solid #E4E5E5', fontFamily:"'Roboto',system-ui,sans-serif", fontSize:13, color:'#111111', background:'#F9FAFA', whiteSpace:'nowrap' },
  tableWrap:{ marginTop:28, border:'1px solid #E4E5E5', borderRadius:12, overflow:'hidden' },
  tableHead:{ display:'grid', gridTemplateColumns:'1fr 120px 120px', background:'#111111', padding:'12px 20px', gap:16 },
  tableRow:{ display:'grid', gridTemplateColumns:'1fr 120px 120px', padding:'14px 20px', gap:16, borderBottom:'1px solid #E4E5E5', alignItems:'center' },
  colFeature:{ display:'flex', flexDirection:'column', gap:2, fontFamily:"'Roboto',system-ui,sans-serif", fontSize:12, color:'#F9FAFA', fontWeight:500 },
  colFree:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:12, color:'#F9FAFA', fontWeight:500, display:'flex', alignItems:'center' },
  colPro:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:12, color:'#FF8210', fontWeight:600, display:'flex', alignItems:'center' },
  rowFeature:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:13, color:'#111111', fontWeight:500 },
  rowDesc:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:12, color:'#979899', lineHeight:1.4 },
};
`);

// ─── FAQPage.jsx ─────────────────────────────────────────────────────────────
write('src/pages/FAQPage.jsx', `import { useState } from 'react';
import { useFadeIn } from '../hooks/useFadeIn';

const FAQS = [
  { q:'What is AprIQ?',             a:'AprIQ is a South African early-stage construction feasibility and ROM cost platform designed to help users generate structured budget direction at the beginning of a project.' },
  { q:'Who is AprIQ for?',          a:'AprIQ is built for architects, quantity surveyors, contractors, developers, homeowners, and anyone who needs fast, structured early-stage construction cost guidance.' },
  { q:'What does AprIQ do?',        a:'AprIQ helps users turn early project information into a high-level cost estimate that can support feasibility planning, concept budgets, and early project decisions.' },
  { q:'How does AprIQ work?',       a:'Users enter key project details such as building type, project type, area, and cost factors. AprIQ then generates a structured output with a total project cost, rate summary, and elemental breakdown.' },
  { q:'Is AprIQ a final pricing tool?', a:'No. AprIQ provides Rough Order of Magnitude estimates only. It is intended for early-stage planning and feasibility, not for final pricing, tenders, or contracts.' },
  { q:'How accurate is AprIQ?',     a:'AprIQ aims to be as accurate as reasonably possible in as little time as possible, but early-stage estimates always carry tolerances. Accuracy improves as project information becomes more defined.' },
  { q:'Can I save my estimates?',   a:'Yes. AprIQ allows users to save estimates to projects for future reference and ongoing use.' },
  { q:'Can I add clients to my projects?', a:'Yes. AprIQ includes client management so users can link client information to projects and outputs.' },
  { q:'Can I export my estimates?', a:'Yes. AprIQ supports professional PDF exports for sharing and presentation purposes.' },
  { q:'Is my data secure?',         a:'AprIQ applies reasonable technical and organisational measures to protect user accounts, saved data, and platform access. While no online platform can guarantee absolute security, AprIQ is built to reduce risk and protect sensitive information responsibly.' },
  { q:'Does AprIQ sell my data?',   a:'No. AprIQ does not sell personal information and does not make personally identifiable user or project information public for independent commercial exploitation.' },
  { q:'Can anyone use AprIQ?',      a:'Yes. AprIQ is designed to be accessible to both industry professionals and general users who need a clearer early-stage cost view.' },
];

function FAQItem({ item }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={s.item}>
      <button onClick={() => setOpen((o) => !o)} style={s.question} aria-expanded={open}>
        <span style={s.qText}>{item.q}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#979899" strokeWidth="2" strokeLinecap="round" style={{ flexShrink:0, transform:open?'rotate(180deg)':'none', transition:'transform 180ms ease' }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && <div style={s.answer}><p style={s.aText}>{item.a}</p></div>}
    </div>
  );
}

export default function FAQPage() {
  const ref = useFadeIn();
  return (
    <div>
      <div style={s.pageTop}/>
      <section style={s.section}><div className="wrap" ref={ref}><div style={s.panel} className="fi-group">
        <h1 style={s.h1} className="fi">FAQ's</h1>
        <div style={s.list} className="fi">{FAQS.map((item,i) => <FAQItem key={i} item={item}/>)}</div>
      </div></div></section>
    </div>
  );
}

const s = {
  pageTop:{ height:48 }, section:{ padding:'0 0 80px' },
  panel:{ background:'#F9FAFA', border:'1px solid #E4E5E5', borderRadius:16, padding:32 },
  h1:{ fontFamily:"'Aptos','Segoe UI',system-ui,sans-serif", fontSize:28, fontWeight:700, color:'#111111', marginBottom:28 },
  list:{ display:'flex', flexDirection:'column' },
  item:{ borderTop:'1px solid #E4E5E5' },
  question:{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, padding:'18px 0', background:'none', border:'none', cursor:'pointer', textAlign:'left' },
  qText:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:14, fontWeight:500, color:'#111111', lineHeight:1.4 },
  answer:{ paddingBottom:18 },
  aText:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:13, color:'#979899', lineHeight:1.7 },
};
`);

// ─── LegalPage.jsx ───────────────────────────────────────────────────────────
write('src/pages/LegalPage.jsx', `import { useState } from 'react';
import { useFadeIn } from '../hooks/useFadeIn';

const TABS = ['Privacy Policy','Terms of Service','Security','Compliance'];

function B({ children }) { return <p style={ls.body}>{children}</p>; }
function BList({ items }) { return <ul style={ls.list}>{items.map((i,k) => <li key={k} style={ls.li}>{i}</li>)}</ul>; }
function Sec({ title, children }) { return <div style={ls.block}><h3 style={ls.h3}>{title}</h3>{children}</div>; }

function PrivacyPolicy() {
  return <div>
    <h2 style={ls.h2}>Privacy Policy</h2>
    <p style={ls.effective}>Effective Date: 2026-04-14</p>
    <Sec title="1. Introduction"><B>AprIQ respects your privacy and is committed to protecting your personal information. AprIQ complies with applicable South African data protection principles, including the Protection of Personal Information Act, 2013 ("POPIA").</B></Sec>
    <Sec title="2. Information We Collect"><B>AprIQ may collect personal, project-related, technical, and usage information that you provide directly or that is generated through use of the platform. This may include:</B><BList items={['Name and surname','Email address','Account information','Project inputs and estimate-related information','Saved project and client information','Uploaded profile, company, or branding details','Usage and interaction data','Technical information such as browser, device, IP-related session data, and platform activity records','Billing and subscription-related information where applicable']}/></Sec>
    <Sec title="3. Purpose of Collection"><B>AprIQ collects and uses information only for purposes reasonably related to providing, operating, maintaining, securing, supporting, enforcing, and improving the platform.</B></Sec>
    <Sec title="4. No Sale or Distribution of Data"><B>AprIQ does not sell personal information. AprIQ does not publish, disclose, or distribute personally identifiable user or project information to third parties for independent commercial exploitation.</B></Sec>
    <Sec title="5. Data Security"><B>AprIQ takes reasonable technical, organisational, and administrative measures to protect personal information against loss, misuse, unauthorised access, disclosure, alteration, or destruction.</B></Sec>
    <Sec title="6. Data Retention"><B>AprIQ retains information only for as long as reasonably necessary to provide the platform, comply with legal and regulatory obligations, resolve disputes, and support legitimate business operations.</B></Sec>
    <Sec title="7. Your Rights"><B>Subject to applicable law, you may have the right to request access, correction, or deletion of your personal information, or to object to certain processing activities.</B></Sec>
    <Sec title="8. Cookies"><B>AprIQ may use cookies and similar technologies as reasonably necessary to operate, secure, maintain, and improve the platform.</B></Sec>
    <Sec title="9. Third-Party Services"><B>AprIQ may engage third-party service providers for hosting, authentication, payments, analytics, and communications. AprIQ is not responsible for the independent privacy practices of third-party services.</B></Sec>
    <Sec title="10. Updates"><B>AprIQ may amend or update this Privacy Policy from time to time. Continued use of the platform after publication of the revised effective date may constitute acceptance.</B></Sec>
    <Sec title="11. Contact"><B>Contact: AprIQ — apriq@apriq.co.za</B></Sec>
  </div>;
}

function TermsOfService() {
  return <div>
    <h2 style={ls.h2}>Terms of Service</h2>
    <p style={ls.effective}>Effective Date: 2026-04-14</p>
    <Sec title="1. Introduction"><B>These Terms of Service govern access to and use of the AprIQ platform, website, application, tools, outputs, features, content, and related services. By using the platform you agree to these Terms.</B></Sec>
    <Sec title="2. Nature of the Platform"><B>The Platform is indicative, data-driven, and informational only. It is not a bill of quantities, tender document, procurement instrument, or final pricing tool.</B></Sec>
    <Sec title="3. Critical Disclaimer — ROM Estimates"><B>All outputs generated through AprIQ are Rough Order of Magnitude ("ROM") estimates only. All outputs are indicative and depend entirely on user-supplied information, assumptions, and inputs.</B></Sec>
    <Sec title="4. No Professional Advice"><B>AprIQ does not provide architectural, engineering, quantity surveying, legal, financial, or project management advice or services. No output creates any consultant-client or advisory relationship.</B></Sec>
    <Sec title="5. User Responsibility"><B>You are solely responsible for all information, inputs, selections, and project details submitted to the Platform, and for verifying that outputs are appropriate for your intended use.</B></Sec>
    <Sec title="6. Limitation of Liability"><B>To the fullest extent permitted by law, AprIQ shall not be liable for any direct, indirect, incidental, or consequential loss arising from access to, use of, or reliance on the Platform. AprIQ's aggregate liability is limited to amounts paid to AprIQ in the 3 months preceding the event, or R1,000.</B></Sec>
    <Sec title="7. No Warranty"><B>The Platform is provided on an "as is" and "as available" basis. AprIQ does not warrant uninterrupted, error-free, or secure operation at all times.</B></Sec>
    <Sec title="8. Subscription and Billing"><B>Certain Platform features may be offered on a paid subscription basis. By subscribing you agree to pay all applicable fees. Access to paid features may be suspended for overdue payments.</B></Sec>
    <Sec title="9. Cancellation"><B>You may cancel your subscription in accordance with the cancellation process available through the Platform. Fees already paid are generally non-refundable unless required by law.</B></Sec>
    <Sec title="10. Acceptable Use"><B>You may not reverse engineer, scrape, exploit, or use Platform outputs to compete with AprIQ or gain unauthorised access to its systems.</B></Sec>
    <Sec title="11. Intellectual Property"><B>All rights to the Platform, including software, systems, design, branding, methodologies, and outputs, remain the exclusive property of AprIQ or its licensors.</B></Sec>
    <Sec title="12. Governing Law"><B>These Terms are governed by the laws of the Republic of South Africa. Disputes shall be subject to the jurisdiction of the competent courts of South Africa.</B></Sec>
    <Sec title="13. Contact"><B>Contact: AprIQ — apriq@apriq.co.za</B></Sec>
  </div>;
}

function Security() {
  return <div>
    <h2 style={ls.h2}>Security</h2>
    <B>AprIQ is designed with a security-first approach to help protect user accounts, project data, subscriptions, and platform access.</B>
    <div style={{marginTop:24}}>
      <Sec title="Platform architecture"><B>The platform treats the frontend as an untrusted presentation layer. Sensitive logic, permissions, payment verification, and access control are enforced on the backend. User-specific data access is controlled at database level through row-level security policies.</B></Sec>
      <Sec title="Authentication"><B>Authentication is handled through secure account and session management, including rate limiting on sign-in attempts, secure password handling, protected password reset flows, and server-side verification of authenticated sessions on protected routes.</B></Sec>
      <Sec title="Payments"><B>Subscription billing is protected through server-side payment verification. Payment callbacks are checked using server-side signature validation, amount matching, status validation, and user verification before any subscription changes are applied.</B></Sec>
      <Sec title="Infrastructure"><B>AprIQ applies security controls across its infrastructure and APIs, including sanitised error responses, rate limiting, validated HTTP methods, controlled internal API access, and browser security headers.</B></Sec>
      <Sec title="Important notice"><B>AprIQ takes reasonable technical and organisational measures to reduce risk. However, no internet-based platform can be guaranteed to be completely secure. Users remain responsible for maintaining the confidentiality of their login credentials.</B></Sec>
    </div>
  </div>;
}

function Compliance() {
  return <div>
    <h2 style={ls.h2}>Compliance</h2>
    <B>AprIQ is designed to operate within a responsible legal, privacy, and platform-governance framework appropriate to its role as an early-stage construction feasibility and ROM estimating platform.</B>
    <div style={{marginTop:24}}>
      <Sec title="Product definition"><B>The platform provides preliminary, indicative, data-driven cost outputs for informational and feasibility purposes only. It is not a bill of quantities, final pricing tool, tender document, or contractual cost tool.</B></Sec>
      <Sec title="Data protection"><B>AprIQ aligns its privacy approach with applicable South African data protection principles, including POPIA. Personal and project-related information is collected only for purposes reasonably connected to operating, supporting, securing, and improving the platform.</B></Sec>
      <Sec title="Platform governance"><B>Access control, user permissions, and data ownership are enforced through authenticated account access and backend-controlled rules. Users are limited to their own records unless a controlled sharing function is intentionally used.</B></Sec>
      <Sec title="Core compliance principles"><BList items={['Clear intended use','Transparent legal positioning','Privacy-conscious data handling','Controlled account and access management','Responsible early-stage estimating practices']}/></Sec>
    </div>
  </div>;
}

export default function LegalPage() {
  const [active, setActive] = useState(0);
  const ref = useFadeIn();
  const CONTENT = [<PrivacyPolicy/>, <TermsOfService/>, <Security/>, <Compliance/>];
  return (
    <div>
      <div style={s.pageTop}/>
      <section style={s.section}><div className="wrap" ref={ref}>
        <div style={s.tabRow} className="fi">
          {TABS.map((tab,i) => (
            <button key={tab} onClick={() => setActive(i)} style={{ ...s.tab, background:active===i?'#111111':'#F9FAFA', color:active===i?'#F9FAFA':'#979899', borderColor:active===i?'#111111':'#E4E5E5' }}>{tab}</button>
          ))}
        </div>
        <div style={s.panel} className="fi">{CONTENT[active]}</div>
      </div></section>
    </div>
  );
}

const s = {
  pageTop:{ height:48 }, section:{ padding:'0 0 80px' },
  tabRow:{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:20 },
  tab:{ padding:'7px 18px', borderRadius:100, border:'1px solid', fontFamily:"'Roboto',system-ui,sans-serif", fontSize:13, cursor:'pointer', transition:'all 150ms ease', fontWeight:400 },
  panel:{ background:'#F9FAFA', border:'1px solid #E4E5E5', borderRadius:16, padding:40 },
};
const ls = {
  h2:{ fontFamily:"'Aptos','Segoe UI',system-ui,sans-serif", fontSize:26, fontWeight:700, color:'#111111', marginBottom:6, textDecoration:'underline' },
  effective:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:12, color:'#979899', marginBottom:32 },
  block:{ marginBottom:28 },
  h3:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:14, fontWeight:500, color:'#111111', marginBottom:8 },
  body:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:13, color:'#979899', lineHeight:1.72, marginBottom:8 },
  list:{ paddingLeft:20, display:'flex', flexDirection:'column', gap:6, marginTop:8 },
  li:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:13, color:'#979899', lineHeight:1.6 },
};
`);

// ─── BillingPage.jsx ─────────────────────────────────────────────────────────
write('src/pages/BillingPage.jsx', `import { useFadeIn } from '../hooks/useFadeIn';

const TIERS = [
  { id:'free', name:'Free', price:'R0', period:'always', description:'Get started with AprIQ and explore the early-stage estimating workflow.', features:['Basic cost estimates','Limited project workspaces','Limited client management','Basic AprIQ workflow access'], cta:'Your current plan', active:true, highlight:false },
  { id:'pro',  name:'Pro',  price:'R79', period:'/month', trialNote:'30-day free trial — no card required to start', description:'A more complete working setup with expanded access for ongoing project and professional output needs.', features:['Full cost estimates','More project workspaces','Full client management','Professional PDF exports','Shareable estimate links','Full AprIQ workflow access','More storage and saved data'], cta:'Upgrade to Pro', active:false, highlight:true },
];

export default function BillingPage() {
  const r1=useFadeIn(), r2=useFadeIn(), r3=useFadeIn();
  const currentTier = 'free';
  return (
    <div>
      <div style={s.pageTop}/>
      <section style={s.section}><div className="wrap" ref={r1}><div style={s.panel} className="fi-group">
        <h1 style={s.h1} className="fi">Billing and plan</h1>
        <div style={s.currentRow} className="fi">
          <div>
            <p style={s.label}>Current plan</p>
            <p style={s.currentPlan}>{currentTier === 'pro' ? 'Pro' : currentTier === 'trial' ? 'Pro Trial' : 'Free'}</p>
          </div>
          {currentTier === 'free' && <button style={s.upgradeCta}>Start 30-day free trial</button>}
        </div>
      </div></div></section>

      <section style={s.section}><div className="wrap" ref={r2}><div style={s.panel} className="fi-group">
        <h2 style={s.h2} className="fi">Plans</h2>
        <p style={s.body} className="fi">Choose the plan that fits how you work. Pro starts with a 30-day free trial — no credit card required to begin.</p>
        <div style={s.tierGrid} className="fi">
          {TIERS.map((tier) => (
            <div key={tier.id} style={{...s.tierCard, borderColor:tier.highlight?'#0F4C5C':'#E4E5E5'}}>
              {tier.highlight && <div style={s.tierBadge}>Best value</div>}
              <div style={s.tierTop}>
                <span style={s.tierName}>{tier.name}</span>
                <div style={s.tierPriceRow}>
                  <span style={s.tierPrice}>{tier.price}</span>
                  <span style={s.tierPeriod}>{tier.period}</span>
                </div>
                {tier.trialNote && <p style={s.trialNote}>{tier.trialNote}</p>}
              </div>
              <p style={s.tierDesc}>{tier.description}</p>
              <ul style={s.featureList}>
                {tier.features.map((f) => (
                  <li key={f} style={s.featureItem}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0F4C5C" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    <span style={s.featureText}>{f}</span>
                  </li>
                ))}
              </ul>
              <button style={{...s.tierCta, background:tier.highlight?'#111111':'transparent', color:tier.highlight?'#F9FAFA':'#979899', border:tier.highlight?'none':'1px solid #E4E5E5', cursor:tier.active?'default':'pointer'}} disabled={tier.active}>{tier.cta}</button>
            </div>
          ))}
        </div>
      </div></div></section>

      <section style={{...s.section,paddingBottom:80}}><div className="wrap" ref={r3}><div style={s.panel} className="fi-group">
        <h2 style={s.h2} className="fi">Manage subscription</h2>
        <div style={s.manageGrid} className="fi">
          {[
            { icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F4C5C" strokeWidth="1.5"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>, label:'Payment method', sub:'Update your card or billing details.', action:<button style={s.manageBtn}>Update</button> },
            { icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F4C5C" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>, label:'Next billing date', sub:currentTier==='pro'?'15 May 2026':'—', action:null },
            { icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F4C5C" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>, label:'Need help?', sub:'Contact us about your plan or billing.', action:<a href="mailto:apriq@apriq.co.za" style={s.manageBtn}>Contact support</a> },
          ].map(({ icon, label, sub, action }, i) => (
            <div key={i} style={s.manageCard}>
              <div style={s.manageIcon}>{icon}</div>
              <div style={{flex:1}}><p style={s.manageLabel}>{label}</p><p style={s.manageSub}>{sub}</p></div>
              {action}
            </div>
          ))}
        </div>
        {currentTier === 'pro' && (
          <div style={s.cancelRow} className="fi">
            <hr style={s.divider}/>
            <p style={s.cancelNote}>Cancelling your subscription will take effect at the end of your current billing period. You will retain Pro access until then.</p>
            <button style={s.cancelBtn}>Cancel subscription</button>
          </div>
        )}
      </div></div></section>
    </div>
  );
}

const s = {
  pageTop:{ height:48 }, section:{ padding:'0 0 32px' },
  panel:{ background:'#F9FAFA', border:'1px solid #E4E5E5', borderRadius:16, padding:32 },
  h1:{ fontFamily:"'Aptos','Segoe UI',system-ui,sans-serif", fontSize:26, fontWeight:700, color:'#111111', marginBottom:24 },
  h2:{ fontFamily:"'Aptos','Segoe UI',system-ui,sans-serif", fontSize:20, fontWeight:600, color:'#111111', marginBottom:12 },
  body:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:14, color:'#979899', lineHeight:1.7, marginBottom:24 },
  label:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:11, color:'#979899', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.5px' },
  currentPlan:{ fontFamily:"'Aptos','Segoe UI',system-ui,sans-serif", fontSize:18, fontWeight:600, color:'#111111' },
  currentRow:{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16 },
  upgradeCta:{ padding:'10px 22px', background:'#111111', color:'#F9FAFA', border:'none', borderRadius:12, fontFamily:"'Roboto',system-ui,sans-serif", fontSize:13, fontWeight:500, cursor:'pointer' },
  tierGrid:{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:16 },
  tierCard:{ border:'1px solid', borderRadius:16, padding:28, display:'flex', flexDirection:'column', gap:16, position:'relative', background:'#F9FAFA' },
  tierBadge:{ position:'absolute', top:-1, right:20, background:'#0F4C5C', color:'#F9FAFA', fontSize:11, fontWeight:500, fontFamily:"'Roboto',system-ui,sans-serif", padding:'4px 12px', borderRadius:'0 0 10px 10px' },
  tierTop:{ display:'flex', flexDirection:'column', gap:4 },
  tierName:{ fontFamily:"'Aptos','Segoe UI',system-ui,sans-serif", fontSize:17, fontWeight:600, color:'#111111' },
  tierPriceRow:{ display:'flex', alignItems:'baseline', gap:4, marginTop:4 },
  tierPrice:{ fontFamily:"'Aptos','Segoe UI',system-ui,sans-serif", fontSize:28, fontWeight:700, color:'#111111' },
  tierPeriod:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:13, color:'#979899' },
  trialNote:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:11, color:'#0F4C5C', marginTop:4 },
  tierDesc:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:13, color:'#979899', lineHeight:1.6 },
  featureList:{ listStyle:'none', display:'flex', flexDirection:'column', gap:8, flex:1 },
  featureItem:{ display:'flex', alignItems:'flex-start', gap:10 },
  featureText:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:13, color:'#111111', lineHeight:1.4 },
  tierCta:{ width:'100%', padding:'11px', borderRadius:12, fontFamily:"'Roboto',system-ui,sans-serif", fontSize:13, fontWeight:500, marginTop:8 },
  manageGrid:{ display:'flex', flexDirection:'column', gap:0 },
  manageCard:{ display:'flex', alignItems:'center', gap:16, padding:'18px 0', borderBottom:'1px solid #E4E5E5', flexWrap:'wrap' },
  manageIcon:{ width:40, height:40, borderRadius:12, border:'1px solid #E4E5E5', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, background:'#F9FAFA' },
  manageLabel:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:13, fontWeight:500, color:'#111111', marginBottom:2 },
  manageSub:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:12, color:'#979899' },
  manageBtn:{ marginLeft:'auto', padding:'8px 18px', border:'1px solid #E4E5E5', borderRadius:10, background:'#F9FAFA', fontFamily:"'Roboto',system-ui,sans-serif", fontSize:12, color:'#111111', cursor:'pointer', textDecoration:'none', display:'inline-flex', alignItems:'center' },
  cancelRow:{ marginTop:4 },
  divider:{ border:'none', borderTop:'1px solid #E4E5E5', margin:'24px 0 20px' },
  cancelNote:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:12, color:'#979899', lineHeight:1.6, marginBottom:16, maxWidth:480 },
  cancelBtn:{ padding:'9px 20px', border:'1px solid #E4E5E5', borderRadius:10, background:'transparent', fontFamily:"'Roboto',system-ui,sans-serif", fontSize:12, color:'#979899', cursor:'pointer' },
};
`);

console.log('\n✅ All files written successfully.\n');
