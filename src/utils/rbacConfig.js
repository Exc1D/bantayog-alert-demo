// Canonical RBAC configuration for Bantayog Alert
// This file is the source of truth for role definitions.
// Firestore rules reference these same roles (see firestore.rules comments).

export const ADMIN_ROLES = ['superadmin_provincial'];

export const MODERATOR_ROLES = ['superadmin_provincial', 'moderator'];

export const ALL_ADMIN_PATTERN = /^admin_/;

export const ALL_SUPERADMIN_PATTERN = /^superadmin_/;

export function isAdminRole(role = '') {
  return ADMIN_ROLES.includes(role) || ALL_ADMIN_PATTERN.test(role);
}

export function isModeratorRole(role = '') {
  return MODERATOR_ROLES.includes(role) || ALL_ADMIN_PATTERN.test(role);
}

export function isSuperAdminRole(role = '') {
  return ALL_SUPERADMIN_PATTERN.test(role);
}

export function canCreateReports(role = '') {
  return role === 'user' || role === 'moderator' || isAdminRole(role) || role === 'anonymous';
}
