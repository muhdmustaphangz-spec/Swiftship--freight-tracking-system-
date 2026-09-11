import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = {
  customer: [
    { to: '/customer', label: 'Book & Track' },
    { to: '/customer/shipments', label: 'My Shipments' },
  ],
  admin: [
    { to: '/admin', label: 'Dashboard' },
    { to: '/admin/shipments', label: 'Shipments' },
  ],
  driver: [
    { to: '/driver', label: 'My Deliveries' },
  ],
};

export default function Shell({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const links = user ? NAV[user.role] || [] : [];

  return (
    <div className="min-h-screen bg-ink-50 flex flex-col">
      <header className="bg-ink-950 text-ink-100 sticky top-0 z-30 border-b border-ink-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center h-16 gap-6">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
              <rect x="1" y="7" width="24" height="15" rx="1.5" stroke="#f0a53d" strokeWidth="1.8"/>
              <path d="M1 12h24" stroke="#f0a53d" strokeWidth="1.8"/>
              <path d="M7 7V4.5C7 3.67 7.67 3 8.5 3h9c.83 0 1.5.67 1.5 1.5V7" stroke="#f0a53d" strokeWidth="1.8"/>
            </svg>
            <span className="font-semibold text-lg tracking-tight">SwiftShip</span>
          </Link>

          {links.length > 0 && (
            <nav className="hidden sm:flex items-center gap-1">
              {links.map((l) => {
                const active = location.pathname === l.to;
                return (
                  <Link
                    key={l.to}
                    to={l.to}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 ease-standard ${
                      active ? 'bg-ink-800 text-white' : 'text-ink-300 hover:text-white hover:bg-ink-900'
                    }`}
                  >
                    {l.label}
                  </Link>
                );
              })}
            </nav>
          )}

          <div className="ml-auto flex items-center gap-3">
            {!user && (
              <>
                <Link to="/track" className="hidden sm:inline text-sm text-ink-300 hover:text-white transition-colors duration-200 ease-standard whitespace-nowrap">Track a shipment</Link>
                <Link to="/login" className="text-sm font-medium lift-on-hover bg-amber-500 hover:bg-amber-400 text-ink-950 px-3.5 py-1.5 rounded-md transition-colors duration-200 ease-standard">
                  Sign in
                </Link>
              </>
            )}
            {user && (
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right leading-tight">
                  <div className="text-sm font-medium text-white">{user.name}</div>
                  <div className="text-xs text-ink-400 capitalize">{user.role}</div>
                </div>
                <button
                  onClick={() => { logout(); navigate('/'); }}
                  className="text-sm text-ink-300 hover:text-white border border-ink-700 hover:border-ink-500 rounded-md px-3 py-1.5 transition-colors duration-200 ease-standard"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
        {links.length > 0 && (
          <nav className="sm:hidden flex items-center gap-1 px-4 pb-2 overflow-x-auto">
            {links.map((l) => {
              const active = location.pathname === l.to;
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors duration-200 ease-standard ${
                    active ? 'bg-ink-800 text-white' : 'text-ink-300'
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-ink-200 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-sm text-ink-500">
          <span>SwiftShip Logistics — consignment &amp; freight tracking</span>
        </div>
      </footer>
    </div>
  );
}
