const fs = require('fs');
let L = fs.readFileSync('src/components/Layout.jsx', 'utf8');

// Replace the entire footer JSX with a version that has proper mobile structure
// The current footer has height:80 on f.inner which blocks mobile layout
// Fix: remove the fixed height from inner style, add flex-wrap
L = L.replace(
  `  inner:{ display:'flex', alignItems:'center', justifyContent:'space-between', height:80, maxWidth:960, margin:'0 auto', padding:'0 24px' },`,
  `  inner:{ display:'flex', alignItems:'center', justifyContent:'space-between', maxWidth:960, margin:'0 auto', padding:'24px', flexWrap:'wrap', gap:20 },`
);

// Remove fixed height from root footer too so it can grow
L = L.replace(
  `  root:{ borderTop:'1px solid #E4E5E5', background:'#F9FAFA', padding:'32px 0' },`,
  `  root:{ borderTop:'1px solid #E4E5E5', background:'#F9FAFA', padding:'0' },`
);

// Fix the header inner too — was using footer inner style  
// Actually the header has its own h.inner — don't touch that

fs.writeFileSync('src/components/Layout.jsx', L, 'utf8');
console.log('Step 1 done - inner height removed');

// Now add the mobile CSS properly targeting the wrap class (not footer-inner which doesn't exist)
let G = fs.readFileSync('src/styles/globals.css', 'utf8');

// Remove ALL previous mobile footer attempts
while (G.includes('/* ── Mobile footer')) {
  const s = G.indexOf('/* ── Mobile footer');
  // Find the closing } of the @media block
  let depth = 0, end = s;
  for (let i = s; i < G.length; i++) {
    if (G[i] === '{') depth++;
    if (G[i] === '}') { depth--; if (depth === 0) { end = i + 1; break; } }
  }
  G = G.slice(0, s) + G.slice(end);
}

G += `
/* ── Mobile footer phones ≤600px ── */
@media (max-width: 600px) {
  footer .footer-brand { order: 1; flex: 0 0 auto; }
  footer .footer-centre { order: 3; flex: 0 0 100%; display: flex; flex-direction: column; align-items: flex-end; }
  footer .footer-right { order: 2; flex: 0 0 auto; margin-left: auto; }
  footer .footer-brand p { display: none; }
  /* Move social row below logo */
  footer .footer-right > .footer-social-wrap { order: 10; }
}
`;

fs.writeFileSync('src/styles/globals.css', G, 'utf8');
console.log('Step 2 done - mobile CSS added');
