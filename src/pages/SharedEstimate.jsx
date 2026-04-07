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
      if (new Date(data.expires_at) < new Date()) { setErr('This estimate link expired 7 days after it was shared.'); setLoad(false); return; }
      setSnap(data.snapshot_data);
      setLoad(false);
    }
    load();
  }, [token]);

  const pg     = { maxWidth:'720px', margin:'0 auto', padding:'2rem 1.25rem 4rem', fontFamily:'-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', fontSize:'0.875rem', color:'#1a1a18' };
  const card   = { background:'#fff', borderRadius:'12px', padding:'1.25rem 1.5rem', border:'1px solid #eee', marginBottom:'1rem' };
  const stitle = { fontSize:'0.72rem', fontWeight:'600', color:'#aaa', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'0.75rem' };
  const row    = { display:'flex', justifyContent:'space-between', padding:'0.35rem 0', borderBottom:'1px solid #f5f5f3' };
  const lbl    = { color:'#666' };
  const bold   = { fontWeight:'600', color:'#1a1a18' };
  const divdr  = { borderTop:'1px solid #f0f0ee', margin:'0.625rem 0' };

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f5f5f3' }}>
      <p style={{ color:'#aaa', fontSize:'0.875rem' }}>Loading estimate\u2026</p>
    </div>
  );

  if (err) return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'1rem', background:'#f5f5f3' }}>
      <p style={{ color:'#888', fontSize:'0.875rem', textAlign:'center', maxWidth:'300px' }}>{err}</p>
      <Link to="/signup" style={{ padding:'0.625rem 1.25rem', background:'#1a1a18', color:'#fff', borderRadius:'8px', textDecoration:'none', fontSize:'0.875rem', fontWeight:'500' }}>Try AprIQ free</Link>
    </div>
  );

  const { inputs, result, userDetails, project, client, reference, numCats, isRenovation, _sharedAt } = snap;
  const issueDate = _sharedAt ? new Date(_sharedAt).toLocaleDateString('en-ZA', { day:'numeric', month:'long', year:'numeric' }) : '';

  return (
    <div style={{ background:'#f5f5f3', minHeight:'100vh', paddingTop:'1.5rem' }}>
      <div style={pg}>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.5rem', flexWrap:'wrap', gap:'0.75rem' }}>
          <div>
            {userDetails?.company_logo_url && <img src={userDetails.company_logo_url} alt="logo" style={{ height:'36px', marginBottom:'0.5rem', display:'block' }} />}
            <div style={{ fontWeight:'700', fontSize:'1.05rem' }}>{userDetails?.company || 'AprIQ Estimate'}</div>
            {userDetails?.full_name && <div style={{ color:'#888', fontSize:'0.8rem' }}>{userDetails.full_name}</div>}
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontWeight:'600', fontSize:'0.85rem' }}>Ref: {reference || '\u2014'}</div>
            {issueDate && <div style={{ color:'#888', fontSize:'0.75rem', marginTop:'2px' }}>Issued: {issueDate}</div>}
            <div style={{ color:'#c0392b', fontSize:'0.7rem', marginTop:'3px' }}>Valid for 7 days</div>
          </div>
        </div>

        {(project?.project_name || client?.name || inputs?.projectName || inputs?.clientName) && (
          <div style={card}>
            <div style={stitle}>Project details</div>
            {(project?.project_name || inputs?.projectName) && <div style={row}><span style={lbl}>Project</span><span style={bold}>{project?.project_name || inputs?.projectName}</span></div>}
            {(client?.name || inputs?.clientName) && <div style={row}><span style={lbl}>Client</span><span style={bold}>{client?.name || inputs?.clientName}</span></div>}
            {project?.address && <div style={row}><span style={lbl}>Address</span><span style={bold}>{project.address}</span></div>}
          </div>
        )}

        <div style={card}>
          <div style={stitle}>Project parameters</div>
          {numCats > 1
            ? [1,2,3].slice(0,numCats).map(i => inputs[`use${i}Category`]
                ? <div key={i} style={row}><span style={lbl}>Use {i}</span><span style={bold}>{inputs[`use${i}Category`]} \u2014 {inputs[`use${i}Subtype`]} ({inputs[`use${i}Pct`]}%)</span></div>
                : null)
            : <div style={row}><span style={lbl}>Building type</span><span style={bold}>{inputs?.buildingCategory} \u2014 {inputs?.buildingSubtype}</span></div>
          }
          <div style={row}><span style={lbl}>Floor area</span><span style={bold}>{inputs?.floorArea?.toLocaleString('en-ZA')} m\u00b2</span></div>
          {isRenovation && inputs?.renovationPct != null && (
            <div style={row}><span style={lbl}>Renovation split</span><span style={bold}>{inputs.renovationPct}% renovation / {100 - inputs.renovationPct}% new build</span></div>
          )}
        </div>

        {result && (
          <div style={card}>
            <div style={stitle}>Rate summary</div>
            <div style={row}><span style={lbl}>Base rate</span><span style={bold}>{fmtZAR(result.baseRate)} /m\u00b2</span></div>
            {result.qualityUplift > 0     && <div style={row}><span style={lbl}>Quality adjustment</span><span style={bold}>+ {fmtZAR(result.qualityUplift)} /m\u00b2</span></div>}
            {result.siteUplift > 0        && <div style={row}><span style={lbl}>Site access</span><span style={bold}>+ {fmtZAR(result.siteUplift)} /m\u00b2</span></div>}
            {result.complexityUplift > 0  && <div style={row}><span style={lbl}>Complexity</span><span style={bold}>+ {fmtZAR(result.complexityUplift)} /m\u00b2</span></div>}
            {result.projectTypeUplift > 0 && <div style={row}><span style={lbl}>Project type</span><span style={bold}>+ {fmtZAR(result.projectTypeUplift)} /m\u00b2</span></div>}
            <div style={divdr} />
            <div style={row}><span style={{ ...lbl, fontWeight:'600' }}>Adjusted base rate</span><span style={bold}>{fmtZAR(result.adjustedRate)} /m\u00b2</span></div>
          </div>
        )}

        {result?.breakdown && (
          <div style={card}>
            <div style={stitle}>11-element cost breakdown</div>
            {result.breakdown.map((el, i) => (
              <div key={i} style={row}><span style={lbl}>{el.name}</span><span style={bold}>{fmtZAR(el.amount)}</span></div>
            ))}
          </div>
        )}

        {result && (
          <div style={card}>
            <div style={stitle}>Financial summary</div>
            <div style={row}><span style={lbl}>Construction cost</span><span style={bold}>{fmtZAR(result.constructionCost)}</span></div>
            {result.landCost > 0 && <div style={row}><span style={lbl}>Land cost</span><span style={bold}>{fmtZAR(result.landCost)}</span></div>}
            <div style={row}><span style={lbl}>Contingency ({pct(inputs?.contingencyPct / 100)})</span><span style={bold}>{fmtZAR(result.contingencyAmount)}</span></div>
            <div style={row}><span style={lbl}>Professional fees ({pct(inputs?.feesPct / 100)})</span><span style={bold}>{fmtZAR(result.feesAmount)}</span></div>
            <div style={row}><span style={lbl}>Developer profit ({pct(inputs?.profitPct / 100)})</span><span style={bold}>{fmtZAR(result.profitAmount)}</span></div>
            <div style={row}><span style={lbl}>VAT ({pct(inputs?.vatPct / 100)})</span><span style={bold}>{fmtZAR(result.vatAmount)}</span></div>
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

        <div style={{ background:'#fffbe6', border:'1px solid #f0e5b0', borderRadius:'10px', padding:'0.875rem 1rem', marginBottom:'1.5rem', fontSize:'0.78rem', color:'#7a6500', lineHeight:'1.55' }}>
          <strong>ROM Disclaimer:</strong> This estimate is a Rough Order of Magnitude (ROM) for budgeting purposes only. It is not a formal bill of quantities or a binding cost commitment. Actual costs may vary based on site conditions, material specifications, market conditions, and contractor pricing. A detailed cost plan by a registered Quantity Surveyor is recommended before committing to any project.
        </div>

        <div style={{ background:'#1a1a18', borderRadius:'14px', padding:'1.75rem 1.5rem', textAlign:'center', marginBottom:'1.5rem' }}>
          <div style={{ color:'#fff', fontWeight:'700', fontSize:'1.05rem', marginBottom:'0.375rem' }}>Generate your own estimates</div>
          <div style={{ color:'#aaa', fontSize:'0.82rem', marginBottom:'1.25rem' }}>AprIQ \u2014 construction cost intelligence for South African professionals. 7-day Pro trial, no card required.</div>
          <Link to="/signup" style={{ display:'inline-block', padding:'0.75rem 2rem', background:'#fff', color:'#1a1a18', borderRadius:'10px', textDecoration:'none', fontWeight:'600', fontSize:'0.875rem' }}>
            Try AprIQ free \u2014 get unlimited estimates
          </Link>
        </div>

        <div style={{ textAlign:'center', color:'#ccc', fontSize:'0.75rem' }}>
          Report generated by AprIQ \u2014 apriq.co.za
        </div>

      </div>
    </div>
  );
}
