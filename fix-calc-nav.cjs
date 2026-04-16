const fs = require('fs');
let calc = fs.readFileSync('src/pages/Calculator.jsx', 'utf8');

const navBlock = `      {/* ── Nav ── */}
      <div style={{ background: '#F9FAFA', borderBottom: '1px solid #E4E5E5', padding: '0.875rem 1.5rem 0.875rem 1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {/* Header handled by Layout */}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          {trialOk && daysLeft <= 5 && <span style={{ fontSize: '0.72rem', background: '#BFD1D6', color: '#0F4C5C', padding: '2px 8px', borderRadius: '8px' }}>Trial {daysLeft}d left</span>}
          <span onClick={!isPro ? ()=>navigate('/upgrade') : undefined} style={{ fontSize: '0.72rem', background: isPro ? '#BFD1D6' : (trialOk ? '#FF8210' : '#E4E5E5'), color: isPro ? '#0F4C5C' : (trialOk ? '#F9FAFA' : '#979899'), padding: '2px 8px', borderRadius: '8px', fontWeight: '600', cursor: !isPro ? 'pointer' : 'default' }}>{tier === 'pro' ? 'Pro' : trialOk ? 'Trial' : 'Free \u2191'}</span>
          <span style={{ fontSize: '0.78rem', color: '#bbb' }}>{profile?.full_name || user?.email}</span>
        </div>
      </div>`;

calc = calc.replace(navBlock, `      {/* Nav handled by Layout */}`);
fs.writeFileSync('src/pages/Calculator.jsx', calc, 'utf8');
console.log('done');
