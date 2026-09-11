import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { routeByRole } from './Login';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', role: 'customer' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await register(form);
      routeByRole(user.role, navigate);
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-ink-950">Create your account</h1>
          <p className="text-ink-500 text-sm mt-1">Book and track shipments with SwiftShip</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-ink-200 rounded-xl p-6 space-y-4 shadow-sm">
          {error && (
            <div className="text-sm text-signal-red bg-signal-red-100 border border-signal-red/20 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">I am a</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { v: 'customer', label: 'Customer' },
                { v: 'driver', label: 'Driver / Agent' },
              ].map((opt) => (
                <button
                  key={opt.v} type="button"
                  onClick={() => setForm((f) => ({ ...f, role: opt.v }))}
                  className={`text-sm rounded-md border px-3 py-2 transition-colors duration-200 ease-standard ${
                    form.role === opt.v
                      ? 'border-amber-500 bg-amber-100 text-amber-600 font-medium'
                      : 'border-ink-200 text-ink-600 hover:border-ink-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">Full name</label>
            <input required value={form.name} onChange={update('name')}
              className="w-full rounded-md border border-ink-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">Email</label>
            <input type="email" required value={form.email} onChange={update('email')}
              className="w-full rounded-md border border-ink-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">Phone</label>
            <input value={form.phone} onChange={update('phone')}
              className="w-full rounded-md border border-ink-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">Password</label>
            <input
              type="password" required minLength={8} value={form.password} onChange={update('password')}
              pattern="(?=.*[A-Za-z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}"
              title="At least 8 characters, including a letter, a number, and a symbol"
              className="w-full rounded-md border border-ink-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400" />
            <p className="text-xs text-ink-400 mt-1.5">At least 8 characters, with a letter, a number, and a symbol (e.g. !, @, #).</p>
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full bg-ink-950 hover:bg-ink-900 text-white font-medium rounded-md py-2.5 text-sm transition-colors duration-200 ease-standard disabled:opacity-60"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-ink-500 mt-6">
          Already have an account? <Link to="/login" className="text-amber-600 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
