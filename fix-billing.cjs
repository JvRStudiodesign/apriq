const fs = require('fs');
let billing = fs.readFileSync('src/pages/BillingPage.jsx', 'utf8');

// Move the dynamic tier CTA/active logic inside the component
// by making TIERS a computed variable inside the component
billing = billing.replace(
  `  { id:'free', name:'Free', price:'R0', period:'always', description:'Get started with AprIQ and explore the early-stage estimating workflow.', features:['Basic cost estimates','Limited project workspaces','Limited client management','Basic AprIQ workflow access'], cta: isPro ? 'Upgrade not needed' : 'Your current plan', active: !isPro, highlight:false },
  { id:'pro',  name:'Pro',  price:'R79', period:'/month', trialNote:'30-day free trial — no card required to start', description:'A more complete working setup with expanded access for ongoing project and professional output needs.', features:['Full cost estimates','More project workspaces','Full client management','Professional PDF exports','Shareable estimate links','Full AprIQ workflow access','More storage and saved data'], cta: isPro ? 'Your current plan' : 'Upgrade to Pro', active: isPro, highlight:true },`,
  `  { id:'free', name:'Free', price:'R0', period:'always', description:'Get started with AprIQ and explore the early-stage estimating workflow.', features:['Basic cost estimates','Limited project workspaces','Limited client management','Basic AprIQ workflow access'], cta:'__free_cta__', active:true, highlight:false },
  { id:'pro',  name:'Pro',  price:'R79', period:'/month', trialNote:'30-day free trial — no card required to start', description:'A more complete working setup with expanded access for ongoing project and professional output needs.', features:['Full cost estimates','More project workspaces','Full client management','Professional PDF exports','Shareable estimate links','Full AprIQ workflow access','More storage and saved data'], cta:'__pro_cta__', active:false, highlight:true },`
);

// Now fix the tier card rendering to use isPro from component scope
billing = billing.replace(
  `{TIERS.map((tier) => (`,
  `{TIERS.map((tier) => {
            const cta = tier.id === 'free'
              ? (isPro ? 'Upgrade not needed' : 'Your current plan')
              : (isPro ? 'Your current plan' : 'Upgrade to Pro');
            const isActive = tier.id === 'free' ? !isPro : isPro;
            return (`
);

// Close the extra return/map
billing = billing.replace(
  `            </div>
          ))}`,
  `            </div>
          );})}` 
);

// Fix references to tier.active and tier.cta in the render
billing = billing.replace(
  `style={{...s.tierCta, background:tier.highlight?'#111111':'transparent', color:tier.highlight?'#F9FAFA':'#979899', border:tier.highlight?'none':'1px solid #E4E5E5', cursor:tier.active?'default':'pointer'}} disabled={tier.active}>{tier.cta}</button>`,
  `style={{...s.tierCta, background:tier.highlight?'#111111':'transparent', color:tier.highlight?'#F9FAFA':'#979899', border:tier.highlight?'none':'1px solid #E4E5E5', cursor:isActive?'default':'pointer'}} disabled={isActive}>{cta}</button>`
);

fs.writeFileSync('src/pages/BillingPage.jsx', billing, 'utf8');
console.log('done');
