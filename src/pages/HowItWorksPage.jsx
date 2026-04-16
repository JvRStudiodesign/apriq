import { useFadeIn } from '../hooks/useFadeIn';

const STEPS = ['Add Project\n& Client info','Add project\nareas','Select all\ncost factors','Generate\nSummary','Export and\nshare'];
const JOURNEY = [
  { id:'profile',      heading:'Add user profile information', desc:'Set up your professional profile, company details, and contact information. This populates your PDF exports automatically.' },
  { id:'project',      heading:'Add project information',      desc:'Define the project — name, location, building type, and nature of work. This forms the foundation of your estimate.' },
  { id:'client',       heading:'Add client information',       desc:'Link client details to the project for accurate, attribution-ready PDF exports and saved estimates.' },
  { id:'configurator', heading:'Project data input',           desc:'Enter floor area, select cost factors — quality, site access, project complexity — and apply escalation or renovation splits.' },
  { id:'export',       heading:'Export and share estimate',    desc:'Generate a professional PDF and share it with clients or colleagues. Each export carries your branding, a ROM disclaimer, and a reference number.' },
];

const ICONS = {
  profile:<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#BFD1D6" strokeWidth="1.2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.58-7 8-7s8 3 8 7"/></svg>,
  project:<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#BFD1D6" strokeWidth="1.2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>,
  client:<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#BFD1D6" strokeWidth="1.2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  configurator:<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#BFD1D6" strokeWidth="1.2"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>,
  export:<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#BFD1D6" strokeWidth="1.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="12" y1="18" x2="12" y2="12"/><polyline points="9,15 12,18 15,15"/></svg>,
};

export default function HowItWorksPage() {
  const r1=useFadeIn(), r2=useFadeIn(), r3=useFadeIn();
  return (
    <div>
      <div style={s.pageTop}/>
      <section style={s.section}><div className="wrap" ref={r1}><div style={s.panel} className="fi-group">
        <h1 style={s.h1} className="fi">What AprIQ does</h1>
        <p style={s.body} className="fi">AprIQ provides a structured way to approach early-stage construction cost planning. It helps users take the basic information available at the beginning of a project and turn it into a clearer cost picture that can support feasibility reviews, budget discussions, and early decision-making. Instead of relying on rough assumptions or time-consuming manual work, AprIQ gives users a faster way to generate organised cost guidance in a professional format.</p>
        <p style={{...s.body,marginTop:12}} className="fi">The platform is designed to support the stage where a project is still being tested, shaped, or discussed. At this point, teams often need to know whether a project is realistic, how big the budget may be, and how different choices could affect overall cost. AprIQ helps create that first level of cost direction in a way that is easier to review, compare, and communicate.</p>
        <p style={{...s.body,marginTop:12}} className="fi">It is especially useful for establishing an early budget framework, guiding concept-stage conversations, supporting client discussions, and reducing unnecessary abortive work before detailed costing or technical documentation begins.</p>
      </div></div></section>

      <section style={s.section}><div className="wrap" ref={r2}><div style={s.panel} className="fi-group">
        <h2 style={s.h2} className="fi">How it works</h2>
        <p style={s.body} className="fi">AprIQ works by guiding the user through the key project choices that shape an early-stage estimate. The process begins with defining the project clearly, including the type of building, the nature of the work, and the size of the project.</p>
        <p style={{...s.body,marginTop:12}} className="fi">As these variables are selected, AprIQ organises them into a structured estimating framework and produces a professional early-stage output. This allows the user to understand the likely cost direction of the project in a way that is practical and easy to interpret.</p>
        <div style={s.stepRow} className="fi">
          {STEPS.map((step,i) => <div key={i} style={s.step}><span style={s.stepLabel}>{step}</span></div>)}
        </div>
      </div></div></section>

      <section style={{...s.section,paddingBottom:80}}><div className="wrap" ref={r3}>
        <div style={s.journeyWrap} className="fi-group">
          {JOURNEY.map((item) => (
            <div key={item.id} style={s.journeyBlock} className="fi">
              <div style={s.journeyMeta}>
                <h3 style={s.h3}>{item.heading}</h3>
                <p style={{...s.body,marginTop:8}}>{item.desc}</p>
              </div>
              <div style={s.placeholder}>
                <video
                  src={`/${{'profile':'user_profile.mp4','project':'add_project_information.mp4','client':'add_client.mp4','configurator':'add_project.mp4','export':'export_pdf.mp4'}[item.id]}`}
                  autoPlay
                  loop
                  muted
                  playsInline
                  style={{ width:'100%', display:'block', borderRadius:0 }}
                />
              </div>
            </div>
          ))}
        </div>
      </div></section>
    </div>
  );
}

const s = {
  pageTop:{ height:48 }, section:{ padding:'0 0 20px' },
  panel:{ background:'#F9FAFA', border:'1px solid #E4E5E5', borderRadius:16, padding:32 },
  h1:{ fontFamily:"'Aptos','Segoe UI',system-ui,sans-serif", fontSize:28, fontWeight:700, color:'#111111', marginBottom:20 },
  h2:{ fontFamily:"'Aptos','Segoe UI',system-ui,sans-serif", fontSize:22, fontWeight:600, color:'#111111', marginBottom:16 },
  h3:{ fontFamily:"'Aptos','Segoe UI',system-ui,sans-serif", fontSize:17, fontWeight:600, color:'#111111' },
  body:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:14, color:'#979899', lineHeight:1.72 },
  stepRow:{ display:'flex', flexWrap:'wrap', gap:8, marginTop:24, justifyContent:'flex-start' },
  step:{ padding:'8px 20px', border:'1px solid #FF8210', borderRadius:12, background:'#F9FAFA', flex:'1 1 auto', textAlign:'center', maxWidth:180 },
  stepLabel:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:13, color:'#111111', whiteSpace:'pre-line', lineHeight:1.35, display:'block', textAlign:'center' },
  journeyWrap:{ display:'flex', flexDirection:'column', gap:24 },
  journeyBlock:{ background:'#F9FAFA', border:'1px solid #E4E5E5', borderRadius:16, overflow:'hidden' },
  journeyMeta:{ padding:'28px 32px 20px' },
  placeholder:{ background:'#F9FAFA', overflow:'hidden', borderRadius:'0 0 16px 16px' },
  placeholderInner:{ display:'flex', flexDirection:'column', alignItems:'center', gap:12, opacity:0.6 },
  placeholderIcon:{ width:56, height:56, borderRadius:16, border:'1px solid #E4E5E5', display:'flex', alignItems:'center', justifyContent:'center', background:'#F9FAFA' },
  placeholderLabel:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:12, color:'#979899', textAlign:'center' },
};
