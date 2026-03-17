import { useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../Common/LoadingSpinner';

export default function AdminGuard({ children, onDenied }) {
  const { user, loading, isAdmin } = useAuth();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      onDenied?.();
    }
  }, [loading, user, isAdmin, onDenied]);

  if (loading) {
    return (
      <div role="status" className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  return children;
}
