import { Link } from 'react-router-dom';

export default function ComingSoon() {
  return (
    <div style={{ minHeight:'100vh', background:'#F9FAFA', fontFamily:"'Roboto','Segoe UI',system-ui,sans-serif", display:'flex', flexDirection:'column' }}>
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'3rem 1.5rem', textAlign:'center' }}>
        <div style={{ maxWidth:'600px', width:'100%' }}>

          <div style={{ marginBottom:'2rem' }}>
            <img src="/logo-transparent.png" alt="AprIQ" style={{ height:'108px', width:'auto', objectFit:'contain', display:'block', margin:'0 auto' }} />
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

          <div style={{ margin:'0 auto 3rem' }}>
            <Link
              to="/signup"
              style={{
                display:'inline-flex', alignItems:'center', justifyContent:'center',
                padding:'0.85rem 1.75rem', background:'#111111', color:'#F9FAFA',
                borderRadius:'12px', fontSize:'0.95rem', fontWeight:'600', textDecoration:'none',
                fontFamily:'inherit',
              }}
            >
              Create your account
            </Link>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px', maxWidth:'540px', margin:'0 auto', width:'100%' }}>
            {[['⚡','Instant estimates'],['📐','100 building types'],['📄','PDF export'],['🇿🇦','SA market rates'],['🔗','Shareable links'],['👥','Projects & clients']].map(([icon,label]) => (
              <div key={label} style={{ background:'#F9FAFA', border:'1px solid #E4E5E5', borderRadius:'12px', padding:'10px 14px', fontSize:'0.8rem', display:'flex', alignItems:'center', gap:'8px', justifyContent:'center' }}>
                <span style={{ fontSize:'1rem', filter:'grayscale(1)', opacity:0.5 }}>{icon}</span>
                <span style={{ color:'#111111', fontWeight:'500' }}>{label}</span>
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
