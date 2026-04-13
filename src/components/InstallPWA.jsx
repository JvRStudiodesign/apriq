import { useState, useEffect } from 'react';

function detectPlatform() {
  const ua = navigator.userAgent;
  const isIOS     = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
  const isAndroid = /Android/.test(ua);
  const isMac     = /Macintosh/.test(ua) && !isIOS;
  const isWindows = /Windows/.test(ua);
  const isTablet  = /iPad/.test(ua) || (isAndroid && !/Mobile/.test(ua)) || (isWindows && /Touch/.test(ua));
  const isMobile  = (isIOS || isAndroid) && !isTablet;
  return { isIOS, isAndroid, isMac, isWindows, isTablet, isMobile };
}

const GUIDES = {
  ios_phone: {
    title: 'iPhone',
    icon: '📱',
    steps: [
      'Open AprIQ in Safari (must be Safari — not Chrome or Firefox)',
      'Tap the Share button (box with arrow) at the bottom of the screen',
      'Scroll down and tap "Add to Home Screen"',
      'Tap "Add" in the top right corner',
      'AprIQ will appear on your home screen like a native app',
    ],
    note: 'iOS only supports PWA installation through Safari.',
  },
  ios_tablet: {
    title: 'iPad',
    icon: '⬛',
    steps: [
      'Open AprIQ in Safari (must be Safari)',
      'Tap the Share button (box with arrow) in the top toolbar',
      'Tap "Add to Home Screen"',
      'Tap "Add" to confirm',
      'AprIQ will appear on your home screen',
    ],
    note: 'iOS only supports PWA installation through Safari.',
  },
  android_phone: {
    title: 'Android Phone',
    icon: '📱',
    steps: [
      'Open AprIQ in Chrome',
      'Tap the three-dot menu (⋮) in the top right corner',
      'Tap "Add to Home screen" or "Install app"',
      'Tap "Install" or "Add" to confirm',
      'AprIQ will appear on your home screen',
    ],
    note: 'Works on Chrome, Edge, and most Android browsers.',
  },
  android_tablet: {
    title: 'Android Tablet',
    icon: '⬛',
    steps: [
      'Open AprIQ in Chrome',
      'Tap the three-dot menu (⋮) in the top right corner',
      'Tap "Add to Home screen" or "Install app"',
      'Tap "Install" to confirm',
      'AprIQ will appear on your home screen',
    ],
    note: 'Works on Chrome and most Android browsers.',
  },
  windows_laptop: {
    title: 'Windows — Chrome',
    icon: '💻',
    steps: [
      'Open AprIQ in Google Chrome',
      'Click the install icon (⊕) in the address bar — or go to the three-dot menu (⋮)',
      'Click "Install AprIQ"',
      'Click "Install" to confirm',
      'AprIQ opens as a standalone app window and is added to your taskbar and Start menu',
    ],
    note: 'Also works in Microsoft Edge: look for the install icon in the address bar.',
  },
  windows_edge: {
    title: 'Windows — Edge',
    icon: '💻',
    steps: [
      'Open AprIQ in Microsoft Edge',
      'Click the install icon in the address bar (looks like a computer with a down arrow)',
      'Click "Install" to confirm',
      'AprIQ opens as a standalone window and is pinned to your taskbar',
    ],
    note: 'Edge has excellent PWA support on Windows.',
  },
  mac_laptop: {
    title: 'Mac — Chrome or Edge',
    icon: '💻',
    steps: [
      'Open AprIQ in Google Chrome or Microsoft Edge',
      'Click the install icon (⊕) in the address bar',
      'Click "Install AprIQ"',
      'AprIQ opens as a standalone app and is added to your Applications folder',
    ],
    note: 'Safari on Mac does not support PWA installation. Use Chrome or Edge.',
  },
};

export function InstallPWA() {
  const [prompt,       setPrompt]       = useState(null);
  const [installed,    setInstalled]    = useState(false);
  const [showGuide,    setShowGuide]    = useState(false);
  const [activeTab,    setActiveTab]    = useState(null);
  const platform = detectPlatform();
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

  useEffect(() => {
    if (isStandalone) { setInstalled(true); return; }
    const handler = e => { e.preventDefault(); setPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => { setInstalled(true); setPrompt(null); });
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Pre-select best guide tab based on detected platform
  useEffect(() => {
    if (platform.isIOS)     setActiveTab(platform.isTablet ? 'ios_tablet'      : 'ios_phone');
    else if (platform.isAndroid) setActiveTab(platform.isTablet ? 'android_tablet' : 'android_phone');
    else if (platform.isWindows) setActiveTab('windows_laptop');
    else if (platform.isMac)     setActiveTab('mac_laptop');
    else                         setActiveTab('windows_laptop');
  }, []);

  if (installed || isStandalone) return null;

  async function handleDirectInstall() {
    if (prompt) {
      prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === 'accepted') setInstalled(true);
      setPrompt(null);
    } else {
      setShowGuide(true);
    }
  }

  const T = { fontFamily: "'Roboto', system-ui, sans-serif" };
  const card = { background:'#F9FAFA', borderRadius:'16px', padding:'1.5rem', border:'1px solid #E4E5E5', marginBottom:'1rem' };
  const tabs = Object.entries(GUIDES);

  const tabGroups = [
    { label: 'iPhone / iPad', keys: ['ios_phone', 'ios_tablet'] },
    { label: 'Android', keys: ['android_phone', 'android_tablet'] },
    { label: 'Windows', keys: ['windows_laptop', 'windows_edge'] },
    { label: 'Mac', keys: ['mac_laptop'] },
  ];

  return (
    <>
      {/* Primary action button */}
      <button onClick={handleDirectInstall}
        style={{ width:'100%', padding:'0.875rem', background:'#111111', color:'#F9FAFA', border:'none', borderRadius:'12px', fontSize:'0.9rem', fontWeight:'600', cursor:'pointer', ...T, marginBottom:'0.75rem' }}>
        {prompt ? 'Install AprIQ' : 'How to install AprIQ'}
      </button>

      {/* How-to guide — always visible on platforms without direct prompt */}
      <button onClick={() => setShowGuide(true)}
        style={{ width:'100%', padding:'0.75rem', background:'#F9FAFA', color:'#979899', border:'1.5px solid #E4E5E5', borderRadius:'12px', fontSize:'0.82rem', cursor:'pointer', ...T }}>
        View installation guide →
      </button>

      {/* Full-screen installation guide modal */}
      {showGuide && (
        <div style={{ position:'fixed', inset:0, zIndex:9998, background:'rgba(17,17,17,0.6)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}
          onClick={() => setShowGuide(false)}>
          <div style={{ background:'#F9FAFA', borderRadius:'20px', width:'100%', maxWidth:'600px', maxHeight:'90vh', overflow:'auto', ...T }}
            onClick={e => e.stopPropagation()}>

            {/* Modal header */}
            <div style={{ padding:'1.5rem 1.5rem 0', borderBottom:'1px solid #E4E5E5', paddingBottom:'1rem' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <img src="/logo-transparent.png" alt="AprIQ" style={{ height:'36px', display:'block', mixBlendMode:'multiply', marginBottom:'0.5rem' }} />
                  <div style={{ fontSize:'1rem', fontWeight:'700', color:'#111111' }}>Installation Guide</div>
                  <div style={{ fontSize:'0.78rem', color:'#979899', marginTop:'2px' }}>Select your device to get started</div>
                </div>
                <button onClick={() => setShowGuide(false)}
                  style={{ background:'none', border:'none', fontSize:'1.25rem', cursor:'pointer', color:'#979899', padding:'4px', lineHeight:1 }}>✕</button>
              </div>

              {/* Platform group tabs */}
              <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', marginTop:'1rem' }}>
                {tabGroups.map(g => {
                  const isActive = g.keys.includes(activeTab);
                  return (
                    <button key={g.label} onClick={() => setActiveTab(g.keys[0])}
                      style={{ padding:'5px 14px', borderRadius:'20px', border:'1.5px solid', borderColor: isActive ? '#111111' : '#E4E5E5', background: isActive ? '#111111' : '#F9FAFA', color: isActive ? '#F9FAFA' : '#979899', fontSize:'0.78rem', fontWeight: isActive ? '600' : '400', cursor:'pointer', ...T }}>
                      {g.label}
                    </button>
                  );
                })}
              </div>

              {/* Sub-tabs for current group */}
              {tabGroups.find(g => g.keys.includes(activeTab))?.keys.length > 1 && (
                <div style={{ display:'flex', gap:'6px', marginTop:'8px' }}>
                  {tabGroups.find(g => g.keys.includes(activeTab))?.keys.map(k => (
                    <button key={k} onClick={() => setActiveTab(k)}
                      style={{ padding:'4px 12px', borderRadius:'20px', border:'1.5px solid', borderColor: activeTab === k ? '#0F4C5C' : '#E4E5E5', background: activeTab === k ? '#BFD1D6' : '#F9FAFA', color: activeTab === k ? '#0F4C5C' : '#979899', fontSize:'0.75rem', fontWeight: activeTab === k ? '600' : '400', cursor:'pointer', ...T }}>
                      {GUIDES[k].icon} {k.includes('tablet') ? 'Tablet' : k.includes('edge') ? 'Edge' : k.includes('phone') ? 'Phone' : 'Chrome'}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Step-by-step guide */}
            {activeTab && GUIDES[activeTab] && (
              <div style={{ padding:'1.5rem' }}>
                <div style={{ fontSize:'0.85rem', fontWeight:'600', color:'#111111', marginBottom:'1rem' }}>
                  {GUIDES[activeTab].icon} {GUIDES[activeTab].title}
                </div>
                {GUIDES[activeTab].steps.map((step, i) => (
                  <div key={i} style={{ display:'flex', gap:'12px', alignItems:'flex-start', marginBottom:'0.875rem' }}>
                    <span style={{ width:'26px', height:'26px', borderRadius:'50%', background:'#111111', color:'#F9FAFA', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.75rem', fontWeight:'700', flexShrink:0, marginTop:'1px' }}>{i+1}</span>
                    <span style={{ fontSize:'0.875rem', color:'#111111', lineHeight:'1.6' }}>{step}</span>
                  </div>
                ))}
                {GUIDES[activeTab].note && (
                  <div style={{ background:'#BFD1D6', borderRadius:'10px', padding:'0.75rem 1rem', fontSize:'0.78rem', color:'#0F4C5C', marginTop:'0.5rem', lineHeight:'1.5' }}>
                    {GUIDES[activeTab].note}
                  </div>
                )}

                {/* Direct install button inside modal for supported browsers */}
                {prompt && (
                  <button onClick={() => { handleDirectInstall(); setShowGuide(false); }}
                    style={{ width:'100%', padding:'0.875rem', background:'#FF8210', color:'#F9FAFA', border:'none', borderRadius:'12px', fontSize:'0.9rem', fontWeight:'600', cursor:'pointer', ...T, marginTop:'1.25rem' }}>
                    Install now →
                  </button>
                )}

                <button onClick={() => setShowGuide(false)}
                  style={{ width:'100%', padding:'0.75rem', background:'#F9FAFA', color:'#979899', border:'1.5px solid #E4E5E5', borderRadius:'12px', fontSize:'0.875rem', cursor:'pointer', ...T, marginTop:'0.5rem' }}>
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
