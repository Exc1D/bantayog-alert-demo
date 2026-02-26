import { useMemo } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import {
  hasPermission,
  getPermissions,
  PERMISSIONS,
  isModerator,
  isAdminRole,
} from '../utils/rbac';

export function usePermissions() {
  const { userProfile } = useAuthContext();

  const role = userProfile?.role;

  const permissions = useMemo(() => {
    const userPermissions = getPermissions(role);

    return {
      role,
      canViewReports: hasPermission(role, PERMISSIONS.VIEW_REPORTS),
      canCreateReport: hasPermission(role, PERMISSIONS.CREATE_REPORT),
      canModerateReports: hasPermission(role, PERMISSIONS.MODERATE_REPORTS),
      canManageUsers: hasPermission(role, PERMISSIONS.MANAGE_USERS),
      canViewAnalytics: hasPermission(role, PERMISSIONS.VIEW_ANALYTICS),
      canManageSettings: hasPermission(role, PERMISSIONS.MANAGE_SETTINGS),
      isModerator: isModerator(role),
      isAdmin: isAdminRole(role),
      permissions: userPermissions,
    };
  }, [role]);

  return permissions;
}
