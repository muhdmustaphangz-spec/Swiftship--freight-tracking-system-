import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import SignatureCapture from '../components/SignatureCapture';
import Spinner from '../components/Spinner';
import { SkeletonBlock } from '../components/Skeleton';

const NEXT_STATUS = {
  'Order Placed': 'Picked Up',
  'Picked Up': 'In Transit',
  'In Transit': 'Out for Delivery',
};

export default function DriverPortal() {
  const [shipments, setShipments] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [podShipmentId, setPodShipmentId] = useState(null);
  const [podMode, setPodMode] = useState(null); // 'signature' | 'photo'

  const load = () => {
    api.getShipments().then((d) => setShipments(d.shipments)).catch((e) => setError(e.message));
  };

  useEffect(() => { load(); }, []);

  const advanceStatus = async (id, current) => {
    const next = NEXT_STATUS[current];
    if (!next) return;
    setBusyId(id);
    try {
      await api.driverUpdateStatus(id, next);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleSignature = async (id, dataUrl) => {
    setBusyId(id);
    try {
      await api.podSignature(id, dataUrl);
      setPodShipmentId(null);
      setPodMode(null);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const handlePhoto = async (id, file) => {
    setBusyId(id);
    try {
      const formData = new FormData();
      formData.append('photo', file);
      await api.podPhoto(id, formData);
      setPodShipmentId(null);
      setPodMode(null);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const active = (shipments || []).filter((s) => !['Delivered', 'Cancelled'].includes(s.status));
  const completed = (shipments || []).filter((s) => ['Delivered', 'Cancelled'].includes(s.status));

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-semibold text-ink-950 mb-1">My deliveries</h1>
      <p className="text-ink-500 text-sm mb-8">Update status as you move packages, and capture proof of delivery.</p>

      {error && <div className="text-sm text-signal-red bg-signal-red-100 rounded-md px-4 py-3 mb-4">{error}</div>}
      {!shipments && (
        <div className="space-y-4 mb-10">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-white border border-ink-200 rounded-xl p-5">
              <SkeletonBlock className="h-5 w-32 mb-2" />
              <SkeletonBlock className="h-4 w-48" />
            </div>
          ))}
        </div>
      )}

      {shipments && (
        <>
          <h2 className="text-base font-semibold text-ink-900 mb-3">
            Active ({active.length})
          </h2>
          {active.length === 0 && (
            <div className="text-center py-12 bg-white border border-ink-200 rounded-xl mb-8 text-ink-400 text-sm">
              No active deliveries assigned to you right now.
            </div>
          )}
          <div className="space-y-4 mb-10">
            {active.map((s) => (
              <div key={s.id} className="bg-white border border-ink-200 rounded-xl p-5">
                <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
                  <div>
                    <Link to={`/driver/shipments/${s.id}`} className="tracking-tag font-semibold text-ink-950 hover:text-amber-600">
                      {s.tracking_id}
                    </Link>
                    <div className="text-sm text-ink-500 mt-0.5">{s.origin} → {s.destination}</div>
                  </div>
                  <StatusBadge status={s.status} />
                </div>

                <div className="grid sm:grid-cols-2 gap-3 text-sm mb-4">
                  <div>
                    <div className="text-ink-400 text-xs">Recipient</div>
                    <div className="text-ink-900">{s.recipient_name} · {s.recipient_phone}</div>
                  </div>
                  <div>
                    <div className="text-ink-400 text-xs">Deliver to</div>
                    <div className="text-ink-900">{s.recipient_address}</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {NEXT_STATUS[s.status] && (
                    <button
                      onClick={() => advanceStatus(s.id, s.status)}
                      disabled={busyId === s.id}
                      className="inline-flex items-center gap-2 bg-ink-950 hover:bg-ink-900 text-white text-sm font-medium rounded-md px-4 py-2 transition-colors duration-200 ease-standard disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {busyId === s.id && <Spinner />}
                      Mark as {NEXT_STATUS[s.status]}
                    </button>
                  )}
                  {s.status === 'Out for Delivery' && (
                    <>
                      <button
                        onClick={() => { setPodShipmentId(s.id); setPodMode('signature'); }}
                        className="bg-signal-green hover:bg-signal-green/90 text-white text-sm font-medium rounded-md px-4 py-2 transition-colors duration-200 ease-standard"
                      >
                        Capture signature
                      </button>
                      <label className="bg-signal-blue hover:bg-signal-blue/90 text-white text-sm font-medium rounded-md px-4 py-2 transition-colors duration-200 ease-standard cursor-pointer">
                        Upload photo
                        <input
                          type="file" accept="image/*" capture="environment" className="hidden"
                          onChange={(e) => e.target.files[0] && handlePhoto(s.id, e.target.files[0])}
                        />
                      </label>
                    </>
                  )}
                </div>

                {podShipmentId === s.id && podMode === 'signature' && (
                  <div className="mt-4 pt-4 border-t border-ink-100">
                    <div className="text-sm font-medium text-ink-700 mb-2">Recipient signature</div>
                    <SignatureCapture
                      onCapture={(dataUrl) => handleSignature(s.id, dataUrl)}
                      onCancel={() => { setPodShipmentId(null); setPodMode(null); }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {completed.length > 0 && (
            <>
              <h2 className="text-base font-semibold text-ink-900 mb-3">
                Completed ({completed.length})
              </h2>
              <div className="bg-white border border-ink-200 rounded-xl divide-y divide-ink-50">
                {completed.map((s) => (
                  <Link key={s.id} to={`/driver/shipments/${s.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-ink-50 transition-colors duration-200 ease-standard">
                    <div>
                      <span className="tracking-tag text-sm font-medium text-ink-900">{s.tracking_id}</span>
                      <span className="text-ink-400 text-sm ml-2">{s.origin} → {s.destination}</span>
                    </div>
                    <StatusBadge status={s.status} />
                  </Link>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
