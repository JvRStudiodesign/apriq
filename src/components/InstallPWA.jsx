import { useState, useEffect } from 'react';

export function InstallPWA() {
  const [prompt,       setPrompt]       = useState(null);
  const [installed,    setInstalled]    = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const isIOS        = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

  useEffect(() => {
    if (isStandalone) { setInstalled(true); return; }
    const handler = e => { e.preventDefault(); setPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => { setInstalled(true); setPrompt(null); });
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (installed || isStandalone) return null;
  if (!prompt && !isIOS) return null;

  async function handleInstall() {
    if (prompt) {
      prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === 'accepted') setInstalled(true);
      setPrompt(null);
    } else if (isIOS) { setShowIOSGuide(true); }
  }

  const btn = { width:'100%', padding:'0.875rem', background:'#111111', color:'#F9FAFA', border:'none', borderRadius:'12px', fontSize:'0.9rem', fontWeight:'600', cursor:'pointer', fontFamily:"'Roboto', system-ui, sans-serif" };
  const overlay = { position:'fixed', inset:0, zIndex:9998, background:'rgba(17,17,17,0.5)', display:'flex', alignItems:'flex-end', justifyContent:'center' };
  const sheet   = { background:'#F9FAFA', borderRadius:'20px 20px 0 0', padding:'2rem 1.5rem 2.5rem', width:'100%', maxWidth:'480px', fontFamily:"'Roboto', system-ui, sans-serif" };

  return (
    <>
      <button onClick={handleInstall} style={btn}>Add AprIQ to Home Screen</button>
      {showIOSGuide && (
        <div style={overlay} onClick={() => setShowIOSGuide(false)}>
          <div style={sheet} onClick={e => e.stopPropagation()}>
            <img src="/logo-transparent.png" alt="AprIQ" style={{ height:'44px', marginBottom:'1.25rem', display:'block', mixBlendMode:'multiply' }} />
            <div style={{ fontSize:'1rem', fontWeight:'700', color:'#111111', marginBottom:'0.5rem' }}>Add to Home Screen</div>
            <p style={{ fontSize:'0.875rem', color:'#979899', marginBottom:'1.5rem', lineHeight:'1.6' }}>Install AprIQ on your iPhone or iPad:</p>
            {[['1','Open AprIQ in Safari'],['2','Tap the Share button at the bottom'],['3','Tap "Add to Home Screen" and confirm']].map(([n,t]) => (
              <div key={n} style={{ display:'flex', gap:'12px', alignItems:'flex-start', marginBottom:'1rem' }}>
                <span style={{ width:'28px', height:'28px', borderRadius:'50%', background:'#111111', color:'#F9FAFA', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.8rem', fontWeight:'700', flexShrink:0 }}>{n}</span>
                <span style={{ fontSize:'0.875rem', color:'#111111', lineHeight:'1.6', paddingTop:'4px' }}>{t}</span>
              </div>
            ))}
            <button onClick={() => setShowIOSGuide(false)} style={{ width:'100%', padding:'0.875rem', background:'#F9FAFA', color:'#979899', border:'1.5px solid #E4E5E5', borderRadius:'12px', fontSize:'0.875rem', cursor:'pointer', fontFamily:'inherit', marginTop:'0.5rem' }}>Close</button>
          </div>
        </div>
      )}
    </>
  );
}
