import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.resetPassword(token, password);
      setDone(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(err.message || 'This reset link may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-2xl font-semibold text-ink-950">Missing reset link</h1>
          <p className="text-ink-500 mt-2 text-sm">This page needs a valid reset token from your email link.</p>
          <Link to="/forgot-password" className="inline-block mt-6 text-amber-600 font-medium hover:underline text-sm">
            Request a new reset link
          </Link>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-signal-green-100 flex items-center justify-center mb-5">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M4 12.5L9 17.5L20 6.5" stroke="#2f7d5f" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-ink-950">Password reset</h1>
          <p className="text-ink-500 mt-2 text-sm">Redirecting you to sign in…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-ink-950">Choose a new password</h1>
          <p className="text-ink-500 text-sm mt-1">Make it something you haven't used before.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-ink-200 rounded-xl p-6 space-y-4 shadow-sm">
          {error && (
            <div className="text-sm text-signal-red bg-signal-red-100 border border-signal-red/20 rounded-md px-3 py-2">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">New password</label>
            <input
              type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              pattern="(?=.*[A-Za-z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}"
              title="At least 8 characters, including a letter, a number, and a symbol"
              className="w-full rounded-md border border-ink-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
              placeholder="••••••••"
            />
            <p className="text-xs text-ink-400 mt-1.5">At least 8 characters, with a letter, a number, and a symbol.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">Confirm new password</label>
            <input
              type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-md border border-ink-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full bg-ink-950 hover:bg-ink-900 text-white font-medium rounded-md py-2.5 text-sm transition-colors duration-200 ease-standard disabled:opacity-60"
          >
            {loading ? 'Resetting…' : 'Reset password'}
          </button>
        </form>
      </div>
    </div>
  );
}
