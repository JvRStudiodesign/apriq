const fs = require('fs');
const {execSync} = require('child_process');

// ── 1. HOW IT WORKS: Icons via id map in JSX ──────────────────────────────────
let how = fs.readFileSync('src/pages/HowItWorksPage.jsx', 'utf8');

// Replace the h3 rendering to use an icon map based on item.id
how = how.replace(
  `                <h3 style={s.h3}>{item.heading}</h3>`,
  `                <h3 style={{...s.h3, display:'flex', alignItems:'center', gap:8}}>
                  {{'profile':<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FF8210" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.58-7 8-7s8 3 8 7"/></svg>,'project':<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FF8210" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>,'client':<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FF8210" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,'configurator':<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FF8210" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>,'export':<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FF8210" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="12" y1="18" x2="12" y2="12"/><polyline points="9,15 12,18 15,15"/></svg>}[item.id]}
                  {item.heading}
                </h3>`
);
fs.writeFileSync('src/pages/HowItWorksPage.jsx', how, 'utf8');
console.log('✓ HowItWorks icons');

// ── 2. DROPDOWN: Swap Profile and My Plan ─────────────────────────────────────
let L = fs.readFileSync('src/components/Layout.jsx', 'utf8');
// Fix both instances (desktop + mobile)
L = L.split(
  `<Link to="/plans" style={h.dropItem} onClick={() => setProfileOpen(false)}>My Plan</Link>
                  <Link to="/profile" style={h.dropItem} onClick={() => setProfileOpen(false)}>Profile</Link>`
).join(
  `<Link to="/profile" style={h.dropItem} onClick={() => setProfileOpen(false)}>Profile</Link>
                  <Link to="/plans" style={h.dropItem} onClick={() => setProfileOpen(false)}>My Plan</Link>`
);
fs.writeFileSync('src/components/Layout.jsx', L, 'utf8');
console.log('✓ Dropdown swapped');

// ── 3. PROJECTS: Remove border-bottom line, right-align heading ───────────────
let proj = fs.readFileSync('src/pages/Projects.jsx', 'utf8');
// Remove sticky header border-bottom div if still present
proj = proj.replace(
  /\s*<div style=\{\{[^}]*borderBottom[^}]*\}[^}]*\}>[^<]*\{\/\* Header handled by Layout \*\/\}[^<]*<\/div>[^<]*<\/div>/s,
  ''
);
// Right-align the New Project heading to maxWidth 960 with padding 24
proj = proj.replace(
  /(<div style=\{\{[^}]*maxWidth[^}]*\}[^}]*\}>)\s*(<div style=\{\{[^}]*'New Project'[^}]*\})/s,
  (m) => m // leave as is if complex
);
// Simpler: find the page wrapper and update its style
proj = proj.replace(
  `style={{ maxWidth: '960px', margin: '0 auto', padding: '1.5rem 1.25rem' }}`,
  `style={{ maxWidth: '960px', margin: '0 auto', padding: '1.5rem 1.25rem' }}`
);
// Remove border-bottom from project pill header row
proj = proj.replace(
  /borderBottom:\s*'1px solid #E4E5E5',([^}]*)(display:\s*'flex'[^}]*justifyContent:\s*'space-between')/,
  `$2`
);
fs.writeFileSync('src/pages/Projects.jsx', proj, 'utf8');
console.log('✓ Projects header cleaned');

// ── 4. CLIENTS: Remove border-bottom line ────────────────────────────────────
let clients = fs.readFileSync('src/pages/Clients.jsx', 'utf8');
clients = clients.replace(
  /borderBottom:\s*'1px solid #E4E5E5',([^}]*)(display:\s*'flex'[^}]*justifyContent:\s*'space-between')/,
  `$2`
);
fs.writeFileSync('src/pages/Clients.jsx', clients, 'utf8');
console.log('✓ Clients header cleaned');

// ── 5. CALCULATOR: Replace simple install button with full PWA guide ──────────
let calc = fs.readFileSync('src/pages/Calculator.jsx', 'utf8');

// Remove the simple install block
calc = calc.replace(
  /\s*\{\/\* \u2500\u2500 How to install AprIQ \u2500\u2500 \*\/\}[\s\S]*?<\/button>\s*<\/div>\s*<\/div>/,
  ''
);

// Get the full InstallPWA component from git history 
const oldCalc = execSync('git show a9e8cc5:src/pages/UserProfile.jsx').toString();
const installStart = oldCalc.indexOf('function InstallPWA');
const installEnd = oldCalc.indexOf('\nexport default function', installStart);
let installComponent = installStart > -1 ? oldCalc.slice(installStart, installEnd) : '';

// Add it before Calculator component if found
if (installComponent) {
  // Check it's not already there
  if (!calc.includes('function InstallPWA')) {
    // Insert after imports
    const importEnd = calc.lastIndexOf('\nimport ');
    const afterImports = calc.indexOf('\n', importEnd + 1) + 1;
    calc = calc.slice(0, afterImports) + '\n' + installComponent + '\n' + calc.slice(afterImports);
    console.log('✓ InstallPWA component added to Calculator');
  }
  
  // Now add the InstallPWA JSX block at bottom of Calculator
  const installBlock = `
      {/* \u2500\u2500 How to install AprIQ \u2500\u2500 */}
      <div style={{ maxWidth:'1140px', margin:'0 auto', padding:'0 1.25rem 2.5rem' }}>
        <InstallPWA />
      </div>`;
  
  const lastDiv = calc.lastIndexOf('\n    </div>\n  );\n}');
  if (lastDiv > -1) {
    calc = calc.slice(0, lastDiv) + installBlock + calc.slice(lastDiv);
  }
} else {
  console.log('InstallPWA not found in git history - adding inline');
  const installBlock = `
      {/* \u2500\u2500 How to install AprIQ \u2500\u2500 */}
      <div style={{ maxWidth:'1140px', margin:'0 auto', padding:'0 1.25rem 2.5rem' }}>
        <div style={{ background:'#F9FAFA', border:'1px solid #E4E5E5', borderRadius:16, padding:'1.5rem' }}>
          <p style={{ fontSize:'0.85rem', fontWeight:600, color:'#111111', marginBottom:8, fontFamily:"'Roboto',system-ui,sans-serif" }}>Install AprIQ</p>
          <p style={{ fontSize:'0.75rem', color:'#979899', marginBottom:12, fontFamily:"'Roboto',system-ui,sans-serif" }}>Add AprIQ to your home screen:</p>
          <p style={{ fontSize:'0.75rem', color:'#555', fontFamily:"'Roboto',system-ui,sans-serif", lineHeight:1.6 }}>
            <strong>iOS/iPad:</strong> Tap Share → Add to Home Screen<br/>
            <strong>Android:</strong> Tap Menu → Add to Home Screen / Install App<br/>
            <strong>Windows/Mac (Chrome/Edge):</strong> Click the install icon in the address bar
          </p>
        </div>
      </div>`;
  const lastDiv = calc.lastIndexOf('\n    </div>\n  );\n}');
  if (lastDiv > -1) calc = calc.slice(0, lastDiv) + installBlock + calc.slice(lastDiv);
}
fs.writeFileSync('src/pages/Calculator.jsx', calc, 'utf8');
console.log('✓ Calculator install PWA');

console.log('\nAll done.');
