import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import Timeline from '../components/Timeline';
import ShipmentMap from '../components/ShipmentMap';

export default function TrackPublic() {
  const { trackingId: paramId } = useParams();
  const navigate = useNavigate();
  const [input, setInput] = useState(paramId || '');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const doTrack = async (id) => {
    if (!id?.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await api.track(id.trim().toUpperCase());
      setResult(data);
    } catch (err) {
      setError(err.message || 'Shipment not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (paramId) doTrack(paramId);
  }, [paramId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate(`/track/${input.trim().toUpperCase()}`);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-2xl font-semibold text-ink-950 mb-1">Track your shipment</h1>
      <p className="text-ink-500 text-sm mb-6">Enter your tracking ID to see live status.</p>

      <form onSubmit={handleSubmit} className="flex gap-2 mb-8">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. SW1001AB"
          className="tracking-tag flex-1 rounded-md border border-ink-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
        />
        <button className="bg-ink-950 hover:bg-ink-900 text-white font-medium rounded-md px-5 text-sm transition-colors duration-200 ease-standard">
          Track
        </button>
      </form>

      {loading && <div className="text-ink-500 text-sm">Looking up shipment…</div>}

      {error && (
        <div className="text-sm text-signal-red bg-signal-red-100 border border-signal-red/20 rounded-md px-4 py-3">
          {error}
        </div>
      )}

      {result && (
        <div className="bg-white border border-ink-200 rounded-xl p-6">
          <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
            <div>
              <div className="tracking-tag text-lg font-semibold text-ink-950">{result.tracking_id}</div>
              <div className="text-sm text-ink-500 mt-1">{result.origin} → {result.destination}</div>
            </div>
            <StatusBadge status={result.status} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4 mb-6 text-sm">
            <div>
              <div className="text-ink-400 text-xs mb-0.5">Recipient</div>
              <div className="text-ink-900">{result.recipient_name}</div>
            </div>
            <div>
              <div className="text-ink-400 text-xs mb-0.5">Service</div>
              <div className="text-ink-900 capitalize">{result.service_type}</div>
            </div>
          </div>
          <div className="mb-6">
            <ShipmentMap
              origin={result.origin} originLat={result.origin_lat} originLng={result.origin_lng}
              destination={result.destination} destLat={result.destination_lat} destLng={result.destination_lng}
            />
          </div>
          <div className="border-t border-ink-100 pt-6">
            <Timeline events={result.events} currentStatus={result.status} />
          </div>
        </div>
      )}
    </div>
  );
}
