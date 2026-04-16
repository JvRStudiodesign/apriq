import { useState } from 'react';
import { useFadeIn } from '../hooks/useFadeIn';

const TABS = ['Privacy Policy','Terms of Service','Security','Compliance'];

function B({ children }) { return <p style={ls.body}>{children}</p>; }
function BList({ items }) { return <ul style={ls.list}>{items.map((i,k) => <li key={k} style={ls.li}>{i}</li>)}</ul>; }
function Sec({ title, children }) { return <div style={ls.block}><h3 style={ls.h3}>{title}</h3>{children}</div>; }

function PrivacyPolicy() {
  return <div>
    <h2 style={ls.h2}>Privacy Policy</h2>
    <p style={ls.effective}>Effective Date: 2026-04-14</p>
    <Sec title="1. Introduction"><B>AprIQ respects your privacy and is committed to protecting your personal information. AprIQ complies with applicable South African data protection principles, including the Protection of Personal Information Act, 2013 ("POPIA").</B></Sec>
    <Sec title="2. Information We Collect"><B>AprIQ may collect personal, project-related, technical, and usage information that you provide directly or that is generated through use of the platform. This may include:</B><BList items={['Name and surname','Email address','Account information','Project inputs and estimate-related information','Saved project and client information','Uploaded profile, company, or branding details','Usage and interaction data','Technical information such as browser, device, IP-related session data, and platform activity records','Billing and subscription-related information where applicable']}/></Sec>
    <Sec title="3. Purpose of Collection"><B>AprIQ collects and uses information only for purposes reasonably related to providing, operating, maintaining, securing, supporting, enforcing, and improving the platform.</B></Sec>
    <Sec title="4. No Sale or Distribution of Data"><B>AprIQ does not sell personal information. AprIQ does not publish, disclose, or distribute personally identifiable user or project information to third parties for independent commercial exploitation.</B></Sec>
    <Sec title="5. Data Security"><B>AprIQ takes reasonable technical, organisational, and administrative measures to protect personal information against loss, misuse, unauthorised access, disclosure, alteration, or destruction.</B></Sec>
    <Sec title="6. Data Retention"><B>AprIQ retains information only for as long as reasonably necessary to provide the platform, comply with legal and regulatory obligations, resolve disputes, and support legitimate business operations.</B></Sec>
    <Sec title="7. Your Rights"><B>Subject to applicable law, you may have the right to request access, correction, or deletion of your personal information, or to object to certain processing activities.</B></Sec>
    <Sec title="8. Cookies"><B>AprIQ may use cookies and similar technologies as reasonably necessary to operate, secure, maintain, and improve the platform.</B></Sec>
    <Sec title="9. Third-Party Services"><B>AprIQ may engage third-party service providers for hosting, authentication, payments, analytics, and communications. AprIQ is not responsible for the independent privacy practices of third-party services.</B></Sec>
    <Sec title="10. Updates"><B>AprIQ may amend or update this Privacy Policy from time to time. Continued use of the platform after publication of the revised effective date may constitute acceptance.</B></Sec>
    <Sec title="11. Contact"><B>Contact: AprIQ — apriq@apriq.co.za</B></Sec>
  </div>;
}

function TermsOfService() {
  return <div>
    <h2 style={ls.h2}>Terms of Service</h2>
    <p style={ls.effective}>Effective Date: 2026-04-14</p>
    <Sec title="1. Introduction"><B>These Terms of Service govern access to and use of the AprIQ platform, website, application, tools, outputs, features, content, and related services. By using the platform you agree to these Terms.</B></Sec>
    <Sec title="2. Nature of the Platform"><B>The Platform is indicative, data-driven, and informational only. It is not a bill of quantities, tender document, procurement instrument, or final pricing tool.</B></Sec>
    <Sec title="3. Critical Disclaimer — ROM Estimates"><B>All outputs generated through AprIQ are Rough Order of Magnitude ("ROM") estimates only. All outputs are indicative and depend entirely on user-supplied information, assumptions, and inputs.</B></Sec>
    <Sec title="4. No Professional Advice"><B>AprIQ does not provide architectural, engineering, quantity surveying, legal, financial, or project management advice or services. No output creates any consultant-client or advisory relationship.</B></Sec>
    <Sec title="5. User Responsibility"><B>You are solely responsible for all information, inputs, selections, and project details submitted to the Platform, and for verifying that outputs are appropriate for your intended use.</B></Sec>
    <Sec title="6. Limitation of Liability"><B>To the fullest extent permitted by law, AprIQ shall not be liable for any direct, indirect, incidental, or consequential loss arising from access to, use of, or reliance on the Platform. AprIQ's aggregate liability is limited to amounts paid to AprIQ in the 3 months preceding the event, or R1,000.</B></Sec>
    <Sec title="7. No Warranty"><B>The Platform is provided on an "as is" and "as available" basis. AprIQ does not warrant uninterrupted, error-free, or secure operation at all times.</B></Sec>
    <Sec title="8. Subscription and Billing"><B>Certain Platform features may be offered on a paid subscription basis. By subscribing you agree to pay all applicable fees. Access to paid features may be suspended for overdue payments.</B></Sec>
    <Sec title="9. Cancellation"><B>You may cancel your subscription in accordance with the cancellation process available through the Platform. Fees already paid are generally non-refundable unless required by law.</B></Sec>
    <Sec title="10. Acceptable Use"><B>You may not reverse engineer, scrape, exploit, or use Platform outputs to compete with AprIQ or gain unauthorised access to its systems.</B></Sec>
    <Sec title="11. Intellectual Property"><B>All rights to the Platform, including software, systems, design, branding, methodologies, and outputs, remain the exclusive property of AprIQ or its licensors.</B></Sec>
    <Sec title="12. Governing Law"><B>These Terms are governed by the laws of the Republic of South Africa. Disputes shall be subject to the jurisdiction of the competent courts of South Africa.</B></Sec>
    <Sec title="13. Contact"><B>Contact: AprIQ — apriq@apriq.co.za</B></Sec>
  </div>;
}

function Security() {
  return <div>
    <h2 style={ls.h2}>Security</h2>
    <B>AprIQ is designed with a security-first approach to help protect user accounts, project data, subscriptions, and platform access.</B>
    <div style={{marginTop:24}}>
      <Sec title="Platform architecture"><B>The platform treats the frontend as an untrusted presentation layer. Sensitive logic, permissions, payment verification, and access control are enforced on the backend. User-specific data access is controlled at database level through row-level security policies.</B></Sec>
      <Sec title="Authentication"><B>Authentication is handled through secure account and session management, including rate limiting on sign-in attempts, secure password handling, protected password reset flows, and server-side verification of authenticated sessions on protected routes.</B></Sec>
      <Sec title="Payments"><B>Subscription billing is protected through server-side payment verification. Payment callbacks are checked using server-side signature validation, amount matching, status validation, and user verification before any subscription changes are applied.</B></Sec>
      <Sec title="Infrastructure"><B>AprIQ applies security controls across its infrastructure and APIs, including sanitised error responses, rate limiting, validated HTTP methods, controlled internal API access, and browser security headers.</B></Sec>
      <Sec title="Important notice"><B>AprIQ takes reasonable technical and organisational measures to reduce risk. However, no internet-based platform can be guaranteed to be completely secure. Users remain responsible for maintaining the confidentiality of their login credentials.</B></Sec>
    </div>
  </div>;
}

function Compliance() {
  return <div>
    <h2 style={ls.h2}>Compliance</h2>
    <B>AprIQ is designed to operate within a responsible legal, privacy, and platform-governance framework appropriate to its role as an early-stage construction feasibility and ROM estimating platform.</B>
    <div style={{marginTop:24}}>
      <Sec title="Product definition"><B>The platform provides preliminary, indicative, data-driven cost outputs for informational and feasibility purposes only. It is not a bill of quantities, final pricing tool, tender document, or contractual cost tool.</B></Sec>
      <Sec title="Data protection"><B>AprIQ aligns its privacy approach with applicable South African data protection principles, including POPIA. Personal and project-related information is collected only for purposes reasonably connected to operating, supporting, securing, and improving the platform.</B></Sec>
      <Sec title="Platform governance"><B>Access control, user permissions, and data ownership are enforced through authenticated account access and backend-controlled rules. Users are limited to their own records unless a controlled sharing function is intentionally used.</B></Sec>
      <Sec title="Core compliance principles"><BList items={['Clear intended use','Transparent legal positioning','Privacy-conscious data handling','Controlled account and access management','Responsible early-stage estimating practices']}/></Sec>
    </div>
  </div>;
}

export default function LegalPage() {
  const [active, setActive] = useState(0);
  const ref = useFadeIn();
  const CONTENT = [<PrivacyPolicy/>, <TermsOfService/>, <Security/>, <Compliance/>];
  return (
    <div>
      <div style={s.pageTop}/>
      <section style={s.section}><div className="wrap" ref={ref}>
        <div style={s.tabRow} className="fi">
          {TABS.map((tab,i) => (
            <button key={tab} onClick={() => setActive(i)} style={{ ...s.tab, background:active===i?'#111111':'#F9FAFA', color:active===i?'#F9FAFA':'#979899', borderColor:active===i?'#111111':'#E4E5E5' }}>{tab}</button>
          ))}
        </div>
        <div style={s.panel} className="fi">{CONTENT[active]}</div>
      </div></section>
    </div>
  );
}

const s = {
  pageTop:{ height:48 }, section:{ padding:'0 0 80px' },
  tabRow:{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:20 },
  tab:{ padding:'7px 18px', borderRadius:100, border:'1px solid', fontFamily:"'Roboto',system-ui,sans-serif", fontSize:13, cursor:'pointer', transition:'all 150ms ease', fontWeight:400 },
  panel:{ background:'#F9FAFA', border:'1px solid #E4E5E5', borderRadius:16, padding:40 },
};
const ls = {
  h2:{ fontFamily:"'Aptos','Segoe UI',system-ui,sans-serif", fontSize:26, fontWeight:700, color:'#111111', marginBottom:6, textDecoration:'underline' },
  effective:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:12, color:'#979899', marginBottom:32 },
  block:{ marginBottom:28 },
  h3:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:14, fontWeight:500, color:'#111111', marginBottom:8 },
  body:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:13, color:'#979899', lineHeight:1.72, marginBottom:8 },
  list:{ paddingLeft:20, display:'flex', flexDirection:'column', gap:6, marginTop:8 },
  li:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize:13, color:'#979899', lineHeight:1.6 },
};
