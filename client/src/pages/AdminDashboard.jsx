import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import { SkeletonBlock, SkeletonStatCard, SkeletonCard } from '../components/Skeleton';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getAnalytics().then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="max-w-6xl mx-auto px-4 py-10 text-signal-red text-sm">{error}</div>;

  if (!data) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <SkeletonBlock className="h-8 w-40" />
          <SkeletonBlock className="h-9 w-36" />
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)}
        </div>
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <SkeletonCard lines={5} />
          <SkeletonCard lines={5} />
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <SkeletonCard lines={4} />
          <SkeletonCard lines={4} />
        </div>
      </div>
    );
  }

  const maxStatusCount = Math.max(...data.statusCounts.map((s) => s.count), 1);
  const maxRoute = Math.max(...data.routeVolume.map((r) => r.count), 1);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <h1 className="text-2xl font-semibold text-ink-950">Dashboard</h1>
        <Link to="/admin/shipments" className="bg-ink-950 hover:bg-ink-900 text-white font-medium rounded-md px-4 py-2 text-sm transition-colors duration-200 ease-standard">
          Manage shipments
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total revenue" value={`$${data.totalRevenue.toFixed(2)}`} accent />
        <StatCard label="Total shipments" value={data.totalShipments} />
        <StatCard label="Pending" value={data.pending} />
        <StatCard label="Completed" value={data.completed} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white border border-ink-200 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-ink-950 mb-5">Shipments by status</h2>
          <div className="space-y-3">
            {data.statusCounts.map((s) => (
              <div key={s.status}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-ink-600">{s.status}</span>
                  <span className="text-ink-900 font-medium">{s.count}</span>
                </div>
                <div className="h-2 bg-ink-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${(s.count / maxStatusCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-ink-200 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-ink-950 mb-5">Top routes by volume</h2>
          <div className="space-y-3">
            {data.routeVolume.length === 0 && <p className="text-sm text-ink-400">No shipment data yet.</p>}
            {data.routeVolume.map((r, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-ink-600 truncate">{r.origin} → {r.destination}</span>
                  <span className="text-ink-900 font-medium">{r.count}</span>
                </div>
                <div className="h-2 bg-ink-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-signal-blue rounded-full"
                    style={{ width: `${(r.count / maxRoute) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white border border-ink-200 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-ink-950 mb-4">Revenue by service type</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-ink-400 uppercase tracking-wide border-b border-ink-100">
                <th className="pb-2 font-medium">Service</th>
                <th className="pb-2 font-medium">Shipments</th>
                <th className="pb-2 font-medium text-right">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {data.revenueByService.map((r) => (
                <tr key={r.service_type} className="border-b border-ink-50 last:border-0">
                  <td className="py-2.5 capitalize text-ink-700">{r.service_type}</td>
                  <td className="py-2.5 text-ink-700">{r.count}</td>
                  <td className="py-2.5 text-right text-ink-900 font-medium">${r.revenue.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white border border-ink-200 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-ink-950 mb-4">Recent shipments</h2>
          <div className="space-y-3">
            {data.recentShipments.map((r) => (
              <div key={r.tracking_id} className="flex items-center justify-between text-sm">
                <div>
                  <div className="tracking-tag font-medium text-ink-950">{r.tracking_id}</div>
                  <div className="text-ink-400 text-xs">{r.customer_name}</div>
                </div>
                <div className="text-right">
                  <StatusBadge status={r.status} />
                  <div className="text-ink-500 text-xs mt-1">${r.cost.toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div className="bg-white border border-ink-200 rounded-xl p-5">
      <div className="text-sm text-ink-500 mb-1.5">{label}</div>
      <div className={`text-2xl font-semibold ${accent ? 'text-amber-600' : 'text-ink-950'}`}>{value}</div>
    </div>
  );
}
