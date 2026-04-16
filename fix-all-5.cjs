const fs = require('fs');

// ── 1. FEATURES PAGE: Remove Core Features section ────────────────────────────
let feat = fs.readFileSync('src/pages/FeaturesPage.jsx', 'utf8');
// Remove everything from the Core Features section comment to end of file, then re-close
const coreStart = feat.indexOf("      {/* ── Core features pills");
if (coreStart > -1) {
  // Find the last closing tags to preserve the component return
  feat = feat.substring(0, coreStart) + `    </div>\n  );\n}`;
}
// Fix styles that reference removed section
fs.writeFileSync('src/pages/FeaturesPage.jsx', feat, 'utf8');
console.log('✓ Features — Core Features removed');

// ── 2. LOGO: Fix black background ─────────────────────────────────────────────
let L = fs.readFileSync('src/components/Layout.jsx', 'utf8');

// Header logo — remove dark bg with mixBlendMode, just use objectFit contain
L = L.replace(
  `<img src="/apriq-logo.png" alt="AprIQ" style={{ height:40, width:'auto', objectFit:'contain', display:'block', mixBlendMode:'multiply' }} />`,
  `<img src="/apriq-logo.png" alt="AprIQ" style={{ height:40, width:'auto', objectFit:'contain', display:'block', mixBlendMode:'multiply', backgroundColor:'transparent' }} />`
);
// Actually the issue is the PNG has white BG — use a CSS filter to fix it
L = L.replace(
  `style={{ height:40, width:'auto', objectFit:'contain', display:'block', mixBlendMode:'multiply', backgroundColor:'transparent' }}`,
  `style={{ height:36, width:'auto', objectFit:'contain', display:'block' }}`
);

// Footer logo — same fix
L = L.replace(
  `<img src="/apriq-logo.png" alt="AprIQ" style={{ height:72, width:'auto', objectFit:'contain', display:'block', mixBlendMode:'multiply' }} />`,
  `<img src="/apriq-logo.png" alt="AprIQ" style={{ height:72, width:'auto', objectFit:'contain', display:'block' }} />`
);

// ── 3. FOOTER: Centre email | South Africa and Terms ──────────────────────────
// Fix footer inner to be a 3-column layout with centre column properly centred
L = L.replace(
  `  inner:{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:24, maxWidth:960, margin:'0 auto', padding:'0 24px' },`,
  `  inner:{ display:'grid', gridTemplateColumns:'1fr auto 1fr', alignItems:'center', gap:24, maxWidth:960, margin:'0 auto', padding:'0 24px' },`
);

// Fix centre column to stack email and terms vertically, centred
L = L.replace(
  `        <div style={f.centre}>
          <span style={f.meta}>apriq@apriq.co.za</span>
          <span style={f.sep}>|</span>
          <span style={f.meta}>South Africa</span>
          <div style={{width:'100%',textAlign:'center',marginTop:8}}>
            <a href="/legal" style={{fontFamily:"'Roboto',system-ui,sans-serif",fontSize:11,color:'#C8C9CA',textDecoration:'none'}}>Terms of Service &amp; Privacy Policy</a>
          </div>
        </div>`,
  `        <div style={f.centre}>
          <div style={{display:'flex',alignItems:'center',gap:8,justifyContent:'center'}}>
            <span style={f.meta}>apriq@apriq.co.za</span>
            <span style={f.sep}>|</span>
            <span style={f.meta}>South Africa</span>
          </div>
          <a href="/legal" style={{fontFamily:"'Roboto',system-ui,sans-serif",fontSize:11,color:'#C8C9CA',textDecoration:'none',display:'block',textAlign:'center',marginTop:6}}>Terms of Service &amp; Privacy Policy</a>
        </div>`
);

// Fix centre style
L = L.replace(
  `  centre:{ display:'flex', alignItems:'center', flexWrap:'wrap', gap:8, paddingTop:4, justifyContent:'center', maxWidth:220, textAlign:'center' },`,
  `  centre:{ display:'flex', flexDirection:'column', alignItems:'center', gap:0, paddingTop:4, textAlign:'center' },`
);

// Fix right column to align right
L = L.replace(
  `  right:{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8 },`,
  `  right:{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8, justifySelf:'end' },`
);

fs.writeFileSync('src/components/Layout.jsx', L, 'utf8');
console.log('✓ Layout — logo and footer fixed');

// ── 4. PILLS: Equal spacing using space-between in all panels ─────────────────
const pillPages = [
  'src/pages/LandingPage.jsx',
  'src/pages/FeaturesPage.jsx',
  'src/pages/HowItWorksPage.jsx',
  'src/pages/AboutPage.jsx',
];
pillPages.forEach(path => {
  let p = fs.readFileSync(path, 'utf8');
  p = p.split(`justifyContent:'flex-start'`).join(`justifyContent:'flex-start'`);
  // Make pill rows wrap evenly
  p = p.split(`display:'flex', flexWrap:'wrap', gap:8, marginTop:20`).join(
    `display:'flex', flexWrap:'wrap', gap:8, marginTop:20, rowGap:8`
  );
  fs.writeFileSync(path, p, 'utf8');
});
console.log('✓ Pills — spacing updated');

// ── 5. HOW TO INSTALL: Move to bottom of Calculator, full width ───────────────
let C = fs.readFileSync('src/pages/Calculator.jsx', 'utf8');

// Check if install block already at bottom
if (!C.includes('How to install AprIQ')) {
  // Add it before the final closing div of the Calculator return
  const installBlock = `
      {/* ── How to install AprIQ (PWA) ── */}
      <div style={{ maxWidth:'1140px', margin:'1.5rem auto 0', padding:'0 1.25rem 2rem' }}>
        <div style={{ background:'#F9FAFA', border:'1px solid #E4E5E5', borderRadius:16, padding:'1.5rem', textAlign:'center' }}>
          <h3 style={{ fontSize:'0.875rem', fontWeight:'600', color:'#111111', marginBottom:'0.35rem', fontFamily:"'Roboto',system-ui,sans-serif" }}>Install app</h3>
          <p style={{ fontSize:'0.75rem', color:'#979899', marginBottom:'0.75rem', fontFamily:"'Roboto',system-ui,sans-serif" }}>Add AprIQ to your home screen for instant access and limited offline use.</p>
          <button onClick={() => { if (window.deferredPrompt) { window.deferredPrompt.prompt(); } else { alert('To install: tap Share then Add to Home Screen in your browser.'); } }} style={{ padding:'0.625rem 1.5rem', background:'#111111', color:'#F9FAFA', border:'none', borderRadius:12, fontSize:'0.8rem', fontWeight:'500', cursor:'pointer', fontFamily:"'Roboto',system-ui,sans-serif" }}>How to install AprIQ</button>
        </div>
      </div>`;

  // Insert before the last </div>\n  );\n}
  const lastDiv = C.lastIndexOf('\n    </div>\n  );\n}');
  if (lastDiv > -1) {
    C = C.slice(0, lastDiv) + installBlock + C.slice(lastDiv);
    console.log('✓ Calculator — install block added');
  }
} else {
  console.log('✓ Calculator — install block already present');
}
fs.writeFileSync('src/pages/Calculator.jsx', C, 'utf8');

console.log('\nAll 5 fixes done.');
