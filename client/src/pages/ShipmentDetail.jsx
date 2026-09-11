import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, uploadUrl } from '../api/client';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import Timeline from '../components/Timeline';
import Spinner from '../components/Spinner';
import { SkeletonBlock, SkeletonCard } from '../components/Skeleton';
import ShipmentMap from '../components/ShipmentMap';

export default function ShipmentDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState('');

  const backPath = user?.role === 'admin' ? '/admin/shipments' : user?.role === 'driver' ? '/driver' : '/customer/shipments';

  const load = () => {
    api.getShipment(id).then(setData).catch((e) => setError(e.message));
  };

  useEffect(() => { load(); }, [id]);

  const handleDownload = async (type) => {
    setDownloading(type);
    try {
      const fn = type === 'invoice' ? api.downloadInvoice : api.downloadWaybill;
      const { blob, filename } = await fn(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      setError(e.message);
    } finally {
      setDownloading('');
    }
  };

  if (error) return <div className="max-w-3xl mx-auto px-4 py-10 text-signal-red text-sm">{error}</div>;
  if (!data) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <SkeletonBlock className="h-4 w-16 mb-4" />
        <div className="bg-white border border-ink-200 rounded-xl p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <SkeletonBlock className="h-6 w-40 mb-2" />
              <SkeletonBlock className="h-4 w-56" />
            </div>
            <SkeletonBlock className="h-6 w-24" />
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i}>
                <SkeletonBlock className="h-3 w-16 mb-1.5" />
                <SkeletonBlock className="h-4 w-24" />
              </div>
            ))}
          </div>
        </div>
        <SkeletonCard lines={5} />
      </div>
    );
  }

  const { shipment: s, events } = data;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <Link to={backPath} className="text-sm text-ink-500 hover:text-ink-900 mb-4 inline-flex items-center gap-1">
        ← Back
      </Link>

      <div className="bg-white border border-ink-200 rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
          <div>
            <div className="tracking-tag text-xl font-semibold text-ink-950">{s.tracking_id}</div>
            <div className="text-sm text-ink-500 mt-1">{s.origin} → {s.destination}</div>
          </div>
          <StatusBadge status={s.status} />
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mb-6 text-sm">
          <Info label="Recipient" value={s.recipient_name} />
          <Info label="Phone" value={s.recipient_phone} />
          <Info label="Service" value={<span className="capitalize">{s.service_type}</span>} />
          <Info label="Weight" value={`${s.weight_kg} kg`} />
          <Info label="Dimensions" value={s.length_cm ? `${s.length_cm}×${s.width_cm}×${s.height_cm} cm` : '—'} />
          <Info label="Cost" value={`$${s.cost.toFixed(2)}`} />
          {s.customer_name && <Info label="Customer" value={s.customer_name} />}
          {s.driver_name && <Info label="Driver" value={s.driver_name} />}
          <Info label="Address" value={s.recipient_address} />
        </div>

        <div className="mb-6">
          <ShipmentMap
            origin={s.origin} originLat={s.origin_lat} originLng={s.origin_lng}
            destination={s.destination} destLat={s.destination_lat} destLng={s.destination_lng}
          />
        </div>

        {s.pod_data && (
          <div className="mb-6 border-t border-ink-100 pt-5">
            <div className="text-xs text-ink-400 mb-2">Proof of delivery ({s.pod_type})</div>
            {s.pod_type === 'signature' ? (
              <img src={s.pod_data} alt="Delivery signature" className="border border-ink-200 rounded-md bg-white h-24" />
            ) : (
              <img src={uploadUrl(s.pod_data)} alt="Delivery photo" className="border border-ink-200 rounded-md max-h-48" />
            )}
          </div>
        )}

        <div className="flex gap-2 flex-wrap border-t border-ink-100 pt-5">
          <button
            onClick={() => handleDownload('invoice')}
            disabled={downloading === 'invoice'}
            className="inline-flex items-center gap-2 text-sm border border-ink-200 hover:border-ink-300 rounded-md px-4 py-2 transition-colors duration-200 ease-standard disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {downloading === 'invoice' && <Spinner />}
            {downloading === 'invoice' ? 'Downloading invoice…' : 'Download invoice'}
          </button>
          <button
            onClick={() => handleDownload('waybill')}
            disabled={downloading === 'waybill'}
            className="inline-flex items-center gap-2 text-sm border border-ink-200 hover:border-ink-300 rounded-md px-4 py-2 transition-colors duration-200 ease-standard disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {downloading === 'waybill' && <Spinner />}
            {downloading === 'waybill' ? 'Downloading waybill…' : 'Download waybill'}
          </button>
        </div>
      </div>

      <div className="bg-white border border-ink-200 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-ink-950 mb-5">Tracking timeline</h2>
        <Timeline events={events} currentStatus={s.status} />
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <div className="text-ink-400 text-xs mb-0.5">{label}</div>
      <div className="text-ink-900">{value}</div>
    </div>
  );
}
