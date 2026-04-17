const fs = require('fs');
let G = fs.readFileSync('src/styles/globals.css', 'utf8');

// Remove the entire input block I added that's breaking everything
const startMark = '\n/* ── Input consistency — all devices, light + dark mode ── */';
const endMark = '}\n';
const startIdx = G.indexOf(startMark);
if (startIdx > -1) {
  // Find the last closing brace of the mobile section
  const endIdx = G.lastIndexOf('\n/* ── Footer mobile responsive ── */');
  const footerEnd = G.indexOf('\n}', G.lastIndexOf('.footer-centre'));
  G = G.slice(0, startIdx) + G.slice(footerEnd + 2);
  console.log('Removed input CSS block');
}

// Add ONLY what is needed:
// 1. font-size 16px on inputs to prevent iOS zoom (no color changes)
// 2. color-scheme: light on ALL inputs to prevent dark mode system override
G += `
/* ── Prevent iOS input zoom (font-size 16px minimum) ── */
input, select, textarea {
  font-size: 16px;
  touch-action: manipulation;
}

/* ── Force all inputs to always use light color scheme ── */
/* This prevents iOS/Android/Chrome dark mode from making inputs black */
input, select, textarea, input[type="date"], input[type="number"], input[type="text"], input[type="email"], input[type="password"] {
  color-scheme: light !important;
}

/* ── Footer mobile responsive ── */
@media (max-width: 700px) {
  .footer-inner {
    flex-direction: column !important;
    align-items: center !important;
    gap: 20px !important;
    text-align: center !important;
    padding: 20px 24px !important;
  }
  .footer-brand { align-items: center !important; text-align: center !important; }
  .footer-right { align-items: center !important; }
  .footer-centre { text-align: center !important; }
}
`;

fs.writeFileSync('src/styles/globals.css', G, 'utf8');
console.log('✓ globals.css fixed — only font-size + color-scheme, no color overrides');
