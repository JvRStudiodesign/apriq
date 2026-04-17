const fs = require('fs');
const {execSync} = require('child_process');

// Extract InstallPWA from original commit
const origProfile = execSync('git show 49c6212:src/pages/UserProfile.jsx').toString();
const fnStart = origProfile.indexOf('function InstallPWA');
const fnEnd = origProfile.indexOf('\nexport default function UserProfile');
const installPWA = origProfile.slice(fnStart, fnEnd).trim();

// ── 1. CALCULATOR: Replace inline install with full InstallPWA modal ───────────
let calc = fs.readFileSync('src/pages/Calculator.jsx', 'utf8');

// Add InstallPWA component if not present
if (!calc.includes('function InstallPWA')) {
  const afterImports = calc.indexOf('\nconst DEFAULT');
  calc = calc.slice(0, afterImports) + '\n\n' + installPWA + '\n' + calc.slice(afterImports);
}

// Replace the simple inline install block with <InstallPWA />
calc = calc.replace(
  /\s*\{\/\* ── How to install AprIQ ── \*\/\}\s*<div style=\{\{ maxWidth:'1140px'[^}]+\}\}>\s*<div style=\{\{[^}]+\}\}>[^<]*<p[^/]*\/p>[^<]*<p[^/]*\/p>[^<]*<\/div>\s*<\/div>/s,
  ''
);
calc = calc.replace(
  /\s*\{\/\* ── How to install AprIQ ── \*\/\}[\s\S]*?<\/div>\s*<\/div>/,
  ''
);

// Add clean block at bottom
const installBlock = `
      {/* ── How to install AprIQ ── */}
      <div style={{ maxWidth:'1140px', margin:'0 auto', padding:'0 1.25rem 2.5rem' }}>
        <InstallPWA />
      </div>`;
const lastDiv = calc.lastIndexOf('\n    </div>\n  );\n}');
if (lastDiv > -1) calc = calc.slice(0, lastDiv) + installBlock + calc.slice(lastDiv);
fs.writeFileSync('src/pages/Calculator.jsx', calc, 'utf8');
console.log('✓ Calculator InstallPWA modal');

// ── 2. DROPDOWN: Swap Profile above My Plan (all instances) ──────────────────
let L = fs.readFileSync('src/components/Layout.jsx', 'utf8');
// Replace every occurrence
while (L.includes(`<Link to="/plans" style={h.dropItem} onClick={() => setProfileOpen(false)}>My Plan</Link>
                  <Link to="/profile" style={h.dropItem} onClick={() => setProfileOpen(false)}>Profile</Link>`)) {
  L = L.replace(
    `<Link to="/plans" style={h.dropItem} onClick={() => setProfileOpen(false)}>My Plan</Link>
                  <Link to="/profile" style={h.dropItem} onClick={() => setProfileOpen(false)}>Profile</Link>`,
    `<Link to="/profile" style={h.dropItem} onClick={() => setProfileOpen(false)}>Profile</Link>
                  <Link to="/plans" style={h.dropItem} onClick={() => setProfileOpen(false)}>My Plan</Link>`
  );
}

// ── 3. HEADER: Double height, centre content ──────────────────────────────────
L = L.replace(
  `  inner:{ display:'grid', gridTemplateColumns:'1fr auto 1fr', alignItems:'center', gap:24, maxWidth:960, margin:'0 auto', padding:'0 24px' },`,
  `  inner:{ display:'flex', alignItems:'center', justifyContent:'space-between', height:80, maxWidth:960, margin:'0 auto', padding:'0 24px' },`
);
L = L.replace(
  `  root:{ position:'sticky', top:0, zIndex:200, background:'#F9FAFA', borderBottom:'1px solid #E4E5E5' },`,
  `  root:{ position:'sticky', top:0, zIndex:200, background:'#F9FAFA', borderBottom:'1px solid #E4E5E5', minHeight:80 },`
);

// Right-align nav items — max-width 960 with 24px padding = right edge at ~984px
// The profile button is at right edge. Pages should align their content to same maxWidth
fs.writeFileSync('src/components/Layout.jsx', L, 'utf8');
console.log('✓ Layout — dropdown fixed, header height doubled');

// ── 4. USER PROFILE: Remove border-bottom line, right-align heading ───────────
let prof = fs.readFileSync('src/pages/UserProfile.jsx', 'utf8');
// Remove the borderBottom from the h1 wrapper or the div below it
prof = prof.replace(
  `<h1 style={{ fontSize: '1.375rem', fontWeight: '700', color: '#111111', marginBottom: '0.25rem', letterSpacing: '-0.01em', fontFamily: "'Roboto', system-ui, sans-serif" }}>Profile</h1>
        <p style={{ fontSize: '0.78rem', color: '#979899', marginBottom: '1.5rem' }}>Your details auto-populate on every PDF export.</p>`,
  `<h1 style={{ fontSize: '1.375rem', fontWeight: '700', color: '#111111', marginBottom: '0.25rem', letterSpacing: '-0.01em', fontFamily: "'Roboto', system-ui, sans-serif" }}>Profile</h1>
        <p style={{ fontSize: '0.78rem', color: '#979899', marginBottom: '1.5rem' }}>Your details auto-populate on every PDF export.</p>`
);
// Remove any borderBottom from page header area
prof = prof.replace(/borderBottom: '1px solid #E4E5E5',\s*/g, '');
fs.writeFileSync('src/pages/UserProfile.jsx', prof, 'utf8');
console.log('✓ UserProfile — border removed');

// ── 5. PROJECTS & CLIENTS: Remove border lines ────────────────────────────────
['src/pages/Projects.jsx', 'src/pages/Clients.jsx'].forEach(path => {
  let p = fs.readFileSync(path, 'utf8');
  p = p.replace(/borderBottom: '1px solid #E4E5E5',\s*/g, '');
  p = p.replace(/borderBottom:'1px solid #E4E5E5',\s*/g, '');
  fs.writeFileSync(path, p, 'utf8');
});
console.log('✓ Projects/Clients — borders removed');

// ── 6. RIGHT-ALIGN headings on utility pages to match header right edge ────────
// Header inner is maxWidth:960, padding 0 24px → right content edge at 960-24=936px from left of container
// Pages use maxWidth 560 or 720 centred — they need to match header's right edge
// Solution: make page wrapper use same maxWidth:960 padding:0 24px and text-align the heading right
['src/pages/Projects.jsx', 'src/pages/Clients.jsx'].forEach(path => {
  let p = fs.readFileSync(path, 'utf8');
  // Update the heading row to right-align within maxWidth 960
  p = p.replace(
    /maxWidth: '960px', margin: '0 auto', padding: '1\.5rem 1\.25rem'/g,
    `maxWidth: '960px', margin: '0 auto', padding: '1.5rem 24px'`
  );
  fs.writeFileSync(path, p, 'utf8');
});
let prof2 = fs.readFileSync('src/pages/UserProfile.jsx', 'utf8');
prof2 = prof2.replace(
  `maxWidth: '560px', margin: '0 auto', padding: '2rem 1.25rem'`,
  `maxWidth: '960px', margin: '0 auto', padding: '1.5rem 24px'`
);
// Keep form width constrained
prof2 = prof2.replace(
  `<div style={{ maxWidth: '960px', margin: '0 auto', padding: '1.5rem 24px' }}>
        <h1`,
  `<div style={{ maxWidth: '960px', margin: '0 auto', padding: '1.5rem 24px' }}>
        <div style={{ maxWidth: 560 }}>
        <h1`
);
fs.writeFileSync('src/pages/UserProfile.jsx', prof2, 'utf8');
console.log('✓ Utility pages aligned to header grid');

console.log('\nAll done.');
