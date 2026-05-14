import { Link } from 'react-router-dom';
import { useFadeIn } from '../hooks/useFadeIn';
import AprIQIntelligence from '../components/AprIQIntelligence';

const WHY_PILLS    = ['Faster Early Decisions','Structured Cost Guidance','Instant Cost Breakdown','Clearer Feasibility Planning'];
const HOW_STEPS    = ['Add Project\n& Client info','Add Project\nArea','Select All\nCost Factors','Generate/Export\nSummary'];
const WHO_PILLS    = ['Architects','Quantity Surveyor','Developers','Contractors','Everyone'];
const FEATURE_PILLS= ['ROM Estimates','Feasibility Planning','Building Types','Project Types','Cost Adjustments','Element Breakdowns','Rate Summaries'];

export default function LandingPage() {
  const r1=useFadeIn(), r2=useFadeIn(), r3=useFadeIn(), r4=useFadeIn(), r5=useFadeIn();

  return (
    <div>
      {/* ── Hero ── */}
      <section style={s.hero}>
        <div className="wrap">
          <div style={s.heroWrap}>
            <p style={s.eyebrow}>Construction cost intelligence · South Africa</p>
            <h1 style={s.h1}>Early-Stage Construction Cost Intelligence for South Africa</h1>
            <p style={s.heroSub}>AprIQ provides early-stage construction feasibility and Rough Order of Magnitude cost estimates, enabling faster budget structuring and clearer professional estimates for project teams.</p>
            <div style={{ display:'flex', justifyContent:'center' }}>
              <Link
                to="/signup"
                style={{ ...s.cta, textDecoration: 'none' }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 4px 16px rgba(17,17,17,0.18)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=''; }}
                onMouseDown={e  => { e.currentTarget.style.transform='scale(0.97)'; e.currentTarget.style.boxShadow='none'; }}
                onMouseUp={e    => { e.currentTarget.style.transform='translateY(-1px)'; }}
              >
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Why AprIQ ── */}
      <section className="section">
        <div className="wrap" ref={r1}>
          <div className="panel fi-group">
            <h2 style={s.panelH2} className="fi">Why AprIQ</h2>
            <p style={s.body} className="fi">AprIQ exists to reduce friction at the point where projects are still being tested. It gives architects, quantity surveyors, contractors, developers, homeowners, and general users a practical way to build an early cost position before detailed costing begins. The aim is not to replace later professional work, but to improve the speed and structure of the decisions that come first.</p>
            <div className="pill-row fi">{WHY_PILLS.map((p) => <span key={p} className="pill-accent">{p}</span>)}</div>
          </div>
        </div>
      </section>

      {/* ── What AprIQ does ── */}
      <section className="section">
        <div className="wrap" ref={r2}>
          <div className="panel fi-group">
            <h2 style={s.panelH2} className="fi">What AprIQ does</h2>
            <p style={s.body} className="fi">AprIQ provides a structured way to approach early-stage construction cost planning. It helps users take the basic information available at the beginning of a project and turn it into a clearer cost picture that can support feasibility reviews, budget discussions, and early decision-making.</p>
            <p style={{...s.body, marginTop:12}} className="fi">AprIQ helps project teams generate early-stage construction cost estimates quickly and in a structured, professional format. It is built for feasibility and Rough Order of Magnitude planning, giving users a clearer cost direction before detailed quantity surveying or procurement work begins.</p>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="section">
        <div className="wrap" ref={r3}>
          <div className="panel fi-group">
            <h2 style={s.panelH2} className="fi">How it works</h2>
            <p style={s.body} className="fi">AprIQ turns early project inputs into a structured ROM estimate. Select the building type and project type, enter the floor area and key project details, apply the relevant cost factors, and AprIQ generates a total project cost, rate summary, and elemental breakdown. You can then save the estimate, link it to a client, and export a professional PDF.</p>
            <div style={s.stepRow} className="fi">
              {HOW_STEPS.map((step,i) => (
                <div key={i} style={s.step}>
                  <span style={s.stepLabel}>{step}</span>
                </div>
              ))}
              <Link to="/how-it-works" style={s.moreLink}>More info →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Who is it for ── */}
      <section className="section">
        <div className="wrap" ref={r4}>
          <div className="panel fi-group">
            <h2 style={s.panelH2} className="fi">Who is it for</h2>
            <p style={s.body} className="fi">AprIQ is built for architects, quantity surveyors, contractors, developers, homeowners, and anyone who needs fast, structured early-stage construction cost guidance.</p>
            <p style={{...s.body, marginTop:8}} className="fi">It is especially useful for feasibility planning, concept budgets, option testing, and early project decisions before detailed costing or construction begins.</p>
            <div className="pill-row fi">{WHO_PILLS.map((p) => <span key={p} className="pill-accent">{p}</span>)}</div>
          </div>
        </div>
      </section>

      {/* ── Core features ── */}
      <section className="section" style={{ paddingBottom: 72 }}>
        <div className="wrap" ref={r5}>
          <div className="panel fi-group">
            <h2 style={s.panelH2} className="fi">Core features</h2>
            <div className="pill-row fi">{FEATURE_PILLS.map((p) => <span key={p} className="pill-accent">{p}</span>)}</div>
          </div>
        </div>
      </section>

      <AprIQIntelligence />
    </div>
  );
}

const s = {
  /* ── Hero — more breathing room ── */
  hero:    { padding:'96px 0 80px', textAlign:'center' },
  heroWrap:{ maxWidth:680, margin:'0 auto' },

  /* Eyebrow label above h1 */
  eyebrow: {
    fontFamily: "'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif",
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: '#0F4C5C',
    marginBottom: 16,
  },

  /* h1 — heading font, tighter tracking */
  h1: {
    fontFamily: "'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif",
    fontSize: 38,
    fontWeight: 700,
    color: '#111111',
    lineHeight: 1.12,
    letterSpacing: '-0.6px',
    marginBottom: 20,
    textAlign: 'center',
  },

  heroSub: {
    fontFamily: "'Roboto','Segoe UI',system-ui,sans-serif",
    fontSize: 15,
    color: '#979899',
    lineHeight: 1.7,
    maxWidth: 540,
    textAlign: 'center',
    margin: '0 auto 36px',
  },

  cta: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '12px 28px',
    background: '#111111',
    color: '#F9FAFA',
    border: 'none',
    borderRadius: 12,
    fontFamily: "'Roboto','Segoe UI',system-ui,sans-serif",
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'transform 160ms cubic-bezier(0.34,1.56,0.64,1), box-shadow 160ms ease',
  },

  /* Panel h2 — Plus Jakarta Sans */
  panelH2: {
    fontFamily: "'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif",
    fontSize: 20,
    fontWeight: 600,
    color: '#111111',
    marginBottom: 16,
    letterSpacing: '-0.2px',
  },

  body: {
    fontFamily: "'Roboto','Segoe UI',system-ui,sans-serif",
    fontSize: 14,
    color: '#979899',
    lineHeight: 1.72,
    maxWidth: '72ch',
  },

  /* How it works steps — numbered, not plain pill */
  stepRow: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 20,
    justifyContent: 'flex-start',
  },

  step: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 16px',
    border: '1px solid #FF8210',
    borderRadius: 12,
    background: '#F9FAFA',
  },

  stepLabel: {
    fontFamily: "'Roboto','Segoe UI',system-ui,sans-serif",
    fontSize: 13,
    color: '#111111',
    whiteSpace: 'pre-line',
    lineHeight: 1.35,
    textAlign: 'left',
    display: 'block',
  },

  moreLink: {
    fontFamily: "'Roboto','Segoe UI',system-ui,sans-serif",
    fontSize: 13,
    color: '#FF8210',
    textDecoration: 'none',
    marginLeft: 4,
    alignSelf: 'center',
  },
};
