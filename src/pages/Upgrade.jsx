import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const MERCHANT_ID  = '34377269';
const MERCHANT_KEY = 'vyu9zys41dbon';
const SANDBOX      = true; // flip to false when PayFast approves account
const PF_URL       = SANDBOX
  ? 'https://sandbox.payfast.co.za/eng/process'
  : 'https://www.payfast.co.za/eng/process';

export default function Upgrade() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const tier = profile?.tier || 'free';
  const isPro = tier === 'pro';

  const card  = { background:'#F9FAFA', borderRadius:'16px', border:'1px solid #E4E5E5', padding:'1.75rem 1.5rem', flex:1, minWidth:'260px', maxWidth:'340px', position:'relative' };
  const badge = { position:'absolute', top:'-12px', left:'50%', transform:'translateX(-50%)', background:'#0F4C5C', color:'#F9FAFA', fontSize:'0.7rem', fontWeight:'600', padding:'3px 12px', borderRadius:'20px', whiteSpace:'nowrap' };

  function buildForm(plan) {
    const BASE_URL = window.location.origin;
    const isAnnual = plan === 'annual';
    const amount   = isAnnual ? '1490.00' : '149.00';
    const name     = isAnnual ? 'AprIQ Pro Annual' : 'AprIQ Pro Monthly';
    const email    = user?.email || '';
    const userId   = user?.id   || '';

    const fields = {
      merchant_id:       MERCHANT_ID,
      merchant_key:      MERCHANT_KEY,
      return_url:        `${BASE_URL}/billing?status=success`,
      cancel_url:        `${BASE_URL}/upgrade?status=cancelled`,
      notify_url:        `${BASE_URL}/api/payfast-itn`,
      email_address:     email,
      amount:            amount,
      item_name:         name,
      item_description:  `AprIQ ${isAnnual ? 'annual' : 'monthly'} Pro subscription`,
      custom_str1:       userId,
      custom_str2:       plan,
      subscription_type: '1',
      billing_date:      new Date().toISOString().split('T')[0],
      recurring_amount:  amount,
      frequency:         isAnnual ? '6' : '3',
      cycles:            '0',
    };

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = PF_URL;
    Object.entries(fields).forEach(([k, v]) => {
      const inp = document.createElement('input');
      inp.type = 'hidden'; inp.name = k; inp.value = v;
      form.appendChild(inp);
    });
    document.body.appendChild(form);
    form.submit();
  }

  return (
    <div style={{ minHeight:'100vh', background:'#F9FAFA', paddingTop:'1.5rem' }}>
      <div style={{ maxWidth:'720px', margin:'0 auto', padding:'2rem 1.25rem 4rem', fontFamily:"'Roboto', system-ui, sans-serif" }}>

        <div style={{ marginBottom:'0.5rem' }}>
          <span onClick={()=>navigate('/')} style={{ cursor:'pointer', fontSize:'0.8rem', color:'#979899' }}>← Back to calculator</span>
        </div>

        <h1 style={{ fontSize:'1.5rem', fontWeight:'700', marginBottom:'0.5rem' }}>Upgrade to AprIQ Pro</h1>
        <p style={{ color:'#888', fontSize:'0.9rem', marginBottom:'2rem' }}>Unlock all features. Cancel anytime.</p>

        {isPro ? (
          <div style={{ background:'#BFD1D6', border:'1px solid #0F4C5C', borderRadius:'16px', padding:'1.25rem 1.5rem', color:'#0F4C5C', fontSize:'0.9rem' }}>
            You are already on Pro. <span onClick={()=>navigate('/billing')} style={{ fontWeight:'600', cursor:'pointer', color:'#0F4C5C', textDecoration:'underline' }}>Manage your plan →</span>
          </div>
        ) : (
          <div style={{ display:'flex', gap:'1.25rem', flexWrap:'wrap', justifyContent:'center', marginBottom:'2rem' }}>

            {/* Monthly */}
            <div style={{...card}}>
              <span style={{ fontSize:'0.72rem', fontWeight:'600', color:'#979899', textTransform:'uppercase', letterSpacing:'0.06em' }}>Monthly</span>
              <div style={{ fontSize:'2rem', fontWeight:'700', margin:'0.75rem 0 0.25rem', color:'#111111' }}>R 149</div>
              <div style={{ color:'#979899', fontSize:'0.8rem', marginBottom:'1.5rem' }}>per month, billed monthly</div>
              <ul style={{ listStyle:'none', padding:0, margin:'0 0 1.5rem', fontSize:'0.85rem', color:'#979899' }}>
                <li style={{marginBottom:'0.4rem'}}>✓ Unlimited estimates</li>
                <li style={{marginBottom:'0.4rem'}}>✓ PDF export with logo</li>
                <li style={{marginBottom:'0.4rem'}}>✓ Mixed-use buildings</li>
                <li style={{marginBottom:'0.4rem'}}>✓ Rate adjustment</li>
                <li style={{marginBottom:'0.4rem'}}>✓ Shareable links</li>
                <li>✓ Projects & clients</li>
              </ul>
              <button onClick={()=>buildForm('monthly')}
                style={{ width:'100%', padding:'0.75rem', background:'#F9FAFA', color:'#111111', border:'1.5px solid #111111', borderRadius:'12px', fontSize:'0.875rem', fontWeight:'600', cursor:'pointer', fontFamily:'inherit' }}>
                Choose monthly
              </button>
            </div>

            {/* Annual */}
            <div style={{...card, border:'2px solid #0F4C5C', boxShadow:'0 4px 20px rgba(0,0,0,0.08)'}}>
              <div style={{...badge}}>BEST VALUE — 2 months free</div>
              <span style={{ fontSize:'0.72rem', fontWeight:'600', color:'#979899', textTransform:'uppercase', letterSpacing:'0.06em' }}>Annual</span>
              <div style={{ fontSize:'2rem', fontWeight:'700', margin:'0.75rem 0 0.25rem', color:'#111111' }}>R 1 490</div>
              <div style={{ color:'#979899', fontSize:'0.8rem', marginBottom:'1.5rem' }}>per year — R 124/month</div>
              <ul style={{ listStyle:'none', padding:0, margin:'0 0 1.5rem', fontSize:'0.85rem', color:'#979899' }}>
                <li style={{marginBottom:'0.4rem'}}>✓ Everything in monthly</li>
                <li style={{marginBottom:'0.4rem'}}>✓ Priority support</li>
                <li>✓ Early access to new features</li>
              </ul>
              <button onClick={()=>buildForm('annual')}
                style={{ width:'100%', padding:'0.75rem', background:'#111111', color:'#F9FAFA', border:'none', borderRadius:'12px', fontSize:'0.875rem', fontWeight:'600', cursor:'pointer', fontFamily:'inherit' }}>
                Choose annual
              </button>
            </div>

          </div>
        )}

        <p style={{ textAlign:'center', fontSize:'0.75rem', color:'#979899' }}>
          Secure payments via PayFast. Cancel anytime from your billing page.
        </p>
      </div>
    </div>
  );
}
