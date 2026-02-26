import { usePermissions } from '../../hooks/usePermissions';
import { PERMISSIONS } from '../../utils/rbac';

export default function RequirePermission({
  permission,
  fallback = null,
  children,
  requireAll = false,
}) {
  const { canModerateReports, canManageUsers, canViewAnalytics, canManageSettings } =
    usePermissions();

  const checkPermission = () => {
    switch (permission) {
      case PERMISSIONS.VIEW_REPORTS:
        return true;
      case PERMISSIONS.CREATE_REPORT:
        return true;
      case PERMISSIONS.MODERATE_REPORTS:
        return canModerateReports;
      case PERMISSIONS.MANAGE_USERS:
        return canManageUsers;
      case PERMISSIONS.VIEW_ANALYTICS:
        return canViewAnalytics;
      case PERMISSIONS.MANAGE_SETTINGS:
        return canManageSettings;
      default:
        return false;
    }
  };

  if (requireAll && Array.isArray(permission)) {
    const allGranted = permission.every((p) => {
      switch (p) {
        case PERMISSIONS.MODERATE_REPORTS:
          return canModerateReports;
        case PERMISSIONS.MANAGE_USERS:
          return canManageUsers;
        case PERMISSIONS.VIEW_ANALYTICS:
          return canViewAnalytics;
        case PERMISSIONS.MANAGE_SETTINGS:
          return canManageSettings;
        default:
          return true;
      }
    });

    if (!allGranted) {
      return fallback;
    }
  } else {
    if (!checkPermission()) {
      return fallback;
    }
  }

  return children;
}

export function RequireModerator({ children, fallback = null }) {
  return (
    <RequirePermission permission={PERMISSIONS.MODERATE_REPORTS} fallback={fallback}>
      {children}
    </RequirePermission>
  );
}

export function RequireAdmin({ children, fallback = null }) {
  return (
    <RequirePermission permission={PERMISSIONS.MANAGE_SETTINGS} fallback={fallback}>
      {children}
    </RequirePermission>
  );
}

export function AccessDenied({ message = 'You do not have permission to access this feature.' }) {
  return (
    <div className="text-center py-8">
      <div className="w-12 h-12 mx-auto mb-3 bg-stone-100 rounded-full flex items-center justify-center">
        <svg
          aria-hidden="true"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#a8a29e"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
      </div>
      <h3 className="text-sm font-bold">Access Denied</h3>
      <p className="text-xs text-textLight mt-1">{message}</p>
    </div>
  );
}
