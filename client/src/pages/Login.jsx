import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      routeByRole(user.role, navigate);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-ink-950">Sign in</h1>
          <p className="text-ink-500 text-sm mt-1">Access your SwiftShip account</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-ink-200 rounded-xl p-6 space-y-4 shadow-sm">
          {error && (
            <div className="text-sm text-signal-red bg-signal-red-100 border border-signal-red/20 rounded-md px-3 py-2">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">Email</label>
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-ink-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
              placeholder="you@company.com"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-ink-700">Password</label>
              <Link to="/forgot-password" className="text-xs text-amber-600 hover:underline">Forgot password?</Link>
            </div>
            <input
              type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-ink-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full bg-ink-950 hover:bg-ink-900 text-white font-medium rounded-md py-2.5 text-sm transition-colors duration-200 ease-standard disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-sm text-ink-500 mt-6">
          Don't have an account? <Link to="/register" className="text-amber-600 font-medium hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  );
}

export function routeByRole(role, navigate) {
  if (role === 'admin') navigate('/admin');
  else if (role === 'driver') navigate('/driver');
  else navigate('/customer');
}
