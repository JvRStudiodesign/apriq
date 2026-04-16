const fs = require('fs');

// ── 1. LANDING PAGE — hero centred + larger, fix pill text to #111111 ─────────
let landing = fs.readFileSync('src/pages/LandingPage.jsx', 'utf8');

// Hero: centre-align and increase size
landing = landing.replace(
  `hero:{ padding:'56px 0 48px' },`,
  `hero:{ padding:'80px 0 72px', textAlign:'center' },`
);
landing = landing.replace(
  `heroWrap:{ maxWidth:580 },`,
  `heroWrap:{ maxWidth:700, margin:'0 auto' },`
);
landing = landing.replace(
  `h1:{ fontFamily:"'Aptos','Segoe UI',system-ui,sans-serif", fontSize:30, fontWeight:700, color:'#111111', lineHeight:1.18, letterSpacing:'-0.3px', marginBottom:20 },`,
  `h1:{ fontFamily:"'Aptos','Segoe UI',system-ui,sans-serif", fontSize:36, fontWeight:700, color:'#111111', lineHeight:1.15, letterSpacing:'-0.5px', marginBottom:20, textAlign:'center' },`
);
landing = landing.replace(
  `heroSub:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:15, color:'#979899', lineHeight:1.65, marginBottom:32, maxWidth:540 },`,
  `heroSub:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:15, color:'#979899', lineHeight:1.65, marginBottom:32, maxWidth:560, textAlign:'center', margin:'0 auto 32px' },`
);

// Fix pill text color: #FF8210 -> #111111 (orange border only, dark text)
landing = landing.split(`color:'#FF8210', background:'#F9FAFA', whiteSpace:'nowrap'`).join(`color:'#111111', background:'#F9FAFA', whiteSpace:'nowrap'`);

// Step pills — fix text color  
landing = landing.replace(
  `stepLabel:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:13, color:'#111111', whiteSpace:'pre-line', lineHeight:1.35, textAlign:'center', display:'block' },`,
  `stepLabel:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:13, color:'#111111', whiteSpace:'pre-line', lineHeight:1.35, textAlign:'left', display:'block' },`
);

// Make pill rows use space-between for equal spacing
landing = landing.split(
  `pillRow:{ display:'flex', flexWrap:'wrap', gap:8, marginTop:20 },`
).join(
  `pillRow:{ display:'flex', flexWrap:'wrap', gap:8, marginTop:20, justifyContent:'flex-start' },`
);

// Step row equal spacing
landing = landing.replace(
  `stepRow:{ display:'flex', alignItems:'center', flexWrap:'wrap', gap:8, marginTop:20 },`,
  `stepRow:{ display:'flex', alignItems:'center', flexWrap:'wrap', gap:8, marginTop:20, justifyContent:'flex-start' },`
);

fs.writeFileSync('src/pages/LandingPage.jsx', landing, 'utf8');
console.log('✓ LandingPage');

// ── 2. ABOUT PAGE — fix pill text color ──────────────────────────────────────
let about = fs.readFileSync('src/pages/AboutPage.jsx', 'utf8');
// Values pills — keep orange border, text #111111
about = about.replace(
  `valueLabel:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:13, fontWeight:500, color:'#111111', padding:'4px 16px', border:'1px solid #FF8210', borderRadius:100, display:'inline-flex', alignItems:'center', height:32, whiteSpace:'nowrap' },`,
  `valueLabel:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:12, fontWeight:500, color:'#111111', padding:'4px 14px', border:'1px solid #FF8210', borderRadius:100, display:'inline-flex', alignItems:'center', height:28, whiteSpace:'nowrap' },`
);
fs.writeFileSync('src/pages/AboutPage.jsx', about, 'utf8');
console.log('✓ AboutPage');

// ── 3. FEATURES PAGE — merge Core Features into Features bubble ───────────────
let features = fs.readFileSync('src/pages/FeaturesPage.jsx', 'utf8');

// Fix pill text color
features = features.split(`color:'#FF8210', background:'#F9FAFA', whiteSpace:'nowrap'`).join(`color:'#111111', background:'#F9FAFA', whiteSpace:'nowrap'`);

// Remove the separate Core Features section entirely
const coreFeatStart = features.indexOf(`      {/* ── Core features pills ── */}`);
const coreFeatEnd = features.indexOf(`    </div>\n  );\n}`, coreFeatStart);
if (coreFeatStart > -1 && coreFeatEnd > -1) {
  features = features.substring(0, coreFeatStart) + `    </div>\n  );\n}`;
}

// Add core feature pills inside the main Features bubble after the benefit pills
features = features.replace(
  `        <div style={s.pillRow} className="fi">{BENEFIT_PILLS.map((p) => <span key={p} style={s.pill}>{p}</span>)}</div>`,
  `        <div style={s.pillRow} className="fi">{BENEFIT_PILLS.map((p) => <span key={p} style={s.pill}>{p}</span>)}</div>
        <div style={{...s.pillRow, marginTop:8}} className="fi">{['ROM Estimates','Feasibility Planning','Building Types','Project Types','Cost Adjustments','Element Breakdowns','Rate Summaries'].map((p) => <span key={p} style={s.pill}>{p}</span>)}</div>`
);

fs.writeFileSync('src/pages/FeaturesPage.jsx', features, 'utf8');
console.log('✓ FeaturesPage');

// ── 4. HOW IT WORKS PAGE — equal size step pills, fix text color ─────────────
let how = fs.readFileSync('src/pages/HowItWorksPage.jsx', 'utf8');

// Step pills equal size
how = how.replace(
  `step:{ padding:'8px 16px', border:'1px solid #FF8210', borderRadius:12, background:'#F9FAFA' },`,
  `step:{ padding:'8px 20px', border:'1px solid #FF8210', borderRadius:12, background:'#F9FAFA', flex:'1 1 auto', textAlign:'center', maxWidth:180 },`
);
how = how.replace(
  `stepRow:{ display:'flex', flexWrap:'wrap', gap:8, marginTop:24 },`,
  `stepRow:{ display:'flex', flexWrap:'wrap', gap:8, marginTop:24, justifyContent:'flex-start' },`
);

fs.writeFileSync('src/pages/HowItWorksPage.jsx', how, 'utf8');
console.log('✓ HowItWorksPage');

// ── 5. LAYOUT — footer Terms below email, Feedback pill to centre ─────────────
let layout = fs.readFileSync('src/components/Layout.jsx', 'utf8');

// Move Terms below email in footer — restructure footer centre column
layout = layout.replace(
  `        <div style={f.centre}>
          <span style={f.meta}>apriq@apriq.co.za</span>
          <span style={f.sep}>|</span>
          <span style={f.meta}>South Africa</span>
        </div>`,
  `        <div style={f.centre}>
          <span style={f.meta}>apriq@apriq.co.za</span>
          <span style={f.sep}>|</span>
          <span style={f.meta}>South Africa</span>
          <div style={{width:'100%',textAlign:'center',marginTop:8}}>
            <a href="/legal" style={{fontFamily:"'Roboto',system-ui,sans-serif",fontSize:11,color:'#C8C9CA',textDecoration:'none'}}>Terms of Service &amp; Privacy Policy</a>
          </div>
        </div>`
);

// Remove duplicate Terms from right side of footer  
layout = layout.replace(
  `          <Link to="/legal" style={f.legalLink}>Terms of Service &amp; Privacy Policy</Link>
          <span style={f.copy}>© 2025 AprIQ.</span>`,
  `          <span style={f.copy}>© 2025 AprIQ.</span>`
);

// Centre column style update
layout = layout.replace(
  `centre:{ display:'flex', alignItems:'center', gap:8, paddingTop:4 },`,
  `centre:{ display:'flex', alignItems:'center', flexWrap:'wrap', gap:8, paddingTop:4, justifyContent:'center', maxWidth:220, textAlign:'center' },`
);

fs.writeFileSync('src/components/Layout.jsx', layout, 'utf8');
console.log('✓ Layout.jsx — footer updated');

console.log('\nAll done.');
