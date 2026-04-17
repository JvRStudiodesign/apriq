const fs = require('fs');
let G = fs.readFileSync('src/styles/globals.css', 'utf8');

const mobileFooter = `
/* ── Mobile footer layout (phone only ≤600px) ── */
@media (max-width: 600px) {
  .footer-inner {
    display: grid !important;
    grid-template-columns: 1fr 1fr !important;
    grid-template-rows: auto !important;
    align-items: start !important;
    gap: 0 !important;
    padding: 24px 20px !important;
  }
  /* Left column: logo + social icons stacked */
  .footer-brand {
    grid-column: 1 !important;
    grid-row: 1 !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: flex-start !important;
    gap: 16px !important;
  }
  /* Hide tagline on mobile */
  .footer-brand p {
    display: none !important;
  }
  /* Right column: FAQ, copyright, email, terms, social — stacked right-aligned */
  .footer-right {
    grid-column: 2 !important;
    grid-row: 1 !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: flex-end !important;
    gap: 8px !important;
  }
  /* Move centre content (email/terms) into right column flow */
  .footer-centre {
    grid-column: 2 !important;
    grid-row: 2 !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: flex-end !important;
    gap: 4px !important;
    padding-top: 8px !important;
    text-align: right !important;
  }
  .footer-centre span, .footer-centre a {
    text-align: right !important;
  }
  /* Social icons move to left column row 2 */
  .footer-social {
    grid-column: 1 !important;
    grid-row: 2 !important;
    display: flex !important;
    gap: 8px !important;
    padding-top: 8px !important;
  }
  /* Copyright stays right */
  .footer-copy {
    text-align: right !important;
  }
}
`;

// Remove any previous mobile footer CSS
const prevStart = G.indexOf('\n/* ── Mobile footer layout');
if (prevStart > -1) {
  const prevEnd = G.indexOf('\n/* ──', prevStart + 5);
  G = G.slice(0, prevStart) + (prevEnd > -1 ? G.slice(prevEnd) : '');
}

G += mobileFooter;
fs.writeFileSync('src/styles/globals.css', G, 'utf8');
console.log('✓ Mobile footer CSS written');

// Add classNames to footer elements in Layout.jsx
let L = fs.readFileSync('src/components/Layout.jsx', 'utf8');

// Footer inner wrapper — add className
L = L.replace(
  `<div style={f.inner}>`,
  `<div style={f.inner} className="footer-inner">`
);
// Brand div
L = L.replace(
  `        <div style={f.brand}>`,
  `        <div style={f.brand} className="footer-brand">`
);
// Centre div
L = L.replace(
  `        <div style={f.centre}>`,
  `        <div style={f.centre} className="footer-centre">`
);
// Right div
L = L.replace(
  `        <div style={f.right}>`,
  `        <div style={f.right} className="footer-right">`
);
// Social icons row
L = L.replace(
  `          <div style={f.socials}>`,
  `          <div style={f.socials} className="footer-social">`
);
// Copyright span
L = L.replace(
  `          <span style={f.copy}>`,
  `          <span style={f.copy} className="footer-copy">`
);

fs.writeFileSync('src/components/Layout.jsx', L, 'utf8');
console.log('✓ Layout footer classNames added');
