import { Link } from 'react-router-dom';
export default function SignupConfirm() {
  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#F9FAFA', fontFamily:"'Roboto',system-ui,sans-serif" }}>
      <div style={{ background:'#fff', padding:'2.5rem', borderRadius:'20px', width:'100%', maxWidth:'420px', boxShadow:'0 1px 12px rgba(0,0,0,0.04)', textAlign:'center' }}>
        <img src="/logo-transparent.png" alt="AprIQ" style={{ height:'60px', objectFit:'contain', display:'block', margin:'0 auto 1.5rem', mixBlendMode:'multiply' }} />
        <h1 style={{ fontSize:'1.25rem', fontWeight:'600', marginBottom:'0.75rem', color:'#111111' }}>Check your inbox</h1>
        <p style={{ color:'#979899', fontSize:'0.9rem', lineHeight:1.6, marginBottom:'2rem' }}>
          We sent a confirmation link to your email address. Click the link to activate your account and start your free trial.
        </p>
        <p style={{ color:'#979899', fontSize:'0.8rem', marginBottom:'2rem' }}>
          If you don't see it, check your spam folder.
        </p>
        <Link to="/login" style={{ display:'block', width:'100%', padding:'0.75rem', background:'#111111', color:'#F9FAFA', border:'none', borderRadius:'12px', fontSize:'0.9rem', fontWeight:'500', cursor:'pointer', textDecoration:'none', boxSizing:'border-box' }}>
          Go to sign in
        </Link>
      </div>
    </div>
  );
}
