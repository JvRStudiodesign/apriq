const fs = require('fs');

// ── 1. Fix Calculator: React.useState → useState ──────────────────────────────
let C = fs.readFileSync('src/pages/Calculator.jsx', 'utf8');
C = C.replace(
  'const [open, setOpen] = React.useState(false);',
  'const [open, setOpen] = useState(false);'
);
C = C.replace(
  "const [device, setDevice] = React.useState('iPhone / iPad');",
  "const [device, setDevice] = useState('iPhone / iPad');"
);
fs.writeFileSync('src/pages/Calculator.jsx', C, 'utf8');
console.log('✓ Calculator React.useState fixed');

// ── 2. UserProfile: match Projects/Clients layout ─────────────────────────────
let P = fs.readFileSync('src/pages/UserProfile.jsx', 'utf8');
// Fix wrapper to use same maxWidth:960, padding:1.5rem 24px
P = P.replace(
  `style={{ maxWidth: '960px', margin: '0 auto', padding: '1.5rem 24px' }}`,
  `style={{ maxWidth: '960px', margin: '0 auto', padding: '1.5rem 24px' }}`
);
// Remove the extra div that was added wrapping h1
P = P.replace(
  `<div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.25rem' }}>
          <h1 style={{ fontSize: '1.375rem', fontWeight: '700', color: '#111111', letterSpacing: '-0.01em', fontFamily: "'Roboto', system-ui, sans-serif" }}>Profile</h1>
        </div>
        <p style={{ fontSize: '0.78rem', color: '#979899', marginBottom: '1.5rem' }}>Your details auto-populate on every PDF export.</p>`,
  `<div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.25rem' }}>
          <h1 style={{ fontSize: '1.375rem', fontWeight: '700', color: '#111111', letterSpacing: '-0.01em', fontFamily: "'Roboto', system-ui, sans-serif" }}>Profile</h1>
        </div>
        <p style={{ fontSize: '0.78rem', color: '#979899', marginBottom: '1.5rem' }}>Your details auto-populate on every PDF export.</p>
        <div style={{ maxWidth: 560 }}>`
);
// Close the inner constrained div before the save button
P = P.replace(
  `        <button onClick={handleSave} disabled={saving || uploading}`,
  `        </div>
        <div style={{ maxWidth: 560 }}>
        <button onClick={handleSave} disabled={saving || uploading}`
);
P = P.replace(
  `        </button>\n      </div>\n    </div>\n  );\n}`,
  `        </button>\n        </div>\n      </div>\n    </div>\n  );\n}`
);
fs.writeFileSync('src/pages/UserProfile.jsx', P, 'utf8');
console.log('✓ UserProfile layout aligned');

console.log('Done.');
