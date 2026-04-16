const fs = require('fs');

// ── HOW IT WORKS PAGE — insert real MP4 videos ────────────────────────────────
let H = fs.readFileSync('src/pages/HowItWorksPage.jsx', 'utf8');

const VIDEO_MAP = {
  profile:      'user_profile.mp4',
  project:      'add_project_information.mp4',
  client:       'add_client.mp4',
  configurator: 'add_project.mp4',
  export:       'export_pdf.mp4',
};

// Replace placeholder divs with real video elements
H = H.replace(
  `  placeholder:{ background:'#F9FAFA', borderTop:'1px solid #E4E5E5', padding:40, display:'flex', alignItems:'center', justifyContent:'center', minHeight:200 },
  placeholderInner:{ display:'flex', flexDirection:'column', alignItems:'center', gap:12, opacity:0.6 },
  placeholderIcon:{ width:56, height:56, borderRadius:16, border:'1px solid #E4E5E5', display:'flex', alignItems:'center', justifyContent:'center', background:'#F9FAFA' },
  placeholderLabel:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:12, color:'#979899', textAlign:'center' },`,
  `  placeholder:{ background:'#F9FAFA', borderTop:'1px solid #E4E5E5', overflow:'hidden' },
  placeholderInner:{ display:'flex', flexDirection:'column', alignItems:'center', gap:12, opacity:0.6 },
  placeholderIcon:{ width:56, height:56, borderRadius:16, border:'1px solid #E4E5E5', display:'flex', alignItems:'center', justifyContent:'center', background:'#F9FAFA' },
  placeholderLabel:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:12, color:'#979899', textAlign:'center' },`
);

// Replace the placeholder rendering with a video element
H = H.replace(
  `              <div style={s.placeholder}>
                <div style={s.placeholderInner}>
                  <div style={s.placeholderIcon}>{ICONS[item.id]}</div>
                  <p style={s.placeholderLabel}>Screenshot / GIF — {item.heading}</p>
                </div>
              </div>`,
  `              <div style={s.placeholder}>
                <video
                  src={\`/\${{'profile':'user_profile.mp4','project':'add_project_information.mp4','client':'add_client.mp4','configurator':'add_project.mp4','export':'export_pdf.mp4'}[item.id]}\`}
                  autoPlay
                  loop
                  muted
                  playsInline
                  style={{ width:'100%', display:'block', borderRadius:0 }}
                />
              </div>`
);

fs.writeFileSync('src/pages/HowItWorksPage.jsx', H, 'utf8');
console.log('✓ HowItWorksPage — videos inserted');

// ── GLOBAL CSS — checkbox styling + pill spacing ──────────────────────────────
let G = fs.readFileSync('src/styles/globals.css', 'utf8');

// Add checkbox orange styling at end
if (!G.includes('input[type="checkbox"]')) {
  G += `
/* ── Checkbox styling — orange tick, transparent bg ── */
input[type="checkbox"] {
  appearance: none;
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border: 1.5px solid #979899;
  border-radius: 4px;
  background: var(--paper);
  cursor: pointer;
  position: relative;
  flex-shrink: 0;
  transition: border-color 150ms ease;
}
input[type="checkbox"]:checked {
  border-color: #FF8210;
  background: var(--paper);
}
input[type="checkbox"]:checked::after {
  content: '';
  position: absolute;
  left: 3px;
  top: 0px;
  width: 7px;
  height: 11px;
  border: 2px solid #FF8210;
  border-top: none;
  border-left: none;
  transform: rotate(45deg);
}
`;
}

fs.writeFileSync('src/styles/globals.css', G, 'utf8');
console.log('✓ globals.css — checkbox styling added');

console.log('Script 3 done.');
