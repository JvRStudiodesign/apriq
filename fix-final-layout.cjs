const fs = require('fs');
let L = fs.readFileSync('src/components/Layout.jsx', 'utf8');

// Fix: line 74-75 has two opening divs but only one close
// Replace the double-open with a single properly closed structure
L = L.replace(
  `        <div style={{display:'flex',alignItems:'center',gap:8}}>
        <div style={{position:'relative'}}>`,
  `        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <div style={{position:'relative'}}>`
);

// Fix the closing div before hamburger — needs one more close
L = L.replace(
  `          )}
        </div>
        <button className="hamburger"`,
  `          )}
          </div>
        </div>
        <button className="hamburger"`
);

// Remove the now-orphaned closing div after hamburger button
L = L.replace(
  `        </button>
      </div>

      {/* \u2500\u2500 Mobile menu`,
  `        </button>

      {/* \u2500\u2500 Mobile menu`
);

fs.writeFileSync('src/components/Layout.jsx', L, 'utf8');
const lines = L.split('\n');
lines.slice(70, 115).forEach((l,i) => console.log(i+71, l));
