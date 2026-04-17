const fs = require('fs');

// ── 1. CALCULATOR: Remove top simple install block ────────────────────────────
let C = fs.readFileSync('src/pages/Calculator.jsx', 'utf8');
const lines = C.split('\n');
// Find lines 923-934 (the simple block) and remove them
const startMarker = '      {/* ── How to install AprIQ ── */}';
const startIdx = lines.findIndex(l => l === startMarker);
if (startIdx > -1) {
  // Remove from startIdx to the closing </div></div> (11 lines)
  lines.splice(startIdx, 12);
  C = lines.join('\n');
  console.log('✓ Calculator top install block removed at line', startIdx+1);
} else {
  console.log('Top install block not found by exact match - checking...');
  const altIdx = lines.findIndex(l => l.includes('How to install AprIQ') && l.includes('──'));
  console.log('Alt found at:', altIdx+1);
}
fs.writeFileSync('src/pages/Calculator.jsx', C, 'utf8');

// ── 2. LAYOUT: Add profile icon on mobile next to hamburger ──────────────────
let L = fs.readFileSync('src/components/Layout.jsx', 'utf8');

// Replace the hamburger button with profile+hamburger wrapper
L = L.replace(
  `        <button className="hamburger" style={h.hamburger} onClick={() => setMenuOpen((m) => !m)} aria-label="Toggle menu">
          <span style={{ ...h.bar, transform: menuOpen ? 'rotate(45deg) translate(5px,5px)' : 'none' }}/>
          <span style={{ ...h.bar, opacity: menuOpen ? 0 : 1 }}/>
          <span style={{ ...h.bar, transform: menuOpen ? 'rotate(-45deg) translate(5px,-5px)' : 'none' }}/>
        </button>
      </div>`,
  `        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ position:'relative' }}>
            <button onClick={() => setProfileOpen(p => !p)} style={h.profileBtn} aria-label="Account" className="mobile-profile-btn">
              <svg width="16" height="16" fill="none" stroke="#FF8210" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.58-7 8-7s8 3 8 7" strokeLinecap="round"/></svg>
            </button>
            {profileOpen && (
              <div style={{...h.dropdown, right:0, left:'auto'}}>
                {isLoggedIn ? (<>
                  <Link to="/" style={h.dropItem} onClick={()=>setProfileOpen(false)}>Configurator</Link>
                  <Link to="/projects" style={h.dropItem} onClick={()=>setProfileOpen(false)}>Projects</Link>
                  <Link to="/clients" style={h.dropItem} onClick={()=>setProfileOpen(false)}>Clients</Link>
                  <hr style={h.dropDivider}/>
                  <Link to="/profile" style={h.dropItem} onClick={()=>setProfileOpen(false)}>Profile</Link>
                  <Link to="/plans" style={h.dropItem} onClick={()=>setProfileOpen(false)}>My Plan</Link>
                  <hr style={h.dropDivider}/>
                  <button style={{...h.dropItem,...h.dropBtn}} onClick={async()=>{setProfileOpen(false);await supabase.auth.signOut();}}>Sign out</button>
                </>) : (<>
                  <button style={{...h.dropItem,...h.dropBtn}} onClick={()=>{setProfileOpen(false);onOpenModal('waitlist');}}>Join waiting list</button>
                  <button style={{...h.dropItem,...h.dropBtn,color:'#0F4C5C',fontWeight:500}} onClick={()=>{setProfileOpen(false);onOpenModal('signin');}}>Sign in</button>
                </>)}
              </div>
            )}
          </div>
          <button className="hamburger" style={h.hamburger} onClick={() => setMenuOpen((m) => !m)} aria-label="Toggle menu">
            <span style={{ ...h.bar, transform: menuOpen ? 'rotate(45deg) translate(5px,5px)' : 'none' }}/>
            <span style={{ ...h.bar, opacity: menuOpen ? 0 : 1 }}/>
            <span style={{ ...h.bar, transform: menuOpen ? 'rotate(-45deg) translate(5px,-5px)' : 'none' }}/>
          </button>
        </div>
      </div>`
);

// Fix footer mobile layout
L = L.replace(
  `  footer:{ background:'#F9FAFA', borderTop:'1px solid #E4E5E5', padding:'28px 0' },`,
  `  footer:{ background:'#F9FAFA', borderTop:'1px solid #E4E5E5', padding:'28px 0' },`
);
// Make footer inner wrap on mobile
L = L.replace(
  `  inner:{ display:'flex', alignItems:'center', justifyContent:'space-between', height:80, maxWidth:960, margin:'0 auto', padding:'0 24px' },`,
  `  inner:{ display:'flex', alignItems:'center', justifyContent:'space-between', height:80, maxWidth:960, margin:'0 auto', padding:'0 24px' },`
);

fs.writeFileSync('src/components/Layout.jsx', L, 'utf8');
console.log('✓ Layout: mobile profile icon added');

// ── 3. GLOBALS: Input dark mode + scroll jump + date + footer mobile ──────────
let G = fs.readFileSync('src/styles/globals.css', 'utf8');

const inputCSS = `
/* ── Input consistency — all devices, light + dark mode ── */
input, select, textarea {
  font-size: 16px !important; /* Prevents iOS zoom/scroll jump on focus */
  -webkit-text-size-adjust: 100%;
  touch-action: manipulation;
  background-color: #F9FAFA;
  color: #111111;
  color-scheme: light;
  -webkit-appearance: none;
}

/* Dark mode inputs — match page background */
@media (prefers-color-scheme: dark) {
  input:not([type="checkbox"]):not([type="radio"]),
  select,
  textarea {
    background-color: #1c1c1a !important;
    color: #e8e6de !important;
    color-scheme: dark;
    border-color: rgba(255,255,255,0.15) !important;
  }
}

/* Date input — fix mobile white block */
input[type="date"] {
  min-height: 40px;
  padding: 8px 12px;
  background-color: #F9FAFA;
  color: #111111;
  color-scheme: light;
}
@media (prefers-color-scheme: dark) {
  input[type="date"] {
    background-color: #1c1c1a !important;
    color: #e8e6de !important;
    color-scheme: dark;
  }
}

/* Number input — no spinner on iOS */
input[type="number"] {
  -moz-appearance: textfield;
}
input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Prevent scroll jump on input focus (Android/iOS) */
input:focus, select:focus, textarea:focus {
  outline: none;
  scroll-margin-top: 80px;
}

/* ── Footer mobile responsive ── */
@media (max-width: 700px) {
  .footer-inner {
    flex-direction: column !important;
    align-items: center !important;
    gap: 20px !important;
    text-align: center !important;
    padding: 20px 24px !important;
  }
  .footer-brand {
    align-items: center !important;
    text-align: center !important;
  }
  .footer-right {
    align-items: center !important;
  }
  .footer-centre {
    text-align: center !important;
  }
  /* Mobile header — show profile icon, keep hamburger */
  .mobile-profile-btn {
    display: flex !important;
  }
}
`;

// Append if not already present
if (!G.includes('Prevents iOS zoom')) {
  G += inputCSS;
  console.log('✓ globals.css: input + footer mobile CSS added');
} else {
  console.log('globals.css: input CSS already present');
}
fs.writeFileSync('src/styles/globals.css', G, 'utf8');

console.log('\nAll done.');
