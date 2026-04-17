const fs = require('fs');
let G = fs.readFileSync('src/styles/globals.css', 'utf8');

// Remove all previous mobile footer blocks
while (G.includes('\n/* ── Mobile footer')) {
  const s = G.indexOf('\n/* ── Mobile footer');
  const e = G.indexOf('\n/* ──', s + 5);
  G = G.slice(0, s) + (e > -1 ? G.slice(e) : '');
}

G += `
/* ── Mobile footer — phones only (max-width:600px) ── */
@media (max-width: 600px) {
  .footer-inner {
    display: grid !important;
    grid-template-columns: auto 1fr !important;
    grid-template-rows: auto !important;
    align-items: start !important;
    justify-content: space-between !important;
    padding: 24px 20px !important;
    height: auto !important;
    gap: 0 !important;
  }
  /* LEFT col — logo only */
  .footer-brand {
    grid-column: 1 !important;
    grid-row: 1 !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: flex-start !important;
    gap: 14px !important;
  }
  .footer-brand p { display: none !important; }

  /* Social icons below logo, left-aligned */
  /* socialRow is inside footer-right — move it visually via order */
  .footer-right {
    grid-column: 1 !important;
    grid-row: 2 !important;
    display: flex !important;
    flex-direction: row !important;
    align-items: center !important;
    justify-content: flex-start !important;
    gap: 8px !important;
    padding-top: 12px !important;
  }
  /* Hide FAQ pill and copyright from footer-right on mobile — they go right col */
  .footer-right > a:first-child,
  .footer-right > span { display: none !important; }

  /* RIGHT col — FAQ, copyright, email, SA, Terms stacked right-aligned */
  .footer-centre {
    grid-column: 2 !important;
    grid-row: 1 / span 2 !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: flex-end !important;
    gap: 6px !important;
    text-align: right !important;
  }
  .footer-centre > div {
    flex-direction: column !important;
    align-items: flex-end !important;
    gap: 4px !important;
  }
  .footer-sep { display: none !important; }
}
`;

fs.writeFileSync('src/styles/globals.css', G, 'utf8');
console.log('done');
