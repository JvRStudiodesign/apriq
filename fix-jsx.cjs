const fs = require('fs');
let layout = fs.readFileSync('src/components/Layout.jsx', 'utf8');

// The form div closes but is missing the } to close the {!isContact && expression
// Find the exact sequence and fix it
layout = layout.replace(
  `          }
        </div>
        {!submitted && (<div style={m.dividerRow}>`,
  `          }
        </div>}
        {!isContact && !submitted && (<div style={m.dividerRow}>`
);

layout = layout.replace(
  `        {!submitted && (<button onClick={handleGoogle} style={m.googleBtn}>Continue with Google</button>)}
        <p style={m.toggle}>`,
  `        {!isContact && !submitted && (<button onClick={handleGoogle} style={m.googleBtn}>Continue with Google</button>)}
        {!isContact && <p style={m.toggle}>`
);

// Close the toggle paragraph conditionally
layout = layout.replace(
  `        </p>
      </div>
    </div>
  );
}`,
  `        </p>}
      </div>
    </div>
  );
}`
);

fs.writeFileSync('src/components/Layout.jsx', layout, 'utf8');
console.log('done');
