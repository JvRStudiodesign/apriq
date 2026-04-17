const fs = require('fs');
const {execSync} = require('child_process');

// Restore Calculator from last known good state
const clean = execSync('git show FTgULYxJY~1:src/pages/Calculator.jsx 2>/dev/null || git show 51baa0b:src/pages/Calculator.jsx').toString();
fs.writeFileSync('src/pages/Calculator.jsx', clean, 'utf8');

// Now add a simple install block at the bottom — no external component
let C = fs.readFileSync('src/pages/Calculator.jsx', 'utf8');
const lastDiv = C.lastIndexOf('\n    </div>\n  );\n}');
const installBlock = `
      {/* How to install AprIQ */}
      <div style={{ maxWidth:'1140px', margin:'0 auto', padding:'0 1.25rem 2.5rem' }}>
        <div style={{ background:'#F9FAFA', border:'1px solid #E4E5E5', borderRadius:16, padding:'1.5rem' }}>
          <p style={{ fontSize:'0.85rem', fontWeight:600, color:'#111111', marginBottom:4, fontFamily:"'Roboto',system-ui,sans-serif" }}>Install AprIQ</p>
          <p style={{ fontSize:'0.75rem', color:'#979899', marginBottom:12, fontFamily:"'Roboto',system-ui,sans-serif" }}>Add AprIQ to your home screen for instant access.</p>
          <p style={{ fontSize:'0.75rem', color:'#555', fontFamily:"'Roboto',system-ui,sans-serif", lineHeight:1.8 }}>
            <strong>iOS / iPad:</strong> Tap the Share icon → Add to Home Screen<br/>
            <strong>Android:</strong> Tap Menu → Add to Home Screen or Install App<br/>
            <strong>Mac / Windows (Chrome or Edge):</strong> Click the install icon in the address bar → Install AprIQ
          </p>
        </div>
      </div>`;
if (lastDiv > -1) C = C.slice(0, lastDiv) + installBlock + C.slice(lastDiv);
fs.writeFileSync('src/pages/Calculator.jsx', C, 'utf8');
console.log('done, lines:', C.split('\n').length);
