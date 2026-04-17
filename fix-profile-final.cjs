const fs = require('fs');
let P = fs.readFileSync('src/pages/UserProfile.jsx', 'utf8');
// Remove the install card that keeps coming back
const installIdx = P.indexOf("        <div style={{ background:'#F9FAFA', borderRadius:'16px', padding:'1.5rem', border:'1px solid #E4E5E5', marginBottom:'1rem', marginTop:'1rem' }}>\n          <span style={{ fontSize:'0.85rem', fontWeight:'600', color:'#111111', display:'block', marginBottom:'0.5rem' }}>Install app</span>");
if (installIdx > -1) {
  // Find the closing div
  let depth = 0, end = -1;
  for (let i = installIdx; i < P.length - 4; i++) {
    if (P.slice(i,i+4) === '<div') depth++;
    if (P.slice(i,i+6) === '</div') { depth--; if (depth===0){end=i+6;break;} }
  }
  if (end > -1) { P = P.slice(0,installIdx) + P.slice(end); console.log('✓ Install removed'); }
} else { console.log('Not found — checking...'); }
// Also remove the wrapping div added by fix-integrate
P = P.replace(`        <div style={{ maxWidth: 560 }}>\n        <h1`, `        <h1`);
fs.writeFileSync('src/pages/UserProfile.jsx', P, 'utf8');
