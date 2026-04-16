const fs = require('fs');
let layout = fs.readFileSync('src/components/Layout.jsx', 'utf8');

// Header component receives onOpenModal prop, not openModal
layout = layout.replace(
  `? <button key={link.to} onClick={() => { openModal(link.modal); }} style={{ ...h.navLink, color: T.grey, background:'none', border:'none', cursor:'pointer', fontWeight:400, padding:0 }}>{link.label}</button>`,
  `? <button key={link.to} onClick={() => { onOpenModal(link.modal); }} style={{ ...h.navLink, color: T.grey, background:'none', border:'none', cursor:'pointer', fontWeight:400, padding:0 }}>{link.label}</button>`
);

// Same fix for mobile menu
layout = layout.replace(
  `? <button key={link.to} onClick={() => { setMenuOpen(false); openModal(link.modal); }} style={{ ...h.mobileLink, color: T.ink, background:'none', border:'none', cursor:'pointer', textAlign:'left', width:'100%', borderBottom:'1px solid #E4E5E5', padding:'11px 0' }}>{link.label}</button>`,
  `? <button key={link.to} onClick={() => { setMenuOpen(false); onOpenModal(link.modal); }} style={{ ...h.mobileLink, color: T.ink, background:'none', border:'none', cursor:'pointer', textAlign:'left', width:'100%', borderBottom:'1px solid #E4E5E5', padding:'11px 0' }}>{link.label}</button>`
);

fs.writeFileSync('src/components/Layout.jsx', layout, 'utf8');
console.log('done');
