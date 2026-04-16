import { Link, useOutletContext } from 'react-router-dom';
import { useFadeIn } from '../hooks/useFadeIn';

const WHY_PILLS = ['Faster Early Decisions','Structured Cost Guidance','Instant Cost Breakdown','Clearer Feasibility Planning'];
const HOW_STEPS = ['Add Project\n& Client info','Add Project\nArea','Select All\nCost Factors','Generate/Export\nSummary'];
const WHO_PILLS = ['Architects','QS','Developers','Contractors','Everyone'];
const FEATURE_PILLS = ['ROM Estimates','Feasibility Planning','Building Types','Project Types','Cost Adjustments','Element Breakdowns','Rate Summaries'];

export default function LandingPage() {
  const { openModal } = useOutletContext();
  const r1=useFadeIn(), r2=useFadeIn(), r3=useFadeIn(), r4=useFadeIn(), r5=useFadeIn();
  return (
    <div>
      <section style={s.hero}>
        <div className="wrap"><div style={s.heroWrap}>
          <h1 style={s.h1}>Early-Stage Construction Cost Intelligence for South Africa</h1>
          <p style={s.heroSub}>AprIQ provides early-stage construction feasibility and Rough Order of Magnitude cost estimates, enabling faster budget structuring and clearer professional estimates for project teams.</p>
          <div style={{display:'flex',justifyContent:'center'}}>
            <button onClick={() => openModal('waitlist')} style={s.cta}>Join the waiting list</button>
          </div>
        </div></div>
      </section>

      <section style={s.section}><div className="wrap" ref={r1}><div style={s.panel} className="fi-group">
        <h2 style={s.panelH2} className="fi">Why AprIQ</h2>
        <p style={s.body} className="fi">AprIQ exists to reduce friction at the point where projects are still being tested. It gives architects, quantity surveyors, contractors, developers, homeowners, and general users a practical way to build an early cost position before detailed costing begins. The aim is not to replace later professional work, but to improve the speed and structure of the decisions that come first.</p>
        <div style={s.pillRow} className="fi">{WHY_PILLS.map((p) => <span key={p} style={s.pill}>{p}</span>)}</div>
      </div></div></section>

      <section style={s.section}><div className="wrap" ref={r2}><div style={s.panel} className="fi-group">
        <h2 style={s.panelH2} className="fi">What AprIQ does</h2>
        <p style={s.body} className="fi">AprIQ provides a structured way to approach early-stage construction cost planning. It helps users take the basic information available at the beginning of a project and turn it into a clearer cost picture that can support feasibility reviews, budget discussions, and early decision-making.</p>
        <p style={{...s.body,marginTop:12}} className="fi">AprIQ helps project teams generate early-stage construction cost estimates quickly and in a structured, professional format. It is built for feasibility and Rough Order of Magnitude planning, giving users a clearer cost direction before detailed quantity surveying or procurement work begins.</p>
      </div></div></section>

      <section style={s.section}><div className="wrap" ref={r3}><div style={s.panel} className="fi-group">
        <h2 style={s.panelH2} className="fi">How it works</h2>
        <p style={s.body} className="fi">AprIQ turns early project inputs into a structured ROM estimate. Select the building type and project type, enter the floor area and key project details, apply the relevant cost factors, and AprIQ generates a total project cost, rate summary, and elemental breakdown. You can then save the estimate, link it to a client, and export a professional PDF.</p>
        <div style={s.stepRow} className="fi">
          {HOW_STEPS.map((step,i) => <div key={i} style={s.step}><span style={s.stepLabel}>{step}</span></div>)}
          <Link to="/how-it-works" style={s.moreLink}>More info →</Link>
        </div>
      </div></div></section>

      <section style={s.section}><div className="wrap" ref={r4}><div style={s.panel} className="fi-group">
        <h2 style={s.panelH2} className="fi">Who is it for</h2>
        <p style={s.body} className="fi">AprIQ is built for architects, quantity surveyors, contractors, developers, homeowners, and anyone who needs fast, structured early-stage construction cost guidance.</p>
        <p style={{...s.body,marginTop:8}} className="fi">It is especially useful for feasibility planning, concept budgets, option testing, and early project decisions before detailed costing or construction begins.</p>
        <div style={s.pillRow} className="fi">{WHO_PILLS.map((p) => <span key={p} style={s.pill}>{p}</span>)}</div>
      </div></div></section>

      <section style={{...s.section,paddingBottom:72}}><div className="wrap" ref={r5}><div style={s.panel} className="fi-group">
        <h2 style={s.panelH2} className="fi">Core features</h2>
        <div style={s.pillRow} className="fi">{FEATURE_PILLS.map((p) => <span key={p} style={s.pill}>{p}</span>)}</div>
      </div></div></section>
    </div>
  );
}

const s = {
  hero:{ padding:'80px 0 72px', textAlign:'center' },
  heroWrap:{ maxWidth:700, margin:'0 auto' },
  h1:{ fontFamily:"'Aptos','Segoe UI',system-ui,sans-serif", fontSize:36, fontWeight:700, color:'#111111', lineHeight:1.15, letterSpacing:'-0.5px', marginBottom:20, textAlign:'center' },
  heroSub:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:15, color:'#979899', lineHeight:1.65, marginBottom:32, maxWidth:560, textAlign:'center', margin:'0 auto 32px' },
  cta:{ display:'inline-flex', alignItems:'center', padding:'11px 26px', background:'#111111', color:'#F9FAFA', border:'none', borderRadius:12, fontFamily:"'Roboto',system-ui,sans-serif", fontSize:14, fontWeight:500, cursor:'pointer' },
  section:{ padding:'16px 0' },
  panel:{ background:'#F9FAFA', border:'1px solid #E4E5E5', borderRadius:16, padding:32 },
  panelH2:{ fontFamily:"'Aptos','Segoe UI',system-ui,sans-serif", fontSize:20, fontWeight:600, color:'#111111', marginBottom:16 },
  body:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:14, color:'#979899', lineHeight:1.72 },
  pillRow:{ display:'flex', flexWrap:'wrap', gap:8, marginTop:20, rowGap:8, justifyContent:'flex-start' },
  pill:{ display:'inline-flex', alignItems:'center', padding:'6px 16px', borderRadius:100, border:'1px solid #FF8210', fontFamily:"'Roboto',system-ui,sans-serif", fontSize:13, color:'#111111', background:'#F9FAFA', whiteSpace:'nowrap' },
  stepRow:{ display:'flex', alignItems:'center', flexWrap:'wrap', gap:8, marginTop:20, justifyContent:'flex-start' },
  step:{ padding:'8px 16px', border:'1px solid #FF8210', borderRadius:12, background:'#F9FAFA' },
  stepLabel:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:13, color:'#111111', whiteSpace:'pre-line', lineHeight:1.35, textAlign:'left', display:'block' },
  moreLink:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:13, color:'#FF8210', textDecoration:'none', marginLeft:4 },
};
