const fs = require('fs');
let L = fs.readFileSync('src/components/Layout.jsx', 'utf8');

// 1. Logo — use apriq-logo.png everywhere, link always to /home
L = L.replace(
  `<Link to="/" style={h.logoWrap}>
          <span style={h.logoMark}>AprIQ</span>
          <span style={h.logoSub}>Smarter Construction Feasibility</span>
        </Link>`,
  `<Link to="/home" style={h.logoWrap}>
          <img src="/apriq-logo.png" alt="AprIQ" style={{ height:44, width:'auto', objectFit:'contain', display:'block' }} />
        </Link>`
);

// 2. Footer logo — use apriq-logo.png, sized to match FAQ-to-social height
L = L.replace(
  `        <div style={f.brand}>
          <span style={f.logoMark}>AprIQ</span>
          <p style={f.brandSub}>ROM cost estimates for South African construction projects.</p>
        </div>`,
  `        <div style={f.brand}>
          <img src="/apriq-logo.png" alt="AprIQ" style={{ height:72, width:'auto', objectFit:'contain', display:'block', mixBlendMode:'multiply' }} />
          <p style={f.brandSub}>ROM cost estimates for South African construction projects.</p>
        </div>`
);

// 3. Social media real links
L = L.replace(
  `{ label:'Facebook',  href:'https://facebook.com',`,
  `{ label:'Facebook',  href:'https://www.facebook.com/profile.php?id=61574287355312',`
);
L = L.replace(
  `{ label:'Instagram', href:'https://instagram.com',`,
  `{ label:'Instagram', href:'https://www.instagram.com/apriq.co.za/',`
);
L = L.replace(
  `{ label:'LinkedIn',  href:'https://linkedin.com',`,
  `{ label:'LinkedIn',  href:'https://www.linkedin.com/company/apriq/?viewAsMember=true',`
);

// 4. Mobile — add profile icon to hamburger row (currently hidden)
// Add profile icon visible on mobile alongside hamburger
L = L.replace(
  `        <button className="hamburger" style={h.hamburger} onClick={() => setMenuOpen((m) => !m)} aria-label="Toggle menu">`,
  `        <div style={{display:'flex',alignItems:'center',gap:8}}>
        <div style={{position:'relative'}}>
          <button onClick={() => setProfileOpen((p) => !p)} style={{...h.profileBtn, display:'flex'}} aria-label="Account">
            <svg width="16" height="16" fill="none" stroke="#FF8210" strokeWidth="1.5" viewBox="0 0 24 24">
              <circle cx="12" cy="8" r="4"/>
              <path d="M4 20c0-4 3.58-7 8-7s8 3 8 7" strokeLinecap="round"/>
            </svg>
          </button>
          {profileOpen && (
            <div style={{...h.dropdown, left:'auto', right:0}}>
              {isLoggedIn ? (
                <>
                  <Link to="/" style={h.dropItem} onClick={() => setProfileOpen(false)}>Configurator</Link>
                  <Link to="/projects" style={h.dropItem} onClick={() => setProfileOpen(false)}>Projects</Link>
                  <Link to="/clients" style={h.dropItem} onClick={() => setProfileOpen(false)}>Clients</Link>
                  <hr style={h.dropDivider}/>
                  <Link to="/plans" style={h.dropItem} onClick={() => setProfileOpen(false)}>My Plan</Link>
                  <Link to="/profile" style={h.dropItem} onClick={() => setProfileOpen(false)}>Profile</Link>
                  <hr style={h.dropDivider}/>
                  <button style={{ ...h.dropItem, ...h.dropBtn }} onClick={async () => { setProfileOpen(false); await supabase.auth.signOut(); }}>Sign out</button>
                </>
              ) : (
                <>
                  <button style={{ ...h.dropItem, ...h.dropBtn }} onClick={() => { setProfileOpen(false); onOpenModal('waitlist'); }}>Join the waiting list</button>
                  <button style={{ ...h.dropItem, ...h.dropBtn, color:'#0F4C5C', fontWeight:500 }} onClick={() => { setProfileOpen(false); onOpenModal('signin'); }}>Sign in</button>
                </>
              )}
            </div>
          )}
        </div>
        <button className="hamburger" style={h.hamburger} onClick={() => setMenuOpen((m) => !m)} aria-label="Toggle menu">`
);
// Close the mobile wrapper div
L = L.replace(
  `        </button>
      </div>

      {/* ── Mobile menu`,
  `        </button>
        </div>
      </div>

      {/* ── Mobile menu`
);

fs.writeFileSync('src/components/Layout.jsx', L, 'utf8');
console.log('✓ Layout');
