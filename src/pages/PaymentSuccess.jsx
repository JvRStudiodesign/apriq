// src/pages/PaymentSuccess.jsx
// PayFast redirects here after a successful payment.
// Shows confirmation and redirects to the app.

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function PaymentSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to calculator after 4 seconds
    const timer = setTimeout(() => navigate('/'), 4000);
    return () => clearTimeout(timer);
  }, [navigate]);

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
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✓</div>
      <h1 style={{ color: '#0F4C5C', fontSize: '1.75rem', fontWeight: 600, marginBottom: '0.5rem' }}>
        Payment successful
      </h1>
      <p style={{ color: '#979899', fontSize: '1rem', maxWidth: 400 }}>
        Welcome to AprIQ Pro. Your account will be upgraded within a few seconds.
        Redirecting you back…
      </p>
    </div>
  );
}
