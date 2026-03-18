import { Navigate, Outlet } from 'react-router-dom';
import useAuthContext from '../../hooks/useAuthContext';
import LoadingSpinner from '../Common/LoadingSpinner';
import { isAdmin } from '../../utils/rbac';

export default function AdminGuard() {
  const { loading, userProfile } = useAuthContext();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full" role="status">
        <LoadingSpinner />
      </div>
    );
  }

  if (!userProfile || !isAdmin(userProfile.role)) {
    return <Navigate to="/profile" replace />;
  }

  return <Outlet />;
}
