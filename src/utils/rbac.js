export const ROLES = {
  USER: 'user',
  MODERATOR: 'moderator',
  ADMIN: 'admin',
};

export const PERMISSIONS = {
  VIEW_REPORTS: 'VIEW_REPORTS',
  CREATE_REPORT: 'CREATE_REPORT',
  MODERATE_REPORTS: 'MODERATE_REPORTS',
  MANAGE_USERS: 'MANAGE_USERS',
  VIEW_ANALYTICS: 'VIEW_ANALYTICS',
  MANAGE_SETTINGS: 'MANAGE_SETTINGS',
};

export const ROLE_PERMISSIONS = {
  [ROLES.USER]: [PERMISSIONS.VIEW_REPORTS, PERMISSIONS.CREATE_REPORT],
  [ROLES.MODERATOR]: [
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.CREATE_REPORT,
    PERMISSIONS.MODERATE_REPORTS,
    PERMISSIONS.VIEW_ANALYTICS,
  ],
  [ROLES.ADMIN]: [
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.CREATE_REPORT,
    PERMISSIONS.MODERATE_REPORTS,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.MANAGE_SETTINGS,
  ],
};

export function hasPermission(role, permission) {
  if (!role || !permission) {
    return false;
  }

  const normalizedRole = normalizeRole(role);
  const permissions = ROLE_PERMISSIONS[normalizedRole];

  if (!permissions) {
    return false;
  }

  return permissions.includes(permission);
}

export function getPermissions(role) {
  if (!role) {
    return [];
  }

  const normalizedRole = normalizeRole(role);
  const permissions = ROLE_PERMISSIONS[normalizedRole];
  return permissions || [];
}

export function normalizeRole(role) {
  if (!role) {
    return null;
  }

  const roleStr = String(role).toLowerCase();

  if (roleStr === ROLES.USER || roleStr === 'citizen') {
    return ROLES.USER;
  }

  if (roleStr.startsWith('admin_')) {
    return ROLES.MODERATOR;
  }

  if (roleStr === ROLES.MODERATOR || roleStr.startsWith('moderator')) {
    return ROLES.MODERATOR;
  }

  if (roleStr === ROLES.ADMIN || roleStr.startsWith('superadmin')) {
    return ROLES.ADMIN;
  }

  return null;
}

export function isModerator(role) {
  return hasPermission(role, PERMISSIONS.MODERATE_REPORTS);
}

export function isAdminRole(role) {
  return hasPermission(role, PERMISSIONS.MANAGE_SETTINGS);
}
