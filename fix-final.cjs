const fs = require('fs');

// ── 1. FEATURES PAGE: Remove Core Features bubble (bottom section) ────────────
let feat = fs.readFileSync('src/pages/FeaturesPage.jsx', 'utf8');
// Remove everything after the Free and Pro section to end, then close properly
const freeProEnd = feat.lastIndexOf('</section>');
if (freeProEnd > -1) {
  feat = feat.substring(0, freeProEnd + '</section>'.length) + '\n    </div>\n  );\n}';
}
// Remove any r2/r3 useFadeIn refs that are now unused
feat = feat.replace(', r2=useFadeIn(), r3=useFadeIn()', '');
feat = feat.replace(', r3=useFadeIn()', '');
fs.writeFileSync('src/pages/FeaturesPage.jsx', feat, 'utf8');
console.log('✓ Features — bottom Core Features section removed');

// ── 2. PROFILE: Remove install block ─────────────────────────────────────────
let prof = fs.readFileSync('src/pages/UserProfile.jsx', 'utf8');
const instIdx = prof.indexOf('Install app');
if (instIdx > -1) {
  const cardStart = prof.lastIndexOf('<div style={card}', instIdx);
  let depth = 0, end = -1;
  for (let i = cardStart; i < prof.length - 4; i++) {
    if (prof.slice(i,i+4) === '<div') depth++;
    if (prof.slice(i,i+6) === '</div') { depth--; if (depth===0){end=i+6;break;} }
  }
  if (end > -1) prof = prof.slice(0,cardStart) + prof.slice(end);
  console.log('✓ Profile — install removed');
} else console.log('✓ Profile — already clean');
fs.writeFileSync('src/pages/UserProfile.jsx', prof, 'utf8');

// ── 3. DROPDOWN: Swap Profile and My Plan order ───────────────────────────────
let L = fs.readFileSync('src/components/Layout.jsx', 'utf8');

// Desktop dropdown — swap order
L = L.replace(
  `<Link to="/plans" style={h.dropItem} onClick={() => setProfileOpen(false)}>My Plan</Link>
                  <Link to="/profile" style={h.dropItem} onClick={() => setProfileOpen(false)}>Profile</Link>`,
  `<Link to="/profile" style={h.dropItem} onClick={() => setProfileOpen(false)}>Profile</Link>
                  <Link to="/plans" style={h.dropItem} onClick={() => setProfileOpen(false)}>My Plan</Link>`
);
// Mobile dropdown — swap order (there may be a second instance)
L = L.replace(
  `<Link to="/plans" style={h.dropItem} onClick={() => setProfileOpen(false)}>My Plan</Link>
                  <Link to="/profile" style={h.dropItem} onClick={() => setProfileOpen(false)}>Profile</Link>`,
  `<Link to="/profile" style={h.dropItem} onClick={() => setProfileOpen(false)}>Profile</Link>
                  <Link to="/plans" style={h.dropItem} onClick={() => setProfileOpen(false)}>My Plan</Link>`
);
fs.writeFileSync('src/components/Layout.jsx', L, 'utf8');
console.log('✓ Dropdown — Profile above My Plan');

// ── 4. HOME: QS → Quantity Surveyor ──────────────────────────────────────────
let landing = fs.readFileSync('src/pages/LandingPage.jsx', 'utf8');
landing = landing.replace("'QS'", "'Quantity Surveyor'");
landing = landing.replace('"QS"', '"Quantity Surveyor"');
fs.writeFileSync('src/pages/LandingPage.jsx', landing, 'utf8');
console.log('✓ Landing — QS → Quantity Surveyor');

// ── 5. HOW IT WORKS: Smaller space, icon next to heading ─────────────────────
let how = fs.readFileSync('src/pages/HowItWorksPage.jsx', 'utf8');

// Make the placeholder area smaller with just a subtle icon
const ICONS = {
  profile: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF8210" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.58-7 8-7s8 3 8 7"/></svg>`,
  project: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF8210" strokeWidth="1.5" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>`,
  client: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF8210" strokeWidth="1.5" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  configurator: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF8210" strokeWidth="1.5" strokeLinecap="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>`,
  export: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF8210" strokeWidth="1.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="12" y1="18" x2="12" y2="12"/><polyline points="9,15 12,18 15,15"/></svg>`,
};

// Replace heading to include inline icon
Object.entries(ICONS).forEach(([id, icon]) => {
  // Find the h3 for this item and prepend icon
  const journeyItems = {
    profile: 'Add user profile information',
    project: 'Add project information',
    client: 'Add client information',
    configurator: 'Project data input',
    export: 'Export and share estimate',
  };
  const heading = journeyItems[id];
  if (heading) {
    how = how.replace(
      `<h3 style={s.h3}>${heading}</h3>`,
      `<h3 style={{...s.h3, display:'flex', alignItems:'center', gap:8}}>${icon}${heading}</h3>`
    );
  }
});

// Make placeholder smaller — just a thin strip
how = how.replace(
  `  placeholder:{ background:'#F9FAFA', overflow:'hidden', borderRadius:'0 0 16px 16px' },`,
  `  placeholder:{ background:'#F9FAFA', overflow:'hidden', borderRadius:'0 0 16px 16px', padding:'12px 32px', borderTop:'1px solid #E4E5E5' },`
);

// Remove the video element — replace with nothing (just the thin bar)
how = how.replace(
  `              <div style={s.placeholder}>
                <video
                  src={\`/\${{'profile':'user_profile.mp4','project':'add_project_information.mp4','client':'add_client.mp4','configurator':'add_project.mp4','export':'export_pdf.mp4'}[item.id]}\`}
                  autoPlay
                  loop
                  muted
                  playsInline
                  style={{ width:'100%', display:'block', borderRadius:0 }}
                />
              </div>`,
  ``
);

// Update journeyMeta padding
how = how.replace(
  `  journeyMeta:{ padding:'24px 32px 24px' },`,
  `  journeyMeta:{ padding:'20px 32px 16px' },`
);

fs.writeFileSync('src/pages/HowItWorksPage.jsx', how, 'utf8');
console.log('✓ HowItWorks — icons added, blank space reduced');

console.log('\nAll done.');
