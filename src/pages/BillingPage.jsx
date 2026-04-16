import { useAuth } from '../hooks/useAuth';
import { useFadeIn } from '../hooks/useFadeIn';

const TIERS = [
  { id:'free', name:'Free', price:'R0', period:'always', description:'Get started with AprIQ and explore the early-stage estimating workflow.', features:['Basic cost estimates','Limited project workspaces','Limited client management','Basic AprIQ workflow access'], cta:'__free_cta__', active:true, highlight:false },
  { id:'pro',  name:'Pro',  price:'R79', period:'/month', trialNote:'30-day free trial — no card required to start', description:'A more complete working setup with expanded access for ongoing project and professional output needs.', features:['Full cost estimates','More project workspaces','Full client management','Professional PDF exports','Shareable estimate links','Full AprIQ workflow access','More storage and saved data'], cta:'__pro_cta__', active:false, highlight:true },
];

export default function BillingPage() {
  const r1=useFadeIn(), r2=useFadeIn(), r3=useFadeIn();
  const { profile } = useAuth();
  const tier = profile?.tier || 'free';
  const trialEnd = profile?.trial_end ? new Date(profile.trial_end) : null;
  const trialOk = tier === 'trial' && trialEnd && trialEnd > new Date();
  const isPro = tier === 'pro';
  const isTrial = trialOk;
  const currentTier = isPro ? 'pro' : isTrial ? 'trial' : 'free';
  return (
    <div>
      <div style={s.pageTop}/>
      <section style={s.section}><div className="wrap" ref={r1}><div style={s.panel} className="fi-group">
        <h1 style={s.h1} className="fi">Billing and plan</h1>
        <div style={s.currentRow} className="fi">
          <div>
            <p style={s.label}>Current plan</p>
            <p style={{...s.currentPlan, color: isPro || isTrial ? '#FF8210' : s.currentPlan.color}}>{isPro ? 'Pro' : isTrial ? 'Pro Trial' : 'Free'}</p>
          </div>
          {currentTier === 'free' && <button style={s.upgradeCta}>Start 30-day free trial</button>}
        </div>
      </div></div></section>

      <section style={s.section}><div className="wrap" ref={r2}><div style={s.panel} className="fi-group">
        <h2 style={s.h2} className="fi">Plans</h2>
        <p style={s.body} className="fi">Choose the plan that fits how you work. Pro starts with a 30-day free trial — no credit card required to begin.</p>
        <div style={s.tierGrid} className="fi">
          {TIERS.map((tier) => {
            const cta = tier.id === 'free'
              ? (isPro ? 'Upgrade not needed' : 'Your current plan')
              : (isPro ? 'Your current plan' : 'Upgrade to Pro');
            const isActive = tier.id === 'free' ? !isPro : isPro;
            return (
            <div key={tier.id} style={{...s.tierCard, borderColor:tier.highlight?'#0F4C5C':'#E4E5E5'}}>
              {tier.highlight && <div style={s.tierBadge}>Best value</div>}
              <div style={s.tierTop}>
                <span style={s.tierName}>{tier.name}</span>
                <div style={s.tierPriceRow}>
                  <span style={s.tierPrice}>{tier.price}</span>
                  <span style={s.tierPeriod}>{tier.period}</span>
                </div>
                {tier.trialNote && <p style={s.trialNote}>{tier.trialNote}</p>}
              </div>
              <p style={s.tierDesc}>{tier.description}</p>
              <ul style={s.featureList}>
                {tier.features.map((f) => (
                  <li key={f} style={s.featureItem}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0F4C5C" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    <span style={s.featureText}>{f}</span>
                  </li>
                ))}
              </ul>
              <button style={{...s.tierCta, background:tier.highlight?'#111111':'transparent', color:tier.highlight?'#F9FAFA':'#979899', border:tier.highlight?'none':'1px solid #E4E5E5', cursor:isActive?'default':'pointer'}} disabled={isActive}>{cta}</button>
            </div>
          );})}
        </div>
      </div></div></section>

      <section style={{...s.section,paddingBottom:80}}><div className="wrap" ref={r3}><div style={s.panel} className="fi-group">
        <h2 style={s.h2} className="fi">Manage subscription</h2>
        <div style={s.manageGrid} className="fi">
          {[
            { icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F4C5C" strokeWidth="1.5"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>, label:'Payment method', sub:'Update your card or billing details.', action:<button style={s.manageBtn}>Update</button> },
            { icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F4C5C" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>, label:'Next billing date', sub:currentTier==='pro'?'15 May 2026':'—', action:null },
            { icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F4C5C" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>, label:'Need help?', sub:'Contact us about your plan or billing.', action:<a href="mailto:apriq@apriq.co.za" style={s.manageBtn}>Contact support</a> },
          ].map(({ icon, label, sub, action }, i) => (
            <div key={i} style={s.manageCard}>
              <div style={s.manageIcon}>{icon}</div>
              <div style={{flex:1}}><p style={s.manageLabel}>{label}</p><p style={s.manageSub}>{sub}</p></div>
              {action}
            </div>
          ))}
        </div>
        {currentTier === 'pro' && (
          <div style={s.cancelRow} className="fi">
            <hr style={s.divider}/>
            <p style={s.cancelNote}>Cancelling your subscription will take effect at the end of your current billing period. You will retain Pro access until then.</p>
            <button style={s.cancelBtn}>Cancel subscription</button>
          </div>
        )}
      </div></div></section>
    </div>
  );
}

const s = {
  pageTop:{ height:48 }, section:{ padding:'0 0 16px' },
  panel:{ background:'#F9FAFA', border:'1px solid #E4E5E5', borderRadius:16, padding:32 },
  h1:{ fontFamily:"'Aptos','Segoe UI',system-ui,sans-serif", fontSize:26, fontWeight:700, color:'#111111', marginBottom:24 },
  h2:{ fontFamily:"'Aptos','Segoe UI',system-ui,sans-serif", fontSize:20, fontWeight:600, color:'#111111', marginBottom:12 },
  body:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:14, color:'#979899', lineHeight:1.7, marginBottom:24 },
  label:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:11, color:'#979899', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.5px' },
  currentPlan:{ fontFamily:"'Aptos','Segoe UI',system-ui,sans-serif", fontSize:18, fontWeight:600, color:'#111111' },
  currentRow:{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16 },
  upgradeCta:{ padding:'10px 22px', background:'#111111', color:'#F9FAFA', border:'none', borderRadius:12, fontFamily:"'Roboto',system-ui,sans-serif", fontSize:13, fontWeight:500, cursor:'pointer' },
  tierGrid:{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:16 },
  tierCard:{ border:'1px solid', borderRadius:16, padding:28, display:'flex', flexDirection:'column', gap:16, position:'relative', background:'#F9FAFA' },
  tierBadge:{ position:'absolute', top:-1, right:20, background:'#0F4C5C', color:'#F9FAFA', fontSize:11, fontWeight:500, fontFamily:"'Roboto',system-ui,sans-serif", padding:'4px 12px', borderRadius:'0 0 10px 10px' },
  tierTop:{ display:'flex', flexDirection:'column', gap:4 },
  tierName:{ fontFamily:"'Aptos','Segoe UI',system-ui,sans-serif", fontSize:17, fontWeight:600, color:'#111111' },
  tierPriceRow:{ display:'flex', alignItems:'baseline', gap:4, marginTop:4 },
  tierPrice:{ fontFamily:"'Aptos','Segoe UI',system-ui,sans-serif", fontSize:28, fontWeight:700, color:'#111111' },
  tierPeriod:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:13, color:'#979899' },
  trialNote:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:11, color:'#0F4C5C', marginTop:4 },
  tierDesc:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:13, color:'#979899', lineHeight:1.6 },
  featureList:{ listStyle:'none', display:'flex', flexDirection:'column', gap:8, flex:1 },
  featureItem:{ display:'flex', alignItems:'flex-start', gap:10 },
  featureText:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:13, color:'#111111', lineHeight:1.4 },
  tierCta:{ width:'100%', padding:'11px', borderRadius:12, fontFamily:"'Roboto',system-ui,sans-serif", fontSize:13, fontWeight:500, marginTop:8 },
  manageGrid:{ display:'flex', flexDirection:'column', gap:0 },
  manageCard:{ display:'flex', alignItems:'center', gap:16, padding:'18px 0', borderBottom:'1px solid #E4E5E5', flexWrap:'wrap' },
  manageIcon:{ width:40, height:40, borderRadius:12, border:'1px solid #E4E5E5', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, background:'#F9FAFA' },
  manageLabel:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:13, fontWeight:500, color:'#111111', marginBottom:2 },
  manageSub:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:12, color:'#979899' },
  manageBtn:{ marginLeft:'auto', padding:'8px 18px', border:'1px solid #E4E5E5', borderRadius:10, background:'#F9FAFA', fontFamily:"'Roboto',system-ui,sans-serif", fontSize:12, color:'#111111', cursor:'pointer', textDecoration:'none', display:'inline-flex', alignItems:'center' },
  cancelRow:{ marginTop:4 },
  divider:{ border:'none', borderTop:'1px solid #E4E5E5', margin:'24px 0 20px' },
  cancelNote:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:12, color:'#979899', lineHeight:1.6, marginBottom:16, maxWidth:480 },
  cancelBtn:{ padding:'9px 20px', border:'1px solid #E4E5E5', borderRadius:10, background:'transparent', fontFamily:"'Roboto',system-ui,sans-serif", fontSize:12, color:'#979899', cursor:'pointer' },
};
