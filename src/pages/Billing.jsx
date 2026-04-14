import { useNavigate } from 'react-router-dom';
import { HamburgerMenu } from '../components/HamburgerMenu';
import { useAuth } from '../hooks/useAuth';

export default function Billing() {
  const { profile } = useAuth();
  const navigate    = useNavigate();
  const tier        = profile?.tier || 'free';
  const trialEnd    = profile?.trial_end_date ? new Date(profile.trial_end_date) : null;
  const isPro       = tier === 'pro';
  const isTrial     = tier === 'trial' && trialEnd && trialEnd > new Date();
  const daysLeft    = trialEnd ? Math.max(0, Math.ceil((trialEnd - new Date()) / 86400000)) : 0;

  const card = { background:'#F9FAFA', borderRadius:'16px', border:'1px solid #E4E5E5', padding:'1.5rem', marginBottom:'1rem' };
  const row  = { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.5rem 0', borderBottom:'1px solid #E4E5E5', fontSize:'0.875rem' };
  const lbl  = { color:'#979899' };
  const val  = { fontWeight:'600', color:'#111111' };

  const tierLabel = isPro ? 'Pro' : isTrial ? `Pro Trial (${daysLeft} days left)` : 'Free';
  const tierColor = isPro ? '#0F4C5C' : isTrial ? '#FF8210' : '#979899';

  return (
    <div style={{ minHeight:'100vh', background:'#F9FAFA' }}>
      <div style={{ background:'#F9FAFA', borderBottom:'1px solid #E4E5E5', padding:'0.875rem 1.5rem', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'4px' }}>
          <HamburgerMenu />
          <img src="/logo-transparent.png" alt="AprIQ" style={{ height:'88px', width:'auto', objectFit:'contain', mixBlendMode:'multiply' }} />
        </div>
        <span style={{ fontSize:'0.78rem', color:'#979899' }}>Billing & plan</span>
      </div>
      <div style={{ maxWidth:'560px', margin:'0 auto', padding:'2rem 1.25rem 4rem', fontFamily:"'Roboto', system-ui, sans-serif" }}>

        <h1 style={{ fontSize:'1.375rem', fontWeight:'700', marginBottom:'2rem', color:'#111111', letterSpacing:'-0.01em', fontFamily:"'Roboto', system-ui, sans-serif" }}>Billing & plan</h1>

        <div style={card}>
          <div style={{ fontSize:'0.85rem', fontWeight:'600', color:'#111111', marginBottom:'1rem' }}>Current plan</div>
          <div style={row}>
            <span style={lbl}>Plan</span>
            <span style={{ ...val, color: tierColor }}>{tierLabel}</span>
          </div>
          {isTrial && (
            <div style={row}>
              <span style={lbl}>Trial ends</span>
              <span style={val}>{trialEnd?.toLocaleDateString('en-ZA', { day:'numeric', month:'long', year:'numeric' })}</span>
            </div>
          )}
          {!isPro && (
            <button onClick={()=>navigate('/upgrade')}
              style={{ marginTop:'1.25rem', width:'100%', padding:'0.75rem', background:'#111111', color:'#F9FAFA', border:'none', borderRadius:'12px', fontSize:'0.875rem', fontWeight:'600', cursor:'pointer', fontFamily:'inherit' }}>
              Upgrade to Pro
            </button>
          )}
        </div>

        {isPro && (
          <div style={card}>
            <div style={{ fontSize:'0.85rem', fontWeight:'600', color:'#111111', marginBottom:'0.75rem' }}>Manage subscription</div>
            <p style={{ fontSize:'0.82rem', color:'#979899', marginBottom:'1rem', lineHeight:'1.5' }}>
              To cancel or update your subscription, contact us at apriq@apriq.co.za and we'll action it within 1 business day.
            </p>
            <a href="mailto:apriq@apriq.co.za?subject=Cancel AprIQ Pro subscription"
              style={{ display:'block', textAlign:'center', padding:'0.625rem', background:'#fff', color:'#c0392b', border:'1.5px solid #E4E5E5', borderRadius:'12px', fontSize:'0.82rem', fontWeight:'500', textDecoration:'none', cursor:'pointer' }}>
              Request cancellation
            </a>
          </div>
        )}

        <div style={card}>
          <div style={{ fontSize:'0.85rem', fontWeight:'600', color:'#111111', marginBottom:'0.5rem' }}>Questions?</div>
          <p style={{ fontSize:'0.82rem', color:'#888', lineHeight:'1.5' }}>
            Email <a href="mailto:apriq@apriq.co.za" style={{ color:'#111111' }}>apriq@apriq.co.za</a> for any billing queries.
          </p>
        </div>

      </div>
    </div>
  );
}
