const fs = require('fs');
let L = fs.readFileSync('src/components/Layout.jsx', 'utf8');

// ── 1. REMOVE the entire mobile profile+hamburger wrapper (lines 74-109 approx)
// Replace it with just the hamburger button (clean, no duplicate icon)
L = L.replace(
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
      </div>`,
  `        <button className="hamburger" style={h.hamburger} onClick={() => setMenuOpen((m) => !m)} aria-label="Toggle menu">
          <span style={{ ...h.bar, transform: menuOpen ? 'rotate(45deg) translate(5px,5px)' : 'none' }}/>
          <span style={{ ...h.bar, opacity: menuOpen ? 0 : 1 }}/>
          <span style={{ ...h.bar, transform: menuOpen ? 'rotate(-45deg) translate(5px,-5px)' : 'none' }}/>
        </button>
      </div>`
);

// ── 2. ADD profile links to mobile menu (already has Join waiting list)
// Add signed-in links before the divider in mobile menu
L = L.replace(
  `          <div style={h.mobileDivider}/>
          <button style={{ ...h.mobileLink, ...h.mobileLinkBtn, color:T.petrol, fontWeight:500 }} onClick={() => { setMenuOpen(false); onOpenModal('waitlist'); }}>
            Join the waiting list
          </button>`,
  `          {isLoggedIn && (<>
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
          </>)}`
);

// ── 3. FOOTER: revert inner height, fix mobile via CSS classes only
// Revert the bad inner height change from earlier
L = L.replace(
  `  inner:{ display:'flex', alignItems:'center', justifyContent:'space-between', maxWidth:960, margin:'0 auto', padding:'24px', flexWrap:'wrap', gap:20 },`,
  `  inner:{ display:'flex', alignItems:'center', justifyContent:'space-between', maxWidth:960, margin:'0 auto', padding:'28px 24px' },`
);
L = L.replace(
  `  root:{ borderTop:'1px solid #E4E5E5', background:'#F9FAFA', padding:'0' },`,
  `  root:{ borderTop:'1px solid #E4E5E5', background:'#F9FAFA', padding:'0' },`
);

fs.writeFileSync('src/components/Layout.jsx', L, 'utf8');
console.log('✓ Header fixed — single profile icon, mobile menu has nav links');

// ── 4. FOOTER CSS — clean mobile layout
let G = fs.readFileSync('src/styles/globals.css', 'utf8');

// Remove ALL previous mobile footer attempts cleanly
const lines = G.split('\n');
const cleaned = [];
let skip = false;
let braceDepth = 0;
for (const line of lines) {
  if (!skip && line.includes('Mobile footer')) { skip = true; braceDepth = 0; }
  if (skip) {
    braceDepth += (line.match(/\{/g)||[]).length - (line.match(/\}/g)||[]).length;
    if (braceDepth <= 0 && line.trim() === '}') { skip = false; continue; }
    continue;
  }
  cleaned.push(line);
}
G = cleaned.join('\n');

// Add clean mobile footer CSS
G += `
/* ── Mobile footer phones ≤600px ── */
@media (max-width: 600px) {
  footer .footer-inner {
    flex-wrap: wrap !important;
    padding: 24px 20px !important;
    align-items: flex-start !important;
    height: auto !important;
    gap: 0 !important;
  }
  footer .footer-brand {
    flex: 0 0 auto !important;
    align-items: flex-start !important;
  }
  footer .footer-brand p { display: none !important; }
  footer .footer-centre {
    flex: 0 0 auto !important;
    margin-left: auto !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: flex-end !important;
    gap: 4px !important;
  }
  footer .footer-centre > div {
    flex-direction: column !important;
    align-items: flex-end !important;
    gap: 3px !important;
  }
  footer .footer-centre .footer-sep { display: none !important; }
  footer .footer-right {
    flex: 0 0 100% !important;
    flex-direction: row !important;
    justify-content: space-between !important;
    align-items: center !important;
    margin-top: 16px !important;
    border-top: 1px solid #E4E5E5 !important;
    padding-top: 12px !important;
  }
}
`;

fs.writeFileSync('src/styles/globals.css', G, 'utf8');
console.log('✓ Footer CSS fixed — brand+centre top row, right full width bottom');
