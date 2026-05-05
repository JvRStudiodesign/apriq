// src/pages/PaymentCancel.jsx
// PayFast redirects here if user cancels during checkout.

import { useNavigate } from 'react-router-dom';

export default function PaymentCancel() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#F9FAFA',
      fontFamily: 'Roboto, sans-serif',
      padding: '2rem',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>×</div>
      <h1 style={{ color: '#111111', fontSize: '1.75rem', fontWeight: 600, marginBottom: '0.5rem' }}>
        Payment cancelled
      </h1>
      <p style={{ color: '#979899', fontSize: '1rem', maxWidth: 400, marginBottom: '1.5rem' }}>
        No charge was made. Your account remains on the free tier.
      </p>
      <button
        onClick={() => navigate('/')}
        style={{
          background: '#0F4C5C',
          color: '#F9FAFA',
          border: 'none',
          borderRadius: 8,
          padding: '0.75rem 1.5rem',
          fontSize: '0.95rem',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Back to AprIQ
      </button>
    </div>
  );
}
