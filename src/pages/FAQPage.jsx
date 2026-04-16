import { useState } from 'react';
import { useFadeIn } from '../hooks/useFadeIn';

const FAQS = [
  { q:'What is AprIQ?',             a:'AprIQ is a South African early-stage construction feasibility and ROM cost platform designed to help users generate structured budget direction at the beginning of a project.' },
  { q:'Who is AprIQ for?',          a:'AprIQ is built for architects, quantity surveyors, contractors, developers, homeowners, and anyone who needs fast, structured early-stage construction cost guidance.' },
  { q:'What does AprIQ do?',        a:'AprIQ helps users turn early project information into a high-level cost estimate that can support feasibility planning, concept budgets, and early project decisions.' },
  { q:'How does AprIQ work?',       a:'Users enter key project details such as building type, project type, area, and cost factors. AprIQ then generates a structured output with a total project cost, rate summary, and elemental breakdown.' },
  { q:'Is AprIQ a final pricing tool?', a:'No. AprIQ provides Rough Order of Magnitude estimates only. It is intended for early-stage planning and feasibility, not for final pricing, tenders, or contracts.' },
  { q:'How accurate is AprIQ?',     a:'AprIQ aims to be as accurate as reasonably possible in as little time as possible, but early-stage estimates always carry tolerances. Accuracy improves as project information becomes more defined.' },
  { q:'Can I save my estimates?',   a:'Yes. AprIQ allows users to save estimates to projects for future reference and ongoing use.' },
  { q:'Can I add clients to my projects?', a:'Yes. AprIQ includes client management so users can link client information to projects and outputs.' },
  { q:'Can I export my estimates?', a:'Yes. AprIQ supports professional PDF exports for sharing and presentation purposes.' },
  { q:'Is my data secure?',         a:'AprIQ applies reasonable technical and organisational measures to protect user accounts, saved data, and platform access. While no online platform can guarantee absolute security, AprIQ is built to reduce risk and protect sensitive information responsibly.' },
  { q:'Does AprIQ sell my data?',   a:'No. AprIQ does not sell personal information and does not make personally identifiable user or project information public for independent commercial exploitation.' },
  { q:'Can anyone use AprIQ?',      a:'Yes. AprIQ is designed to be accessible to both industry professionals and general users who need a clearer early-stage cost view.' },
];

function FAQItem({ item }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={s.item}>
      <button onClick={() => setOpen((o) => !o)} style={s.question} aria-expanded={open}>
        <span style={s.qText}>{item.q}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#979899" strokeWidth="2" strokeLinecap="round" style={{ flexShrink:0, transform:open?'rotate(180deg)':'none', transition:'transform 180ms ease' }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && <div style={s.answer}><p style={s.aText}>{item.a}</p></div>}
    </div>
  );
}

export default function FAQPage() {
  const ref = useFadeIn();
  return (
    <div>
      <div style={s.pageTop}/>
      <section style={s.section}><div className="wrap" ref={ref}><div style={s.panel} className="fi-group">
        <h1 style={s.h1} className="fi">FAQ's</h1>
        <div style={s.list} className="fi">{FAQS.map((item,i) => <FAQItem key={i} item={item}/>)}</div>
      </div></div></section>
    </div>
  );
}

const s = {
  pageTop:{ height:48 }, section:{ padding:'0 0 40px' },
  panel:{ background:'#F9FAFA', border:'1px solid #E4E5E5', borderRadius:16, padding:32 },
  h1:{ fontFamily:"'Aptos','Segoe UI',system-ui,sans-serif", fontSize:28, fontWeight:700, color:'#111111', marginBottom:28 },
  list:{ display:'flex', flexDirection:'column' },
  item:{ borderTop:'1px solid #E4E5E5' },
  question:{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, padding:'18px 0', background:'none', border:'none', cursor:'pointer', textAlign:'left' },
  qText:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:14, fontWeight:500, color:'#111111', lineHeight:1.4 },
  answer:{ paddingBottom:18 },
  aText:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:13, color:'#979899', lineHeight:1.7 },
};
