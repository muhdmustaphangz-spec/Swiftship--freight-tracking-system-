import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import { SkeletonRow } from '../components/Skeleton';

const STATUS_OPTIONS = ['Order Placed', 'Picked Up', 'In Transit', 'Out for Delivery', 'Delivered', 'Cancelled'];
const FILTER_OPTIONS = ['All', ...STATUS_OPTIONS];
const SERVICE_OPTIONS = ['All', 'economy', 'standard', 'express'];

const emptyFilters = {
  status: 'All',
  driverId: 'All',
  serviceType: 'All',
  dateFrom: '',
  dateTo: '',
  costMin: '',
  costMax: '',
};

export default function AdminShipments() {
  const [shipments, setShipments] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState(emptyFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const load = () => {
    api.getShipments().then((d) => setShipments(d.shipments)).catch((e) => setError(e.message));
  };

  useEffect(() => {
    load();
    api.getDrivers().then((d) => setDrivers(d.drivers)).catch(() => {});
  }, []);

  const handleStatusChange = async (id, status) => {
    setBusyId(id);
    try {
      await api.updateStatus(id, status);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleDriverChange = async (id, driver_id) => {
    setBusyId(id);
    try {
      await api.assignDriver(id, driver_id ? Number(driver_id) : null);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const setFilter = (key) => (e) => setFilters((f) => ({ ...f, [key]: e.target.value }));
  const clearFilters = () => setFilters(emptyFilters);
  const activeFilterCount = Object.entries(filters).filter(([k, v]) => v && v !== 'All').length;

  const filtered = (shipments || []).filter((s) => {
    if (filters.status !== 'All' && s.status !== filters.status) return false;
    if (filters.serviceType !== 'All' && s.service_type !== filters.serviceType) return false;
    if (filters.driverId !== 'All') {
      if (filters.driverId === 'unassigned' ? s.driver_id : String(s.driver_id) !== filters.driverId) return false;
    }
    if (filters.dateFrom && new Date(s.created_at) < new Date(filters.dateFrom)) return false;
    if (filters.dateTo) {
      const to = new Date(filters.dateTo);
      to.setHours(23, 59, 59, 999); // include the whole end day
      if (new Date(s.created_at) > to) return false;
    }
    if (filters.costMin && s.cost < parseFloat(filters.costMin)) return false;
    if (filters.costMax && s.cost > parseFloat(filters.costMax)) return false;

    if (search) {
      const q = search.toLowerCase();
      return (
        s.tracking_id.toLowerCase().includes(q) ||
        s.customer_name?.toLowerCase().includes(q) ||
        s.origin.toLowerCase().includes(q) ||
        s.destination.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-semibold text-ink-950">Shipment management</h1>
        <Link to="/admin" className="text-sm text-ink-500 hover:text-ink-900">← Dashboard</Link>
      </div>

      {error && <div className="text-sm text-signal-red bg-signal-red-100 rounded-md px-4 py-3 mb-4">{error}</div>}

      <div className="flex flex-wrap gap-3 mb-5">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tracking ID, customer, route…"
          className="flex-1 min-w-[220px] rounded-md border border-ink-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
        />
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className="inline-flex items-center gap-2 rounded-md border border-ink-200 px-3 py-2 text-sm bg-white hover:border-ink-300 transition-colors duration-200 ease-standard"
        >
          Filters
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-ink-950 text-xs font-semibold">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {showFilters && (
        <div className="bg-white border border-ink-200 rounded-xl p-4 mb-5">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-ink-500 mb-1.5">Status</label>
              <select
                value={filters.status}
                onChange={setFilter('status')}
                className="w-full rounded-md border border-ink-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                {FILTER_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-500 mb-1.5">Driver</label>
              <select
                value={filters.driverId}
                onChange={setFilter('driverId')}
                className="w-full rounded-md border border-ink-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="All">All</option>
                <option value="unassigned">Unassigned</option>
                {drivers.map((d) => <option key={d.id} value={String(d.id)}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-500 mb-1.5">Service type</label>
              <select
                value={filters.serviceType}
                onChange={setFilter('serviceType')}
                className="w-full rounded-md border border-ink-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                {SERVICE_OPTIONS.map((s) => <option key={s} value={s}>{s === 'All' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-500 mb-1.5">Cost range ($)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number" min="0" step="0.01" placeholder="Min"
                  value={filters.costMin} onChange={setFilter('costMin')}
                  className="w-full rounded-md border border-ink-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <span className="text-ink-400 text-sm">–</span>
                <input
                  type="number" min="0" step="0.01" placeholder="Max"
                  value={filters.costMax} onChange={setFilter('costMax')}
                  className="w-full rounded-md border border-ink-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-ink-500 mb-1.5">Booked between</label>
              <div className="flex items-center gap-2">
                <input
                  type="date" value={filters.dateFrom} onChange={setFilter('dateFrom')}
                  className="w-full rounded-md border border-ink-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <span className="text-ink-400 text-sm">–</span>
                <input
                  type="date" value={filters.dateTo} onChange={setFilter('dateTo')}
                  className="w-full rounded-md border border-ink-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>
          </div>
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-4 text-sm text-amber-600 hover:underline font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {!shipments && (
        <div className="bg-white border border-ink-200 rounded-xl overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs text-ink-400 uppercase tracking-wide">
                <th className="px-4 py-3 font-medium">Tracking ID</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Route</th>
                <th className="px-4 py-3 font-medium">Cost</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Driver</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={7} />)}
            </tbody>
          </table>
        </div>
      )}

      {shipments && (
        <div className="bg-white border border-ink-200 rounded-xl overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs text-ink-400 uppercase tracking-wide">
                <th className="px-4 py-3 font-medium">Tracking ID</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Route</th>
                <th className="px-4 py-3 font-medium">Cost</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Driver</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50/60 transition-colors duration-200 ease-standard">
                  <td className="px-4 py-3 tracking-tag font-medium text-ink-950 whitespace-nowrap">{s.tracking_id}</td>
                  <td className="px-4 py-3 text-ink-700 whitespace-nowrap">{s.customer_name}</td>
                  <td className="px-4 py-3 text-ink-600 whitespace-nowrap">{s.origin} → {s.destination}</td>
                  <td className="px-4 py-3 text-ink-900 whitespace-nowrap">${s.cost.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <select
                      value={s.status}
                      disabled={busyId === s.id}
                      onChange={(e) => handleStatusChange(s.id, e.target.value)}
                      className="text-xs rounded-md border border-ink-200 px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-50"
                    >
                      {STATUS_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={s.driver_id || ''}
                      disabled={busyId === s.id}
                      onChange={(e) => handleDriverChange(s.id, e.target.value)}
                      className="text-xs rounded-md border border-ink-200 px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-50"
                    >
                      <option value="">Unassigned</option>
                      {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Link to={`/admin/shipments/${s.id}`} className="text-amber-600 hover:underline font-medium">View</Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-ink-400">No shipments match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
