# Announcement Management — Design Spec

**Date:** 2026-03-17
**Status:** Approved

---

## Overview

Admins can create public announcements that appear in the citizen Alerts tab. Announcements support a broader set of types than the previous class/work suspension model (which was hard-coded). Each announcement is scoped to a municipality or the province. Admins can deactivate any announcement they are responsible for. Citizens see all announcements relevant to their location in real time.

This replaces the old `system/announcements.suspensions[]` array approach entirely.

---

## Data Model

### Collection: `announcements/{id}`

Each announcement is a standalone Firestore document.

```js
{
  // Content
  type: 'class-suspension'
      | 'work-suspension'
      | 'flood-advisory'
      | 'road-closure'
      | 'evacuation-order'
      | 'storm-surge'
      | 'health-advisory'
      | 'emergency-notice',
  title: string,          // Required. e.g. "Mandatory evacuation — Brgy. Lag-on"
  body: string,           // Required. Full details paragraph.
  severity: 'critical' | 'warning' | 'info',

  // Scope
  scope: string,          // Municipality slug ('daet', 'labo', …) or 'provincial'

  // Authorship
  createdBy: string,      // Firebase Auth uid
  createdByRole: string,  // e.g. 'admin_daet', 'superadmin_provincial'

  // Lifecycle
  active: boolean,        // true = visible to citizens. false = deactivated (soft delete).
  createdAt: Timestamp,
  deactivatedAt: Timestamp | null,
}
```

**No hard deletes.** Deactivation sets `active: false` + `deactivatedAt`. This preserves the audit trail and simplifies security rules (update only, no delete needed for normal operations).

---

## Announcement Types

| Value | Display label |
|---|---|
| `class-suspension` | Class Suspension |
| `work-suspension` | Work Suspension |
| `flood-advisory` | Flood Advisory |
| `road-closure` | Road Closure |
| `evacuation-order` | Evacuation Order |
| `storm-surge` | Storm Surge |
| `health-advisory` | Health Advisory |
| `emergency-notice` | Emergency Notice |

---

## Severity and Color

| Severity | Header color | Use for |
|---|---|---|
| `critical` | `#FF3B30` (urgent) | Evacuation orders, imminent danger |
| `warning` | `#FF9500` (moderate) | Suspensions, flood advisories, road closures |
| `info` | `#1C1C1E` (shell) | General notices, operational updates |

---

## Scope Rules

| Admin role | Scope at creation | Can deactivate |
|---|---|---|
| `admin_daet` | `'daet'` (auto, read-only) | Own municipality's announcements only |
| `admin_labo` | `'labo'` (auto, read-only) | Own municipality's announcements only |
| `superadmin_provincial` | `'provincial'` (auto, read-only) | Any announcement |

Scope is derived from the admin's role at creation time and is not editable. A `superadmin_provincial` announcement is visible to citizens in every municipality. A municipal admin's announcement is visible only to citizens detected in that municipality.

---

## Citizen Alerts Tab Changes (`/alerts`)

The `useAnnouncements` hook is updated to read from the new `announcements/` collection instead of the `system/announcements` doc. The `SuspensionCard` component is replaced by the more general `AnnouncementCard`.

**Query:**
```js
query(
  collection(db, 'announcements'),
  where('active', '==', true),
  orderBy('createdAt', 'desc')
)
```

**Client-side filter:** Show an announcement if `scope === 'provincial'` OR `scope === userMunicipality` (from `useGeolocation`).

**Sort order in the UI:** Critical first, then warning, then info. Within the same severity, newest first.

**AnnouncementCard anatomy:**
- Colored header bar (severity color): type label (bold) + severity badge (translucent white pill) + scope + timestamp
- Body: title (bold, 13px) + details paragraph (9px, `#3C3C43`, line-clamp-4)
- No interaction controls for citizens — read only

Multiple active announcements stack as separate cards above the WeatherCard.

---

## Admin UI — "Alerts" Tab (4th tab in AdminShell)

### Route

`/admin/alerts` — added as a 4th route inside `AdminShell`. The `AdminNav` component gains a 4th tab: **Queue · Live Map · All Reports · Alerts**.

### List view

Two sections, shown in order:

**Own municipality section** (e.g. "Active · Daet (2)")
- All announcements where `scope === adminMunicipality` and `active === true`
- Each item: colored header (severity) · type · severity badge · scope · title · body (1-line truncated) · timestamp · **Deactivate** button

**Provincial section** ("Provincial (N)")
- Announcements where `scope === 'provincial'` and `active === true`
- Municipal admins: read-only, no Deactivate button
- Superadmin: full Deactivate access

Empty state (no active announcements in scope): "No active announcements."

### Deactivate flow

Tapping **Deactivate** shows a confirmation: *"Deactivate this announcement? Citizens will no longer see it."* On confirm, writes:

```js
await updateDoc(doc(db, 'announcements', id), {
  active: false,
  deactivatedAt: serverTimestamp(),
});
```

Also logs an audit event via existing `auditLogger.js`.

### FAB — "New Announcement"

A pill-shaped red FAB (`#FF3B30`) anchored bottom-center, **exclusive to the `/admin/alerts` route**. It does not appear on Queue, Live Map, or All Reports. Tapping it navigates to `/admin/alerts/new` (full-screen create form).

### Create form (`/admin/alerts/new`)

Full-screen page with a dark header showing "New announcement" + the admin's municipality (read-only, right-aligned).

**Fields (top to bottom):**

1. **Type** — chip grid (single-select, required). All 8 types listed. Selected chip: dark fill + white text.
2. **Severity** — 3 chips: Critical / Warning / Info (single-select, required). Selected chip: severity color border + tinted background.
3. **Title** — text input (required). Placeholder: "Short, clear headline."
4. **Details** — textarea (required, min 10 chars). Placeholder: "Full details — what happened, what to do, who is affected."
5. **Scope** — read-only row. Shows municipality name (municipal admin) or "Provincial" (superadmin). Includes a lock/shield icon to signal it's auto-set.

**"Post announcement" button:** Red, full-width, disabled until type + severity + title + details are all filled. On submit:

```js
await addDoc(collection(db, 'announcements'), {
  type,
  title: title.trim(),
  body: body.trim(),
  severity,
  scope,           // derived from userProfile.role
  createdBy: user.uid,
  createdByRole: userProfile.role,
  active: true,
  createdAt: serverTimestamp(),
  deactivatedAt: null,
});
```

Logs audit event via `auditLogger.js`. On success, navigates back to `/admin/alerts`.

---

## Firestore Security Rules

Add to `firestore.rules`:

```
match /announcements/{announcementId} {
  // Citizens can read active announcements (unauthenticated access not needed)
  allow read: if isSignedIn();

  // Any admin can create
  allow create: if isAdmin()
    && request.resource.data.keys().hasAll([
      'type', 'title', 'body', 'severity', 'scope',
      'createdBy', 'createdByRole', 'active', 'createdAt', 'deactivatedAt'
    ])
    && request.resource.data.createdBy == request.auth.uid
    && request.resource.data.active == true;

  // Deactivate (update active to false):
  // - superadmin can deactivate any
  // - municipal admin can only deactivate their own municipality's announcements
  allow update: if isAdmin()
    && request.resource.data.active == false
    && (isSuperAdmin()
        || resource.data.scope == getMunicipalityFromRole(request.auth.token.role));

  // No hard deletes for normal operations
  allow delete: if isSuperAdmin();
}
```

> **Note:** `getMunicipalityFromRole` extracts the municipality slug from the role string (e.g. `'admin_daet'` → `'daet'`). This helper may need to be added to the Firestore rules if it doesn't already exist. Alternatively, the `scope` check can be enforced client-side with server-side validation via `createdBy == request.auth.uid` as a fallback.

---

## Files

### Create

| File | Purpose |
|---|---|
| `src/components/Admin/AdminAlertsTab.jsx` | List view — active announcements + FAB |
| `src/components/Admin/AnnouncementItem.jsx` | Single announcement row with Deactivate button |
| `src/components/Admin/AnnouncementItem.test.jsx` | Unit tests |
| `src/components/Admin/CreateAnnouncementForm.jsx` | Full-screen create form |
| `src/components/Admin/CreateAnnouncementForm.test.jsx` | Unit tests |
| `src/components/Alerts/AnnouncementCard.jsx` | Citizen-facing card (replaces SuspensionCard) |
| `src/components/Alerts/AnnouncementCard.test.jsx` | Unit tests |

### Modify

| File | Change |
|---|---|
| `src/components/Admin/AdminShell.jsx` | Add `/admin/alerts` and `/admin/alerts/new` routes |
| `src/components/Admin/AdminNav.jsx` | Add 4th tab "Alerts" |
| `src/hooks/useAnnouncements.js` | Rewrite to query `announcements/` collection |
| `src/pages/AlertsTab.jsx` | Replace `SuspensionCard` with `AnnouncementCard` |
| `firestore.rules` | Add `announcements/{id}` match block |

---

## Preserved Infrastructure

The `auditLogger.js` `logAuditEvent` function is called on every create and deactivate action. No changes to `auditLogger.js` itself — only new call sites.

The existing `system/announcements` document can be left in Firestore but is no longer read by the app after this feature ships.

---

## Verification Checklist

1. **Create (municipal admin):** Log in as `admin_daet` → Alerts tab → tap FAB → fill form → post → announcement appears in list with scope "Daet"
2. **Create (superadmin):** Log in as `superadmin_provincial` → same flow → scope shows "Provincial"
3. **Citizen visibility:** Open Alerts tab as a citizen in Daet → Daet + provincial announcements visible, Labo announcements hidden
4. **Deactivate (own scope):** `admin_daet` deactivates a Daet announcement → disappears from list and citizen Alerts tab
5. **Scope enforcement:** `admin_daet` cannot see Deactivate button on provincial announcements
6. **Superadmin override:** `superadmin_provincial` can deactivate any announcement from any municipality
7. **Security rules:** Attempt to deactivate another municipality's announcement via direct Firestore write → rejected
8. **Form validation:** Post button disabled until all required fields filled
9. **Severity colors:** Critical=red, Warning=orange, Info=dark across both admin list and citizen card
10. **Audit log:** Every create and deactivate appears in `audit/` collection
11. **FAB visibility:** FAB appears only on `/admin/alerts`, not on Queue/Live Map/All Reports
12. **Real-time:** Admin creates announcement → citizen Alerts tab updates without refresh
