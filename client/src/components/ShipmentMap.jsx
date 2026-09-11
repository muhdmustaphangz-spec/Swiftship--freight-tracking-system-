import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Leaflet's default marker icons reference image files by relative URL, which
// breaks under Vite's bundling (the paths don't resolve). Rebuilding the
// default icon from CDN-hosted images is the standard, documented workaround.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

/**
 * Shows origin and destination as markers with a connecting line. If either
 * coordinate pair is missing (e.g. a shipment booked before geocoding was
 * added, or the customer typed a location without picking a suggestion),
 * shows a plain message instead of a broken/empty map — this is expected to
 * happen for older data and should not look like an error.
 */
export default function ShipmentMap({ origin, originLat, originLng, destination, destLat, destLng }) {
  const hasOrigin = originLat != null && originLng != null;
  const hasDest = destLat != null && destLng != null;

  if (!hasOrigin && !hasDest) {
    return (
      <div className="bg-ink-50 border border-ink-200 rounded-xl p-6 text-center text-sm text-ink-400">
        Map unavailable for this shipment — no location coordinates were recorded at booking.
      </div>
    );
  }

  const points = [];
  if (hasOrigin) points.push([originLat, originLng]);
  if (hasDest) points.push([destLat, destLng]);

  // Center on the midpoint of whichever points are available; a sensible
  // default zoom that works whether we have one point or two.
  const center = hasOrigin && hasDest
    ? [(originLat + destLat) / 2, (originLng + destLng) / 2]
    : points[0];

  return (
    <div className="rounded-xl overflow-hidden border border-ink-200" style={{ height: 320 }}>
      <MapContainer center={center} zoom={hasOrigin && hasDest ? 3 : 8} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={19}
        />
        {hasOrigin && (
          <Marker position={[originLat, originLng]}>
            <Popup>Origin: {origin}</Popup>
          </Marker>
        )}
        {hasDest && (
          <Marker position={[destLat, destLng]}>
            <Popup>Destination: {destination}</Popup>
          </Marker>
        )}
        {hasOrigin && hasDest && (
          <Polyline positions={points} pathOptions={{ color: '#e08a1e', weight: 3, dashArray: '6 6' }} />
        )}
      </MapContainer>
    </div>
  );
}
