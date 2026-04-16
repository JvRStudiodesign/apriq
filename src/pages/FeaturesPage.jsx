import { useFadeIn } from '../hooks/useFadeIn';

const BENEFIT_PILLS = ['Faster Early Decisions','Structured Cost Guidance','Instant Cost Breakdown','Clearer Feasibility Planning'];
const COMPARISON = [
  { feature:'Estimates',  desc:'Create structured early-stage cost estimates',      free:'Basic',   pro:'Full'    },
  { feature:'Projects',   desc:'Save and manage project workspaces',                free:'Limited', pro:'More'    },
  { feature:'Clients',    desc:'Manage client details for linked project use',      free:'Limited', pro:'More'    },
  { feature:'Exports',    desc:'Generate professional PDF estimates',               free:'No',      pro:'Yes'     },
  { feature:'Sharing',    desc:'Generate shareable link estimates for stakeholders',free:'No',      pro:'Yes'     },
  { feature:'Access',     desc:'Unlock the full AprIQ workflow',                    free:'Basic',   pro:'Full'    },
  { feature:'Storage',    desc:'Save more working data over time',                  free:'Limited', pro:'More'    },
];

export default function FeaturesPage() {
  const r1=useFadeIn(), r2=useFadeIn(), r3=useFadeIn();
  return (
    <div>
      <div style={s.pageTop}/>
      <section style={s.section}><div className="wrap" ref={r1}><div style={s.panel} className="fi-group">
        <h1 style={s.h1} className="fi">Features</h1>
        <p style={s.body} className="fi">AprIQ combines speed, structure, and clarity to support early-stage construction cost planning. Key features include building and project type selection, structured cost adjustments, rate summaries, elemental breakdowns, and clear total project cost outputs.</p>
        <p style={{...s.body,marginTop:12}} className="fi">AprIQ also supports practical workflow needs by allowing estimates to be saved, linked to projects and clients, and used to support early feasibility discussions, budget planning, and decision-making.</p>
        <div style={s.pillRow} className="fi">{BENEFIT_PILLS.map((p) => <span key={p} style={s.pill}>{p}</span>)}</div>
      </div></div></section>

      <section style={s.section}><div className="wrap" ref={r2}><div style={s.panel} className="fi-group">
        <h2 style={s.h2} className="fi">Free and Pro</h2>
        <p style={s.body} className="fi">Choose the plan that fits how you work.</p>
        <p style={{...s.body,marginTop:8}} className="fi">Free is designed for getting started with AprIQ and exploring the platform's early-stage estimating workflow. Pro is built for users who need a more complete working setup, with expanded access for ongoing project use, saved workflows, and professional output needs.</p>
        <div style={s.tableWrap} className="fi">
          <div style={s.tableHead}>
            <div style={s.colFeature}>Feature</div>
            <div style={s.colFree}>Free</div>
            <div style={s.colPro}>Pro</div>
          </div>
          {COMPARISON.map((row,i) => (
            <div key={row.feature} style={{...s.tableRow,background:i%2===0?'#F9FAFA':'#F4F4F2'}}>
              <div style={s.colFeature}><span style={s.rowFeature}>{row.feature}</span><span style={s.rowDesc}>{row.desc}</span></div>
              <div style={s.colFree}><span style={{fontFamily:"'Roboto',system-ui,sans-serif",fontSize:13,color:row.free==='No'?'#979899':'#111111'}}>{row.free}</span></div>
              <div style={s.colPro}><span style={{fontFamily:"'Roboto',system-ui,sans-serif",fontSize:13,color:['Yes','Full','More'].includes(row.pro)?'#0F4C5C':'#979899',fontWeight:500}}>{row.pro}</span></div>
            </div>
          ))}
        </div>
      </div></div></section>

      <section style={{...s.section,paddingBottom:80}}><div className="wrap" ref={r3}><div style={s.panel} className="fi-group">
        <h2 style={s.h2} className="fi">Core features</h2>
        <div style={s.pillRow} className="fi">
          {['ROM Estimates','Feasibility Planning','Building Types','Project Types','Cost Adjustments','Element Breakdowns','Rate Summaries'].map((p) => <span key={p} style={s.pill}>{p}</span>)}
        </div>
      </div></div></section>
    </div>
  );
}

const s = {
  pageTop:{ height:48 }, section:{ padding:'0 0 20px' },
  panel:{ background:'#F9FAFA', border:'1px solid #E4E5E5', borderRadius:16, padding:32 },
  h1:{ fontFamily:"'Aptos','Segoe UI',system-ui,sans-serif", fontSize:28, fontWeight:700, color:'#111111', marginBottom:20 },
  h2:{ fontFamily:"'Aptos','Segoe UI',system-ui,sans-serif", fontSize:22, fontWeight:600, color:'#111111', marginBottom:16 },
  body:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:14, color:'#979899', lineHeight:1.72 },
  pillRow:{ display:'flex', flexWrap:'wrap', gap:8, marginTop:20 },
  pill:{ display:'inline-flex', alignItems:'center', padding:'6px 16px', borderRadius:100, border:'1px solid #FF8210', fontFamily:"'Roboto',system-ui,sans-serif", fontSize:13, color:'#FF8210', background:'#F9FAFA', whiteSpace:'nowrap' },
  tableWrap:{ marginTop:28, border:'1px solid #E4E5E5', borderRadius:12, overflow:'hidden' },
  tableHead:{ display:'grid', gridTemplateColumns:'1fr 120px 120px', background:'#111111', padding:'12px 20px', gap:16 },
  tableRow:{ display:'grid', gridTemplateColumns:'1fr 120px 120px', padding:'14px 20px', gap:16, borderBottom:'1px solid #E4E5E5', alignItems:'center' },
  colFeature:{ display:'flex', flexDirection:'column', gap:2, fontFamily:"'Roboto',system-ui,sans-serif", fontSize:12, color:'#F9FAFA', fontWeight:500 },
  colFree:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:12, color:'#F9FAFA', fontWeight:500, display:'flex', alignItems:'center' },
  colPro:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:12, color:'#FF8210', fontWeight:600, display:'flex', alignItems:'center' },
  rowFeature:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:13, color:'#111111', fontWeight:500 },
  rowDesc:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:12, color:'#979899', lineHeight:1.4 },
};
