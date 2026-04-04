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

function Select({ label, value, onChange, options, tooltip }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', color: '#555', marginBottom: '0.25rem' }}>
        {label} {tooltip && <span title={tooltip} style={{ cursor: 'help', color: '#aaa' }}>?</span>}
      </label>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ width: '100%', padding: '0.5rem 0.625rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '0.875rem', background: '#fff' }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function NumberInput({ label, value, onChange, tooltip, prefix, suffix }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', color: '#555', marginBottom: '0.25rem' }}>
        {label} {tooltip && <span title={tooltip} style={{ cursor: 'help', color: '#aaa' }}>?</span>}
      </label>
      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: '6px', overflow: 'hidden' }}>
        {prefix && <span style={{ padding: '0.5rem 0.625rem', background: '#f5f5f3', fontSize: '0.875rem', color: '#888', borderRight: '1px solid #ddd' }}>{prefix}</span>}
        <input type="number" value={value} onChange={e => onChange(parseFloat(e.target.value) || 0)}
          style={{ flex: 1, padding: '0.5rem 0.625rem', border: 'none', outline: 'none', fontSize: '0.875rem' }} />
        {suffix && <span style={{ padding: '0.5rem 0.625rem', background: '#f5f5f3', fontSize: '0.875rem', color: '#888', borderLeft: '1px solid #ddd' }}>{suffix}</span>}
      </div>
    </div>
  );
}

export default function Calculator() {
  const { user, profile } = useAuth();
  const [inputs, setInputs] = useState(defaultInputs);
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function update(field, value) {
    setInputs(prev => ({ ...prev, [field]: value }));
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
      floor_area: inputs.floorArea, is_mixed_use: inputs.use2Category !== null,
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
    setSaving(false);
    setSaved(true);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  const subtypes1 = inputs.use1Category ? CATEGORIES.find(c => c.key === inputs.use1Category)?.subtypes || [] : [];

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f3', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '0.75rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: '600', fontSize: '1rem' }}>AprIQ</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.8rem', color: '#888' }}>{profile?.full_name || user?.email}</span>
          <button onClick={handleLogout} style={{ fontSize: '0.8rem', color: '#888', background: 'none', border: 'none', cursor: 'pointer' }}>Sign out</button>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.25rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

        {/* LEFT — Inputs */}
        <div>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', border: '1px solid #eee', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '1.25rem', color: '#1a1a18' }}>Building</h2>

            <Select label="Category" value={inputs.use1Category} onChange={v => { update('use1Category', v); update('use1Subtype', CATEGORIES.find(c=>c.key===v)?.subtypes[0]?.key || ''); }}
              options={CATEGORIES.map(c => ({ value: c.key, label: c.label }))} tooltip="Select the primary building category" />

            <Select label="Building type" value={inputs.use1Subtype} onChange={v => update('use1Subtype', v)}
              options={subtypes1.map(s => ({ value: s.key, label: s.label }))} tooltip="Select the specific building type" />

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

          <div style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', border: '1px solid #eee', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '1.25rem', color: '#1a1a18' }}>Project factors</h2>
            <Select label="Quality" value={inputs.qualityKey} onChange={v => update('qualityKey', v)}
              options={Object.entries(QUALITY).map(([k,v]) => ({ value: k, label: v.label }))} tooltip="Specification and finish level" />
            <Select label="Site access" value={inputs.siteAccessKey} onChange={v => update('siteAccessKey', v)}
              options={Object.entries(SITE_ACCESS).map(([k,v]) => ({ value: k, label: v.label }))} tooltip="Distance from urban centre affects logistics costs" />
            <Select label="Building complexity" value={inputs.complexityKey} onChange={v => update('complexityKey', v)}
              options={Object.entries(COMPLEXITY).map(([k,v]) => ({ value: k, label: v.label }))} tooltip="Structural and services complexity" />
          </div>

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

          <div style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', border: '1px solid #eee', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '1.25rem', color: '#1a1a18' }}>Financial inputs</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
              <NumberInput label="Contingency" value={inputs.contingencyPct * 100} onChange={v => update('contingencyPct', v/100)} suffix="%" tooltip="Contingency on construction cost" />
              <NumberInput label="Contractor profit" value={inputs.profitPct * 100} onChange={v => update('profitPct', v/100)} suffix="%" tooltip="Contractor profit margin" />
              <NumberInput label="Professional fees" value={inputs.feesPct * 100} onChange={v => update('feesPct', v/100)} suffix="%" tooltip="Architects, engineers, QS fees" />
              <NumberInput label="VAT" value={inputs.vatPct * 100} onChange={v => update('vatPct', v/100)} suffix="%" tooltip="VAT rate" />
            </div>
            <NumberInput label="Escalation rate" value={inputs.escalationRate} onChange={v => update('escalationRate', v)} suffix="% p.a." tooltip="Annual construction cost escalation rate" />
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', color: '#555', marginBottom: '0.25rem' }}>Estimated start date <span title="Used to calculate escalation" style={{ cursor: 'help', color: '#aaa' }}>?</span></label>
              <input type="date" value={inputs.estimatedStartDate || ''} onChange={e => update('estimatedStartDate', e.target.value || null)}
                style={{ width: '100%', padding: '0.5rem 0.625rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '0.875rem', boxSizing: 'border-box' }} />
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
              {result.allocationCheck !== 'OK' && (
                <div style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.875rem', color: '#856404' }}>
                  ⚠️ {result.allocationCheck}
                </div>
              )}

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
                  <span>Total</span>
                  <span>{formatZAR(result.totalProjectCost)}</span>
                </div>
              </div>

              <div style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', border: '1px solid #eee', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '1rem', color: '#1a1a18' }}>Weighted base rate</h3>
                <p style={{ fontSize: '1.25rem', fontWeight: '600' }}>{formatZAR(result.weightedBaseRate)} <span style={{ fontSize: '0.8rem', fontWeight: '400', color: '#888' }}>/ m²</span></p>
                <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '0.5rem' }}>
                  Quality ×{result.qualityMultiplier} · Site ×{result.siteMultiplier} · Complexity ×{result.complexityMultiplier}
                </p>
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
  );
}
