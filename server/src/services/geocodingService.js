// Proxies geocoding requests to OpenStreetMap's Nominatim service.
//
// This exists as a backend proxy rather than calling Nominatim directly from
// the browser for two reasons: Nominatim's usage policy requires a
// descriptive User-Agent identifying the calling application (not reliably
// settable from browser fetch()), and calling it directly from the browser
// was observed to fail with a CORS error in practice — proxying through the
// backend, which has no such restriction, sidesteps both issues.
const AppError = require('../utils/AppError');

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'SwiftShip-Logistics-App/1.0 (student project; contact: none)';

async function geocode(queryText) {
  if (!queryText || queryText.trim().length < 3) return [];

  const url = `${NOMINATIM_URL}?format=json&addressdetails=0&limit=5&q=${encodeURIComponent(queryText)}`;

  let res;
  try {
    res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' } });
  } catch (err) {
    throw new AppError('Could not reach the geocoding service. Please try again.', 502);
  }

  if (!res.ok) {
    throw new AppError('Geocoding service returned an error. Please try again.', 502);
  }

  const data = await res.json();
  return data.map((place) => ({
    place_id: place.place_id,
    display_name: place.display_name,
    lat: parseFloat(place.lat),
    lon: parseFloat(place.lon),
  }));
}

module.exports = { geocode };
