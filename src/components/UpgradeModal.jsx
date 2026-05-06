import { useState } from 'react';

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
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const userId   = user?.id || '';
  const email    = user?.email || profile?.email || '';
  const fullName = profile?.full_name || user?.user_metadata?.full_name || '';
  const firstName = fullName.split(' ')[0] || '';
  const lastName  = fullName.split(' ').slice(1).join(' ') || '';

  const canSubmit = !!userId && !!email && !loading;

  async function handleSubscribe() {
    setError(null);
    if (!userId || !email) {
      setError('You must be logged in to upgrade.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/payfast-redirect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, email, firstName, lastName }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server error ${res.status}`);
      }
      const { url } = await res.json();
      if (!url) throw new Error('Server returned no PayFast URL.');
      window.location.assign(url);
    } catch (err) {
      console.error('Subscribe failed:', err);
      setError(err.message || 'Could not start payment. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(15, 76, 92, 0.45)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: BRAND.bg, borderRadius: 16,
          border: `1px solid ${BRAND.border}`,
          width: '100%', maxWidth: 440,
          padding: '2rem', fontFamily: 'Roboto, sans-serif',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: BRAND.teal, fontFamily: 'Aptos, sans-serif' }}>
              Upgrade to Pro
            </h2>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: BRAND.grey }}>
              Unlock all AprIQ features
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: BRAND.grey, fontSize: '1.25rem', lineHeight: 1, padding: '0.25rem' }}>×</button>
        </div>

        <div style={{ border: `2px solid ${BRAND.teal}`, borderRadius: 12, padding: '1.25rem', marginBottom: '1.25rem', background: '#fff', position: 'relative' }}>
          <span style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: BRAND.orange, color: '#fff', fontSize: '0.7rem', fontWeight: 700, padding: '3px 12px', borderRadius: 20, letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
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
          <ul style={{ listStyle: 'none', margin: '1rem 0 0', padding: 0, display: 'grid', gap: '0.5rem' }}>
            {['Custom element cost splits','Rate adjustment ±30%','Escalation with year-by-year breakdown','Mixed-use up to 3 categories','Renovation area split','PDF export','Saved estimates & sharing'].map(f => (
              <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: BRAND.black }}>
                <span style={{ color: BRAND.teal, fontWeight: 700 }}>✓</span>{f}
              </li>
            ))}
          </ul>
        </div>

        {(error || (!userId || !email)) && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.85rem', color: '#B91C1C' }}>
            {error || 'You must be logged in to upgrade.'}
          </div>
        )}

        <button
          type="button"
          onClick={handleSubscribe}
          disabled={!canSubmit}
          style={{
            width: '100%',
            background: canSubmit ? BRAND.teal : BRAND.light,
            color: BRAND.bg, border: 'none', borderRadius: 10,
            padding: '0.875rem', fontSize: '1rem', fontWeight: 700,
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            fontFamily: 'Roboto, sans-serif',
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
