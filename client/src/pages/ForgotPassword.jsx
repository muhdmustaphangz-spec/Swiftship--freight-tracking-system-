import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.forgotPassword(email);
      // Backend always returns the same generic response whether or not the
      // email exists, by design — we show the same success state regardless.
      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-signal-green-100 flex items-center justify-center mb-5">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M4 12.5L9 17.5L20 6.5" stroke="#2f7d5f" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-ink-950">Check your email</h1>
          <p className="text-ink-500 mt-2 text-sm">
            If an account exists for <span className="text-ink-900 font-medium">{email}</span>, we've sent a link to reset your password. The link expires in 30 minutes.
          </p>
          <Link to="/login" className="inline-block mt-6 text-amber-600 font-medium hover:underline text-sm">
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-ink-950">Forgot your password?</h1>
          <p className="text-ink-500 text-sm mt-1">Enter your email and we'll send you a reset link.</p>
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
          <button
            type="submit" disabled={loading}
            className="w-full bg-ink-950 hover:bg-ink-900 text-white font-medium rounded-md py-2.5 text-sm transition-colors duration-200 ease-standard disabled:opacity-60"
          >
            {loading ? 'Sending…' : 'Send reset link'}
          </button>
        </form>

        <p className="text-center text-sm text-ink-500 mt-6">
          Remembered it? <Link to="/login" className="text-amber-600 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
