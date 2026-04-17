const fs = require('fs');
const {execSync} = require('child_process');

// Restore clean UserProfile from last known good
const clean = execSync('git show be10bed:src/pages/UserProfile.jsx').toString();

// Apply only the wrapper change: maxWidth 960, padding 24px
let P = clean;
P = P.replace(
  `style={{ maxWidth: '560px', margin: '0 auto', padding: '2rem 1.25rem' }}`,
  `style={{ maxWidth: '960px', margin: '0 auto', padding: '1.5rem 24px' }}`
);
// Constrain the form content to 560px inside the wider wrapper
P = P.replace(
  `<h1 style={{ fontSize: '1.375rem', fontWeight: '700', color: '#111111', marginBottom: '0.25rem', letterSpacing: '-0.01em', fontFamily: "'Roboto', system-ui, sans-serif" }}>Profile</h1>`,
  `<div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.25rem' }}>
          <h1 style={{ fontSize: '1.375rem', fontWeight: '700', color: '#111111', letterSpacing: '-0.01em', fontFamily: "'Roboto', system-ui, sans-serif" }}>Profile</h1>
        </div>`
);
// Wrap form in 560px container
P = P.replace(
  `<p style={{ fontSize: '0.78rem', color: '#979899', marginBottom: '1.5rem' }}>Your details auto-populate on every PDF export.</p>`,
  `<p style={{ fontSize: '0.78rem', color: '#979899', marginBottom: '1.5rem' }}>Your details auto-populate on every PDF export.</p>
        <div style={{ maxWidth: 560 }}>`
);
// Close that div before final closing tags
P = P.replace(
  `      </div>\n    </div>\n  );\n}`,
  `        </div>\n      </div>\n    </div>\n  );\n}`
);

fs.writeFileSync('src/pages/UserProfile.jsx', P, 'utf8');

// Verify
const lines = P.split('\n');
console.log('Lines:', lines.length);
lines.slice(-8).forEach((l,i,a)=>console.log(a.length-8+i+1, l));
