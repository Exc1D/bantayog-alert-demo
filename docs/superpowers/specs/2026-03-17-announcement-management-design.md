# Announcement Management — Design Spec

**Date:** 2026-03-17
**Status:** Approved

---

## Overview

Admins can create public announcements that appear in the citizen Alerts tab. Announcements support a broader set of types than the previous class/work suspension model (which was hard-coded). Each announcement is scoped to a municipality or the province. Admins can deactivate any announcement within their own scope. Citizens see all announcements relevant to their location in real time.

This replaces the old `system/announcements.suspensions[]` array approach entirely. The `useAnnouncements` hook is rewritten to read from the new `announcements/` Firestore collection.

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

  // Scope — title-case, matching isValidMunicipality() values in firestore.rules
  // e.g. 'Daet', 'Labo', 'Jose Panganiban', or 'Provincial'
  scope: string,

  // Authorship
  createdBy: string,      // Firebase Auth uid
  createdByRole: string,  // e.g. 'admin_daet', 'superadmin_provincial'

  // Lifecycle
  active: boolean,        // true = visible to citizens. false = deactivated (soft delete).
  createdAt: Timestamp,
  deactivatedAt: Timestamp | null,
}
```

**Scope casing:** `scope` uses the same title-case format as `isValidMunicipality()` in `firestore.rules` and as returned by `detectMunicipality()` in `geoFencing.js` — e.g. `'Daet'`, `'Labo'`, `'Jose Panganiban'`. Province-wide announcements use `'Provincial'`. This ensures direct string equality against `userMunicipality` from `useGeolocation` without case conversion.

**No hard deletes.** Deactivation sets `active: false` + `deactivatedAt: serverTimestamp()`. This preserves the audit trail and simplifies security rules (update only).

**User document prerequisite:** The `users/{uid}` document must include a `municipality` field (title-case) for every admin account — e.g. `{ role: 'admin_daet', municipality: 'Daet' }`. This field is used in Firestore security rules to validate scope without string manipulation. Set during admin account provisioning.

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
| `admin_daet` | `'Daet'` (auto, read-only in form) | Own municipality only |
| `admin_labo` | `'Labo'` (auto, read-only in form) | Own municipality only |
| `superadmin_provincial` | `'Provincial'` (auto, read-only in form) | Any announcement |

Scope is derived from `userProfile.municipality` on the client at creation time and is not editable by the admin. A `'Provincial'` announcement is visible to citizens in every municipality.

---

## Citizen Alerts Tab Changes (`/alerts`)

### Query

Replace the `system/announcements` snapshot listener with a two-pronged query approach that pushes only relevant documents to the client:

```js
// Two queries, merged by onSnapshot
query(
  collection(db, 'announcements'),
  where('active', '==', true),
  where('scope', 'in', [userMunicipality, 'Provincial']),
  orderBy('createdAt', 'desc')
)
```

Where `userMunicipality` is the title-cased municipality from `useGeolocation` + `detectMunicipality`. This keeps the result set small regardless of total collection size and avoids unbounded reads.

**Required Firestore indexes:** Merge both objects into the `"indexes"` array in the existing `firestore.indexes.json` (alongside existing `reports` indexes — do not replace the file):

```json
{
  "collectionGroup": "announcements",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "active", "order": "ASCENDING" },
    { "fieldPath": "scope", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
},
{
  "collectionGroup": "announcements",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "active", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```

The first index covers the scoped citizen query. The second covers the geolocation-fallback query (no scope filter).

### Geolocation failure fallback

`detectMunicipality` from `geoFencing.js` may return `null` in three cases: GPS still loading, permission denied, or user is outside all municipality boundaries. In all three cases, the citizen Alerts tab falls back to showing **all active announcements** (no scope filter applied). This is intentional — for an emergency app, showing too much is safer than showing nothing.

```js
// In useAnnouncements:
const scopeFilter = userMunicipality
  ? where('scope', 'in', [userMunicipality, 'Provincial'])
  : null; // no scope filter → all active announcements
```

When `scopeFilter` is `null`, the query becomes `where('active', '==', true), orderBy('createdAt', 'desc')` — covered by the second composite index above.

### Display

**Sort order:** Critical first, then warning, then info. Within the same severity, newest first (client-side re-sort after query).

**AnnouncementCard anatomy:**
- Colored header bar (severity color): type label (bold) + severity badge (translucent white pill) + scope + timestamp
- Body: title (bold, 13px) + details paragraph (9px, `#3C3C43`, `line-clamp-4`)
- No interaction controls for citizens — read only

Multiple active announcements stack as separate cards above the `WeatherCard`. The `SuspensionCard` component is replaced by `AnnouncementCard` entirely.

---

## Admin UI — "Alerts" Tab (4th tab in AdminShell)

### Route

`/admin/alerts` — 4th route in `AdminShell`. The `AdminNav` gains a 4th tab: **Queue · Live Map · All Reports · Alerts**.

### Admin list queries

**Municipal admin** — two separate `onSnapshot` listeners merged in `useAdminAnnouncements`:

```js
// Own municipality's announcements
query(collection(db, 'announcements'),
  where('active', '==', true),
  where('scope', '==', adminMunicipality),
  orderBy('createdAt', 'desc'))

// Provincial announcements (read-only section)
query(collection(db, 'announcements'),
  where('active', '==', true),
  where('scope', '==', 'Provincial'),
  orderBy('createdAt', 'desc'))
```

**Superadmin** — single listener across all active announcements:

```js
query(collection(db, 'announcements'),
  where('active', '==', true),
  orderBy('createdAt', 'desc'))
```

All three admin query shapes are covered by the two composite indexes defined above.

### List view — Municipal admin

Two sections:

**"Active · {Municipality} (N)"**
- Announcements where `scope === adminMunicipality` and `active === true`
- Each item: colored header (severity) · type · severity badge · scope · title · body (1-line truncated) · timestamp · **Deactivate** button

**"Provincial (N)"**
- Announcements where `scope === 'Provincial'` and `active === true`
- **Read-only for municipal admins** — no Deactivate button, visually dimmed (50% opacity)

Empty state (no active announcements): "No active announcements in {Municipality}."

### List view — Superadmin (`superadmin_provincial`)

`superadmin_provincial` has no home municipality, so the list shows a **single unified flat list** across all active announcements, regardless of scope. No "own municipality" section — just all announcements sorted by severity then time, each with its scope label and a Deactivate button.

Section header: "All active announcements (N)"

### Deactivate flow

Tapping **Deactivate** shows a confirmation: *"Deactivate this announcement? Citizens will no longer see it."* On confirm:

```js
await updateDoc(doc(db, 'announcements', id), {
  active: false,
  deactivatedAt: serverTimestamp(),
});
await logAuditEvent(new AuditEvent({
  eventType: AuditEventType.ANNOUNCEMENT_DEACTIVATED,
  userId: user.uid,
  targetId: id,
  metadata: { scope: announcement.scope, type: announcement.type },
}));
```

### FAB — "New Announcement"

A pill-shaped red FAB (`#FF3B30`) anchored bottom-center, **exclusive to the `/admin/alerts` route**. Does not appear on Queue, Live Map, or All Reports. Tapping navigates to `/admin/alerts/new`.

### Create form (`/admin/alerts/new`)

Full-screen page. Dark header: "New announcement" + admin's municipality label (right-aligned, read-only).

**Fields (top to bottom):**

1. **Type** — chip grid (single-select, required). All 8 types. Selected: dark fill + white text.
2. **Severity** — 3 chips: Critical / Warning / Info (single-select, required). Selected: severity-color border + tinted background.
3. **Title** — text input (required). Placeholder: "Short, clear headline."
4. **Details** — textarea (required, min 10 chars). Placeholder: "Full details — what happened, what to do, who is affected."
5. **Scope** — read-only row. Shows `userProfile.municipality` (municipal admin) or `'Provincial'` (superadmin). Shield icon signals it is auto-set and not editable.

**"Post announcement" button:** Red, full-width, disabled until type + severity + title + details are all filled. On submit:

```js
await addDoc(collection(db, 'announcements'), {
  type,
  title: title.trim(),
  body: body.trim(),
  severity,
  scope: userProfile.municipality ?? 'Provincial', // derived client-side
  createdBy: user.uid,
  createdByRole: userProfile.role,
  active: true,
  createdAt: serverTimestamp(),
  deactivatedAt: null,
});
await logAuditEvent(new AuditEvent({
  eventType: AuditEventType.ANNOUNCEMENT_CREATED,
  userId: user.uid,
  metadata: { type, severity, scope },
}));
```

On success, navigate back to `/admin/alerts`.

---

## Firestore Security Rules

Add to `firestore.rules` alongside the existing `system/` match block:

```
match /announcements/{announcementId} {

  // Any signed-in user can read (citizens need real-time access)
  allow read: if isSignedIn();

  // Any admin can create — scope and role must match the authenticated user
  allow create: if isAdmin()
    && request.resource.data.keys().hasAll([
      'type', 'title', 'body', 'severity', 'scope',
      'createdBy', 'createdByRole', 'active', 'createdAt', 'deactivatedAt'
    ])
    && request.resource.data.createdBy == request.auth.uid
    && request.resource.data.createdByRole == userRole()
    && request.resource.data.active == true
    && (isSuperAdmin()
        ? request.resource.data.scope == 'Provincial'
        : request.resource.data.scope == userData().municipality);

  // Deactivate only: only 'active' and 'deactivatedAt' may change
  allow update: if isAdmin()
    && request.resource.data.diff(resource.data).affectedKeys()
         .hasOnly(['active', 'deactivatedAt'])
    && request.resource.data.active == false
    && (isSuperAdmin()
        || resource.data.scope == userData().municipality);

  // No hard deletes (superadmin only, for data correction)
  allow delete: if isSuperAdmin();
}
```

**`userData().municipality`** reads the `municipality` field from `users/{uid}` in Firestore — the existing `userData()` helper already handles this. Municipal admin user documents must have this field set at account creation.

**`isSuperAdmin()`** — verify this helper exists in `firestore.rules`. If not, add alongside existing helpers:
```
function isSuperAdmin() {
  return userRole().matches('superadmin.*');
}
```

---

## Files

### Create

| File | Purpose |
|---|---|
| `src/components/Admin/AdminAlertsTab.jsx` | List view with municipal + provincial sections, FAB |
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
| `src/hooks/useAnnouncements.js` | Rewrite: query `announcements/` collection with scope + active filters |
| `src/utils/auditLogger.js` | Add `ANNOUNCEMENT_CREATED` and `ANNOUNCEMENT_DEACTIVATED` to `AuditEventType` enum |
| `src/pages/AlertsTab.jsx` | Replace `SuspensionCard` with `AnnouncementCard`; update hook usage |
| `firestore.rules` | Add `announcements/{id}` match block; add `isSuperAdmin()` helper if missing |
| `firestore.indexes.json` | Add composite index for `(active ASC, scope ASC, createdAt DESC)` |

---

## Preserved Infrastructure

- `auditLogger.js` — `AuditEvent` and `logAuditEvent` need no changes. The `AuditEventType` enum **must** be extended with two new entries (see Modify table): `ANNOUNCEMENT_CREATED` and `ANNOUNCEMENT_DEACTIVATED`. `AuditEvent` already uses `serverTimestamp()` internally (confirmed at `auditLogger.js:36`).
- The `system/announcements` Firestore document can be left as-is but will no longer be read by the app. No migration needed.

---

## Verification Checklist

1. **Create (municipal admin):** Log in as `admin_daet` → Alerts tab → tap "New Announcement" FAB → fill form → post → announcement appears in list with scope "Daet"
2. **Create (superadmin):** Log in as `superadmin_provincial` → same flow → scope shows "Provincial" → flat unified list view with all announcements
3. **Citizen visibility — scoped:** Open Alerts tab as citizen in Daet → Daet + Provincial announcements visible; Labo-only announcements hidden
4. **Geolocation failure fallback:** Deny GPS permission → Alerts tab shows all active announcements (no scope filter applied)
5. **Deactivate (own scope):** `admin_daet` deactivates a Daet announcement → confirmation shown → after confirm, disappears from list and citizen Alerts tab within seconds
6. **Scope read-only enforcement:** `admin_daet` cannot see Deactivate button on Provincial announcements; section is dimmed
7. **Superadmin override:** `superadmin_provincial` can deactivate any announcement from any municipality
8. **Firestore rule — field tampering rejected:** Attempt to update `title` via Firestore client while deactivating → write rejected by rules
9. **Firestore rule — wrong scope rejected:** Attempt to create a `'Provincial'` announcement as `admin_daet` → write rejected by rules
10. **Form validation:** Post button disabled until all 4 required fields filled
11. **Severity colors:** Critical=red, Warning=orange, Info=dark, consistent across admin list and citizen AnnouncementCard
12. **Composite index:** No "requires index" error when Alerts tab loads in production build
13. **Audit log:** Create and deactivate actions each produce an entry in `users/{uid}/audit/`; verify `AuditEvent.toFirestoreObject()` write succeeds (timestamp field uses `serverTimestamp()`)
14. **FAB visibility:** "New Announcement" FAB appears on `/admin/alerts` only — not on Queue, Live Map, or All Reports
15. **Real-time:** Admin creates announcement → citizen Alerts tab updates without page refresh
16. **Empty state:** Admin with no active announcements in scope sees "No active announcements in {Municipality}"
