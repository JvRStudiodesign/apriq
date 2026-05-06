// src/components/UpgradeModal.jsx
// Upgrade to Pro modal — shows plan card, triggers PayFast payment.
//
// INTEGRATION POINTS (search TODO):
//   1. Replace useAuth() import path with your actual auth hook
//   2. Pass user object with { id, email, user_metadata.full_name }
//
// Usage:
//   import UpgradeModal from './components/UpgradeModal';
//   <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} />

import { useState } from 'react';

// TODO: replace with your actual auth hook path
// import { useAuth } from '../contexts/AuthContext';

const BRAND = {
  teal:   '#0F4C5C',
  black:  '#111111',
  bg:     '#F9FAFA',
  border: '#E4E5E5',
  grey:   '#979899',
  orange: '#FF8210',
  light:  '#BFD1D6',
};

export default function UpgradeModal({ isOpen, onClose, user, profile }) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  if (!isOpen) return null;

  async function handleUpgrade() {
    // Resolve email and name — profile is more reliable than auth user object
    const userId    = user?.id;
    const email     = user?.email || profile?.email;
    const fullName  = profile?.full_name || user?.user_metadata?.full_name || '';

    if (!userId || !email) {
      setError('You must be logged in to upgrade.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Get signed params from server
      const res = await fetch('/api/payfast-sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          email,
          firstName: fullName.split(' ')[0] || '',
          lastName:  fullName.split(' ').slice(1).join(' ') || '',
        }),
      });

      if (!res.ok) throw new Error('Failed to initialise payment.');

      const { payfastUrl, params } = await res.json();

      // 2. Build a hidden form and POST to PayFast
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = payfastUrl;

      Object.entries(params).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type  = 'hidden';
        input.name  = key;
        input.value = value;
        form.appendChild(input);
      });

      // DEBUG — log all params before submit (remove after fix)
      const debugParams = {};
      form.querySelectorAll('input').forEach(i => { debugParams[i.name] = i.value; });
      console.log('=== PAYFAST PARAMS ===', JSON.stringify(debugParams, null, 2));
      console.log('=== PAYFAST URL ===', payfastUrl);
      alert('DEBUG: Check browser console (F12) for PayFast params before submitting. Click OK to proceed to PayFast.');
      // DEBUG — log all params before submit (remove after fix)
      const debugParams = {};
      form.querySelectorAll('input').forEach(i => { debugParams[i.name] = i.value; });
      console.log('=== PAYFAST PARAMS ===', JSON.stringify(debugParams, null, 2));
      console.log('=== PAYFAST URL ===', payfastUrl);
      alert('DEBUG: Check browser console (F12) for PayFast params before submitting. Click OK to proceed to PayFast.');
      document.body.appendChild(form);
      form.submit();

    } catch (err) {
      console.error('UpgradeModal error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  return (
    // Backdrop
    <div
      onClick={onClose}
      style={{
        position:        'fixed',
        inset:           0,
        background:      'rgba(15, 76, 92, 0.45)',
        backdropFilter:  'blur(4px)',
        zIndex:          1000,
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        padding:         '1rem',
      }}
    >
      {/* Modal card */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background:   BRAND.bg,
          borderRadius: 16,
          border:       `1px solid ${BRAND.border}`,
          width:        '100%',
          maxWidth:     440,
          padding:      '2rem',
          fontFamily:   'Roboto, sans-serif',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: BRAND.teal, fontFamily: 'Aptos, sans-serif' }}>
              Upgrade to Pro
            </h2>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: BRAND.grey }}>
              Unlock all AprIQ features
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border:     'none',
              cursor:     'pointer',
              color:      BRAND.grey,
              fontSize:   '1.25rem',
              lineHeight: 1,
              padding:    '0.25rem',
            }}
          >
            ×
          </button>
        </div>

        {/* Plan card */}
        <div style={{
          border:       `2px solid ${BRAND.teal}`,
          borderRadius: 12,
          padding:      '1.25rem',
          marginBottom: '1.25rem',
          background:   '#fff',
          position:     'relative',
        }}>
          <span style={{
            position:     'absolute',
            top:          -12,
            left:         '50%',
            transform:    'translateX(-50%)',
            background:   BRAND.orange,
            color:        '#fff',
            fontSize:     '0.7rem',
            fontWeight:   700,
            padding:      '3px 12px',
            borderRadius: 20,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            whiteSpace:   'nowrap',
          }}>
            Most popular
          </span>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', color: BRAND.black }}>Pro Monthly</div>
              <div style={{ color: BRAND.grey, fontSize: '0.8rem', marginTop: 2 }}>Cancel anytime</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '1.75rem', fontWeight: 800, color: BRAND.teal }}>R79</span>
              <span style={{ color: BRAND.grey, fontSize: '0.85rem' }}>/month</span>
            </div>
          </div>

          {/* Feature list */}
          <ul style={{ listStyle: 'none', margin: '1rem 0 0', padding: 0, display: 'grid', gap: '0.5rem' }}>
            {[
              'Custom element cost splits',
              'Rate adjustment ±30%',
              'Escalation with year-by-year breakdown',
              'Mixed-use up to 3 categories',
              'Renovation area split',
              'PDF export',
              'Saved estimates & sharing',
            ].map(f => (
              <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: BRAND.black }}>
                <span style={{ color: BRAND.teal, fontWeight: 700, fontSize: '0.9rem' }}>✓</span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background:   '#FEF2F2',
            border:       '1px solid #FECACA',
            borderRadius: 8,
            padding:      '0.75rem 1rem',
            marginBottom: '1rem',
            fontSize:     '0.85rem',
            color:        '#B91C1C',
          }}>
            {error}
          </div>
        )}

        {/* CTA */}
        <button
          onClick={handleUpgrade}
          disabled={loading}
          style={{
            width:        '100%',
            background:   loading ? BRAND.light : BRAND.teal,
            color:        BRAND.bg,
            border:       'none',
            borderRadius: 10,
            padding:      '0.875rem',
            fontSize:     '1rem',
            fontWeight:   700,
            cursor:       loading ? 'not-allowed' : 'pointer',
            transition:   'background 0.2s',
            fontFamily:   'Roboto, sans-serif',
          }}
        >
          {loading ? 'Redirecting to PayFast…' : 'Subscribe — R79/month'}
        </button>

        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: BRAND.grey, marginTop: '0.75rem', marginBottom: 0 }}>
          Secured by PayFast · Cancel anytime from your billing page
        </p>
      </div>
    </div>
  );
}
