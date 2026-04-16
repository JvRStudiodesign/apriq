const fs = require('fs');
let layout = fs.readFileSync('src/components/Layout.jsx', 'utf8');

// 1. Profile icon — orange stroke
layout = layout.replace(
  `stroke={T.ink} strokeWidth="1.5"`,
  `stroke="#FF8210" strokeWidth="1.5"`
);

// 2. Contact us — open contact modal instead of navigating
layout = layout.replace(
  `{ label:'Contact us',   to:'/contact'      },`,
  `{ label:'Contact us',   to:'/contact',  modal:'contact' },`
);

// 3. Nav link — handle modal items
layout = layout.replace(
  `          {NAV.map((link) => (
            <Link key={link.to} to={link.to} style={{ ...h.navLink, color: active(link.to) ? T.petrol : T.grey, fontWeight: active(link.to) ? 500 : 400 }}>
              {link.label}
            </Link>
          ))}`,
  `          {NAV.map((link) => (
            link.modal
              ? <button key={link.to} onClick={() => { openModal(link.modal); }} style={{ ...h.navLink, color: T.grey, background:'none', border:'none', cursor:'pointer', fontWeight:400, padding:0 }}>{link.label}</button>
              : <Link key={link.to} to={link.to} style={{ ...h.navLink, color: active(link.to) ? T.petrol : T.grey, fontWeight: active(link.to) ? 500 : 400 }}>{link.label}</Link>
          ))}`
);

// 4. Mobile menu — Contact us modal
layout = layout.replace(
  `          {NAV.map((link) => (
            <Link key={link.to} to={link.to} style={{ ...h.mobileLink, color: active(link.to) ? T.petrol : T.ink, fontWeight: active(link.to) ? 500 : 400 }}>
              {link.label}
            </Link>
          ))}`,
  `          {NAV.map((link) => (
            link.modal
              ? <button key={link.to} onClick={() => { setMenuOpen(false); openModal(link.modal); }} style={{ ...h.mobileLink, color: T.ink, background:'none', border:'none', cursor:'pointer', textAlign:'left', width:'100%', borderBottom:'1px solid #E4E5E5', padding:'11px 0' }}>{link.label}</button>
              : <Link key={link.to} to={link.to} style={{ ...h.mobileLink, color: active(link.to) ? T.petrol : T.ink, fontWeight: active(link.to) ? 500 : 400 }}>{link.label}</Link>
          ))}`
);

// 5. Footer year 2026 → 2025
layout = layout.replace(`© 2026 AprIQ.`, `© 2025 AprIQ.`);

// 6. FAQ pill border → orange
layout = layout.replace(
  `faqPill:{ display:'inline-flex', alignItems:'center', padding:'5px 16px', borderRadius:100, border:'1px solid #E4E5E5', background:'#F9FAFA', fontFamily:"'Roboto',system-ui,sans-serif", fontSize:12, color:'#979899', textDecoration:'none' },`,
  `faqPill:{ display:'inline-flex', alignItems:'center', padding:'5px 16px', borderRadius:100, border:'1px solid #FF8210', background:'#F9FAFA', fontFamily:"'Roboto',system-ui,sans-serif", fontSize:12, color:'#FF8210', textDecoration:'none' },`
);

// 7. Social icon borders → orange
layout = layout.replace(
  `socialIcon:{ width:30, height:30, borderRadius:10, border:'1px solid #E4E5E5', display:'flex', alignItems:'center', justifyContent:'center', textDecoration:'none' },`,
  `socialIcon:{ width:30, height:30, borderRadius:10, border:'1px solid #FF8210', display:'flex', alignItems:'center', justifyContent:'center', textDecoration:'none' },`
);

// 8. Add contact modal mode to WaitlistModal
layout = layout.replace(
  `export function WaitlistModal({ open, onClose, mode = 'waitlist' }) {`,
  `export function WaitlistModal({ open, onClose, mode = 'waitlist', openModal: _openModal }) {`
);

// 9. Add contact form content inside modal
layout = layout.replace(
  `  if (!open) return null;
  const isWaitlist = mode === 'waitlist';`,
  `  const [contactName, setContactName] = useState('');
  const [contactSurname, setContactSurname] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSent, setContactSent] = useState(false);
  const [contactSaving, setContactSaving] = useState(false);

  async function handleContact() {
    if (!contactEmail || !contactMessage) return;
    setContactSaving(true);
    await supabase.from('contact_submissions').insert({
      name: contactName, surname: contactSurname,
      email: contactEmail, message: contactMessage,
    });
    setContactSaving(false);
    setContactSent(true);
  }

  if (!open) return null;
  const isWaitlist = mode === 'waitlist';
  const isContact = mode === 'contact';`
);

// 10. Add contact form rendering inside the modal panel
layout = layout.replace(
  `        <span style={m.brand}>AprIQ</span>
        <h2 style={m.title}>{isWaitlist ? 'Join the waiting list' : 'Sign in to AprIQ'}</h2>
        <p style={m.sub}>{isWaitlist ? 'Be among the first to access AprIQ when we launch.' : 'Welcome back. Enter your details below.'}</p>`,
  `        <span style={m.brand}>AprIQ</span>
        <h2 style={m.title}>{isContact ? 'Contact us' : isWaitlist ? 'Join the waiting list' : 'Sign in to AprIQ'}</h2>
        <p style={m.sub}>{isContact ? 'Send us a message and we will get back to you.' : isWaitlist ? 'Be among the first to access AprIQ when we launch.' : 'Welcome back. Enter your details below.'}</p>`
);

// 11. Add contact form fields before existing form block
layout = layout.replace(
  `        <div style={m.form}>`,
  `        {isContact && (
          <div style={m.form}>
            {contactSent
              ? <p style={{fontFamily:"'Roboto',system-ui,sans-serif",fontSize:13,color:'#0F4C5C',padding:'12px 0'}}>Message sent. We will be in touch soon.</p>
              : <>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                    <input type="text" placeholder="Name" value={contactName} onChange={e=>setContactName(e.target.value)} style={m.input}/>
                    <input type="text" placeholder="Surname" value={contactSurname} onChange={e=>setContactSurname(e.target.value)} style={m.input}/>
                  </div>
                  <input type="email" placeholder="Email address" value={contactEmail} onChange={e=>setContactEmail(e.target.value)} style={m.input}/>
                  <textarea placeholder="Message" value={contactMessage} onChange={e=>setContactMessage(e.target.value)} rows={4} style={{...m.input,resize:'vertical',lineHeight:1.5}}/>
                  <button onClick={handleContact} disabled={contactSaving} style={{...m.submit,opacity:contactSaving?0.6:1}}>{contactSaving?'Sending...':'Send message'}</button>
                </>
            }
          </div>
        )}
        {!isContact && <div style={m.form}>`
);

// 12. Close the conditional form div
layout = layout.replace(
  `          {submitted && isWaitlist`,
  `          {!isContact && submitted && isWaitlist`
);

// 13. Close the extra form div and toggle
layout = layout.replace(
  `        <p style={m.toggle}>
          {isWaitlist ? (
            <>Already have access?&nbsp;<button style={m.toggleLink} onClick={() => {}}>Sign in</button></>
          ) : (
            <>Don't have an account?&nbsp;<button style={m.toggleLink} onClick={() => {}}>Join the waiting list</button></>
          )}
        </p>`,
  `        </div>}
        {!isContact && <p style={m.toggle}>
          {isWaitlist ? (
            <>Already have access?&nbsp;<button style={m.toggleLink} onClick={() => {}}>Sign in</button></>
          ) : (
            <>Don't have an account?&nbsp;<button style={m.toggleLink} onClick={() => {}}>Join the waiting list</button></>
          )}
        </p>}`
);

fs.writeFileSync('src/components/Layout.jsx', layout, 'utf8');
console.log('✓ Layout.jsx');
