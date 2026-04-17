const fs = require('fs');
const {execSync} = require('child_process');

// ── 1. DROPDOWN: Exact string match with correct indentation ──────────────────
let L = fs.readFileSync('src/components/Layout.jsx', 'utf8');

const oldOrder = `<Link to="/plans" style={h.dropItem} onClick={() => setProfileOpen(false)}>My Plan</Link>
                    <Link to="/profile" style={h.dropItem} onClick={() => setProfileOpen(false)}>Profile</Link>`;
const newOrder = `<Link to="/profile" style={h.dropItem} onClick={() => setProfileOpen(false)}>Profile</Link>
                    <Link to="/plans" style={h.dropItem} onClick={() => setProfileOpen(false)}>My Plan</Link>`;

const count = (L.match(/My Plan<\/Link>/g) || []).length;
console.log('My Plan occurrences:', count);
L = L.split(oldOrder).join(newOrder);
console.log('Replacements done:', (L.match(/Profile<\/Link>\s*\n\s*<Link[^>]*>My Plan/g)||[]).length);

// ── 2. HEADER: Double height to 80px ─────────────────────────────────────────
// Find current header inner style
const innerMatch = L.match(/inner:\{[^}]+height:\d+/);
if (innerMatch) console.log('Current inner:', innerMatch[0]);
L = L.replace(/inner:\{ display:'flex', alignItems:'center', justifyContent:'space-between', height:\d+,/, 
  `inner:{ display:'flex', alignItems:'center', justifyContent:'space-between', height:80,`);
L = L.replace(/inner:\{ display:'grid'[^}]+\},/,
  `inner:{ display:'flex', alignItems:'center', justifyContent:'space-between', height:80, maxWidth:960, margin:'0 auto', padding:'0 24px' },`);

fs.writeFileSync('src/components/Layout.jsx', L, 'utf8');
console.log('✓ Layout fixed');

// ── 3. USERPROFILE: Remove borderBottom ───────────────────────────────────────
let prof = fs.readFileSync('src/pages/UserProfile.jsx', 'utf8');
prof = prof.replace(/borderBottom:\s*['"]1px solid #E4E5E5['"]\s*,?\s*/g, '');
fs.writeFileSync('src/pages/UserProfile.jsx', prof, 'utf8');
console.log('✓ UserProfile border removed');

// ── 4. PROJECTS/CLIENTS: Remove borderBottom ──────────────────────────────────
['src/pages/Projects.jsx','src/pages/Clients.jsx'].forEach(p => {
  let f = fs.readFileSync(p,'utf8');
  f = f.replace(/borderBottom:\s*['"]1px solid #E4E5E5['"]\s*,?\s*/g,'');
  fs.writeFileSync(p,f,'utf8');
  console.log('✓', p, 'border removed');
});

// ── 5. CALCULATOR: Add InstallPWA from original ───────────────────────────────
let calc = fs.readFileSync('src/pages/Calculator.jsx','utf8');
if (!calc.includes('function InstallPWA')) {
  const orig = execSync('git show 49c6212:src/pages/UserProfile.jsx').toString();
  const s = orig.indexOf('function InstallPWA');
  const e = orig.indexOf('\nexport default function UserProfile');
  if (s > -1 && e > -1) {
    const comp = orig.slice(s,e).trim();
    const insertAt = calc.indexOf('\nconst DEFAULT');
    calc = calc.slice(0,insertAt)+'\n\n'+comp+'\n'+calc.slice(insertAt);
    console.log('✓ InstallPWA added to Calculator');
  }
}
// Ensure InstallPWA is used at bottom
if (calc.includes('function InstallPWA') && !calc.includes('<InstallPWA />')) {
  const lastDiv = calc.lastIndexOf('\n    </div>\n  );\n}');
  const block = `\n      <div style={{ maxWidth:'1140px', margin:'0 auto', padding:'0 1.25rem 2.5rem' }}>\n        <InstallPWA />\n      </div>`;
  calc = calc.slice(0,lastDiv)+block+calc.slice(lastDiv);
  console.log('✓ InstallPWA used in Calculator');
}
// Remove old simple install block
calc = calc.replace(/\s*\{\/\* ── How to install AprIQ ── \*\/\}\s*<div style=\{\{ maxWidth:'1140px'[^;]+;\s*\}\}>\s*<div[^>]+>[^<]*<p[^<]*<\/p>\s*<p[^<]*<\/p>[^<]*<\/div>\s*<\/div>/s,'');
fs.writeFileSync('src/pages/Calculator.jsx', calc, 'utf8');

console.log('\nAll done.');
