const fs = require('fs');

// ── 1. LAYOUT — clean up unused logo text styles ─────────────────────────────
let L = fs.readFileSync('src/components/Layout.jsx', 'utf8');
L = L.replace(
  `  logoMark:{ fontFamily:"'Aptos','Segoe UI',system-ui,sans-serif", fontSize:22, fontWeight:700, color:'#111111', letterSpacing:'-0.3px' },\n  logoSub:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:9, color:'#979899', letterSpacing:'0.1px' },`,
  `  logoMark:{ display:'none' },\n  logoSub:{ display:'none' },`
);
fs.writeFileSync('src/components/Layout.jsx', L, 'utf8');
console.log('✓ Layout cleaned');

// ── 2. LANDING PAGE — centre CTA button ──────────────────────────────────────
let Landing = fs.readFileSync('src/pages/LandingPage.jsx', 'utf8');
Landing = Landing.replace(
  `          <button onClick={() => openModal('waitlist')} style={s.cta}>Join the waiting list</button>`,
  `          <div style={{display:'flex',justifyContent:'center'}}>\n            <button onClick={() => openModal('waitlist')} style={s.cta}>Join the waiting list</button>\n          </div>`
);
fs.writeFileSync('src/pages/LandingPage.jsx', Landing, 'utf8');
console.log('✓ LandingPage CTA centred');

// ── 3. FLOOR AREA default → 0 ────────────────────────────────────────────────
let Calc = fs.readFileSync('src/pages/Calculator.jsx', 'utf8');
// Set floorArea default to 0
Calc = Calc.replace(/floorArea\s*:\s*\d+/, 'floorArea: 0');
fs.writeFileSync('src/pages/Calculator.jsx', Calc, 'utf8');
console.log('✓ Calculator floorArea defaulted to 0');

// ── 4. MOVE "How to install AprIQ" from UserProfile to Calculator ─────────────
let Profile = fs.readFileSync('src/pages/UserProfile.jsx', 'utf8');

// Extract the install app section
const installStart = Profile.indexOf('Install app');
const cardStart = Profile.lastIndexOf('<div style={card}', installStart);
// Find the closing div of this card
let depth = 0;
let pos = cardStart;
let installBlock = '';
for (let i = cardStart; i < Profile.length; i++) {
  if (Profile[i] === '<' && Profile[i+1] === 'd') depth++;
  if (Profile[i] === '<' && Profile[i+1] === '/' && Profile[i+2] === 'd') depth--;
  if (depth === 0 && i > cardStart) {
    installBlock = Profile.substring(cardStart, i + 4);
    break;
  }
}

if (installStart > -1 && cardStart > -1) {
  // Remove from Profile
  Profile = Profile.replace(installBlock, '');
  fs.writeFileSync('src/pages/UserProfile.jsx', Profile, 'utf8');
  console.log('✓ UserProfile — install block removed');

  // Add to bottom of Calculator before the closing div
  let C = fs.readFileSync('src/pages/Calculator.jsx', 'utf8');
  const installInCalc = `
      {/* ── How to install AprIQ (PWA) ── */}
      <div style={{ maxWidth:'1140px', margin:'0 auto', padding:'0 1.25rem 2rem' }}>
        <div style={{ background:'#F9FAFA', border:'1px solid #E4E5E5', borderRadius:16, padding:'1.5rem', textAlign:'center' }}>
          <h3 style={{ fontSize:'0.875rem', fontWeight:'600', color:'#111111', marginBottom:'0.35rem', fontFamily:"'Roboto',system-ui,sans-serif" }}>Install app</h3>
          <p style={{ fontSize:'0.75rem', color:'#979899', marginBottom:'0.75rem', fontFamily:"'Roboto',system-ui,sans-serif" }}>Add AprIQ to your home screen for instant access and limited offline use.</p>
          <button
            onClick={() => { if (window.deferredPrompt) { window.deferredPrompt.prompt(); window.deferredPrompt.userChoice.then(() => { window.deferredPrompt = null; }); } else { alert('To install: tap the Share button in your browser and select "Add to Home Screen".'); } }}
            style={{ padding:'0.625rem 1.5rem', background:'#111111', color:'#F9FAFA', border:'none', borderRadius:12, fontSize:'0.8rem', fontWeight:'500', cursor:'pointer', fontFamily:"'Roboto',system-ui,sans-serif" }}
          >
            How to install AprIQ
          </button>
        </div>
      </div>`;

  C = C.replace(
    `      {/* Legal footer */}`,
    installInCalc + `\n      {/* Legal footer */}`
  );
  // If no legal footer marker, add before final closing div
  if (!C.includes('installInCalc')) {
    C = C.replace(
      `    </div>\n  );\n}`,
      installInCalc + `\n    </div>\n  );\n}`
    );
  }
  fs.writeFileSync('src/pages/Calculator.jsx', C, 'utf8');
  console.log('✓ Calculator — install block added at bottom');
} else {
  console.log('⚠️  Install block not found in UserProfile — check manually');
}

console.log('\nScript 4 done.');
