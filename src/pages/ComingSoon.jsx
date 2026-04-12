import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function ComingSoon() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    const { error } = await supabase.from('waitlist').insert({ email });
    if (error) console.error('Waitlist error:', error);
    setLoading(false);
    setSubmitted(true);
  }

  return (
    <div style={{ minHeight:'100vh', background:'#F9FAFA', fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif', display:'flex', flexDirection:'column' }}>
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'3rem 1.5rem', textAlign:'center' }}>
        <div style={{ maxWidth:'600px', width:'100%' }}>

          <div style={{ marginBottom:'2rem' }}>
            <img src="/logo-launch.png" alt="AprIQ" style={{ height:'108px', width:'auto', objectFit:'contain', display:'block', margin:'0 auto' }} />
          </div>

          <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', background:'#111111', color:'#F9FAFA', fontSize:'0.72rem', fontWeight:'600', padding:'5px 14px', borderRadius:'20px', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:'2rem' }}>
            <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#FF8210', display:'inline-block' }} />
            Launching soon
          </div>

          <h1 style={{ fontSize:'clamp(2.25rem, 6vw, 3.75rem)', fontWeight:'700', color:'#111111', lineHeight:1.08, letterSpacing:'-0.03em', marginBottom:'1.5rem' }}>
            Construction cost<br />intelligence for SA
          </h1>

          <p style={{ fontSize:'1.05rem', color:'#979899', lineHeight:1.7, maxWidth:'460px', margin:'0 auto 2.5rem' }}>
            Instant ROM cost estimates calibrated to South African market rates. Built for architects, developers and quantity surveyors.
          </p>

          {submitted ? (
            <div style={{ background:'#F9FAFA', border:'1px solid #E4E5E5', borderRadius:'20px', padding:'1.5rem 2rem', maxWidth:'380px', margin:'0 auto' }}>
              <div style={{ fontSize:'1.75rem', marginBottom:'0.5rem' }}>✓</div>
              <p style={{ fontWeight:'600', color:'#111111', marginBottom:'0.25rem' }}>You are on the list</p>
              <p style={{ fontSize:'0.82rem', color:'#979899' }}>We will reach out when AprIQ launches.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display:'flex', gap:'8px', maxWidth:'440px', margin:'0 auto 3rem', flexWrap:'wrap', justifyContent:'center' }}>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.co.za" required
                style={{ flex:1, minWidth:'220px', padding:'0.8rem 1rem', border:'1.5px solid #E4E5E5', borderRadius:'12px', fontSize:'0.95rem', fontFamily:'inherit', outline:'none', color:'#111111', background:'#fff' }} />
              <button type="submit" disabled={loading}
                style={{ padding:'0.8rem 1.5rem', background:'#111111', color:'#F9FAFA', border:'none', borderRadius:'12px', fontSize:'0.95rem', fontWeight:'600', cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }}>
                {loading ? 'Joining...' : 'Join waitlist'}
              </button>
            </form>
          )}

          <div style={{ display:'flex', gap:'10px', flexWrap:'wrap', justifyContent:'center', marginTop: submitted ? '2rem' : '0' }}>
            {[['⚡','Instant estimates'],['🏗️','100 building types'],['📄','PDF export'],['🇿🇦','South African market']].map(([icon,label]) => (
              <div key={label} style={{ background:'#F9FAFA', border:'1px solid #E4E5E5', borderRadius:'20px', padding:'6px 14px', fontSize:'0.8rem', color:'#979899', display:'flex', alignItems:'center', gap:'6px' }}>
                <span>{icon}</span><span>{label}</span>
              </div>
            ))}
          </div>

        </div>
      </div>

      <div style={{ padding:'1.5rem 2rem', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'1rem' }}>
        <span style={{ fontSize:'0.72rem', color:'#979899' }}>© 2026 AprIQ · JvRStudio (Pty) Ltd</span>
        <span style={{ fontSize:'0.72rem', color:'#979899' }}>apriq.co.za</span>
      </div>
    </div>
  );
}