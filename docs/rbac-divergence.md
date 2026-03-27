# RBAC Divergence Analysis

## Overview

Bantayog Alert has two independent RBAC implementations that MUST be kept in sync:

1. **Firestore Rules** (`firestore.rules`) — server-side enforcement
2. **JavaScript RBAC** (`src/utils/rbac.js` and `src/utils/rbacConfig.js`) — client-side UI gating

## Firestore Rules RBAC

Functions in `firestore.rules`:
- `isSignedIn()` — request.auth != null
- `isAnonymous()` — anonymous Firebase auth provider
- `userRole()` — returns 'anonymous' for anon, or role from user doc
- `isAdmin()` — superadmin_provincial OR role matches ^admin_.*
- `isModerator()` — superadmin_provincial OR ^admin_.* OR moderator role
- `isSuperAdmin()` — role matches ^superadmin_.*
- `canCreateReports()` — user, moderator, admin, or anonymous role

## JavaScript RBAC

`src/utils/rbac.js`:
- `ROLES` — USER, MODERATOR, ADMIN constants
- `PERMISSIONS` — VIEW_REPORTS, CREATE_REPORT, etc.
- `normalizeRole(role)` — maps various role strings to ROLES constants
- `hasPermission(role, permission)` — checks ROLE_PERMISSIONS map
- `isModerator(role)` — checks MODERATE_REPORTS permission
- `isAdminRole(role)` — checks MANAGE_SETTINGS permission

`src/utils/rbacConfig.js` (canonical):
- `ADMIN_ROLES` — ['superadmin_provincial']
- `MODERATOR_ROLES` — ['superadmin_provincial', 'moderator']
- `isAdminRole(role)` — admin_ prefix or ADMIN_ROLES
- `isModeratorRole(role)` — admin_ prefix or MODERATOR_ROLES

## Divergence Risks

| Aspect | Firestore Rules | JS RBAC |
|--------|----------------|---------|
| Admin check | role.startsWith('admin_') | hasPermission(role, MANAGE_SETTINGS) |
| Moderator check | includes 'moderator' or admin_ prefix | hasPermission(role, MODERATE_REPORTS) |
| Anonymous | Explicit 'anonymous' role | Not handled (checked separately) |

## Keeping Them in Sync

When adding a new role:
1. Update `src/utils/rbacConfig.js` ADMIN_ROLES or MODERATOR_ROLES
2. Update `firestore.rules` isAdmin/isModerator functions (ternary, not if/else!)
3. Update `src/utils/rbac.js` ROLE_PERMISSIONS
4. Run `node scripts/verify-rbac-consistency.js`
