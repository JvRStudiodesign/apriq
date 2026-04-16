const fs = require('fs');
let L = fs.readFileSync('src/components/Layout.jsx', 'utf8');

// Remove the entire mobile profile icon block that's causing div mismatch
// Replace with a simple clean version
const mobileStart = L.indexOf('        <div style={{display:\'flex\',alignItems:\'center\',gap:8}} className="hamburger-wrap">');
const hamburgerEnd = L.indexOf('        </button>\n        </div>\n      </div>');

if (mobileStart > -1 && hamburgerEnd > -1) {
  const endPos = hamburgerEnd + '        </button>\n        </div>\n      </div>'.length;
  const replacement = `        <button className="hamburger" style={h.hamburger} onClick={() => setMenuOpen((m) => !m)} aria-label="Toggle menu">
          <span style={{ ...h.bar, transform: menuOpen ? 'rotate(45deg) translate(5px,5px)' : 'none' }}/>
          <span style={{ ...h.bar, opacity: menuOpen ? 0 : 1 }}/>
          <span style={{ ...h.bar, transform: menuOpen ? 'rotate(-45deg) translate(5px,-5px)' : 'none' }}/>
        </button>`;
  L = L.substring(0, mobileStart) + replacement + L.substring(endPos);
  console.log('Mobile block replaced');
} else {
  console.log('Pattern not found — searching differently');
  // Fallback: find and show surrounding context
  const idx = L.indexOf('hamburger-wrap');
  if (idx > -1) {
    console.log('Found hamburger-wrap at index', idx);
    console.log(L.substring(idx-50, idx+500));
  }
}

fs.writeFileSync('src/components/Layout.jsx', L, 'utf8');
// Verify header section
const lines = L.split('\n');
lines.slice(60, 115).forEach((l,i) => console.log(i+61, l));
