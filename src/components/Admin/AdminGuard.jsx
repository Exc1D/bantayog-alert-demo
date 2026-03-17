import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { isAdminRole } from '../../utils/rbac';
import LoadingSpinner from '../Common/LoadingSpinner';

export default function AdminGuard({ children }) {
  const { user, userData, loading } = useAuth();

  if (loading) {
    return (
      <div role="status" className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  if (!user || !userData?.role || !isAdminRole(userData.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
