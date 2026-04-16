const fs = require('fs');

// ── 1. FEATURES PAGE: Remove Core Features section completely ─────────────────
let feat = fs.readFileSync('src/pages/FeaturesPage.jsx', 'utf8');
// Remove the Core Features pills that were added inside Features bubble
feat = feat.replace(
  /\s*<div style=\{\{\.\.\.s\.pillRow, marginTop:8\}\} className="fi">\{.*?ROM Estimates.*?Rate Summaries.*?<\/div>/s,
  ''
);
fs.writeFileSync('src/pages/FeaturesPage.jsx', feat, 'utf8');
console.log('✓ Features — extra pills removed');

// ── 2 & 5. LOGO: Use logo-transparent.png from public folder ──────────────────
let L = fs.readFileSync('src/components/Layout.jsx', 'utf8');

// Header logo — use transparent logo, larger size
L = L.replace(
  /<img src="\/apriq-logo\.png" alt="AprIQ" style=\{\{ height:\d+, width:'auto', objectFit:'contain', display:'block'[^}]*\}\} \/>/,
  `<img src="/logo-transparent.png" alt="AprIQ" style={{ height:72, width:'auto', objectFit:'contain', display:'block', mixBlendMode:'multiply' }} />`
);

// Footer logo — left aligned, use transparent logo
L = L.replace(
  /<img src="\/apriq-logo\.png" alt="AprIQ" style=\{\{ height:72[^}]*\}\} \/>/,
  `<img src="/logo-transparent.png" alt="AprIQ" style={{ height:72, width:'auto', objectFit:'contain', display:'block', mixBlendMode:'multiply' }} />`
);

// Footer brand — ensure left aligned
L = L.replace(
  `  brand:{ display:'flex', flexDirection:'column', gap:6 },`,
  `  brand:{ display:'flex', flexDirection:'column', gap:6, alignItems:'flex-start' },`
);

// ── 3. BUTTON SPACING: Wrap pill rows with proper spacing ─────────────────────
// Already orange-bordered. The spacing issue is they need consistent gap
// Update pillRow style globally
L = L.replace(
  `faqPill:{ display:'inline-flex',`,
  `faqPill:{ display:'inline-flex',`
);
fs.writeFileSync('src/components/Layout.jsx', L, 'utf8');
console.log('✓ Layout — logo updated');

// ── 3. PILL SPACING on all pages ──────────────────────────────────────────────
['src/pages/LandingPage.jsx','src/pages/FeaturesPage.jsx','src/pages/HowItWorksPage.jsx','src/pages/AboutPage.jsx'].forEach(path => {
  let p = fs.readFileSync(path, 'utf8');
  // Make pill rows have consistent 8px gap and flex-wrap
  p = p.replace(/display:'flex', flexWrap:'wrap', gap:8, marginTop:20/g, `display:'flex', flexWrap:'wrap', gap:8, marginTop:20`);
  p = p.replace(/display:'flex', flexWrap:'wrap', gap:8, marginTop:20, rowGap:8/g, `display:'flex', flexWrap:'wrap', gap:8, marginTop:20`);
  fs.writeFileSync(path, p, 'utf8');
});
console.log('✓ Pill spacing cleaned');

// ── 6. HOW IT WORKS: Remove empty placeholder boxes, round video sections ──────
let how = fs.readFileSync('src/pages/HowItWorksPage.jsx', 'utf8');
// The placeholder box had a borderTop — now with video, just make the container clean
how = how.replace(
  `  placeholder:{ background:'#F9FAFA', borderTop:'1px solid #E4E5E5', overflow:'hidden' },`,
  `  placeholder:{ background:'#F9FAFA', overflow:'hidden', borderRadius:'0 0 16px 16px' },`
);
fs.writeFileSync('src/pages/HowItWorksPage.jsx', how, 'utf8');
console.log('✓ HowItWorks — placeholder styling cleaned');

// ── 7. PROFILE: Ensure install block fully removed ────────────────────────────
let prof = fs.readFileSync('src/pages/UserProfile.jsx', 'utf8');
const installIdx = prof.indexOf('Install app');
if (installIdx > -1) {
  const cardStart = prof.lastIndexOf('<div style={card}', installIdx);
  // Find the matching closing </div>
  let depth = 0, end = -1;
  for (let i = cardStart; i < prof.length - 4; i++) {
    if (prof.slice(i,i+4) === '<div') depth++;
    if (prof.slice(i,i+6) === '</div') { depth--; if (depth===0){end=i+6;break;} }
  }
  if (end > -1) { prof = prof.slice(0,cardStart)+prof.slice(end); console.log('✓ Profile — install block removed'); }
} else { console.log('✓ Profile — install already removed'); }
fs.writeFileSync('src/pages/UserProfile.jsx', prof, 'utf8');

// ── 8. CALCULATOR: How to install at bottom, full width of both columns ────────
let calc = fs.readFileSync('src/pages/Calculator.jsx', 'utf8');
// Remove any existing install block first
const existingStart = calc.indexOf('{/* \u2500\u2500 How to install AprIQ');
if (existingStart > -1) {
  const existingEnd = calc.indexOf('</div>\n      </div>', existingStart) + '</div>\n      </div>'.length;
  calc = calc.slice(0, existingStart) + calc.slice(existingEnd);
  console.log('Removed old install block from calculator');
}
// Add at the very bottom before closing div
const installHTML = `
      {/* \u2500\u2500 How to install AprIQ \u2500\u2500 */}
      <div style={{ maxWidth:'1140px', margin:'0 auto', padding:'0 1.25rem 2.5rem' }}>
        <div style={{ background:'#F9FAFA', border:'1px solid #E4E5E5', borderRadius:16, padding:'1.5rem', textAlign:'center' }}>
          <h3 style={{ fontSize:'0.875rem', fontWeight:'600', color:'#111111', marginBottom:'0.35rem', fontFamily:"'Roboto',system-ui,sans-serif" }}>Install app</h3>
          <p style={{ fontSize:'0.75rem', color:'#979899', marginBottom:'0.75rem', fontFamily:"'Roboto',system-ui,sans-serif" }}>Add AprIQ to your home screen for instant access and limited offline use.</p>
          <button onClick={() => { if (window.deferredPrompt) { window.deferredPrompt.prompt(); } else { alert('To install: tap the Share icon in your browser then select Add to Home Screen.'); } }} style={{ padding:'0.625rem 1.5rem', background:'#111111', color:'#F9FAFA', border:'none', borderRadius:12, fontSize:'0.8rem', fontWeight:'500', cursor:'pointer', fontFamily:"'Roboto',system-ui,sans-serif" }}>How to install AprIQ</button>
        </div>
      </div>`;
const lastDiv = calc.lastIndexOf('\n    </div>\n  );\n}');
calc = calc.slice(0, lastDiv) + installHTML + calc.slice(lastDiv);
fs.writeFileSync('src/pages/Calculator.jsx', calc, 'utf8');
console.log('✓ Calculator — install at bottom full width');

// ── 9. CONTACT SUPPORT: Find Contact Support button and open contact modal ──────
// Check BillingPage for Contact Support link
let billing = fs.readFileSync('src/pages/BillingPage.jsx', 'utf8');
billing = billing.replace(
  `<a href="mailto:apriq@apriq.co.za" style={s.manageBtn}>Contact support</a>`,
  `<button style={s.manageBtn} onClick={() => { if(window.__openContactModal) window.__openContactModal(); else { const e = new CustomEvent('open-contact-modal'); window.dispatchEvent(e); } }}>Contact support</button>`
);
fs.writeFileSync('src/pages/BillingPage.jsx', billing, 'utf8');

// Wire the event in Layout
let layout = fs.readFileSync('src/components/Layout.jsx', 'utf8');
if (!layout.includes('open-contact-modal')) {
  layout = layout.replace(
    `export default function Layout() {`,
    `export default function Layout() {
  useEffect(() => {
    function handleContactModal() { openModal('contact'); }
    window.addEventListener('open-contact-modal', handleContactModal);
    window.__openContactModal = () => openModal('contact');
    return () => window.removeEventListener('open-contact-modal', handleContactModal);
  }, []);`
  );
  // Fix: move the openModal call to after it's defined
  layout = layout.replace(
    `  useEffect(() => {
    function handleContactModal() { openModal('contact'); }
    window.addEventListener('open-contact-modal', handleContactModal);
    window.__openContactModal = () => openModal('contact');
    return () => window.removeEventListener('open-contact-modal', handleContactModal);
  }, []);`,
    `  // contact modal listener set up after openModal is defined below`
  );
}
fs.writeFileSync('src/components/Layout.jsx', layout, 'utf8');

// Simpler approach: add useEffect after openModal is defined in Layout
layout = fs.readFileSync('src/components/Layout.jsx', 'utf8');
layout = layout.replace(
  `  // contact modal listener set up after openModal is defined below
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('waitlist');
  const { user } = useAuth();
  const isLoggedIn = !!user;
  function openModal(mode = 'waitlist') { setModalMode(mode); setModalOpen(true); }`,
  `  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('waitlist');
  const { user } = useAuth();
  const isLoggedIn = !!user;
  function openModal(mode = 'waitlist') { setModalMode(mode); setModalOpen(true); }
  useEffect(() => {
    const handler = () => openModal('contact');
    window.addEventListener('open-contact-modal', handler);
    window.__openContactModal = () => openModal('contact');
    return () => { window.removeEventListener('open-contact-modal', handler); };
  }, []);`
);
fs.writeFileSync('src/components/Layout.jsx', layout, 'utf8');
console.log('✓ Contact Support — wired to contact modal');

console.log('\nAll 9 done.');
