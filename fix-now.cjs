const fs = require('fs');

// ── HowItWorks: icons next to headings, smaller blank space ──────────────────
let how = fs.readFileSync('src/pages/HowItWorksPage.jsx', 'utf8');

const iconMap = {
  'Add user profile information': `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF8210" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.58-7 8-7s8 3 8 7"/></svg>`,
  'Add project information': `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF8210" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>`,
  'Add client information': `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF8210" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  'Project data input': `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF8210" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>`,
  'Export and share estimate': `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF8210" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="12" y1="18" x2="12" y2="12"/><polyline points="9,15 12,18 15,15"/></svg>`,
};

Object.entries(iconMap).forEach(([heading, icon]) => {
  how = how.replace(
    `<h3 style={s.h3}>${heading}</h3>`,
    `<h3 style={{...s.h3, display:'flex', alignItems:'center', gap:8}}>${icon}${heading}</h3>`
  );
});

// Reduce blank space — tighten journeyMeta padding and remove empty placeholder div
how = how.replace(
  `  journeyMeta:{ padding:'20px 32px 16px' },`,
  `  journeyMeta:{ padding:'20px 32px 20px' },`
);

// Remove any remaining empty placeholder divs
how = how.replace(
  /\s*<div style=\{s\.placeholder\}>\s*<\/div>/g, ''
);

fs.writeFileSync('src/pages/HowItWorksPage.jsx', how, 'utf8');
console.log('✓ HowItWorks icons done');

console.log('Done.');
