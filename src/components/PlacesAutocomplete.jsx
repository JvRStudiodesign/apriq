import { useState, useRef, useEffect } from 'react';

export default function PlacesAutocomplete({ value, onChange, onSelect, placeholder, style = {}, disabled = false, autoFocus = false }) {
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
    if (!q || q.length < 3) { setSuggestions([]); setOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&countrycodes=za&format=json&limit=6&addressdetails=1`,
          { headers: { 'Accept-Language': 'en', 'User-Agent': 'AprIQ/1.0 (apriq.co.za)' } }
        );
        const data = await res.json();
        const results = data.map(d => ({
          label: d.display_name.replace(/, South Africa$/, '').replace(/, ZA$/, ''),
          full: d.display_name,
        }));
        setSuggestions(results);
        setOpen(results.length > 0);
      } catch { setSuggestions([]); setOpen(false); }
    }, 300);
  };

  const handleChange = (val) => {
    if (onChange) onChange(val);
    search(val);
  };

  const handleSelect = (item) => {
    const val = item.label + ', South Africa';
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
      />
      {open && suggestions.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 9999,
          background: '#F9FAFA', border: '1px solid #E4E5E5', borderRadius: '12px',
          marginTop: '4px', overflow: 'hidden',
          boxShadow: '0 4px 16px rgba(17,17,17,0.08)',
        }}>
          {suggestions.map((item, i) => (
            <div
              key={i}
              onMouseDown={() => handleSelect(item)}
              style={{
                padding: '10px 14px', fontSize: '13px', color: '#111111',
                fontFamily: "'Roboto',system-ui,sans-serif", cursor: 'pointer',
                borderBottom: i < suggestions.length - 1 ? '1px solid #E4E5E5' : 'none',
                lineHeight: 1.4,
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
