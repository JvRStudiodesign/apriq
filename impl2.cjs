const fs = require('fs');

// ── CALCULATOR ────────────────────────────────────────────────────────────────
let C = fs.readFileSync('src/pages/Calculator.jsx', 'utf8');

// Remove Terms of Service from bottom of Calculator
C = C.replace(
  `      {/* Legal footer */}
      <div style={{ textAlign:"center", paddingTop:"0.75rem", paddingBottom:"0.25rem" }}>
        <a href="/legal" style={{ fontSize:"0.7rem", color:"#ccc", textDecoration:"none" }}>Terms of Service &amp; Privacy Policy</a>
      </div>`,
  ''
);

// Move Feedback button to centre of page
C = C.replace(
  `<button onClick={() => setFeedback(true)} style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', background: '#FF8210', color: '#F9FAFA', border: 'none', borderRadius: '20px', padding: '0.5rem 1rem', fontSize: '0.78rem', fontWeight: '500', cursor: 'pointer', boxShadow: '0 2px 12px rgba(0,0,0,0.15)', zIndex: 50, fontFamily: 'inherit' }}>Feedback</button>`,
  `<button onClick={() => setFeedback(true)} style={{ position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)', background: '#FF8210', color: '#F9FAFA', border: 'none', borderRadius: '20px', padding: '0.5rem 1.25rem', fontSize: '0.78rem', fontWeight: '500', cursor: 'pointer', boxShadow: '0 2px 12px rgba(0,0,0,0.15)', zIndex: 50, fontFamily: 'inherit', whiteSpace:'nowrap' }}>Feedback</button>`
);

fs.writeFileSync('src/pages/Calculator.jsx', C, 'utf8');
console.log('✓ Calculator');

// ── USER PROFILE — remove old sticky header div ───────────────────────────────
let P = fs.readFileSync('src/pages/UserProfile.jsx', 'utf8');

// Remove the entire old sticky header shell (left over)
P = P.replace(
  `      <div style={{ background: '#F9FAFA', borderBottom: '1px solid #E4E5E5', padding: '0.875rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          {/* Header handled by Layout */}
        </div>
        <span style={{ fontSize: '0.78rem', color: '#979899' }}>User Profile</span>
      </div>`,
  ''
);

// Remove borderBottom from h1
P = P.replace(
  `<h1 style={{ fontSize: '1.375rem', fontWeight: '700', color: '#111111', marginBottom: '0.25rem', letterSpacing: '-0.01em', fontFamily: "'Roboto', system-ui, sans-serif" }}>Profile</h1>`,
  `<h1 style={{ fontSize: '1.375rem', fontWeight: '700', color: '#111111', marginBottom: '0.25rem', letterSpacing: '-0.01em', fontFamily: "'Roboto', system-ui, sans-serif" }}>Profile</h1>`
);

fs.writeFileSync('src/pages/UserProfile.jsx', P, 'utf8');
console.log('✓ UserProfile');

// ── PROJECTS — remove divider line below heading ──────────────────────────────
let Proj = fs.readFileSync('src/pages/Projects.jsx', 'utf8');

// Remove old sticky header block
Proj = Proj.replace(
  /\s*<div style=\{\{ background: '#F9FAFA', borderBottom: '1px solid #E4E5E5'.*?<\/div>\s*\{\/\* Header handled by Layout \*\/\}\s*<\/div>\s*<\/div>/s,
  ''
);

fs.writeFileSync('src/pages/Projects.jsx', Proj, 'utf8');
console.log('✓ Projects');

// ── CLIENTS — remove divider line below heading ───────────────────────────────
let Cl = fs.readFileSync('src/pages/Clients.jsx', 'utf8');

Cl = Cl.replace(
  /\s*<div style=\{\{ background: '#F9FAFA', borderBottom: '1px solid #E4E5E5'.*?<\/div>\s*\{\/\* Header handled by Layout \*\/\}\s*<\/div>\s*<\/div>/s,
  ''
);

fs.writeFileSync('src/pages/Clients.jsx', Cl, 'utf8');
console.log('✓ Clients');

console.log('Script 2 done.');
