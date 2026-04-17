const fs = require('fs');
let L = fs.readFileSync('src/components/Layout.jsx', 'utf8');

// 1. Remove social from footer-brand (I put them there wrongly)
L = L.replace(
  `          <div style={f.socialRow} className="footer-social">
            {[
              { label:'Facebook',  href:'https://www.facebook.com/profile.php?id=61574287355312',  icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="#979899"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg> },
              { label:'Instagram', href:'https://www.instagram.com/apriq.co.za/', icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#979899" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="#979899" stroke="none"/></svg> },
              { label:'LinkedIn',  href:'https://www.linkedin.com/company/apriq/?viewAsMember=true',  icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="#979899"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg> },
            ].map(({ label, href, icon }) => (
              <a key={label} href={href} aria-label={label} target="_blank" rel="noreferrer" style={f.socialIcon}>{icon}</a>
            ))}
          </div>
        </div>`,
  `        </div>`
);

// 2. Restore social into footer-right where it belongs (after copyright)
L = L.replace(
  `          <span style={f.copy} className="footer-copy">© 2025 AprIQ.</span>`,
  `          <span style={f.copy} className="footer-copy">© 2025 AprIQ.</span>
          <div style={f.socialRow} className="footer-social">
            {[
              { label:'Facebook',  href:'https://www.facebook.com/profile.php?id=61574287355312',  icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="#979899"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg> },
              { label:'Instagram', href:'https://www.instagram.com/apriq.co.za/', icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#979899" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="#979899" stroke="none"/></svg> },
              { label:'LinkedIn',  href:'https://www.linkedin.com/company/apriq/?viewAsMember=true',  icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="#979899"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg> },
            ].map(({ label, href, icon }) => (
              <a key={label} href={href} aria-label={label} target="_blank" rel="noreferrer" style={f.socialIcon}>{icon}</a>
            ))}
          </div>`
);

fs.writeFileSync('src/components/Layout.jsx', L, 'utf8');
console.log('✓ Social icons restored to footer-right');

// 3. Mobile CSS — keep JSX unchanged, use flex order to reorder visually
let G = fs.readFileSync('src/styles/globals.css', 'utf8');
while (G.includes('/* ── Mobile footer')) {
  const s = G.indexOf('/* ── Mobile footer');
  let d=0, e=s;
  for(let i=s;i<G.length;i++){if(G[i]==='{')d++;if(G[i]==='}'){d--;if(d<=0&&i>s+10){e=i+1;break;}}}
  G=G.slice(0,s)+G.slice(e);
}

G += `
/* ── Mobile footer phones ≤600px ── */
@media (max-width: 600px) {
  footer .wrap {
    flex-wrap: wrap !important;
    height: auto !important;
    padding: 24px 20px !important;
    align-items: flex-start !important;
  }
  /* LEFT col: logo (order 1) */
  footer .footer-brand { order: 1; flex: 0 0 auto !important; }
  footer .footer-brand p { display: none !important; }

  /* RIGHT col: all text info right-aligned (order 2) */
  footer .footer-centre {
    order: 2;
    flex: 0 0 auto !important;
    margin-left: auto !important;
    align-items: flex-end !important;
    text-align: right !important;
  }
  footer .footer-centre > div { flex-direction: column !important; align-items: flex-end !important; }
  footer .footer-sep { display: none !important; }

  /* RIGHT col continued: FAQ + copyright (order 3) */
  footer .footer-right {
    order: 3;
    flex: 0 0 auto !important;
    flex-direction: column !important;
    align-items: flex-end !important;
    margin-left: auto !important;
    margin-top: 4px !important;
    gap: 6px !important;
  }
  /* Social icons: move to LEFT under logo (order 4, reset margin) */
  footer .footer-social {
    order: 4;
    flex: 0 0 100% !important;
    justify-content: flex-start !important;
    margin-top: 12px !important;
  }
}
`;

fs.writeFileSync('src/styles/globals.css', G, 'utf8');
console.log('✓ Mobile CSS: logo left, social bottom-left, all info right');
