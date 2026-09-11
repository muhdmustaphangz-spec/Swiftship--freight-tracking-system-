import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Landing() {
  const [trackingId, setTrackingId] = useState('');
  const navigate = useNavigate();

  const handleTrack = (e) => {
    e.preventDefault();
    if (trackingId.trim()) navigate(`/track/${trackingId.trim().toUpperCase()}`);
  };

  return (
    <div>
      <section className="bg-ink-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl sm:text-5xl font-semibold leading-[1.1] tracking-tight">
              Ship it. Track it.<br />Know exactly where it is.
            </h1>
            <p className="text-ink-300 mt-5 text-lg max-w-md">
              Book a shipment in minutes, get a transparent price before you commit,
              and watch it move from pickup to delivery in real time.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register" className="lift-on-hover bg-amber-500 hover:bg-amber-400 text-ink-950 font-medium rounded-md px-5 py-2.5 text-sm transition-colors duration-200 ease-standard">
                Book a shipment
              </Link>
              <Link to="/login" className="border border-ink-700 hover:border-ink-500 rounded-md px-5 py-2.5 text-sm transition-colors duration-200 ease-standard">
                Sign in
              </Link>
            </div>
          </div>

          <div className="bg-ink-900 border border-ink-800 rounded-xl p-6">
            <div className="text-sm font-medium text-ink-300 mb-3">Track a shipment</div>
            <form onSubmit={handleTrack} className="flex gap-2">
              <input
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                placeholder="e.g. SW1001AB"
                className="tracking-tag flex-1 rounded-md bg-ink-950 border border-ink-700 px-3 py-2.5 text-sm text-white placeholder:text-ink-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <button className="lift-on-hover bg-amber-500 hover:bg-amber-400 text-ink-950 font-medium rounded-md px-4 text-sm transition-colors duration-200 ease-standard">
                Track
              </button>
            </form>
            <div className="mt-6 pt-6 border-t border-ink-800 grid grid-cols-3 gap-4 text-center">
              {['Order Placed', 'In Transit', 'Delivered'].map((s) => (
                <div key={s} className="text-xs text-ink-400">{s}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 grid sm:grid-cols-3 gap-8">
        {[
          {
            title: 'Book in minutes',
            body: 'Enter origin, destination and parcel details. Get an instant, transparent cost estimate before you confirm.',
          },
          {
            title: 'Real-time status',
            body: 'Every shipment moves through a clear timeline — placed, picked up, in transit, out for delivery, delivered.',
          },
          {
            title: 'Proof of delivery',
            body: 'Drivers capture a signature or photo at drop-off, so you always know the parcel arrived.',
          },
        ].map((f) => (
          <div key={f.title}>
            <h3 className="font-semibold text-ink-950">{f.title}</h3>
            <p className="text-ink-500 text-sm mt-2 leading-relaxed">{f.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
