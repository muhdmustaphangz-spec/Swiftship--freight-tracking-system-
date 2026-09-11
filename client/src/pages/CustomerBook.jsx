import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import LocationInput from '../components/LocationInput';

const SERVICE_OPTIONS = [
  { v: 'economy', label: 'Economy', desc: '5–7 days · lowest cost' },
  { v: 'standard', label: 'Standard', desc: '3–5 days · balanced' },
  { v: 'express', label: 'Express', desc: '1–2 days · priority' },
];

const initialForm = {
  origin: '', destination: '', distance_km: '',
  origin_lat: null, origin_lng: null, destination_lat: null, destination_lng: null,
  weight_kg: '', length_cm: '', width_cm: '', height_cm: '',
  recipient_name: '', recipient_phone: '', recipient_address: '',
  service_type: 'standard',
};

export default function CustomerBook() {
  const [form, setForm] = useState(initialForm);
  const [pricing, setPricing] = useState(null);
  const [estimating, setEstimating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [booked, setBooked] = useState(null);
  const navigate = useNavigate();

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const canEstimate = form.distance_km && form.weight_kg;

  const runEstimate = useCallback(async () => {
    if (!form.distance_km || !form.weight_kg) {
      setPricing(null);
      return;
    }
    setEstimating(true);
    try {
      const data = await api.estimate({
        distance_km: Number(form.distance_km),
        weight_kg: Number(form.weight_kg),
        length_cm: form.length_cm ? Number(form.length_cm) : 0,
        width_cm: form.width_cm ? Number(form.width_cm) : 0,
        height_cm: form.height_cm ? Number(form.height_cm) : 0,
        service_type: form.service_type,
      });
      setPricing(data);
    } catch {
      setPricing(null);
    } finally {
      setEstimating(false);
    }
  }, [form.distance_km, form.weight_kg, form.length_cm, form.width_cm, form.height_cm, form.service_type]);

  useEffect(() => {
    const t = setTimeout(runEstimate, 350); // debounce
    return () => clearTimeout(t);
  }, [runEstimate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { shipment } = await api.createShipment(form);
      setBooked(shipment);
      setForm(initialForm);
      setPricing(null);
    } catch (err) {
      setError(err.message || 'Failed to book shipment');
    } finally {
      setSubmitting(false);
    }
  };

  if (booked) {
    return (
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="mx-auto w-14 h-14 rounded-full bg-signal-green-100 flex items-center justify-center mb-5">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M4 12.5L9 17.5L20 6.5" stroke="#2f7d5f" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-ink-950">Shipment booked</h1>
        <p className="text-ink-500 mt-2">Your tracking number is</p>
        <div className="tracking-tag text-2xl font-semibold text-ink-950 mt-2 mb-8">{booked.tracking_id}</div>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => navigate('/customer/shipments')}
            className="bg-ink-950 hover:bg-ink-900 text-white font-medium rounded-md px-5 py-2.5 text-sm transition-colors duration-200 ease-standard"
          >
            View my shipments
          </button>
          <button
            onClick={() => setBooked(null)}
            className="border border-ink-200 hover:border-ink-300 rounded-md px-5 py-2.5 text-sm transition-colors duration-200 ease-standard"
          >
            Book another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-semibold text-ink-950 mb-1">Book a shipment</h1>
      <p className="text-ink-500 text-sm mb-8">Fill in the details below to get an instant price and tracking number.</p>

      <div className="grid lg:grid-cols-3 gap-8">
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
          {error && (
            <div className="text-sm text-signal-red bg-signal-red-100 border border-signal-red/20 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <fieldset className="bg-white border border-ink-200 rounded-xl p-5">
            <legend className="text-sm font-semibold text-ink-950 px-1">Route</legend>
            <div className="grid sm:grid-cols-2 gap-4 mt-2">
              <LocationInput
                label="Origin" required placeholder="Lagos, Nigeria"
                value={{ text: form.origin, lat: form.origin_lat, lng: form.origin_lng }}
                onChange={({ text, lat, lng }) => setForm((f) => ({ ...f, origin: text, origin_lat: lat, origin_lng: lng }))}
              />
              <LocationInput
                label="Destination" required placeholder="London, England"
                value={{ text: form.destination, lat: form.destination_lat, lng: form.destination_lng }}
                onChange={({ text, lat, lng }) => setForm((f) => ({ ...f, destination: text, destination_lat: lat, destination_lng: lng }))}
              />
              <Field label="Distance (km)" required type="number" min="1" value={form.distance_km} onChange={update('distance_km')} placeholder="346" />
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">Service type</label>
                <select value={form.service_type} onChange={update('service_type')}
                  className="w-full rounded-md border border-ink-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-white">
                  {SERVICE_OPTIONS.map((s) => <option key={s.v} value={s.v}>{s.label} — {s.desc}</option>)}
                </select>
              </div>
            </div>
          </fieldset>

          <fieldset className="bg-white border border-ink-200 rounded-xl p-5">
            <legend className="text-sm font-semibold text-ink-950 px-1">Parcel</legend>
            <div className="grid sm:grid-cols-2 gap-4 mt-2">
              <Field label="Weight (kg)" required type="number" step="0.1" min="0.1" value={form.weight_kg} onChange={update('weight_kg')} placeholder="4.5" />
              <div className="grid grid-cols-3 gap-2">
                <Field label="L (cm)" type="number" min="0" value={form.length_cm} onChange={update('length_cm')} placeholder="30" />
                <Field label="W (cm)" type="number" min="0" value={form.width_cm} onChange={update('width_cm')} placeholder="20" />
                <Field label="H (cm)" type="number" min="0" value={form.height_cm} onChange={update('height_cm')} placeholder="15" />
              </div>
            </div>
          </fieldset>

          <fieldset className="bg-white border border-ink-200 rounded-xl p-5">
            <legend className="text-sm font-semibold text-ink-950 px-1">Recipient</legend>
            <div className="grid sm:grid-cols-2 gap-4 mt-2">
              <Field label="Full name" required value={form.recipient_name} onChange={update('recipient_name')} placeholder="Taylor Morgan" />
              <Field label="Phone" required value={form.recipient_phone} onChange={update('recipient_phone')} placeholder="555-0400" />
              <div className="sm:col-span-2">
                <Field label="Delivery address" required value={form.recipient_address} onChange={update('recipient_address')} placeholder="14 Baker Street, London, England" />
              </div>
            </div>
          </fieldset>

          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto lift-on-hover bg-amber-500 hover:bg-amber-400 text-ink-950 font-medium rounded-md px-6 py-3 text-sm transition-colors duration-200 ease-standard disabled:opacity-60"
          >
            {submitting ? 'Booking…' : 'Confirm & book shipment'}
          </button>
        </form>

        <div className="lg:sticky lg:top-20 h-fit">
          <div className="bg-ink-950 text-white rounded-xl p-5">
            <div className="text-sm font-medium text-ink-300 mb-4">Price estimate</div>
            {!canEstimate && (
              <p className="text-ink-400 text-sm">Enter distance and weight to see a live estimate.</p>
            )}
            {canEstimate && estimating && !pricing && (
              <p className="text-ink-400 text-sm">Calculating…</p>
            )}
            {pricing && (
              <div>
                <div className="space-y-2 text-sm mb-4">
                  <Row label="Base fee" value={pricing.base_fee} />
                  <Row label="Distance charge" value={pricing.distance_cost} />
                  <Row label="Weight charge" value={pricing.weight_cost} />
                  {pricing.volumetric_weight_kg > 0 && (
                    <div className="text-xs text-ink-500 pt-1">
                      Chargeable weight: {pricing.chargeable_weight_kg} kg
                      {pricing.volumetric_weight_kg > 0 && ` (volumetric: ${pricing.volumetric_weight_kg} kg)`}
                    </div>
                  )}
                </div>
                <div className="border-t border-ink-800 pt-4 flex items-baseline justify-between">
                  <span className="text-ink-300 text-sm">Total</span>
                  <span className="text-2xl font-semibold text-amber-400">${pricing.total.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, required, ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink-700 mb-1.5">
        {label}{required && <span className="text-signal-red">*</span>}
      </label>
      <input
        required={required}
        {...props}
        className="w-full rounded-md border border-ink-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
      />
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-ink-400">{label}</span>
      <span className="text-ink-100">${Number(value).toFixed(2)}</span>
    </div>
  );
}
