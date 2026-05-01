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

  const clean = (name) => name
    .replace(/,?\s*South Africa$/i, '')
    .replace(/,?\s*ZA$/i, '')
    .replace(/,?\s*Gauteng$/i, ', Gauteng')
    .trim();

  const search = (q) => {
    clearTimeout(debounceRef.current);
    if (!q || q.length < 2) { setSuggestions([]); setOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const url = 'https://nominatim.openstreetmap.org/search?' + new URLSearchParams({
          q,
          countrycodes: 'za',
          format: 'json',
          limit: '8',
          addressdetails: '1',
          'accept-language': 'en',
        });
        const res = await fetch(url, { headers: { 'User-Agent': 'AprIQ/1.0 (apriq.co.za)' } });
        const data = await res.json();
        const seen = new Set();
        const results = data.map(d => {
          const a = d.address || {};
          const suburb = a.suburb || a.neighbourhood || a.quarter || a.village || '';
          const city = a.city || a.town || a.municipality || a.county || '';
          const province = a.state || a.province || '';
          let label = '';
          if (suburb && city) label = suburb + ', ' + city;
          else if (city && province) label = city + ', ' + province;
          else label = clean(d.display_name).split(',').slice(0, 3).join(',').trim();
          return label;
        }).filter(label => {
          if (!label || seen.has(label)) return false;
          seen.add(label);
          return true;
        }).slice(0, 6);
        setSuggestions(results);
        setOpen(results.length > 0);
      } catch { setSuggestions([]); setOpen(false); }
    }, 300);
  };

  const handleChange = (val) => {
    if (onChange) onChange(val);
    search(val);
  };

  const handleSelect = (label) => {
    const val = label.includes('South Africa') ? label : label + ', South Africa';
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
          {suggestions.map((label, i) => (
            <div
              key={i}
              onMouseDown={() => handleSelect(label)}
              style={{
                padding: '10px 14px', fontSize: '13px', color: '#111111',
                fontFamily: "'Roboto',system-ui,sans-serif", cursor: 'pointer',
                borderBottom: i < suggestions.length - 1 ? '1px solid #E4E5E5' : 'none',
                lineHeight: 1.4, background: 'transparent',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#E4E5E5'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
