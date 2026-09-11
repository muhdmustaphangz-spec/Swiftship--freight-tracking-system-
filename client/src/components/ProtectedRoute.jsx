import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from './Spinner';

export default function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-ink-400">
        <Spinner className="h-5 w-5" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    const fallback = user.role === 'admin' ? '/admin' : user.role === 'driver' ? '/driver' : '/customer';
    return <Navigate to={fallback} replace />;
  }
  return children;
}
