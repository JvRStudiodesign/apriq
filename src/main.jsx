import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/globals.css'
import App from './App.jsx'

function CrashOverlay({ crash, onReset }) {
  if (!crash) return null;
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#F9FAFA',
        zIndex: 999999,
        padding: 20,
        fontFamily: "'Roboto', system-ui, sans-serif",
        color: '#111111',
      }}
    >
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>AprIQ hit a runtime error</div>
            <div style={{ fontSize: 12, color: '#979899' }}>
              Copy the error text below and send it to support.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid #E4E5E5',
                background: '#F9FAFA',
                color: '#111111',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Reload
            </button>
            <button
              type="button"
              onClick={onReset}
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid #FF8210',
                background: '#FF8210',
                color: '#111111',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Clear crash
            </button>
          </div>
        </div>

        <div
          style={{
            marginTop: 16,
            border: '1px solid #E4E5E5',
            borderRadius: 12,
            padding: 14,
            background: '#fff',
            whiteSpace: 'pre-wrap',
            overflowWrap: 'anywhere',
            fontSize: 12,
            lineHeight: 1.5,
          }}
        >
          {crash}
        </div>
      </div>
    </div>
  );
}

function AppWithCrashReporting() {
  const [crash, setCrash] = useState('');

  useEffect(() => {
    const onError = (event) => {
      const msg = event?.error?.stack || event?.error?.message || event?.message || String(event);
      console.error('Runtime error:', event?.error || event);
      setCrash((prev) => prev || msg);
    };
    const onRejection = (event) => {
      const reason = event?.reason;
      const msg =
        reason?.stack ||
        reason?.message ||
        (typeof reason === 'string' ? reason : JSON.stringify(reason, null, 2));
      console.error('Unhandled rejection:', reason);
      setCrash((prev) => prev || msg);
    };
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  return (
    <>
      <App />
      <CrashOverlay crash={crash} onReset={() => setCrash('')} />
    </>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppWithCrashReporting />
  </StrictMode>,
)
