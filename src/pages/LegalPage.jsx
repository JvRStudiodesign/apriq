import { useState } from 'react';

const ToS = () => (
  <div>
    <h2 style={{ fontSize:'1.1rem', fontWeight:'700', color:'#1a1a18', marginBottom:'1.25rem' }}>Terms of Service</h2>
    <p style={{ fontSize:'0.8rem', color:'#999', marginBottom:'1.5rem' }}>Effective Date: 7 April 2026</p>
    {[
      ['1. Introduction', 'AprIQ ("we", "us", "our") provides a digital platform for preliminary construction cost estimation and feasibility insights ("Platform"). By using the Platform, you agree to these Terms.'],
      ['2. Nature of the Platform', 'The Platform provides indicative, data-driven estimates for informational purposes only. It is not a Bill of Quantities (BOQ) or final pricing tool.'],
      ['3. Critical Disclaimer — ROM Estimates', 'All outputs are Rough Order of Magnitude (ROM) estimates only. Outputs depend entirely on user inputs. Rates may change over time. AprIQ makes no guarantees of accuracy. Outputs may not be used for final budgeting, tenders, or contracts.'],
      ['4. No Professional Advice', 'AprIQ does not provide architectural, engineering, or quantity surveying services. Future features may connect users with professionals, but AprIQ is not responsible for their independent services.'],
      ['5. User Responsibility', 'Users are responsible for all inputs and any decisions made based on platform outputs.'],
      ['6. Limitation of Liability', 'AprIQ is not liable for any losses, damages, or decisions based on platform outputs.'],
      ['7. Intellectual Property & Usage Rights', 'Outputs may be used for presentations and internal purposes but may not be resold or used commercially as a competing service.'],
      ['8. Feedback & Improvements', 'User feedback submitted through the platform may be used to improve the service.'],
      ['9. Service Availability', 'AprIQ may update, modify, or withdraw the platform at any time without notice.'],
      ['10. Governing Law', 'South African law applies. International users agree to this jurisdiction.'],
      ['11. Contact', 'apriq@apriq.co.za'],
    ].map(([title, body]) => (
      <div key={title} style={{ marginBottom:'1.25rem' }}>
        <p style={{ fontSize:'0.85rem', fontWeight:'600', color:'#1a1a18', marginBottom:'0.35rem' }}>{title}</p>
        <p style={{ fontSize:'0.83rem', color:'#555', lineHeight:1.65 }}>{body}</p>
      </div>
    ))}
  </div>
);

const PP = () => (
  <div>
    <h2 style={{ fontSize:'1.1rem', fontWeight:'700', color:'#1a1a18', marginBottom:'1.25rem' }}>Privacy Policy</h2>
    <p style={{ fontSize:'0.8rem', color:'#999', marginBottom:'1.5rem' }}>Effective Date: 7 April 2026 · Compliant with POPIA (Protection of Personal Information Act, 2013)</p>
    {[
      ['1. Introduction', 'AprIQ is committed to protecting your personal information in accordance with the Protection of Personal Information Act 4 of 2013 (POPIA). This policy explains how we collect, use, store, and protect your data.'],
      ['2. Information Officer', 'AprIQ's designated Information Officer is the founder of JvRStudio (Pty) Ltd. Contact: apriq@apriq.co.za'],
      ['3. Information We Collect', 'We collect your name, email address, professional details (company, profession), and project input data you submit to the platform. We also collect usage data to improve the service.'],
      ['4. Purpose of Collection', 'Data is used exclusively to provide the AprIQ platform service, improve functionality, and communicate with you about your account or the platform.'],
      ['5. No Sale or Distribution', 'Your personal information is never sold, shared with third parties for marketing, or made publicly available.'],
      ['6. Cross-Border Data Transfer', 'AprIQ uses Supabase (hosted in the EU — Frankfurt, Germany) for data storage. This constitutes a cross-border transfer under POPIA. Supabase maintains GDPR-compliant safeguards which meet or exceed POPIA transfer requirements.'],
      ['7. Data Security', 'We implement reasonable technical and organisational measures to protect your personal information against unauthorised access, loss, or misuse.'],
      ['8. Data Retention', 'We retain your data only for as long as necessary to provide the service or as required by law. You may request deletion at any time.'],
      ['9. Your Rights (POPIA Section 23)', 'You have the right to: access your personal information; request correction of inaccurate data; request deletion; object to processing; and lodge a complaint with the Information Regulator (South Africa).'],
      ['10. Cookies', 'AprIQ uses session cookies for authentication and analytics cookies (PostHog) to understand platform usage. No personally identifiable information is shared with analytics providers.'],
      ['11. Third-Party Services', 'We use Supabase (database), Resend (email), PayFast (payments), and PostHog (analytics). All are bound by their own privacy policies and used only to deliver the AprIQ service.'],
      ['12. Policy Updates', 'This policy may be updated from time to time. Changes will be published on this page.'],
      ['13. Contact & Complaints', 'For privacy queries or to exercise your POPIA rights: apriq@apriq.co.za. To lodge a complaint: Information Regulator — inforeg.org.za'],
    ].map(([title, body]) => (
      <div key={title} style={{ marginBottom:'1.25rem' }}>
        <p style={{ fontSize:'0.85rem', fontWeight:'600', color:'#1a1a18', marginBottom:'0.35rem' }}>{title}</p>
        <p style={{ fontSize:'0.83rem', color:'#555', lineHeight:1.65 }}>{body}</p>
      </div>
    ))}
  </div>
);

export default function LegalPage() {
  const [tab, setTab] = useState('tos');
  return (
    <div style={{ minHeight:'100vh', background:'#f5f5f3', fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif' }}>
      <div style={{ maxWidth:'700px', margin:'0 auto', padding:'3rem 1.5rem 5rem' }}>
        <div style={{ marginBottom:'2rem' }}>
          <img src="/logo.jpg" alt="AprIQ" style={{ height:'30px', width:'auto', objectFit:'contain', marginBottom:'1.5rem', display:'block' }} />
          <div style={{ display:'flex', gap:'8px' }}>
            {[['tos','Terms of Service'],['pp','Privacy Policy']].map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)} style={{ padding:'7px 18px', borderRadius:'20px', border:'1.5px solid', fontSize:'0.82rem', fontWeight:'600', cursor:'pointer', fontFamily:'inherit', background: tab===key ? '#1a1a18' : '#fff', color: tab===key ? '#fff' : '#1a1a18', borderColor: tab===key ? '#1a1a18' : '#e5e5e3' }}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ background:'#fff', borderRadius:'14px', padding:'2rem', border:'1px solid #eeede8' }}>
          {tab === 'tos' ? <ToS /> : <PP />}
        </div>
        <p style={{ fontSize:'0.75rem', color:'#bbb', textAlign:'center', marginTop:'2rem' }}>
          2026 AprIQ · JvRStudio (Pty) Ltd · South Africa
        </p>
      </div>
    </div>
  );
}
