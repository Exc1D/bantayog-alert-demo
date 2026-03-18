/**
 * useAuthContext — thin re-export of useAuth shaped for the rebuild context.
 * Exposes { loading, userProfile, user, ...auth } so consumers don't need to
 * import from useAuth directly and the mock surface in tests stays narrow.
 */
import { useAuth } from './useAuth';

export default function useAuthContext() {
  return useAuth();
}
