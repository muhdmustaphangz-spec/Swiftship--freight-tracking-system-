import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../api/client';

/**
 * A text input that geocodes what the user types (debounced, via our backend
 * proxy — see server/src/services/geocodingService.js for why this isn't
 * called directly from the browser) and shows a dropdown of matching places.
 * Selecting one stores both the display name and its coordinates via
 * onChange({ text, lat, lng }). Typing without selecting a suggestion still
 * updates the text (onChange({ text, lat: null, lng: null })), so the form
 * remains usable even if geocoding is slow, fails, or the place genuinely
 * isn't found — coordinates are simply omitted and the map feature degrades
 * gracefully rather than blocking booking.
 */
export default function LocationInput({ label, required, placeholder, value, onChange }) {
  const [query, setQuery] = useState(value?.text || '');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    setQuery(value?.text || '');
  }, [value?.text]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = useCallback(async (text) => {
    if (!text || text.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const { results } = await api.geocode(text);
      setSuggestions(results);
      setOpen(results.length > 0);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (e) => {
    const text = e.target.value;
    setQuery(text);
    onChange({ text, lat: null, lng: null }); // clear coords until a suggestion is picked

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(text), 500);
  };

  const handleSelect = (place) => {
    const text = place.display_name;
    setQuery(text);
    setOpen(false);
    setSuggestions([]);
    onChange({ text, lat: parseFloat(place.lat), lng: parseFloat(place.lon) });
  };

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-medium text-ink-700 mb-1.5">
        {label}{required && <span className="text-signal-red">*</span>}
      </label>
      <input
        required={required}
        value={query}
        onChange={handleInputChange}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full rounded-md border border-ink-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
      />
      {loading && (
        <div className="absolute right-3 top-[38px] text-ink-400 text-xs">…</div>
      )}
      {open && suggestions.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full bg-white border border-ink-200 rounded-md shadow-md max-h-56 overflow-y-auto">
          {suggestions.map((place) => (
            <li key={place.place_id}>
              <button
                type="button"
                onClick={() => handleSelect(place)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-ink-50 transition-colors duration-200 ease-standard border-b border-ink-50 last:border-0"
              >
                {place.display_name}
              </button>
            </li>
          ))}
        </ul>
      )}
      {value?.lat == null && query.trim().length >= 3 && !loading && !open && (
        <p className="text-xs text-ink-400 mt-1">No location selected from suggestions — distance/map may be less accurate.</p>
      )}
    </div>
  );
}
