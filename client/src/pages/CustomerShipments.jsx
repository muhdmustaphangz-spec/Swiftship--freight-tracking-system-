import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import { SkeletonRow } from '../components/Skeleton';

export default function CustomerShipments() {
  const [shipments, setShipments] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getShipments().then((d) => setShipments(d.shipments)).catch((e) => setError(e.message));
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-semibold text-ink-950">My shipments</h1>
        <Link to="/customer" className="lift-on-hover bg-amber-500 hover:bg-amber-400 text-ink-950 font-medium rounded-md px-4 py-2 text-sm transition-colors duration-200 ease-standard">
          + Book a shipment
        </Link>
      </div>

      {error && <div className="text-sm text-signal-red bg-signal-red-100 rounded-md px-4 py-3">{error}</div>}

      {!shipments && !error && (
        <div className="bg-white border border-ink-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs text-ink-400 uppercase tracking-wide">
                <th className="px-4 py-3 font-medium">Tracking ID</th>
                <th className="px-4 py-3 font-medium">Route</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Cost</th>
                <th className="px-4 py-3 font-medium">Booked</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} cols={6} />)}
            </tbody>
          </table>
        </div>
      )}

      {shipments && shipments.length === 0 && (
        <div className="text-center py-16 bg-white border border-ink-200 rounded-xl">
          <p className="text-ink-500">You haven't booked any shipments yet.</p>
          <Link to="/customer" className="inline-block mt-4 text-amber-600 font-medium hover:underline text-sm">Book your first shipment</Link>
        </div>
      )}

      {shipments && shipments.length > 0 && (
        <div className="bg-white border border-ink-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs text-ink-400 uppercase tracking-wide">
                <th className="px-4 py-3 font-medium">Tracking ID</th>
                <th className="px-4 py-3 font-medium">Route</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Cost</th>
                <th className="px-4 py-3 font-medium">Booked</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {shipments.map((s) => (
                <tr key={s.id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50 transition-colors duration-200 ease-standard">
                  <td className="px-4 py-3 tracking-tag font-medium text-ink-950">{s.tracking_id}</td>
                  <td className="px-4 py-3 text-ink-600">{s.origin} → {s.destination}</td>
                  <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                  <td className="px-4 py-3 text-ink-900">${s.cost.toFixed(2)}</td>
                  <td className="px-4 py-3 text-ink-500">{new Date(s.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/customer/shipments/${s.id}`} className="text-amber-600 hover:underline font-medium">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
