import { useState, useRef, useEffect } from 'react';

export default function PlacesAutocomplete({ value, onChange, onSelect, onKeyDown, placeholder, style = {}, disabled = false, autoFocus = false }) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) setTimeout(() => inputRef.current?.focus(), 150);
  }, [autoFocus]);

  useEffect(() => {
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const search = (q) => {
    clearTimeout(debounceRef.current);
    if (!q || q.length < 2) { setSuggestions([]); setOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/places?q=' + encodeURIComponent(q));
        const data = await res.json();
        const results = data.predictions || [];
        setSuggestions(results);
        setOpen(results.length > 0);
      } catch { setSuggestions([]); setOpen(false); }
    }, 250);
  };

  const handleChange = (val) => {
    if (onChange) onChange(val);
    search(val);
  };

  const handleSelect = (item, e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    const val = item.full || (item.label + ', South Africa');
    if (onChange) onChange(val);
    if (onSelect) onSelect(val);
    setSuggestions([]);
    setOpen(false);
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%' }}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={e => handleChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        placeholder={placeholder || 'Start typing a South African address...'}
        style={style}
        disabled={disabled}
        autoComplete="off"
        onKeyDown={(e) => {
          onKeyDown?.(e);
        }}
      />
      {open && suggestions.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 99999,
          background: '#F9FAFA', border: '1px solid #E4E5E5', borderRadius: '12px',
          marginTop: '4px', overflow: 'hidden',
          boxShadow: '0 4px 16px rgba(17,17,17,0.08)',
        }}>
          {suggestions.map((item, i) => (
            <div
              key={i}
              onPointerDown={(e) => handleSelect(item, e)}
              role="option"
              tabIndex={-1}
              style={{
                padding: '10px 14px', fontSize: '13px', color: '#111111',
                fontFamily: "'Roboto',system-ui,sans-serif", cursor: 'pointer',
                borderBottom: i < suggestions.length - 1 ? '1px solid #E4E5E5' : 'none',
                lineHeight: 1.4, background: 'transparent',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#E4E5E5'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {item.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
