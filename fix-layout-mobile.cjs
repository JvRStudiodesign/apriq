const fs = require('fs');
let L = fs.readFileSync('src/components/Layout.jsx', 'utf8');

// The mobile profile icon block added a wrapping div that didn't close cleanly
// Find and fix the closing structure around the hamburger button
L = L.replace(
  `        </button>
        </div>
      </div>

      {/* \u2500\u2500 Mobile menu`,
  `        </button>
          </div>
        </div>

      {/* \u2500\u2500 Mobile menu`
);

// Also ensure the hamburger className doesn't conflict with CSS hiding
L = L.replace(
  `        <div style={{display:'flex',alignItems:'center',gap:8}} className="hamburger">`,
  `        <div style={{display:'flex',alignItems:'center',gap:8}} className="hamburger-wrap">`
);

fs.writeFileSync('src/components/Layout.jsx', L, 'utf8');
const lines = L.split('\n');
lines.slice(100, 130).forEach((l,i) => console.log(i+101, l));
