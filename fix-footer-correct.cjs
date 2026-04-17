const fs = require('fs');
let L = fs.readFileSync('src/components/Layout.jsx', 'utf8');

// 1. Restore desktop footer padding
L = L.replace(
  `  root:{ borderTop:'1px solid #E4E5E5', background:'#F9FAFA', padding:'0' },`,
  `  root:{ borderTop:'1px solid #E4E5E5', background:'#F9FAFA', padding:'32px 0' },`
);

// 2. Move social icons from footer-right into footer-brand so mobile CSS can left-align them under logo
// Remove socialRow from footer-right
L = L.replace(
  `          <span style={f.copy} className="footer-copy">© 2025 AprIQ.</span>
          <div style={f.socialRow}>
            {[
              { label:'Facebook',  href:'https://www.facebook.com/profile.php?id=61574287355312',  icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="#979899"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg> },
              { label:'Instagram', href:'https://www.instagram.com/apriq.co.za/', icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#979899" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="#979899" stroke="none"/></svg> },
              { label:'LinkedIn',  href:'https://www.linkedin.com/company/apriq/?viewAsMember=true',  icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="#979899"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg> },
            ].map(({ label, href, icon }) => (
              <a key={label} href={href} aria-label={label} target="_blank" rel="noreferrer" style={f.socialIcon}>{icon}</a>
            ))}
          </div>`,
  `          <span style={f.copy} className="footer-copy">© 2025 AprIQ.</span>`
);

// Add social icons into footer-brand, below the logo tagline
L = L.replace(
  `          <p style={f.brandSub}>ROM cost estimates for South African construction projects.</p>
        </div>`,
  `          <p style={f.brandSub}>ROM cost estimates for South African construction projects.</p>
          <div style={f.socialRow} className="footer-social">
            {[
              { label:'Facebook',  href:'https://www.facebook.com/profile.php?id=61574287355312',  icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="#979899"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg> },
              { label:'Instagram', href:'https://www.instagram.com/apriq.co.za/', icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#979899" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="#979899" stroke="none"/></svg> },
              { label:'LinkedIn',  href:'https://www.linkedin.com/company/apriq/?viewAsMember=true',  icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="#979899"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg> },
            ].map(({ label, href, icon }) => (
              <a key={label} href={href} aria-label={label} target="_blank" rel="noreferrer" style={f.socialIcon}>{icon}</a>
            ))}
          </div>
        </div>`
);

fs.writeFileSync('src/components/Layout.jsx', L, 'utf8');
console.log('✓ Footer JSX fixed');

// 3. Clean all previous mobile footer CSS and write correct version
let G = fs.readFileSync('src/styles/globals.css', 'utf8');
while (G.includes('/* ── Mobile footer')) {
  const s = G.indexOf('/* ── Mobile footer');
  let depth = 0, end = s;
  for (let i = s; i < G.length; i++) {
    if (G[i]==='{') depth++;
    if (G[i]==='}') { depth--; if (depth<=0&&i>s+10){end=i+1;break;} }
  }
  G = G.slice(0,s) + G.slice(end);
}

G += `
/* ── Mobile footer phones ≤600px ── */
@media (max-width: 600px) {
  footer .wrap {
    flex-wrap: wrap !important;
    height: auto !important;
    padding: 24px 20px 20px !important;
    align-items: flex-start !important;
  }
  /* LEFT: logo + tagline hidden + social icons stacked */
  footer .footer-brand {
    flex: 0 0 auto !important;
    align-items: flex-start !important;
    gap: 12px !important;
  }
  footer .footer-brand p { display: none !important; }

  /* RIGHT: centre content (email/SA/terms) right-aligned */
  footer .footer-centre {
    flex: 0 0 auto !important;
    margin-left: auto !important;
    align-items: flex-end !important;
    text-align: right !important;
  }
  footer .footer-centre > div {
    flex-direction: column !important;
    align-items: flex-end !important;
    gap: 2px !important;
  }
  footer .footer-centre .footer-sep { display: none !important; }
  footer .footer-centre a { text-align: right !important; }

  /* RIGHT continued: FAQ + copyright below email/SA/terms */
  footer .footer-right {
    flex: 0 0 auto !important;
    flex-direction: column !important;
    align-items: flex-end !important;
    margin-left: auto !important;
    margin-top: 8px !important;
    gap: 6px !important;
  }
}
`;

fs.writeFileSync('src/styles/globals.css', G, 'utf8');
console.log('✓ Mobile footer CSS fixed — targeting correct .wrap class');
