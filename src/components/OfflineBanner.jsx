import { useState, useEffect } from 'react';

export function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine);
  useEffect(() => {
    const off = () => setOffline(true);
    const on  = () => setOffline(false);
    window.addEventListener('offline', off);
    window.addEventListener('online', on);
    return () => { window.removeEventListener('offline', off); window.removeEventListener('online', on); };
  }, []);
  if (!offline) return null;
  return (
    <div style={{
      position:'fixed', bottom:0, left:0, right:0, zIndex:9999,
      background:'#111111', color:'#F9FAFA',
      padding:'0.5rem 1.5rem',
      display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
      fontSize:'0.78rem', fontWeight:'500',
      fontFamily:"'Roboto', system-ui, sans-serif",
    }}>
      <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#FF8210', display:'inline-block', flexShrink:0 }} />
      Offline mode — configurator available
    </div>
  );
}
