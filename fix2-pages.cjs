const fs = require('fs');

// ── Landing page ──────────────────────────────────────────────────────────────
let landing = fs.readFileSync('src/pages/LandingPage.jsx', 'utf8');
// Orange pill borders
landing = landing.split("border:'1px solid #E4E5E5', fontFamily:\"'Roboto',system-ui,sans-serif\", fontSize:13, color:'#111111', background:'#F9FAFA', whiteSpace:'nowrap'").join("border:'1px solid #FF8210', fontFamily:\"'Roboto',system-ui,sans-serif\", fontSize:13, color:'#FF8210', background:'#F9FAFA', whiteSpace:'nowrap'");
// Orange step pill borders
landing = landing.split("padding:'8px 16px', border:'1px solid #E4E5E5', borderRadius:12, background:'#F9FAFA'").join("padding:'8px 16px', border:'1px solid #FF8210', borderRadius:12, background:'#F9FAFA'");
// Remove the hr/border-bottom line below hero section
landing = landing.replace("hero:{ padding:'56px 0 48px', borderBottom:'1px solid #E4E5E5' },", "hero:{ padding:'56px 0 48px' },");
fs.writeFileSync('src/pages/LandingPage.jsx', landing, 'utf8');
console.log('✓ LandingPage.jsx');

// ── About page ────────────────────────────────────────────────────────────────
let about = fs.readFileSync('src/pages/AboutPage.jsx', 'utf8');
about = about.split("border:'1px solid #E4E5E5', borderRadius:100").join("border:'1px solid #FF8210', borderRadius:100");
fs.writeFileSync('src/pages/AboutPage.jsx', about, 'utf8');
console.log('✓ AboutPage.jsx');

// ── Features page ─────────────────────────────────────────────────────────────
let features = fs.readFileSync('src/pages/FeaturesPage.jsx', 'utf8');
features = features.split("border:'1px solid #E4E5E5', fontFamily:\"'Roboto',system-ui,sans-serif\", fontSize:13, color:'#111111', background:'#F9FAFA', whiteSpace:'nowrap'").join("border:'1px solid #FF8210', fontFamily:\"'Roboto',system-ui,sans-serif\", fontSize:13, color:'#FF8210', background:'#F9FAFA', whiteSpace:'nowrap'");
fs.writeFileSync('src/pages/FeaturesPage.jsx', features, 'utf8');
console.log('✓ FeaturesPage.jsx');

// ── HowItWorks page ───────────────────────────────────────────────────────────
let how = fs.readFileSync('src/pages/HowItWorksPage.jsx', 'utf8');
how = how.split("padding:'8px 16px', border:'1px solid #E4E5E5', borderRadius:12, background:'#F9FAFA'").join("padding:'8px 16px', border:'1px solid #FF8210', borderRadius:12, background:'#F9FAFA'");
fs.writeFileSync('src/pages/HowItWorksPage.jsx', how, 'utf8');
console.log('✓ HowItWorksPage.jsx');

// ── BillingPage — read real tier from Supabase ────────────────────────────────
let billing = fs.readFileSync('src/pages/BillingPage.jsx', 'utf8');

// Add useAuth import
billing = `import { useAuth } from '../hooks/useAuth';\n` + billing;

// Replace hardcoded currentTier with real auth
billing = billing.replace(
  `export default function BillingPage() {
  const r1=useFadeIn(), r2=useFadeIn(), r3=useFadeIn();
  const currentTier = 'free';`,
  `export default function BillingPage() {
  const r1=useFadeIn(), r2=useFadeIn(), r3=useFadeIn();
  const { profile } = useAuth();
  const tier = profile?.tier || 'free';
  const trialEnd = profile?.trial_end ? new Date(profile.trial_end) : null;
  const trialOk = tier === 'trial' && trialEnd && trialEnd > new Date();
  const isPro = tier === 'pro';
  const isTrial = trialOk;
  const currentTier = isPro ? 'pro' : isTrial ? 'trial' : 'free';`
);

// Fix current plan display
billing = billing.replace(
  `<p style={s.currentPlan}>{currentTier === 'pro' ? 'Pro' : currentTier === 'trial' ? 'Pro Trial' : 'Free'}</p>`,
  `<p style={{...s.currentPlan, color: isPro || isTrial ? '#FF8210' : s.currentPlan.color}}>{isPro ? 'Pro' : isTrial ? 'Pro Trial' : 'Free'}</p>`
);

// Fix upgrade CTA — hide when already Pro
billing = billing.replace(
  `{currentTier === 'free' && <button style={s.upgradeCta}>Start 30-day free trial</button>}
          {currentTier === 'trial' && <button style={s.upgradeCta}>Upgrade to Pro — R79/month</button>}`,
  `{!isPro && !isTrial && <button style={s.upgradeCta}>Start 30-day free trial</button>}
          {isTrial && <button style={s.upgradeCta}>Upgrade to Pro — R79/month</button>}
          {isPro && <span style={s.proBadge}>Active</span>}`
);

// Fix tier card — Your current plan label based on real tier
billing = billing.replace(
  `cta:'Your current plan', active:true, highlight:false },`,
  `cta: isPro ? 'Upgrade not needed' : 'Your current plan', active: !isPro, highlight:false },`
);

billing = billing.replace(
  `cta:'Upgrade to Pro', active:false, highlight:true },`,
  `cta: isPro ? 'Your current plan' : 'Upgrade to Pro', active: isPro, highlight:true },`
);

fs.writeFileSync('src/pages/BillingPage.jsx', billing, 'utf8');
console.log('✓ BillingPage.jsx');

console.log('\nScript 2 done.');
