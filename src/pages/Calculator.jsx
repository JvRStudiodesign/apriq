import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { calculate } from '../engine/calculator';
import { CATEGORIES, QUALITY, SITE_ACCESS, PROJECT_TYPE, RENOVATION_COMPLEXITY, COMPLEXITY, LAND_PROCUREMENT, LAND_SLOPE } from '../engine/rates';

const defaultInputs = {
  use1Category: 'Residential', use1Subtype: 'Single Dwelling', use1Allocation: 1,
  use2Category: null, use2Subtype: null, use2Allocation: 0,
  use3Category: null, use3Subtype: null, use3Allocation: 0,
  floorArea: 0, complexityKey: 'Low Complexity', siteAccessKey: 'Urban Setting',
  projectTypeKey: 'New', renovationArea: 0, renovationComplexityKey: 'Low', qualityKey: 'Medium',
  contingencyPct: 0.10, profitPct: 0.10, feesPct: 0.12, vatPct: 0.15,
  landProcurementType: 'N/A', landArea: 0, landSlopeKey: 'Flat Land (0-5%)',
  escalationRate: 7, estimatedStartDate: null,
};

function formatZAR(n) {
  if (!n || isNaN(n)) return 'R 0';
  return 'R ' + Math.round(n).toLocaleString('en-ZA');
}

function Select({ label, value, onChange, options, tooltip, locked }) {
  return (
    <div style={{ marginBottom: '1rem', opacity: locked ? 0.5 : 1 }}>
      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', color: '#555', marginBottom: '0.25rem' }}>
        {label} {tooltip && <span title={tooltip} style={{ cursor: 'help', color: '#aaa' }}>?</span>}
        {locked && <span style={{ marginLeft: '6px', fontSize: '0.7rem', background: '#f0f0f0', padding: '1px 6px', borderRadius: '10px', color: '#888' }}>Pro</span>}
      </label>
      <select value={value} onChange={e => !locked && onChange(e.target.value)} disabled={locked}
        style={{ width: '100%', padding: '0.5rem 0.625rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '0.875rem', background: locked ? '#f9f9f9' : '#fff', cursor: locked ? 'not-allowed' : 'auto' }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function NumberInput({ label, value, onChange, tooltip, prefix, suffix, locked }) {
  return (
    <div style={{ marginBottom: '1rem', opacity: locked ? 0.5 : 1 }}>
      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', color: '#555', marginBottom: '0.25rem' }}>
        {label} {tooltip && <span title={tooltip} style={{ cursor: 'help', color: '#aaa' }}>?</span>}
        {locked && <span style={{ marginLeft: '6px', fontSize: '0.7rem', background: '#f0f0f0', padding: '1px 6px', borderRadius: '10px', color: '#888' }}>Pro</span>}
      </label>
      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: '6px', overflow: 'hidden', background: locked ? '#f9f9f9' : '#fff' }}>
        {prefix && <span style={{ padding: '0.5rem 0.625rem', background: '#f5f5f3', fontSize: '0.875rem', color: '#888', borderRight: '1px solid #ddd' }}>{prefix}</span>}
        <input type="number" value={value} onChange={e => !locked && onChange(parseFloat(e.target.value) || 0)} disabled={locked}
          style={{ flex: 1, padding: '0.5rem 0.625rem', border: 'none', outline: 'none', fontSize: '0.875rem', background: 'transparent', cursor: locked ? 'not-allowed' : 'auto' }} />
        {suffix && <span style={{ padding: '0.5rem 0.625rem', background: '#f5f5f3', fontSize: '0.875rem', color: '#888', borderLeft: '1px solid #ddd' }}>{suffix}</span>}
      </div>
    </div>
  );
}

function TrialBanner({ profile }) {
  if (!profile) return null;
  const tier = profile.tier;
  const trialEnd = profile.trial_end_date ? new Date(profile.trial_end_date) : null;
  const now = new Date();
  const daysLeft = trialEnd ? Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24)) : 0;

  if (tier === 'pro') return null;

  if (tier === 'trial' && daysLeft > 0) {
    const isWarning = daysLeft <= 2;
    return (
      <div style={{ background: isWarning ? '#fff3cd' : '#e8f4fd', border: `1px solid ${isWarning ? '#ffc107' : '#90caf9'}`, borderRadius: '8px', padding: '0.625rem 1rem', marginBottom: '1rem', fontSize: '0.8rem', color: isWarning ? '#856404' : '#0c447c', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{isWarning ? '⚠️' : '🎉'} {daysLeft === 1 ? 'Your Pro trial expires today' : `Your Pro trial expires in ${daysLeft} days`}</span>
        <a href="/upgrade" style={{ fontWeight: '600', color: 'inherit' }}>Upgrade →</a>
      </div>
    );
  }

  if ((tier === 'trial' && daysLeft <= 0) || tier === 'free') {
    return (
      <div style={{ background: '#fdecea', border: '1px solid #f5c6cb', borderRadius: '8px', padding: '0.625rem 1rem', marginBottom: '1rem', fontSize: '0.8rem', color: '#721c24', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Your Pro trial has ended. Some features are locked.</span>
        <a href="/upgrade" style={{ fontWeight: '600', color: 'inherit' }}>Upgrade to Pro →</a>
      </div>
    );
  }
  return null;
}

function FeedbackForm() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [sent, setSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    await supabase.from('estimates').select('id').limit(1); // placeholder — will wire to feedback table later
    setSent(true);
    setTimeout(() => { setOpen(false); setSent(false); setText(''); }, 2000);
  }

  return (
    <>
      <button onClick={() => setOpen(true)}
        style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', background: '#1a1a18', color: '#fff', border: 'none', borderRadius: '20px', padding: '0.5rem 1rem', fontSize: '0.8rem', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
        💬 Feedback
      </button>

      {open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', width: '100%', maxWidth: '400px', margin: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: '600' }}>Share feedback or a suggestion</h3>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: '1.2rem' }}>×</button>
            </div>
            {sent ? (
              <p style={{ color: '#27ae60', textAlign: 'center', padding: '1rem 0' }}>✓ Thanks — we'll review it shortly.</p>
            ) : (
              <form onSubmit={handleSubmit}>
                <textarea value={text} onChange={e => setText(e.target.value)} required rows={4} placeholder="What's working well? What's missing? What's confusing?"
                  style={{ width: '100%', padding: '0.625rem', border: '1px solid #ddd', borderRadius: '8px', fontSize: '0.875rem', resize: 'vertical', boxSizing: 'border-box', marginBottom: '0.75rem' }} />
                <button type="submit"
                  style={{ width: '100%', padding: '0.625rem', background: '#1a1a18', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.875rem', cursor: 'pointer' }}>
                  Send feedback
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default function Calculator() {
  const { user, profile } = useAuth();
  const [inputs, setInputs] = useState(defaultInputs);
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [mixedUse, setMixedUse] = useState(false);

  // Tier logic
  const tier = profile?.tier || 'free';
  const trialEnd = profile?.trial_end_date ? new Date(profile.trial_end_date) : null;
  const trialActive = tier === 'trial' && trialEnd && trialEnd > new Date();
  const isPro = tier === 'pro' || trialActive;
  const isLocked = (feature) => !isPro;

  function update(field, value) {
    setInputs(prev => ({ ...prev, [field]: value }));
    setResult(null);
  }

  function toggleMixedUse() {
    if (!isPro) return;
    const next = !mixedUse;
    setMixedUse(next);
    if (!next) {
      update('use2Category', null); update('use2Subtype', null); update('use2Allocation', 0);
      update('use3Category', null); update('use3Subtype', null); update('use3Allocation', 0);
      update('use1Allocation', 1);
    } else {
      const cat2 = CATEGORIES[1];
      update('use2Category', cat2.key); update('use2Subtype', cat2.subtypes[0].key); update('use2Allocation', 0.3);
      update('use1Allocation', 0.7);
    }
    setResult(null);
  }

  function handleCalculate() {
    const r = calculate(inputs);
    setResult(r);
    setSaved(false);
  }

  async function handleSave() {
    if (!result) return;
    setSaving(true);
    const ref = 'APR-' + Date.now().toString(36).toUpperCase();
    await supabase.from('estimates').insert({
      user_id: user.id, reference_number: ref,
      building_category: inputs.use1Category, building_subtype: inputs.use1Subtype,
      floor_area: inputs.floorArea, is_mixed_use: mixedUse,
      quality_multiplier: result.qualityMultiplier, site_access_multiplier: result.siteMultiplier,
      project_type_multiplier: result.projectTypeMultiplier, complexity_multiplier: result.complexityMultiplier,
      land_type: inputs.landProcurementType, land_area: inputs.landArea,
      slope_multiplier: result.earthworksMultiplier,
      contingency_pct: inputs.contingencyPct * 100, profit_pct: inputs.profitPct * 100,
      fees_pct: inputs.feesPct * 100, vat_pct: inputs.vatPct * 100,
      base_construction_cost: result.baseConstructionCostNew + result.baseConstructionCostRenovation,
      land_cost: result.landProcurementCost, contingency_amount: result.contingencyAmount,
      profit_amount: result.contractorProfit, fees_amount: result.professionalFees,
      vat_amount: result.vatAmount, total_project_cost: result.totalProjectCost,
      escalated_total: result.escalatedTotal, cost_breakdown: result.costBreakdown,
    });
    setSaving(false); setSaved(true);
  }

  async function handleLogout() { await supabase.auth.signOut(); }

  const subtypes1 = inputs.use1Category ? CATEGORIES.find(c => c.key === inputs.use1Category)?.subtypes || [] : [];
  const subtypes2 = inputs.use2Category ? CATEGORIES.find(c => c.key === inputs.use2Category)?.subtypes || [] : [];
  const subtypes3 = inputs.use3Category ? CATEGORIES.find(c => c.key === inputs.use3Category)?.subtypes || [] : [];

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f3', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '0.75rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: '600', fontSize: '1rem' }}>AprIQ</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.75rem', background: isPro ? '#eaf3de' : '#f0f0f0', color: isPro ? '#27500a' : '#888', padding: '2px 8px', borderRadius: '10px', fontWeight: '500' }}>
            {tier === 'pro' ? 'Pro' : trialActive ? 'Trial' : 'Free'}
          </span>
          <span style={{ fontSize: '0.8rem', color: '#888' }}>{profile?.full_name || user?.email}</span>
          <button onClick={handleLogout} style={{ fontSize: '0.8rem', color: '#888', background: 'none', border: 'none', cursor: 'pointer' }}>Sign out</button>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.25rem' }}>
        <TrialBanner profile={profile} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

          {/* LEFT — Inputs */}
          <div>
            {/* Building */}
            <div style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', border: '1px solid #eee', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1a1a18' }}>Building</h2>
                <button onClick={toggleMixedUse}
                  style={{ fontSize: '0.75rem', padding: '3px 10px', borderRadius: '12px', border: '1px solid #ddd', background: mixedUse ? '#1a1a18' : '#fff', color: mixedUse ? '#fff' : '#888', cursor: isPro ? 'pointer' : 'not-allowed', opacity: isPro ? 1 : 0.5 }}>
                  Mixed-use {!isPro && '🔒'}
                </button>
              </div>

              {/* Use 1 */}
              {mixedUse && <p style={{ fontSize: '0.75rem', color: '#aaa', marginBottom: '0.5rem', fontWeight: '500' }}>USE 1</p>}
              <Select label="Category" value={inputs.use1Category} onChange={v => { update('use1Category', v); update('use1Subtype', CATEGORIES.find(c=>c.key===v)?.subtypes[0]?.key || ''); }}
                options={CATEGORIES.map(c => ({ value: c.key, label: c.label }))} tooltip="Primary building category" />
              <Select label="Building type" value={inputs.use1Subtype} onChange={v => update('use1Subtype', v)}
                options={subtypes1.map(s => ({ value: s.key, label: s.label }))} tooltip="Specific building type" />
              {mixedUse && <NumberInput label="Allocation %" value={Math.round(inputs.use1Allocation * 100)} onChange={v => update('use1Allocation', v/100)} suffix="%" tooltip="Percentage of floor area for this use" />}

              {/* Use 2 */}
              {mixedUse && (
                <>
                  <div style={{ borderTop: '1px solid #f0f0f0', margin: '1rem 0' }} />
                  <p style={{ fontSize: '0.75rem', color: '#aaa', marginBottom: '0.5rem', fontWeight: '500' }}>USE 2</p>
                  <Select label="Category" value={inputs.use2Category || ''} onChange={v => { update('use2Category', v); update('use2Subtype', CATEGORIES.find(c=>c.key===v)?.subtypes[0]?.key || ''); }}
                    options={CATEGORIES.map(c => ({ value: c.key, label: c.label }))} tooltip="Second building category" />
                  <Select label="Building type" value={inputs.use2Subtype || ''} onChange={v => update('use2Subtype', v)}
                    options={subtypes2.map(s => ({ value: s.key, label: s.label }))} tooltip="Second building type" />
                  <NumberInput label="Allocation %" value={Math.round(inputs.use2Allocation * 100)} onChange={v => update('use2Allocation', v/100)} suffix="%" tooltip="Percentage of floor area for this use" />
                </>
              )}

              {/* Use 3 */}
              {mixedUse && (
                <>
                  <div style={{ borderTop: '1px solid #f0f0f0', margin: '1rem 0' }} />
                  <p style={{ fontSize: '0.75rem', color: '#aaa', marginBottom: '0.5rem', fontWeight: '500' }}>USE 3 (optional)</p>
                  <Select label="Category" value={inputs.use3Category || 'Residential'} onChange={v => { update('use3Category', v); update('use3Subtype', CATEGORIES.find(c=>c.key===v)?.subtypes[0]?.key || ''); }}
                    options={CATEGORIES.map(c => ({ value: c.key, label: c.label }))} tooltip="Third building category (optional)" />
                  <Select label="Building type" value={inputs.use3Subtype || ''} onChange={v => update('use3Subtype', v)}
                    options={subtypes3.map(s => ({ value: s.key, label: s.label }))} tooltip="Third building type (optional)" />
                  <NumberInput label="Allocation %" value={Math.round(inputs.use3Allocation * 100)} onChange={v => update('use3Allocation', v/100)} suffix="%" tooltip="Percentage for third use (0 to exclude)" />
                </>
              )}

              {mixedUse && result?.allocationCheck && (
                <p style={{ fontSize: '0.75rem', color: result.allocationCheck === 'OK' ? '#27ae60' : '#c0392b', marginTop: '0.5rem' }}>
                  {result.allocationCheck === 'OK' ? '✓ Allocation totals 100%' : '⚠️ ' + result.allocationCheck}
                </p>
              )}

              <div style={{ borderTop: '1px solid #f0f0f0', margin: '1rem 0' }} />

              <Select label="Project type" value={inputs.projectTypeKey} onChange={v => update('projectTypeKey', v)}
                options={Object.entries(PROJECT_TYPE).map(([k,v]) => ({ value: k, label: v.label }))} tooltip="New build, renovation or addition" />

              {inputs.projectTypeKey === 'Renovation' ? (
                <>
                  <NumberInput label="Renovation area (m²)" value={inputs.renovationArea} onChange={v => update('renovationArea', v)} tooltip="Floor area being renovated" suffix="m²" />
                  <Select label="Renovation complexity" value={inputs.renovationComplexityKey} onChange={v => update('renovationComplexityKey', v)}
                    options={Object.entries(RENOVATION_COMPLEXITY).map(([k,v]) => ({ value: k, label: v.label + ' — ' + v.description }))} tooltip="Extent of renovation works" />
                </>
              ) : (
                <NumberInput label="Floor area (m²)" value={inputs.floorArea} onChange={v => update('floorArea', v)} tooltip="Gross floor area of the building" suffix="m²" />
              )}
            </div>

            {/* Project factors */}
            <div style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', border: '1px solid #eee', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '1.25rem', color: '#1a1a18' }}>Project factors</h2>
              <Select label="Quality" value={inputs.qualityKey} onChange={v => update('qualityKey', v)}
                options={Object.entries(QUALITY).map(([k,v]) => ({ value: k, label: v.label }))} tooltip="Specification and finish level" />
              <Select label="Site access" value={inputs.siteAccessKey} onChange={v => update('siteAccessKey', v)}
                options={Object.entries(SITE_ACCESS).map(([k,v]) => ({ value: k, label: v.label }))} tooltip="Distance from urban centre" />
              <Select label="Building complexity" value={inputs.complexityKey} onChange={v => update('complexityKey', v)}
                options={Object.entries(COMPLEXITY).map(([k,v]) => ({ value: k, label: v.label }))} tooltip="Structural and services complexity" />
            </div>

            {/* Land */}
            <div style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', border: '1px solid #eee', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '1.25rem', color: '#1a1a18' }}>Land</h2>
              <Select label="Land procurement type" value={inputs.landProcurementType} onChange={v => update('landProcurementType', v)}
                options={Object.entries(LAND_PROCUREMENT).map(([k,v]) => ({ value: k, label: v.label }))} tooltip="Type of land being purchased" />
              {inputs.landProcurementType !== 'N/A' && (
                <>
                  <NumberInput label="Land area (m²)" value={inputs.landArea} onChange={v => update('landArea', v)} suffix="m²" tooltip="Total land area to be purchased" />
                  <Select label="Land type / slope" value={inputs.landSlopeKey} onChange={v => update('landSlopeKey', v)}
                    options={Object.entries(LAND_SLOPE).map(([k,v]) => ({ value: k, label: v.label }))} tooltip="Slope affects earthworks cost" />
                </>
              )}
            </div>

            {/* Financial inputs */}
            <div style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', border: '1px solid #eee', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '1.25rem', color: '#1a1a18' }}>Financial inputs</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
                <NumberInput label="Contingency" value={inputs.contingencyPct * 100} onChange={v => update('contingencyPct', v/100)} suffix="%" tooltip="Contingency on construction cost" />
                <NumberInput label="Contractor profit" value={inputs.profitPct * 100} onChange={v => update('profitPct', v/100)} suffix="%" tooltip="Contractor profit margin" />
                <NumberInput label="Professional fees" value={inputs.feesPct * 100} onChange={v => update('feesPct', v/100)} suffix="%" tooltip="Architects, engineers, QS fees" />
                <NumberInput label="VAT" value={inputs.vatPct * 100} onChange={v => update('vatPct', v/100)} suffix="%" tooltip="VAT rate" />
              </div>
              <NumberInput label="Escalation rate" value={inputs.escalationRate} onChange={v => update('escalationRate', v)} suffix="% p.a."
                tooltip="Annual construction cost escalation — adjustable on Pro" locked={isLocked('escalation')} />
              <div style={{ marginBottom: '1rem', opacity: isLocked('escalation') ? 0.5 : 1 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', color: '#555', marginBottom: '0.25rem' }}>
                  Estimated start date <span title="Used to calculate escalation" style={{ cursor: 'help', color: '#aaa' }}>?</span>
                  {isLocked('escalation') && <span style={{ marginLeft: '6px', fontSize: '0.7rem', background: '#f0f0f0', padding: '1px 6px', borderRadius: '10px', color: '#888' }}>Pro</span>}
                </label>
                <input type="date" value={inputs.estimatedStartDate || ''} onChange={e => !isLocked('escalation') && update('estimatedStartDate', e.target.value || null)}
                  disabled={isLocked('escalation')}
                  style={{ width: '100%', padding: '0.5rem 0.625rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '0.875rem', boxSizing: 'border-box', background: isLocked('escalation') ? '#f9f9f9' : '#fff', cursor: isLocked('escalation') ? 'not-allowed' : 'auto' }} />
              </div>
            </div>

            <button onClick={handleCalculate}
              style={{ width: '100%', padding: '0.875rem', background: '#1a1a18', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer' }}>
              Calculate estimate
            </button>
          </div>

          {/* RIGHT — Results */}
          <div>
            {!result ? (
              <div style={{ background: '#fff', borderRadius: '12px', padding: '3rem 1.5rem', border: '1px solid #eee', textAlign: 'center', color: '#aaa' }}>
                <p style={{ fontSize: '0.9rem' }}>Fill in the inputs and click<br /><strong style={{ color: '#555' }}>Calculate estimate</strong> to see results.</p>
              </div>
            ) : (
              <>
                <div style={{ background: '#1a1a18', borderRadius: '12px', padding: '1.5rem', marginBottom: '1rem', color: '#fff' }}>
                  <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '0.25rem' }}>Total project cost</p>
                  <p style={{ fontSize: '2rem', fontWeight: '700', letterSpacing: '-0.5px' }}>{formatZAR(result.totalProjectCost)}</p>
                  {result.escalatedTotal !== result.totalProjectCost && (
                    <p style={{ fontSize: '0.85rem', color: '#aaa', marginTop: '0.5rem' }}>Escalated ({result.monthsToStart} months): {formatZAR(result.escalatedTotal)}</p>
                  )}
                </div>

                <div style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', border: '1px solid #eee', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '1rem', color: '#1a1a18' }}>Cost breakdown</h3>
                  {[
                    { label: 'Earthworks', value: result.earthworksCost },
                    { label: 'Construction cost (new)', value: result.baseConstructionCostNew },
                    { label: 'Construction cost (renovation)', value: result.baseConstructionCostRenovation },
                    { label: 'Land procurement', value: result.landProcurementCost },
                    { label: 'Contingency', value: result.contingencyAmount },
                    { label: 'Contractor profit', value: result.contractorProfit },
                    { label: 'Preliminaries', value: result.preliminaries },
                    { label: 'Professional fees', value: result.professionalFees },
                    { label: 'VAT', value: result.vatAmount },
                  ].filter(r => r.value > 0).map(row => (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f0f0f0', fontSize: '0.875rem' }}>
                      <span style={{ color: '#555' }}>{row.label}</span>
                      <span style={{ fontWeight: '500' }}>{formatZAR(row.value)}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0 0', fontSize: '0.95rem', fontWeight: '700' }}>
                    <span>Total</span><span>{formatZAR(result.totalProjectCost)}</span>
                  </div>
                </div>

                <div style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', border: '1px solid #eee', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem', color: '#1a1a18' }}>Weighted base rate</h3>
                  <p style={{ fontSize: '1.25rem', fontWeight: '600' }}>{formatZAR(result.weightedBaseRate)} <span style={{ fontSize: '0.8rem', fontWeight: '400', color: '#888' }}>/ m²</span></p>
                  <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '0.25rem' }}>Quality ×{result.qualityMultiplier} · Site ×{result.siteMultiplier} · Complexity ×{result.complexityMultiplier}</p>
                </div>

                <button onClick={handleSave} disabled={saving || saved}
                  style={{ width: '100%', padding: '0.75rem', background: saved ? '#27ae60' : '#fff', color: saved ? '#fff' : '#1a1a18', border: '1px solid #ddd', borderRadius: '10px', fontSize: '0.9rem', fontWeight: '500', cursor: 'pointer' }}>
                  {saving ? 'Saving...' : saved ? '✓ Estimate saved' : 'Save estimate'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <FeedbackForm />
    </div>
  );
}
