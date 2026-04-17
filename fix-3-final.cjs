const fs = require('fs');

// ══════════════════════════════════════════════════════════════
// 1. INSTALL PWA MODAL — full device tabs, built inline
// ══════════════════════════════════════════════════════════════
const installPWA = `
function InstallPWA() {
  const [open, setOpen] = React.useState(false);
  const [device, setDevice] = React.useState('iPhone / iPad');
  const devices = ['iPhone / iPad','Android','Windows','Mac'];
  const steps = {
    'iPhone / iPad': {
      emoji: '📱', subtitle: 'iPhone / iPad — Safari',
      steps: ['Open AprIQ in Safari','Tap the Share icon at the bottom of the screen','Scroll down and tap Add to Home Screen','Tap Add in the top-right corner'],
      note: 'Safari on iPhone/iPad is required. Chrome and other browsers do not support PWA installation on iOS.'
    },
    'Android': {
      emoji: '🤖', subtitle: 'Android — Chrome',
      steps: ['Open AprIQ in Google Chrome','Tap the three-dot menu in the top-right corner','Tap Add to Home Screen or Install App','Tap Install or Add to confirm'],
      note: 'Works best in Chrome. Samsung Internet also supports this feature.'
    },
    'Windows': {
      emoji: '💻', subtitle: 'Windows — Chrome or Edge',
      steps: ['Open AprIQ in Google Chrome or Microsoft Edge','Click the install icon (⊕) in the address bar','Click Install AprIQ','AprIQ opens as a standalone app on your desktop'],
      note: 'If you do not see the install icon, open the browser menu and look for Install AprIQ.'
    },
    'Mac': {
      emoji: '🖥', subtitle: 'Mac — Chrome or Edge',
      steps: ['Open AprIQ in Google Chrome or Microsoft Edge','Click the install icon (⊕) in the address bar','Click Install AprIQ','AprIQ opens as a standalone app and is added to your Applications folder'],
      note: 'Safari on Mac does not support PWA installation. Use Chrome or Edge.'
    },
  };
  const d = steps[device];
  const overlay = { position:'fixed', inset:0, background:'rgba(17,17,17,0.45)', backdropFilter:'blur(6px)', zIndex:600, display:'flex', alignItems:'center', justifyContent:'center', padding:20 };
  const panel = { background:'#fff', borderRadius:20, padding:'32px 28px 24px', width:'100%', maxWidth:420, position:'relative', maxHeight:'90vh', overflowY:'auto' };
  return (
    <>
      <div style={{ background:'#F9FAFA', border:'1px solid #E4E5E5', borderRadius:16, padding:'1.25rem 1.5rem', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <p style={{ fontSize:'0.85rem', fontWeight:600, color:'#111111', marginBottom:2, fontFamily:"'Roboto',system-ui,sans-serif" }}>Install app</p>
          <p style={{ fontSize:'0.75rem', color:'#979899', fontFamily:"'Roboto',system-ui,sans-serif" }}>Add AprIQ to your home screen for instant access and limited offline use.</p>
        </div>
        <button onClick={() => setOpen(true)} style={{ padding:'8px 18px', background:'#111111', color:'#F9FAFA', border:'none', borderRadius:10, fontSize:'0.78rem', fontWeight:500, cursor:'pointer', fontFamily:"'Roboto',system-ui,sans-serif", whiteSpace:'nowrap', marginLeft:16 }}>How to install AprIQ</button>
      </div>
      {open && (
        <div style={overlay} onClick={e => e.target===e.currentTarget && setOpen(false)}>
          <div style={panel}>
            <button onClick={() => setOpen(false)} style={{ position:'absolute', top:16, right:16, background:'none', border:'none', cursor:'pointer', fontSize:18, color:'#999', lineHeight:1 }}>✕</button>
            <div style={{ marginBottom:16 }}>
              <img src="/logo-transparent.png" alt="AprIQ" style={{ height:32, mixBlendMode:'multiply', marginBottom:12 }} />
              <h2 style={{ fontSize:18, fontWeight:700, color:'#111111', fontFamily:"'Aptos','Segoe UI',system-ui,sans-serif", marginBottom:4 }}>Installation Guide</h2>
              <p style={{ fontSize:13, color:'#979899', fontFamily:"'Roboto',system-ui,sans-serif" }}>Select your device to get started</p>
            </div>
            <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
              {devices.map(dv => (
                <button key={dv} onClick={() => setDevice(dv)} style={{ padding:'6px 14px', borderRadius:20, border:'1px solid #E4E5E5', background: dv===device ? '#111111' : '#F9FAFA', color: dv===device ? '#F9FAFA' : '#111111', fontSize:12, fontFamily:"'Roboto',system-ui,sans-serif", cursor:'pointer', fontWeight: dv===device ? 600 : 400 }}>{dv}</button>
              ))}
            </div>
            <div style={{ borderTop:'1px solid #E4E5E5', paddingTop:20 }}>
              <p style={{ fontSize:13, fontWeight:700, color:'#111111', fontFamily:"'Roboto',system-ui,sans-serif", marginBottom:16 }}>{d.emoji} {d.subtitle}</p>
              {d.steps.map((step, i) => (
                <div key={i} style={{ display:'flex', gap:12, marginBottom:14, alignItems:'flex-start' }}>
                  <div style={{ width:24, height:24, borderRadius:'50%', background:'#111111', color:'#fff', fontSize:12, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontFamily:"'Roboto',system-ui,sans-serif" }}>{i+1}</div>
                  <p style={{ fontSize:13, color:'#111111', fontFamily:"'Roboto',system-ui,sans-serif", lineHeight:1.5, paddingTop:3 }}>{step}</p>
                </div>
              ))}
              <div style={{ background:'#EEF4F5', borderRadius:10, padding:'10px 14px', marginTop:8 }}>
                <p style={{ fontSize:12, color:'#0F4C5C', fontFamily:"'Roboto',system-ui,sans-serif", lineHeight:1.5 }}>{d.note}</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ width:'100%', marginTop:20, padding:'11px', border:'1px solid #E4E5E5', borderRadius:12, background:'#F9FAFA', color:'#979899', fontSize:13, fontFamily:"'Roboto',system-ui,sans-serif", cursor:'pointer' }}>Close</button>
          </div>
        </div>
      )}
    </>
  );
}
`;

// Inject into Calculator
let C = fs.readFileSync('src/pages/Calculator.jsx', 'utf8');
if (!C.includes('function InstallPWA')) {
  const at = C.indexOf('\nconst DEFAULT');
  C = C.slice(0, at) + '\n' + installPWA + C.slice(at);
}
// Replace simple install block with InstallPWA component
C = C.replace(
  /\s*\{\/\* How to install AprIQ \*\/\}\s*<div style=\{\{ maxWidth:'1140px'[^}]+\}\}>\s*<div[^>]+>[\s\S]*?<\/div>\s*<\/div>/,
  `\n      {/* How to install AprIQ */}\n      <div style={{ maxWidth:'1140px', margin:'0 auto', padding:'0 1.25rem 2.5rem' }}>\n        <InstallPWA />\n      </div>`
);
fs.writeFileSync('src/pages/Calculator.jsx', C, 'utf8');
console.log('✓ InstallPWA full modal in Calculator');

// ══════════════════════════════════════════════════════════════
// 2. PROJECTS — remove sticky mini-header, right-align button
// ══════════════════════════════════════════════════════════════
let P = fs.readFileSync('src/pages/Projects.jsx', 'utf8');
// Remove the old sticky mini-header entirely
P = P.replace(
  `      <div style={{ background:'#F9FAFA', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'2px' }}>
          {/* Header handled by Layout */}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <span style={{ fontSize:'0.72rem', color:'#979899' }}>{projects.length}/{limit}</span>
          <button onClick={startNew} style={{ padding:'6px 14px', background:'#111111', color:'#F9FAFA', border:'none', borderRadius:'10px', fontSize:'0.78rem', fontWeight:'600', cursor:'pointer', fontFamily:'inherit' }}>+ New project</button>
        </div>
      </div>`,
  ``
);
// Update page wrapper to match header grid (960px, 24px padding) and add right-aligned button row
P = P.replace(
  `      <div style={{ maxWidth:'680px', margin:'0 auto', padding:'2rem 1.25rem' }}>
        <h1 style={{ fontSize:'1.375rem', fontWeight:'700', color:'#111111', marginBottom:'0.25rem', letterSpacing:'-0.01em', fontFamily:"'Roboto', system-ui, sans-serif" }}>Projects</h1>
        <p style={{ fontSize:'0.78rem', color:'#979899', marginBottom:'1.5rem' }}>Each project holds its saved estimate. Edit or re-export anytime.</p>`,
  `      <div style={{ maxWidth:'960px', margin:'0 auto', padding:'1.5rem 24px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.25rem' }}>
          <h1 style={{ fontSize:'1.375rem', fontWeight:'700', color:'#111111', letterSpacing:'-0.01em', fontFamily:"'Roboto', system-ui, sans-serif" }}>Projects</h1>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:'0.72rem', color:'#979899' }}>{projects.length}/{limit}</span>
            <button onClick={startNew} style={{ padding:'6px 14px', background:'#111111', color:'#F9FAFA', border:'none', borderRadius:'10px', fontSize:'0.78rem', fontWeight:'600', cursor:'pointer', fontFamily:'inherit' }}>+ New project</button>
          </div>
        </div>
        <p style={{ fontSize:'0.78rem', color:'#979899', marginBottom:'1.5rem' }}>Each project holds its saved estimate. Edit or re-export anytime.</p>`
);
fs.writeFileSync('src/pages/Projects.jsx', P, 'utf8');
console.log('✓ Projects layout fixed');

// ══════════════════════════════════════════════════════════════
// 3. CLIENTS — same treatment
// ══════════════════════════════════════════════════════════════
let Cl = fs.readFileSync('src/pages/Clients.jsx', 'utf8');
// Remove old sticky mini-header
Cl = Cl.replace(
  /\s*<div style=\{\{ background:'#F9FAFA', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, zIndex:100 \}\}>\s*<div[^>]+>\s*\{\/\* Header handled by Layout \*\/\}\s*<\/div>\s*<div[^>]+>\s*<span[^<]+<\/span>\s*<button[^>]+>\+ Add client<\/button>\s*<\/div>\s*<\/div>/s,
  ``
);
// Update wrapper
Cl = Cl.replace(
  `      <div style={{ maxWidth:'560px', margin:'0 auto', padding:'2rem 1.25rem' }}>
        <h1 style={{ fontSize:'1.375rem', fontWeight:'700', color:'#111111', marginBottom:'0.25rem', letterSpacing:'-0.01em', fontFamily:"'Roboto', system-ui, sans-serif" }}>Clients</h1>
        <p style={{ fontSize:'0.78rem', color:'#979899', marginBottom:'1.5rem' }}>Client details appear on PDF exports when linked to a project.</p>`,
  `      <div style={{ maxWidth:'960px', margin:'0 auto', padding:'1.5rem 24px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.25rem' }}>
          <h1 style={{ fontSize:'1.375rem', fontWeight:'700', color:'#111111', letterSpacing:'-0.01em', fontFamily:"'Roboto', system-ui, sans-serif" }}>Clients</h1>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:'0.72rem', color:'#979899' }}>{clients.length}/{limit}</span>
            <button onClick={startNew} style={{ padding:'6px 14px', background:'#111111', color:'#F9FAFA', border:'none', borderRadius:'10px', fontSize:'0.78rem', fontWeight:'600', cursor:'pointer', fontFamily:'inherit' }}>+ Add client</button>
          </div>
        </div>
        <p style={{ fontSize:'0.78rem', color:'#979899', marginBottom:'1.5rem' }}>Client details appear on PDF exports when linked to a project.</p>`
);
fs.writeFileSync('src/pages/Clients.jsx', Cl, 'utf8');
console.log('✓ Clients layout fixed');

// ══════════════════════════════════════════════════════════════
// 4. USER PROFILE — same: remove old mini-header, right-align
// ══════════════════════════════════════════════════════════════
let UP = fs.readFileSync('src/pages/UserProfile.jsx', 'utf8');
UP = UP.replace(
  `        <h1 style={{ fontSize: '1.375rem', fontWeight: '700', color: '#111111', marginBottom: '0.25rem', letterSpacing: '-0.01em', fontFamily: "'Roboto', system-ui, sans-serif" }}>Profile</h1>
        <p style={{ fontSize: '0.78rem', color: '#979899', marginBottom: '1.5rem' }}>Your details auto-populate on every PDF export.</p>`,
  `<div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.25rem' }}>
          <h1 style={{ fontSize: '1.375rem', fontWeight: '700', color: '#111111', letterSpacing: '-0.01em', fontFamily: "'Roboto', system-ui, sans-serif" }}>Profile</h1>
        </div>
        <p style={{ fontSize: '0.78rem', color: '#979899', marginBottom: '1.5rem' }}>Your details auto-populate on every PDF export.</p>`
);
// Fix page wrapper width
UP = UP.replace(
  `style={{ maxWidth: '960px', margin: '0 auto', padding: '1.5rem 24px' }}`,
  `style={{ maxWidth: '960px', margin: '0 auto', padding: '1.5rem 24px' }}`
);
fs.writeFileSync('src/pages/UserProfile.jsx', UP, 'utf8');
console.log('✓ UserProfile layout fixed');

console.log('\nAll 3 done.');
