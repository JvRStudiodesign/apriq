const fs = require('fs');
const lines = fs.readFileSync('src/components/Layout.jsx', 'utf8').split('\n');
// Print lines 245-275 to see the broken area
lines.slice(244, 275).forEach((l, i) => console.log(i+245, l));
