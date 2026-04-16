import { useFadeIn } from '../hooks/useFadeIn';

const VALUES = [
  { label:'Clarity',              desc:'AprIQ is built to make cost information easier to understand and communicate.' },
  { label:'Efficiency',           desc:'It is designed to reduce unnecessary abortive work and speed up early-stage decisions.' },
  { label:'Structure',            desc:'The platform turns early assumptions into a more ordered and professional cost framework.' },
  { label:'Accessibility',        desc:'AprIQ is intended to be useful to both industry professionals and general users.' },
  { label:'Professional integrity', desc:'AprIQ is clear about what it is and what it is not: an early-stage estimating tool, not a final pricing or contractual document.' },
];

export default function AboutPage() {
  const r1=useFadeIn(), r2=useFadeIn(), r3=useFadeIn(), r4=useFadeIn();
  return (
    <div>
      <div style={s.pageTop}/>
      <section style={s.section}><div className="wrap" ref={r1}><div style={s.panel} className="fi-group">
        <h1 style={s.h1} className="fi">About</h1>
        <p style={s.body} className="fi">AprIQ is a South African early-stage construction feasibility and cost estimation platform built to help users create structured budget direction at the beginning of a project. It is designed to support the stage where decisions need to be made quickly, often before detailed drawings, measured quantities, or full consultant input are available.</p>
        <p style={{...s.body,marginTop:12}} className="fi">AprIQ was developed out of necessity. In the initial stages of a project, clients often want an early budget indication almost immediately, while professionals are still working with limited information. That can lead to repeated preliminary pricing exercises, shifting assumptions, and abortive work when projects change, pause, or never proceed. AprIQ was created to help fast-track those early conversations by giving users a faster, more structured starting point for initial budget expectations and feasibility decisions.</p>
      </div></div></section>

      <section style={s.section}><div className="wrap" ref={r2}>
        <div style={s.mvGrid} className="fi-group">
          <div style={s.mvCard} className="fi">
            <h2 style={s.h2}>Mission</h2>
            <p style={{...s.body,marginTop:16}}>AprIQ's mission is to make early-stage construction budgeting faster, clearer, and more accessible by turning limited project information into structured cost guidance that can support better planning and earlier decisions.</p>
          </div>
          <div style={s.mvCard} className="fi">
            <h2 style={s.h2}>Vision</h2>
            <p style={{...s.body,marginTop:16}}>AprIQ's vision is to become a trusted early-stage construction feasibility platform that helps professionals and everyday users approach project budgeting with more clarity, less wasted time, and better alignment between expectations and likely cost direction from the outset.</p>
          </div>
        </div>
      </div></section>

      <section style={s.section}><div className="wrap" ref={r3}><div style={s.panel} className="fi-group">
        <h2 style={s.panelH2} className="fi">Values</h2>
        <div style={s.valuesGrid}>
          {VALUES.map((v) => (
            <div key={v.label} style={s.valueRow} className="fi">
              <span style={s.valueLabel}>{v.label}</span>
              <p style={s.valueDesc}>{v.desc}</p>
            </div>
          ))}
        </div>
      </div></div></section>

      <section style={{...s.section,paddingBottom:80}}><div className="wrap" ref={r4}><div style={s.panel} className="fi-group">
        <h2 style={s.panelH2} className="fi">Standards and accuracy</h2>
        <p style={s.body} className="fi">AprIQ is built around early-stage estimating, where limited project information is available and the purpose is to provide a high-level cost indication for feasibility planning, initial budgets, and early decision-making rather than final pricing. AACE International describes these as very early estimate classes used for strategic planning, screening, and evaluation of alternatives when project definition is still limited.</p>
        <p style={{...s.body,marginTop:12}} className="fi">Because these estimates are prepared so early, tolerances are naturally wider than later-stage estimates. AACE notes that typical Class 5 ranges can fall around −20% to −50% on the low side and +30% to +100% on the high side, depending on complexity, assumptions, and reference data.</p>
        <p style={{...s.body,marginTop:12}} className="fi">For AprIQ, this means the platform is intended for initial client budgets, expectation setting, concept-stage discussions, and feasibility planning. The goal is to deliver results faster than traditional early-stage workflows while still honestly recognising that the output remains an estimate, not a guarantee.</p>
        <div style={s.refBlock} className="fi">
          <p style={s.refText}>Reference: AACE International, 87R-14: Cost Estimate Classification System</p>
          <p style={s.refText}>Reference: AACE International, 18R-97: Cost Estimate Classification System</p>
        </div>
      </div></div></section>
    </div>
  );
}

const s = {
  pageTop:{ height:48 }, section:{ padding:'0 0 20px' },
  panel:{ background:'#F9FAFA', border:'1px solid #E4E5E5', borderRadius:16, padding:32 },
  h1:{ fontFamily:"'Aptos','Segoe UI',system-ui,sans-serif", fontSize:28, fontWeight:700, color:'#111111', marginBottom:20 },
  h2:{ fontFamily:"'Aptos','Segoe UI',system-ui,sans-serif", fontSize:22, fontWeight:600, color:'#111111' },
  panelH2:{ fontFamily:"'Aptos','Segoe UI',system-ui,sans-serif", fontSize:20, fontWeight:600, color:'#111111', marginBottom:24 },
  body:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:14, color:'#979899', lineHeight:1.72 },
  mvGrid:{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:16 },
  mvCard:{ background:'#F9FAFA', border:'1px solid #E4E5E5', borderRadius:16, padding:32 },
  valuesGrid:{ display:'flex', flexDirection:'column', gap:0 },
  valueRow:{ display:'grid', gridTemplateColumns:'180px 1fr', gap:24, padding:'16px 0', borderBottom:'1px solid #E4E5E5', alignItems:'flex-start' },
  valueLabel:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:13, fontWeight:500, color:'#111111', padding:'4px 16px', border:'1px solid #FF8210', borderRadius:100, display:'inline-flex', alignItems:'center', height:32, whiteSpace:'nowrap' },
  valueDesc:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:13, color:'#979899', lineHeight:1.65, paddingTop:6 },
  refBlock:{ marginTop:24, padding:16, background:'#F9FAFA', border:'1px solid #E4E5E5', borderRadius:12, display:'flex', flexDirection:'column', gap:6 },
  refText:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:11, color:'#979899', lineHeight:1.5 },
};
