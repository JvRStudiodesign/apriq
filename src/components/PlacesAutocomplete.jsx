import { useEffect, useRef, useState } from 'react';

const PLACES_KEY = import.meta.env.VITE_GOOGLE_PLACES_KEY;

let scriptLoaded = false;
let scriptLoading = false;
const callbacks = [];

function loadGooglePlaces(cb) {
  if (scriptLoaded) { cb(); return; }
  callbacks.push(cb);
  if (scriptLoading) return;
  scriptLoading = true;
  const s = document.createElement('script');
  s.src = `https://maps.googleapis.com/maps/api/js?key=${PLACES_KEY}&libraries=places`;
  s.async = true;
  s.defer = true;
  s.onload = () => {
    scriptLoaded = true;
    callbacks.forEach(fn => fn());
    callbacks.length = 0;
  };
  document.head.appendChild(s);
}

export default function PlacesAutocomplete({ value, onChange, onSelect, placeholder, style = {}, disabled = false, autoFocus = false }) {
  const inputRef = useRef(null);
  const acRef = useRef(null);
  const [ready, setReady] = useState(scriptLoaded);

  useEffect(() => {
    if (!PLACES_KEY) return;
    loadGooglePlaces(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready || !inputRef.current || acRef.current) return;
    const ac = new window.google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: 'za' },
      types: ['geocode', 'establishment'],
      fields: ['formatted_address', 'name'],
    });
    ac.addListener('place_changed', () => {
      const place = ac.getPlace();
      const address = place.formatted_address || place.name || '';
      if (onSelect) onSelect(address);
      if (onChange) onChange(address);
    });
    acRef.current = ac;
    return () => {
      if (acRef.current) {
        window.google?.maps?.event?.clearInstanceListeners(acRef.current);
        acRef.current = null;
      }
    };
  }, [ready]);

  useEffect(() => {
    if (autoFocus && inputRef.current) setTimeout(() => inputRef.current?.focus(), 150);
  }, [autoFocus]);

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={e => onChange && onChange(e.target.value)}
      placeholder={placeholder || 'Start typing a South African address...'}
      style={style}
      disabled={disabled}
      autoComplete="off"
    />
  );
}
