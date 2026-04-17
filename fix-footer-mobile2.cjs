const fs = require('fs');
let G = fs.readFileSync('src/styles/globals.css', 'utf8');

// Remove previous mobile footer block
const prev = G.indexOf('\n/* ── Mobile footer layout');
if (prev > -1) {
  const next = G.indexOf('\n/* ──', prev + 5);
  G = G.slice(0, prev) + (next > -1 ? G.slice(next) : '');
}

G += `
/* ── Mobile footer — phones only (≤600px) ── */
@media (max-width: 600px) {
  .footer-inner {
    display: flex !important;
    flex-direction: row !important;
    align-items: flex-start !important;
    justify-content: space-between !important;
    padding: 24px 20px 20px !important;
    gap: 0 !important;
  }
  /* LEFT: logo then social icons below */
  .footer-brand {
    display: flex !important;
    flex-direction: column !important;
    align-items: flex-start !important;
    gap: 16px !important;
    flex: 0 0 auto !important;
  }
  .footer-brand p { display: none !important; }
  .footer-social {
    display: flex !important;
    flex-direction: row !important;
    gap: 8px !important;
    margin-top: 0 !important;
  }
  /* RIGHT: FAQ, copyright, email, SA, terms — all right-aligned */
  .footer-right {
    display: flex !important;
    flex-direction: column !important;
    align-items: flex-end !important;
    gap: 6px !important;
    flex: 0 0 auto !important;
  }
  .footer-centre {
    display: flex !important;
    flex-direction: column !important;
    align-items: flex-end !important;
    gap: 4px !important;
    margin-top: 6px !important;
  }
  .footer-centre > div {
    display: flex !important;
    flex-direction: column !important;
    align-items: flex-end !important;
    gap: 3px !important;
  }
  .footer-centre span, .footer-centre a {
    text-align: right !important;
  }
  .footer-sep { display: none !important; }
  .footer-copy { text-align: right !important; }
}
`;

fs.writeFileSync('src/styles/globals.css', G, 'utf8');
console.log('✓ Mobile footer CSS updated');

// Add className to social div if not already there
let L = fs.readFileSync('src/components/Layout.jsx', 'utf8');
if (!L.includes('className="footer-social"')) {
  L = L.replace(
    `          <div style={f.socials}>`,
    `          <div style={f.socials} className="footer-social">`
  );
  console.log('✓ footer-social className added');
}
// Add separator class to hide on mobile
L = L.replace(
  `<span style={f.sep}>|</span>`,
  `<span style={f.sep} className="footer-sep">|</span>`
);
fs.writeFileSync('src/components/Layout.jsx', L, 'utf8');
console.log('✓ Layout updated');
