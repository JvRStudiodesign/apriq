import { useState, useEffect, useRef } from 'react';

// Password checked server-side via API — not stored in frontend

function Stat({ label, value, sub }) {
  return (
    <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #eee', padding:'1.25rem 1.5rem' }}>
      <div style={{ fontSize:'0.72rem', fontWeight:'600', color:'#aaa', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'0.5rem' }}>{label}</div>
      <div style={{ fontSize:'1.75rem', fontWeight:'700', color:'#1a1a18', lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:'0.78rem', color:'#aaa', marginTop:'0.375rem' }}>{sub}</div>}
    </div>
  );
}

export default function Admin() {
  // Clear any stale admin session on mount
  useEffect(() => { sessionStorage.removeItem('admin_auth'); }, []);
  const [auth, setAuth]    = useState(false); // Never auto-restore admin auth
  const pwRef = useRef('');
  const [pw, setPw]        = useState('');
  const [data, setData]    = useState(null);
  const [loading, setLoad] = useState(false);
  const [err, setErr]      = useState('');

  async function login(e) {
    e.preventDefault();
    try {
      const r = await fetch('/api/admin-stats', {
        headers: { 'x-admin-password': pw }
      });
      if (r.ok) { pwRef.current = pw; setAuth(true); setPw(''); }
      else if (r.status === 503) setErr('Server configuration error — check SUPABASE_SERVICE_ROLE_KEY in Vercel');
      else if (r.status === 429) setErr('Too many attempts — wait 1 minute');
      else setErr('Incorrect password');
    } catch { setErr('Connection error'); }
  }

  useEffect(() => {
    if (!auth) return;
    setLoad(true);
    fetch('/api/admin-stats', { headers: { 'x-admin-password': pwRef.current || '' } })
      .then(r => r.json())
      .then(d => { setData(d); setLoad(false); })
      .catch(() => { setErr('Failed to load — add SUPABASE_SERVICE_ROLE_KEY to Vercel env vars'); setLoad(false); });
  }, [auth]);

  const pg   = { maxWidth:'900px', margin:'0 auto', padding:'2rem 1.25rem 4rem', fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' };
  const grid = { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:'0.875rem', marginBottom:'1.5rem' };
  const sh   = { fontSize:'0.72rem', fontWeight:'600', color:'#aaa', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'0.75rem' };

  if (!auth) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f5f5f3' }}>
      <div style={{ background:'#fff', borderRadius:'14px', padding:'2.5rem', width:'100%', maxWidth:'340px', border:'1px solid #eee' }}>
        <div style={{ fontWeight:'700', fontSize:'1.1rem', marginBottom:'0.25rem' }}>AprIQ Admin</div>
        <div style={{ color:'#aaa', fontSize:'0.82rem', marginBottom:'1.5rem' }}>Founder access only</div>
        {err && <div style={{ color:'#c0392b', fontSize:'0.82rem', marginBottom:'0.75rem' }}>{err}</div>}
        <form onSubmit={login}>
          <input type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="Password"
            style={{ width:'100%', padding:'0.625rem 0.75rem', border:'1px solid #eee', borderRadius:'8px', fontSize:'0.875rem', marginBottom:'1rem', boxSizing:'border-box', fontFamily:'inherit' }} />
          <button type="submit" style={{ width:'100%', padding:'0.75rem', background:'#1a1a18', color:'#fff', border:'none', borderRadius:'8px', fontSize:'0.875rem', fontWeight:'600', cursor:'pointer', fontFamily:'inherit' }}>
            Sign in
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div style={{ background:'#f5f5f3', minHeight:'100vh', paddingTop:'1.5rem' }}>
      <div style={pg}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.75rem' }}>
          <div>
            <div style={{ fontWeight:'700', fontSize:'1.25rem' }}>AprIQ Analytics</div>
            <div style={{ color:'#aaa', fontSize:'0.8rem' }}>Live data · refreshes on load</div>
          </div>
          <button onClick={()=>{ sessionStorage.removeItem('admin_auth'); setAuth(false); }}
            style={{ padding:'0.5rem 1rem', background:'#fff', border:'1px solid #eee', borderRadius:'8px', fontSize:'0.78rem', cursor:'pointer', fontFamily:'inherit', color:'#888' }}>
            Sign out
          </button>
        </div>

        {loading && <p style={{ color:'#aaa', fontSize:'0.875rem' }}>Loading stats…</p>}
        {err && !loading && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'10px', padding:'1rem', color:'#c0392b', fontSize:'0.82rem', marginBottom:'1rem' }}>{err}</div>}

        {data && <>
          <div style={sh}>Users</div>
          <div style={grid}>
            <Stat label="Total users"   value={data.users.total}   />
            <Stat label="New today"     value={data.users.daily}   />
            <Stat label="New this week" value={data.users.weekly}  />
            <Stat label="Active trials" value={data.trials.active} />
          </div>
          <div style={sh}>Revenue</div>
          <div style={grid}>
            <Stat label="Pro subscribers" value={data.pro.total}        sub={`${data.pro.monthly} monthly · ${data.pro.annual} annual`} />
            <Stat label="Conversion rate" value={`${data.conversion}%`} sub="trial → paid" />
            <Stat label="MRR"             value={`R ${data.revenue.mrr.toLocaleString('en-ZA')}`} />
            <Stat label="ARR"             value={`R ${data.revenue.arr.toLocaleString('en-ZA')}`} />
          </div>
          <div style={sh}>Estimates</div>
          <div style={grid}>
            <Stat label="Total"     value={data.estimates.total}  />
            <Stat label="Today"     value={data.estimates.today}  />
            <Stat label="This week" value={data.estimates.weekly} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.875rem', marginTop:'0.25rem' }}>
            <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #eee', padding:'1.25rem 1.5rem' }}>
              <div style={sh}>Top building types</div>
              {data.topTypes.map((t,i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'0.35rem 0', borderBottom:'1px solid #f5f5f3', fontSize:'0.82rem' }}>
                  <span style={{ color:'#555' }}>{t.name}</span>
                  <span style={{ fontWeight:'600' }}>{t.count}</span>
                </div>
              ))}
            </div>
            <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #eee', padding:'1.25rem 1.5rem' }}>
              <div style={sh}>Referral sources</div>
              {data.referrals.map((r,i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'0.35rem 0', borderBottom:'1px solid #f5f5f3', fontSize:'0.82rem' }}>
                  <span style={{ color:'#555', textTransform:'capitalize' }}>{r.source.replace(/_/g,' ')}</span>
                  <span style={{ fontWeight:'600' }}>{r.count}</span>
                </div>
              ))}
            </div>
          </div>
        </>
        }
      </div>
    </div>
  );
}
