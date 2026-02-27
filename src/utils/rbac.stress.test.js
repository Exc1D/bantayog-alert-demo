/**
 * Stress tests for RBAC — privilege escalation attempts, role manipulation,
 * edge cases in permission checking, and authorization boundary testing.
 */
import { describe, it, expect } from 'vitest';
import {
  hasPermission,
  getPermissions,
  normalizeRole,
  isModerator,
  isAdminRole,
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
} from './rbac';

describe('normalizeRole — edge cases and manipulation attempts', () => {
  it('returns null for falsy values', () => {
    expect(normalizeRole(null)).toBeNull();
    expect(normalizeRole(undefined)).toBeNull();
    expect(normalizeRole('')).toBeNull();
    expect(normalizeRole(0)).toBeNull();
    expect(normalizeRole(false)).toBeNull();
  });

  it('normalizes standard roles', () => {
    expect(normalizeRole('user')).toBe(ROLES.USER);
    expect(normalizeRole('moderator')).toBe(ROLES.MODERATOR);
    expect(normalizeRole('admin')).toBe(ROLES.ADMIN);
  });

  it('handles case insensitivity', () => {
    expect(normalizeRole('USER')).toBe(ROLES.USER);
    expect(normalizeRole('Moderator')).toBe(ROLES.MODERATOR);
    expect(normalizeRole('ADMIN')).toBe(ROLES.ADMIN);
  });

  it('maps citizen alias to user', () => {
    expect(normalizeRole('citizen')).toBe(ROLES.USER);
    expect(normalizeRole('Citizen')).toBe(ROLES.USER);
    expect(normalizeRole('CITIZEN')).toBe(ROLES.USER);
  });

  it('maps admin_ prefixed roles to moderator', () => {
    expect(normalizeRole('admin_municipality')).toBe(ROLES.MODERATOR);
    expect(normalizeRole('admin_daet')).toBe(ROLES.MODERATOR);
    expect(normalizeRole('admin_provincial')).toBe(ROLES.MODERATOR);
    expect(normalizeRole('ADMIN_ANYTHING')).toBe(ROLES.MODERATOR);
  });

  it('maps superadmin to admin', () => {
    expect(normalizeRole('superadmin_provincial')).toBe(ROLES.ADMIN);
    expect(normalizeRole('superadmin')).toBe(ROLES.ADMIN);
    expect(normalizeRole('SUPERADMIN_REGIONAL')).toBe(ROLES.ADMIN);
  });

  it('maps moderator_ prefixed roles to moderator', () => {
    expect(normalizeRole('moderator_daet')).toBe(ROLES.MODERATOR);
    expect(normalizeRole('moderator_anything')).toBe(ROLES.MODERATOR);
  });

  it('returns null for unknown roles', () => {
    expect(normalizeRole('hacker')).toBeNull();
    expect(normalizeRole('root')).toBeNull();
    expect(normalizeRole('sudo')).toBeNull();
    expect(normalizeRole('god_mode')).toBeNull();
  });

  it('handles type coercion of non-string inputs', () => {
    expect(normalizeRole(123)).toBeNull();
    expect(normalizeRole(true)).toBeNull(); // "true" is not a role
    expect(normalizeRole({})).toBeNull();
    expect(normalizeRole([])).toBeNull();
  });

  it('handles strings with whitespace', () => {
    // String('  admin  ').toLowerCase() = '  admin  '
    // This won't match exactly — tests the current behavior
    const result = normalizeRole('  admin  ');
    // '  admin  ' doesn't start with 'admin_', is not 'admin', is not 'user', etc.
    expect(result).toBeNull();
  });

  it('handles strings with special characters', () => {
    expect(normalizeRole('admin<script>')).toBeNull(); // starts with 'admin' but not 'admin_'
    expect(normalizeRole('user; DROP TABLE')).toBeNull();
  });
});

describe('hasPermission — authorization boundary testing', () => {
  it('denies all permissions for null role', () => {
    for (const perm of Object.values(PERMISSIONS)) {
      expect(hasPermission(null, perm)).toBe(false);
    }
  });

  it('denies all permissions for unknown role', () => {
    for (const perm of Object.values(PERMISSIONS)) {
      expect(hasPermission('hacker', perm)).toBe(false);
    }
  });

  it('denies null permission for valid role', () => {
    expect(hasPermission('admin', null)).toBe(false);
    expect(hasPermission('admin', '')).toBe(false);
    expect(hasPermission('admin', undefined)).toBe(false);
  });

  it('user role can only view and create reports', () => {
    expect(hasPermission('user', PERMISSIONS.VIEW_REPORTS)).toBe(true);
    expect(hasPermission('user', PERMISSIONS.CREATE_REPORT)).toBe(true);
    expect(hasPermission('user', PERMISSIONS.MODERATE_REPORTS)).toBe(false);
    expect(hasPermission('user', PERMISSIONS.MANAGE_USERS)).toBe(false);
    expect(hasPermission('user', PERMISSIONS.VIEW_ANALYTICS)).toBe(false);
    expect(hasPermission('user', PERMISSIONS.MANAGE_SETTINGS)).toBe(false);
  });

  it('moderator cannot manage users or settings', () => {
    expect(hasPermission('moderator', PERMISSIONS.MANAGE_USERS)).toBe(false);
    expect(hasPermission('moderator', PERMISSIONS.MANAGE_SETTINGS)).toBe(false);
  });

  it('moderator can moderate reports and view analytics', () => {
    expect(hasPermission('moderator', PERMISSIONS.MODERATE_REPORTS)).toBe(true);
    expect(hasPermission('moderator', PERMISSIONS.VIEW_ANALYTICS)).toBe(true);
  });

  it('admin has all permissions', () => {
    for (const perm of Object.values(PERMISSIONS)) {
      expect(hasPermission('admin', perm)).toBe(true);
    }
  });

  it('admin_municipality maps to moderator (not full admin)', () => {
    // This is critical: admin_municipality should NOT get MANAGE_SETTINGS
    expect(hasPermission('admin_municipality', PERMISSIONS.MODERATE_REPORTS)).toBe(true);
    expect(hasPermission('admin_municipality', PERMISSIONS.MANAGE_SETTINGS)).toBe(false);
    expect(hasPermission('admin_municipality', PERMISSIONS.MANAGE_USERS)).toBe(false);
  });

  it('superadmin_provincial maps to full admin', () => {
    expect(hasPermission('superadmin_provincial', PERMISSIONS.MANAGE_SETTINGS)).toBe(true);
    expect(hasPermission('superadmin_provincial', PERMISSIONS.MANAGE_USERS)).toBe(true);
  });

  it('rejects fabricated permission strings', () => {
    expect(hasPermission('admin', 'DELETE_EVERYTHING')).toBe(false);
    expect(hasPermission('admin', 'SUPER_ADMIN')).toBe(false);
    expect(hasPermission('admin', 'root')).toBe(false);
  });
});

describe('getPermissions — complete permission sets', () => {
  it('returns empty array for null role', () => {
    expect(getPermissions(null)).toEqual([]);
  });

  it('returns empty array for unknown role', () => {
    expect(getPermissions('hacker')).toEqual([]);
  });

  it('returns exactly 2 permissions for user role', () => {
    const perms = getPermissions('user');
    expect(perms).toHaveLength(2);
    expect(perms).toContain(PERMISSIONS.VIEW_REPORTS);
    expect(perms).toContain(PERMISSIONS.CREATE_REPORT);
  });

  it('returns exactly 4 permissions for moderator role', () => {
    const perms = getPermissions('moderator');
    expect(perms).toHaveLength(4);
  });

  it('returns all 6 permissions for admin role', () => {
    const perms = getPermissions('admin');
    expect(perms).toHaveLength(6);
    expect(perms).toEqual(expect.arrayContaining(Object.values(PERMISSIONS)));
  });

  it('permissions are a proper superset chain: user ⊂ moderator ⊂ admin', () => {
    const userPerms = new Set(getPermissions('user'));
    const modPerms = new Set(getPermissions('moderator'));
    const adminPerms = new Set(getPermissions('admin'));

    // Every user permission should be in moderator
    for (const p of userPerms) {
      expect(modPerms.has(p)).toBe(true);
    }

    // Every moderator permission should be in admin
    for (const p of modPerms) {
      expect(adminPerms.has(p)).toBe(true);
    }

    // Moderator should have more than user
    expect(modPerms.size).toBeGreaterThan(userPerms.size);

    // Admin should have more than moderator
    expect(adminPerms.size).toBeGreaterThan(modPerms.size);
  });
});

describe('isModerator — role-based checks', () => {
  it('returns false for regular user', () => {
    expect(isModerator('user')).toBe(false);
    expect(isModerator('citizen')).toBe(false);
  });

  it('returns true for moderator role', () => {
    expect(isModerator('moderator')).toBe(true);
  });

  it('returns true for admin_municipality (mapped to moderator)', () => {
    expect(isModerator('admin_municipality')).toBe(true);
  });

  it('returns true for superadmin (admin has moderate permission)', () => {
    expect(isModerator('superadmin_provincial')).toBe(true);
  });

  it('returns false for null/undefined', () => {
    expect(isModerator(null)).toBe(false);
    expect(isModerator(undefined)).toBe(false);
  });
});

describe('isAdminRole — strictest privilege check', () => {
  it('returns false for user', () => {
    expect(isAdminRole('user')).toBe(false);
  });

  it('returns false for moderator', () => {
    expect(isAdminRole('moderator')).toBe(false);
  });

  it('returns false for admin_municipality (they are moderators, not full admins)', () => {
    // This is the critical security boundary:
    // admin_municipality should NOT pass isAdminRole
    expect(isAdminRole('admin_municipality')).toBe(false);
  });

  it('returns true only for superadmin/admin', () => {
    expect(isAdminRole('admin')).toBe(true);
    expect(isAdminRole('superadmin_provincial')).toBe(true);
  });

  it('returns false for null/undefined', () => {
    expect(isAdminRole(null)).toBe(false);
    expect(isAdminRole(undefined)).toBe(false);
  });
});

describe('RBAC consistency — structural integrity', () => {
  it('all permission values are unique strings', () => {
    const values = Object.values(PERMISSIONS);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
    values.forEach((v) => expect(typeof v).toBe('string'));
  });

  it('all role values are unique strings', () => {
    const values = Object.values(ROLES);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
    values.forEach((v) => expect(typeof v).toBe('string'));
  });

  it('ROLE_PERMISSIONS only references valid permissions', () => {
    const validPerms = new Set(Object.values(PERMISSIONS));
    for (const [role, perms] of Object.entries(ROLE_PERMISSIONS)) {
      for (const perm of perms) {
        expect(validPerms.has(perm)).toBe(true);
      }
    }
  });

  it('ROLE_PERMISSIONS has entries for all defined roles', () => {
    for (const role of Object.values(ROLES)) {
      expect(ROLE_PERMISSIONS).toHaveProperty(role);
      expect(Array.isArray(ROLE_PERMISSIONS[role])).toBe(true);
    }
  });

  it('no role has duplicate permissions', () => {
    for (const [role, perms] of Object.entries(ROLE_PERMISSIONS)) {
      const unique = new Set(perms);
      expect(unique.size).toBe(perms.length);
    }
  });
});
