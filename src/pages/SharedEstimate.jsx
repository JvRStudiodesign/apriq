import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

function fmtZAR(n) {
  if (!n || isNaN(n) || n === 0) return 'R 0';
  return 'R ' + Math.round(n).toLocaleString('en-ZA');
}
function pct(p) { return p != null ? (p * 100).toFixed(1) + '%' : ''; }

export default function SharedEstimate() {
  const { token } = useParams();
  const [snap, setSnap]    = useState(null);
  const [err, setErr]      = useState('');
  const [loading, setLoad] = useState(true);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('estimate_snapshots')
        .select('snapshot_data, expires_at')
        .eq('share_token', token)
        .single();
      if (error || !data)                         { setErr('This estimate link is invalid or has expired.'); setLoad(false); return; }
      if (new Date(data.expires_at) < new Date()) { setErr('This estimate link has expired.'); setLoad(false); return; }
      setSnap(data.snapshot_data);
      setLoad(false);
    }
    load();
  }, [token]);

  const pg     = { maxWidth:'720px', margin:'0 auto', padding:'2rem 1.25rem 4rem', fontFamily:"'Roboto', system-ui, sans-serif", fontSize:'0.875rem', color:'#1a1a18' };
  const card   = { background:'#F9FAFA', borderRadius:'16px', padding:'1.25rem 1.5rem', border:'1px solid #E4E5E5', marginBottom:'1rem' };
  const stitle = { fontSize:'0.72rem', fontWeight:'600', color:'#aaa', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'0.75rem' };
  const row    = { display:'flex', justifyContent:'space-between', padding:'0.35rem 0', borderBottom:'1px solid #E4E5E5' };
  const lbl    = { color:'#979899', textAlign:'left', flex:1, minWidth:0 };
  const bold   = { fontWeight:'600', color:'#111111', textAlign:'right', flexShrink:0 };
  const divdr  = { borderTop:'1px solid #E4E5E5', margin:'0.625rem 0' };

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#F9FAFA' }}>
      <p style={{ color:'#979899', fontSize:'0.875rem' }}>Loading estimate...</p>
    </div>
  );

  if (err) return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'1rem', background:'#F9FAFA' }}>
      <p style={{ color:'#979899', fontSize:'0.875rem', textAlign:'center', maxWidth:'300px' }}>{err}</p>
      <Link to="/signup" style={{ padding:'0.625rem 1.25rem', background:'#1a1a18', color:'#fff', borderRadius:'8px', textDecoration:'none', fontSize:'0.875rem', fontWeight:'500' }}>Try AprIQ free</Link>
    </div>
  );

  const { inputs, result, userDetails, project, client, reference, numCats, isRenovation, _sharedAt } = snap;
  const issueDate = _sharedAt ? new Date(_sharedAt).toLocaleDateString('en-ZA', { day:'numeric', month:'long', year:'numeric' }) : '';

  // Compute rate uplifts from multipliers (same approach as PDF)
  const baseRate = numCats === 1 ? (result?.rate1Raw || result?.rate1 || 0) : (result?.weightedBaseRate || 0);
  const qMult    = result?.qualityMultiplier || 1;
  const sMult    = result?.siteMultiplier || 1;
  const cMult    = result?.complexityMultiplier || 1;
  const ptMult   = result?.projectTypeMultiplier || 1;
  const qualityUplift      = baseRate * (qMult - 1);
  const siteUplift         = baseRate * qMult * (sMult - 1);
  const complexityUplift   = baseRate * qMult * sMult * (cMult - 1);
  const projectTypeUplift  = baseRate * qMult * sMult * cMult * (ptMult - 1);
  const adjustedRate       = result?.totalAdjustedBaseRate || result?.appliedRate || 0;
  const breakdown          = result?.elementBreakdown || [];
  const logoUrl            = userDetails?.logo_url || userDetails?.company_logo_url || null;
  const companyName        = userDetails?.company_name || userDetails?.company || '';

  return (
    <div style={{ background:'#F9FAFA', minHeight:'100vh', paddingTop:'1.5rem' }}>
      <div style={pg}>

        {/* Header — matches PDF layout */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.5rem', flexWrap:'wrap', gap:'0.75rem' }}>
          <div>
            {logoUrl
              ? <img src={logoUrl} alt="logo" style={{ height:'44px', marginBottom:'0.5rem', display:'block', objectFit:'contain' }} />
              : <img src="/logo-transparent.png" alt="AprIQ" style={{ height:'44px', marginBottom:'0.5rem', display:'block', objectFit:'contain' }} />
            }
            {userDetails?.full_name && <div style={{ fontWeight:'600', fontSize:'0.9rem' }}>{userDetails.full_name}</div>}
            {companyName && <div style={{ color:'#979899', fontSize:'0.8rem' }}>{companyName}</div>}
            {userDetails?.email && <div style={{ color:'#979899', fontSize:'0.78rem' }}>{userDetails.email}</div>}
            {userDetails?.phone && <div style={{ color:'#979899', fontSize:'0.78rem' }}>{userDetails.phone}</div>}
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:'0.7rem', color:'#aaa', textTransform:'uppercase', letterSpacing:'0.05em' }}>Reference</div>
            <div style={{ fontWeight:'700', fontSize:'1rem' }}>{reference || '—'}</div>
            {issueDate && <div style={{ color:'#979899', fontSize:'0.75rem', marginTop:'2px' }}>{issueDate}</div>}
            <div style={{ color:'#979899', fontSize:'0.72rem', marginTop:'2px' }}>ROM Cost Estimate</div>
          </div>
        </div>

        {/* Project details */}
        {(project?.project_name || client?.name || inputs?.projectName || inputs?.clientName) && (
          <div style={card}>
            <div style={stitle}>Project details</div>
            {(project?.project_name || inputs?.projectName) && <div style={row}><span style={lbl}>Project</span><span style={bold}>{project?.project_name || inputs?.projectName}</span></div>}
            {(client?.name || inputs?.clientName) && <div style={row}><span style={lbl}>Client</span><span style={bold}>{client?.name || inputs?.clientName}</span></div>}
            {project?.address && <div style={row}><span style={lbl}>Address</span><span style={bold}>{project.address}</span></div>}
          </div>
        )}

        {/* Project parameters */}
        <div style={card}>
          <div style={stitle}>Project parameters</div>
          {numCats > 1
            ? [1,2,3].slice(0,numCats).map(i => inputs[`use${i}Category`]
                ? <div key={i} style={row}><span style={lbl}>Use {i}</span><span style={bold}>{inputs[`use${i}Category`]} — {inputs[`use${i}Subtype`]} ({inputs[`use${i}Pct`]}%)</span></div>
                : null)
            : <div style={row}><span style={lbl}>Building type</span><span style={bold}>{inputs?.use1Category || inputs?.buildingCategory} — {inputs?.use1Subtype || inputs?.buildingSubtype}</span></div>
          }
          <div style={row}><span style={lbl}>Floor area</span><span style={bold}>{inputs?.floorArea?.toLocaleString('en-ZA')} m²</span></div>
          {inputs?.projectTypeKey && <div style={row}><span style={lbl}>Project type</span><span style={bold}>{inputs.projectTypeKey}</span></div>}
          {isRenovation && inputs?.renovationPct != null && <div style={row}><span style={lbl}>Renovation split</span><span style={bold}>{inputs.renovationPct}% renovation / {100 - inputs.renovationPct}% new build</span></div>}
          {inputs?.qualityKey && <div style={row}><span style={lbl}>Quality</span><span style={bold}>{inputs.qualityKey}</span></div>}
          {inputs?.siteAccessKey && <div style={row}><span style={lbl}>Site access</span><span style={bold}>{inputs.siteAccessKey}</span></div>}
          {inputs?.complexityKey && <div style={row}><span style={lbl}>Complexity</span><span style={bold}>{inputs.complexityKey}</span></div>}
        </div>

        {/* Rate summary */}
        {result && (
          <div style={card}>
            <div style={stitle}>Rate summary</div>
            <div style={row}><span style={lbl}>Base rate{inputs?.use1Subtype ? ` (${inputs.use1Subtype})` : ''}</span><span style={bold}>{fmtZAR(baseRate)} /m²</span></div>
            {qualityUplift > 0    && <div style={row}><span style={lbl}>Quality — {inputs?.qualityKey}</span><span style={bold}>+ {fmtZAR(qualityUplift)} /m²</span></div>}
            {siteUplift > 0       && <div style={row}><span style={lbl}>Site — {inputs?.siteAccessKey}</span><span style={bold}>+ {fmtZAR(siteUplift)} /m²</span></div>}
            {complexityUplift > 0 && <div style={row}><span style={lbl}>Complexity — {inputs?.complexityKey}</span><span style={bold}>+ {fmtZAR(complexityUplift)} /m²</span></div>}
            <div style={divdr} />
            {isRenovation && result?.renovationMultiplier > 1 && <>
              <div style={row}><span style={{ ...lbl, fontWeight:'600' }}>{isRenovation ? 'Construction rate — new work' : 'Total adjusted base rate'}</span><span style={bold}>{fmtZAR(adjustedRate)} /m²</span></div>
              <div style={row}><span style={lbl}>Renovation — {inputs?.renovationComplexityKey} (x{result?.renovationMultiplier})</span><span style={bold}>+ {fmtZAR(adjustedRate * ((result?.renovationMultiplier||1) - 1))} /m²</span></div>
              <div style={divdr} />
              <div style={row}><span style={{ ...lbl, fontWeight:'600' }}>Construction rate — renovation</span><span style={bold}>{fmtZAR(adjustedRate * (result?.renovationMultiplier||1))} /m²</span></div>
            </>}
            {!isRenovation && <div style={row}><span style={{ ...lbl, fontWeight:'600' }}>Total adjusted base rate</span><span style={bold}>{fmtZAR(adjustedRate)} /m²</span></div>}
          </div>
        )}

        {/* 11-element breakdown */}
        {breakdown.length > 0 && (
          <div style={card}>
            <div style={stitle}>Element breakdown</div>
            {breakdown.map((el, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', padding:'0.35rem 0', borderBottom:'1px solid #E4E5E5' }}>
                <span style={{ flex:1, color:'#979899', textAlign:'left', paddingRight:'0.5rem' }}>{el.label}</span>
                <span style={{ width:'52px', color:'#979899', fontSize:'0.8rem', textAlign:'right', paddingRight:'1rem', flexShrink:0 }}>{el.effectivePct != null ? (el.effectivePct*100).toFixed(1)+'%' : ''}</span>
                <span style={{ width:'100px', fontWeight:'600', color:'#111111', textAlign:'right', flexShrink:0 }}>{fmtZAR(el.amount)}</span>
              </div>
            ))}
            {isRenovation && result?.newArea > 0 && <div style={{ ...row, marginTop:'0.5rem' }}><span style={{ ...lbl, fontWeight:'600' }}>Construction cost — New ({result.newArea} m²)</span><span style={bold}>{fmtZAR(result.baseConstructionCostNew)}</span></div>}
            {isRenovation && result?.renovArea > 0 && <div style={row}><span style={{ ...lbl, fontWeight:'600' }}>Construction cost — Renovation ({result.renovArea} m²)</span><span style={bold}>{fmtZAR(result.baseConstructionCostRenovation)}</span></div>}
            {!isRenovation && <div style={{ ...row, marginTop:'0.5rem' }}><span style={{ ...lbl, fontWeight:'600' }}>Construction cost ({inputs?.floorArea} m²)</span><span style={bold}>{fmtZAR(result?.constructionCost)}</span></div>}
          </div>
        )}

        {/* Financial stack */}
        {result && (
          <div style={card}>
            <div style={stitle}>Financial stack</div>
            <div style={row}><span style={lbl}>Construction cost</span><span style={bold}>{fmtZAR(result.constructionCost)}</span></div>
            {(result.landProcurementCost > 0) && <div style={row}><span style={lbl}>Land cost</span><span style={bold}>{fmtZAR(result.landProcurementCost)}</span></div>}
            {result.contingencyAmount > 0 && <div style={row}><span style={lbl}>Contingency ({pct(inputs?.contingencyPct)})</span><span style={bold}>{fmtZAR(result.contingencyAmount)}</span></div>}
            {result.contractorProfit > 0 && <div style={row}><span style={lbl}>Contractor profit ({pct(inputs?.profitPct)})</span><span style={bold}>{fmtZAR(result.contractorProfit)}</span></div>}
            {result.preliminaries > 0 && <div style={row}><span style={lbl}>Preliminaries ({pct(inputs?.preliminariesPct)})</span><span style={bold}>{fmtZAR(result.preliminaries)}</span></div>}
            {result.professionalFees > 0 && <div style={row}><span style={lbl}>Professional fees ({pct(inputs?.feesPct)})</span><span style={bold}>{fmtZAR(result.professionalFees)}</span></div>}
            {result.vatAmount > 0 && <div style={row}><span style={lbl}>VAT ({pct(inputs?.vatPct)})</span><span style={bold}>{fmtZAR(result.vatAmount)}</span></div>}
            <div style={divdr} />
            <div style={{ ...row, paddingTop:'0.5rem' }}>
              <span style={{ fontWeight:'700', fontSize:'1rem' }}>Total project cost</span>
              <span style={{ fontWeight:'700', fontSize:'1rem' }}>{fmtZAR(result.totalProjectCost)}</span>
            </div>
            {result.escalatedTotal && result.escalatedTotal !== result.totalProjectCost && (
              <div style={{ ...row, marginTop:'0.25rem' }}>
                <span style={{ ...lbl, color:'#e67e22' }}>Escalated total</span>
                <span style={{ fontWeight:'600', color:'#e67e22' }}>{fmtZAR(result.escalatedTotal)}</span>
              </div>
            )}
          </div>
        )}

        {/* ROM Disclaimer */}
        <div style={{ background:'#F9FAFA', border:'1px solid #E4E5E5', borderRadius:'10px', padding:'0.875rem 1rem', marginBottom:'0.75rem', fontSize:'0.78rem', color:'#0F4C5C', lineHeight:'1.55' }}>
          <strong>ROM Disclaimer:</strong> This estimate is a Rough Order of Magnitude (ROM) for early-stage planning and feasibility purposes only. Figures are based on average market rates from AprIQ's internal cost database and are subject to variation depending on site conditions, specification, contractor pricing, and market conditions at time of tender. This does not constitute a formal quantity survey, bill of quantities, or professional cost advice. AprIQ accepts no liability for decisions made on the basis of this estimate. A registered professional quantity surveyor should be appointed for detailed cost planning.
        </div>

        {/* Link expiry notice — below ROM disclaimer */}
        <div style={{ textAlign:'center', color:'#aaa', fontSize:'0.75rem', marginBottom:'1.5rem' }}>
          Link will expire in 7 days
        </div>

        {/* CTA */}
        <div style={{ background:'#111111', borderRadius:'20px', padding:'1.75rem 1.5rem', textAlign:'center', marginBottom:'1.5rem' }}>
          <div style={{ color:'#F9FAFA', fontWeight:'700', fontSize:'1.05rem', marginBottom:'0.375rem' }}>Generate your own estimates</div>
          <div style={{ color:'#BFD1D6', fontSize:'0.82rem', marginBottom:'1.25rem' }}>AprIQ — construction cost intelligence for South African professionals. 7-day Pro trial, no card required.</div>
          <Link to="/signup" style={{ display:'inline-block', padding:'0.75rem 2rem', background:'#F9FAFA', color:'#111111', borderRadius:'12px', textDecoration:'none', fontWeight:'600', fontSize:'0.875rem' }}>
            Try AprIQ free — get unlimited estimates
          </Link>
        </div>

        <div style={{ textAlign:'center', color:'#979899', fontSize:'0.75rem' }}>
          Report generated by AprIQ — apriq.co.za
        </div>

      </div>
    </div>
  );
}
