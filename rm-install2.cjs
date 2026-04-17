const fs = require('fs');
let C = fs.readFileSync('src/pages/Calculator.jsx', 'utf8');
const lines = C.split('\n');

// Print all lines containing 'install' or 'Install' to find exact location
lines.forEach((l, i) => {
  if (l.toLowerCase().includes('install') && !l.toLowerCase().includes('installpwa') && !l.toLowerCase().includes('function install')) {
    console.log(i+1, '|', l.trim().substring(0,100));
  }
});
