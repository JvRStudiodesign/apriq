const fs = require('fs');
let L = fs.readFileSync('src/components/Layout.jsx', 'utf8');

// Find the exact broken mobile section and replace with clean version
// The issue is the extra wrapper div around mobile profile + hamburger
// Replace from the desktop nav closing tag to the mobile menu

const oldMobile = `        <div style={{display:'flex',alignItems:'center',gap:8}}>
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
        </div>
        <button className="hamburger" style={h.hamburger} onClick={() => setMenuOpen((m) => !m)} aria-label="Toggle menu">
          <span style={{ ...h.bar, transform: menuOpen ? 'rotate(45deg) translate(5px,5px)' : 'none' }}/>
          <span style={{ ...h.bar, opacity: menuOpen ? 0 : 1 }}/>
          <span style={{ ...h.bar, transform: menuOpen ? 'rotate(-45deg) translate(5px,-5px)' : 'none' }}/>
        </button>
      </div>`;

const newMobile = `        <button className="hamburger" style={h.hamburger} onClick={() => setMenuOpen((m) => !m)} aria-label="Toggle menu">
          <span style={{ ...h.bar, transform: menuOpen ? 'rotate(45deg) translate(5px,5px)' : 'none' }}/>
          <span style={{ ...h.bar, opacity: menuOpen ? 0 : 1 }}/>
          <span style={{ ...h.bar, transform: menuOpen ? 'rotate(-45deg) translate(5px,-5px)' : 'none' }}/>
        </button>
      </div>`;

if (L.includes(oldMobile)) {
  L = L.replace(oldMobile, newMobile);
  console.log('Replaced mobile block');
} else {
  console.log('Pattern not found exactly');
  // Show what we have around line 74
  const lines = L.split('\n');
  lines.slice(70,115).forEach((l,i) => console.log(i+71,'|'+l+'|'));
}

fs.writeFileSync('src/components/Layout.jsx', L, 'utf8');
// Verify
const lines = L.split('\n');
lines.slice(68,115).forEach((l,i) => console.log(i+69, l));
