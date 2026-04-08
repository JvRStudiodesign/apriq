import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Billing() {
  const { profile } = useAuth();
  const navigate    = useNavigate();
  const tier        = profile?.tier || 'free';
  const trialEnd    = profile?.trial_end_date ? new Date(profile.trial_end_date) : null;
  const isPro       = tier === 'pro';
  const isTrial     = tier === 'trial' && trialEnd && trialEnd > new Date();
  const daysLeft    = trialEnd ? Math.max(0, Math.ceil((trialEnd - new Date()) / 86400000)) : 0;

  const card = { background:'#fff', borderRadius:'14px', border:'1px solid #eee', padding:'1.5rem', marginBottom:'1rem' };
  const row  = { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.5rem 0', borderBottom:'1px solid #f5f5f3', fontSize:'0.875rem' };
  const lbl  = { color:'#888' };
  const val  = { fontWeight:'600', color:'#1a1a18' };

  const tierLabel = isPro ? 'Pro' : isTrial ? `Pro Trial (${daysLeft} days left)` : 'Free';
  const tierColor = isPro ? '#27ae60' : isTrial ? '#e67e22' : '#aaa';

  return (
    <div style={{ minHeight:'100vh', background:'#f5f5f3', paddingTop:'1.5rem' }}>
      <div style={{ maxWidth:'560px', margin:'0 auto', padding:'2rem 1.25rem 4rem', fontFamily:'-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

        <div style={{ marginBottom:'0.5rem' }}>
          <span onClick={()=>navigate('/')} style={{ cursor:'pointer', fontSize:'0.8rem', color:'#aaa' }}>← Back to calculator</span>
        </div>

        <h1 style={{ fontSize:'1.5rem', fontWeight:'700', marginBottom:'2rem' }}>Billing & plan</h1>

        <div style={card}>
          <div style={{ fontSize:'0.85rem', fontWeight:'600', color:'#1a1a18', marginBottom:'1rem' }}>Current plan</div>
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
              style={{ marginTop:'1.25rem', width:'100%', padding:'0.75rem', background:'#1a1a18', color:'#fff', border:'none', borderRadius:'10px', fontSize:'0.875rem', fontWeight:'600', cursor:'pointer', fontFamily:'inherit' }}>
              Upgrade to Pro
            </button>
          )}
        </div>

        {isPro && (
          <div style={card}>
            <div style={{ fontSize:'0.85rem', fontWeight:'600', color:'#1a1a18', marginBottom:'0.75rem' }}>Manage subscription</div>
            <p style={{ fontSize:'0.82rem', color:'#888', marginBottom:'1rem', lineHeight:'1.5' }}>
              To cancel or update your subscription, contact us at hello@apriq.co.za and we'll action it within 1 business day.
            </p>
            <a href="mailto:hello@apriq.co.za?subject=Cancel AprIQ Pro subscription"
              style={{ display:'block', textAlign:'center', padding:'0.625rem', background:'#fff', color:'#c0392b', border:'1.5px solid #e5e5e3', borderRadius:'10px', fontSize:'0.82rem', fontWeight:'500', textDecoration:'none', cursor:'pointer' }}>
              Request cancellation
            </a>
          </div>
        )}

        <div style={card}>
          <div style={{ fontSize:'0.85rem', fontWeight:'600', color:'#1a1a18', marginBottom:'0.5rem' }}>Questions?</div>
          <p style={{ fontSize:'0.82rem', color:'#888', lineHeight:'1.5' }}>
            Email <a href="mailto:hello@apriq.co.za" style={{ color:'#1a1a18' }}>hello@apriq.co.za</a> for any billing queries.
          </p>
        </div>

      </div>
    </div>
  );
}
