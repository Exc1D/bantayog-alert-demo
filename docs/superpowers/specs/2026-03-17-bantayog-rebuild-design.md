# Bantayog Alert — Full Rebuild Design Spec

## Context

The current app scores 78% on Lighthouse with an LCP of 4.5s — well above the 2.5s target. The root cause is architectural: all four tabs mount simultaneously on startup, forcing Leaflet (~150KB parse cost) to load on every cold start regardless of which tab the user visits. The hash-based routing system has no real code splitting. Additionally, the admin interface is embedded inside `ProfileTab.jsx` with no dedicated structure, making it difficult for responders to triage and dispatch efficiently. The UI, while recently redesigned, does not yet feel purpose-built for emergency use.

**Goal:** Rebuild from scratch using the same stack (React + Vite + Firebase) with a new routing architecture, a redesigned UI optimized for both citizens and admins, and a performance target of LCP ≤ 1.5s.

---

## Approach

Option A: Architectural overhaul, same stack. React 18 + Vite + Firebase + React Router v6 + Tailwind CSS. Every UI component rebuilt from scratch. Admin section extracted to a dedicated route group. Data layer (hooks, contexts, utils) preserved and reused.

---

## Architecture

### Routing (React Router v6 — replaces hash routing)

```
/                App Shell  (renders in <200ms — header + nav only)
├── /            Map tab    (default — Leaflet loads async behind skeleton)
├── /feed        Feed tab
├── /alerts      Alerts tab (weather + suspensions + nearest report)
├── /report      Report flow (shareable URL, public read — no auth required)
└── /admin       Admin shell (separate lazy chunk, auth-gated)
    ├── /admin            Queue (triage)
    ├── /admin/map        Live map (responder view)
    └── /admin/report/:id Report detail + verify/resolve
```

**Key change from today:** All tabs currently mount at startup and are hidden with CSS. React Router v6 mounts only the active route. Other routes consume zero memory until visited. Leaflet is a lazy chunk loaded only when `/` (map) is active. Admin chunk contains zero bytes in the citizen bundle.

**Admin access:** Same Firebase Auth login as citizens. Role is read from Firestore `users/{uid}.role` field on login. If `role` is `admin_*` or `superadmin_provincial`, the admin shortcut and `/admin` routes are accessible. Non-admins visiting `/admin` are redirected to `/profile`. This is consistent with the existing `rbac.js` implementation.

---

## Color System

| Token | Value | Usage |
|---|---|---|
| Urgent/critical | `#FF3B30` | Primary action buttons, critical badges, alert banners, report button |
| Moderate/warning | `#FF9500` | Moderate severity indicators |
| Resolved/safe | `#34C759` | Resolved status badges and strips only — never used for nav or branding |
| Header/shell | `#1C1C1E` | App header, admin header |
| Background | `#F2F2F7` | App-level background (iOS system gray 6) |
| Surface | `#FFFFFF` | Cards, modals, tab bar |
| Primary text | `#1C1C1E` | Headings, labels |
| Secondary text | `#3C3C43` | Body text |
| Tertiary text | `#8E8E93` | Timestamps, captions, placeholders |
| Separator | `rgba(0,0,0,0.12)` | Dividers, borders |

**Note on existing palette:** The rebuild intentionally replaces `#C62828` (current accent) with `#FF3B30` (iOS system red). `#FF3B30` has a 4.5:1 contrast ratio on white — WCAG AA compliant for all text sizes. The current `#C62828` is preserved in Tailwind config only if needed for compatibility; all new components use the tokens above.

**Sponsor (`#009900`):** Credited as a logotype or "Powered by" wordmark in the app header — not used as a UI color.

**Typography:** System font stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`) for iOS-native feel. No custom font loading on the critical path. Existing Atkinson Hyperlegible / DM Serif may be dropped or deferred.

---

## Navigation

- **4 citizen tabs:** Map · Feed · Alerts · Profile
- Bottom tab bar on mobile, sidebar on desktop (lg+)
- **Active indicator:** Small red dot (`#FF3B30`, 4px circle) above tab label
- **Tab bar style:** White background, `backdrop-filter: blur(20px)`, 0.5px top separator
- **Tab links:** Real `<a>` tags with `href` — accessible, bookmarkable, browser back/forward works natively

---

## Screens

### 1. Map tab — default (`/`)

- App shell (header + nav) renders first in <200ms
- Leaflet initializes asynchronously — map container skeleton visible ~300ms while loading
- **Critical alert banner** (conditional): renders only when at least one report exists with `disaster.severity === 'critical'` AND `verification.status !== 'resolved'`. Shows the most recent such report's type and municipality. Not dismissible.
- Report markers: `#FF3B30` = critical, `#FF9500` = moderate/minor, `#34C759` = resolved. White 2px border, drop shadow.
- **Floating red "REPORT EMERGENCY" button:** Anchored bottom-center over the map, always visible.
- Tap marker → popup: first report photo as header image (if available), type + location + time + status, "View full report →" link
- Tap popup → `/report/:id` (public, no auth required)

### 2. Feed tab (`/feed`)

Facebook-inspired card pattern — citizens already know how to read it.

**Card anatomy:**
- **3px severity strip** at top: `#FF3B30` critical, `#FF9500` moderate/minor, `#34C759` resolved, `#8E8E93` pending/unverified
- **Header row:** Disaster type SVG icon in 36px circle (colored bg matching severity, 15% opacity) + type name (bold) + severity badge + verification badge + barangay/municipality + timestamp
- **Description text:** Up to 3 lines, "See more" link if truncated
- **Photo grid:**
  - 0 photos → no photo area
  - 1 photo → full card width, 160px tall
  - 2 photos → side-by-side, equal width, 100px tall each
  - 3+ photos → 2+1 grid: top row full-width, bottom row 2 cells; last cell has semi-transparent black overlay showing "+N" where N = remaining photo count. Tapping any photo opens a full-screen lightbox (swipeable).
- **Engagement bar:** Thumbs-up SVG + upvote count · Share SVG + "Share" · "View full report →" link (right-aligned)

**Resolved card state:**
- Green (`#34C759`) severity strip and "Resolved" badge
- Original report photo(s) + resolution evidence photo(s) displayed together in the same photo grid
- Caption below engagement bar: "Resolved by [unit] · [time]"
- "View full report →" opens modal with full resolution notes and all evidence

**No emojis anywhere in the feed.** All icons are inline SVG.

### 3. Alerts tab (`/alerts`)

Merged replacement for the Weather tab. Stacked card layout, scroll if needed.

**1. Suspension card (conditional):**
- Renders only when `system/announcements` Firestore doc has `suspensions` array with at least one entry where `active: true`
- Red header bar (`#FF3B30`) with label "Class Suspension" or "Work Suspension"
- Body: issuing authority (e.g., "DepEd · Camarines Norte"), scope (e.g., "All levels"), timestamp
- Multiple active suspensions stack as separate cards

**2. Weather card (always present):**
- Temperature, weather description, humidity, wind speed — from existing `useWeather` hook / `weatherAPI.js`
- PAGASA signal level badge (`#FF9500`) if `signal > 0` in weather data
- No changes to data source

**3. Nearest report card (always present when reports exist):**
- Fetches the single closest unresolved report to the user's geolocation using existing `useGeolocation` + `geoFencing.js` distance logic
- Shows: disaster type, barangay + municipality, distance in km, verification status, time
- Left border strip colored by severity
- Tap → `/report/:id`

### 4. Report flow (`/report`)

Three full-screen steps. No modal stacking. Step number shown in header ("Step 1 of 3").

- **Step 1 — What happened?** Full-screen list of disaster types (SVG icon + label per item). Selected item gets red border + light red background. Location capture (`useGeolocation`) starts silently in background as soon as this step renders. "Cancel" in header navigates back.
- **Step 2 — Add a photo** (entire step is skippable via "Skip" link in header). Dashed upload zone. Uses `<input type="file" accept="image/*" capture="environment">`. On selection, `imageCompression.js` compresses before upload. "Next" button is red.
- **Step 3 — Describe it.** Text area (required, min 10 chars) + severity chips (Critical / Moderate / Minor — single select, red when active). Red "Submit report" button. Location shown as detected municipality with "Edit" option if detection failed.

All primary action buttons are `#FF3B30`. Severity chip selected state: red border + `#FF3B3015` background.

### 5. Admin section (`/admin`)

Separate lazy chunk via `React.lazy()`. Zero bytes loaded for users without admin role. Redirect to `/profile` if `rbac.isAdmin(user) === false` (using existing `rbac.js`).

**Admin tab bar (3 tabs, within admin shell):** Queue · Live Map · All Reports

#### Queue (`/admin`)

**Status bar (sticky top, always visible):**
- 4 counts: Pending (red) · Critical active (orange) · Total active · Resolved today (green)
- Counts from real-time Firestore `onSnapshot` listeners

**"Needs action" list:**
- Reports where `verification.status === 'pending'`, sorted by severity then timestamp
- Each queue item: severity left-border strip, type + municipality, severity label + timestamp + photo count, description (1 line preview)
- Inline buttons: **Reject** (outlined, red text) and **Verify** (dark fill, white text) — trigger without navigating
- Tap card body (not buttons) → `/admin/report/:id`

#### Report detail + dispatch (`/admin/report/:id`)

- Full-width photo (swipeable if multiple, same lightbox as citizen view)
- Report metadata block: type, location, severity, time submitted, reporter (name or "Anonymous")
- Map miniature showing report location (static, not interactive — avoids second Leaflet instance)

**Dispatch form (required before Verify + Dispatch):**

Response action chips (single-select, required):
- `deploy-team` → "Deploy team"
- `issue-advisory` → "Issue advisory"
- `monitor-only` → "Monitor only"
- `coordinate-lgu` → "Coordinate LGU"
- `evacuate-area` → "Evacuate area"

Assign to unit chips (single-select, required for ALL response actions):
- `mdrrmo` → "MDRRMO"
- `bfp` → "BFP"
- `pnp` → "PNP"
- `barangay` → "Barangay"
- `provincial` → "Provincial"

**`assignedUnit` is always required, including for "monitor-only" and "issue-advisory".** Every dispatched report must have a responsible unit for accountability. There is no conditional logic — if neither chip is selected, "Verify + Dispatch" stays disabled regardless of which responseAction is chosen.

Notes for responders — free text, optional. Placeholder: "Specific instructions, access points, contacts..."

**Action buttons:**
- **Reject** (outlined red) — sets `verification.status = 'rejected'`, prompts for rejection reason (required)
- **Verify + Dispatch** (filled red, disabled until responseAction + assignedUnit are selected) — writes all fields below

On "Verify + Dispatch", writes to `reports/{id}`:
```js
verification: {
  status: 'verified',
  verifiedBy: uid,
  verifiedAt: serverTimestamp(),
  verifierRole: userProfile.role,
  responseAction: 'deploy-team' | 'issue-advisory' | 'monitor-only' | 'coordinate-lgu' | 'evacuate-area',
  assignedUnit: 'mdrrmo' | 'bfp' | 'pnp' | 'barangay' | 'provincial',
  notes: string,
}
```
Also writes an audit event via existing `auditLogger.js`.

### 6. Profile tab (`/profile`)

**User card:**
- 52px avatar (initial letter if no photo, actual photo if uploaded). White 2.5px border, `#F2F2F7` background circle.
- **Camera badge:** 18px dark circle (`#1C1C1E`), white border 1.5px, camera SVG icon, bottom-right of avatar
- Tapping avatar or badge opens native action sheet (iOS sheet / Android bottom drawer via `<input>` trigger):
  - "Take photo" → `<input accept="image/*" capture="environment">`
  - "Choose from library" → `<input accept="image/*">`
  - "Remove photo" → clears Firebase Storage URL, reverts to initial letter
- Upload uses existing `imageCompression.js` (max 500KB, 400×400px for avatars) + Firebase Storage at `/users/{uid}/avatar`
- During upload: spinner overlays avatar, camera badge hidden
- Name (bold), email (truncated if long), role badge (red bg for admins: "Admin · Municipality")
- Tap card row → Edit profile screen

**Admin shortcut card (admins only):**
- Dark card (`#1C1C1E`), white text
- "Admin dashboard" label, pending report count as subtitle
- Red "Open" button → `/admin`

**Settings groups (iOS grouped list style):**

Account:
- Edit profile (→ edit name, municipality)
- Change password (→ email form for password reset, uses existing `requestPasswordReset()`)
- My reports (→ filtered feed showing only current user's reports)

Preferences:
- Notifications — toggle, uses existing `usePushNotifications` hook. Applies immediately.
- Dark mode — toggle, uses existing `ThemeContext.toggleTheme()`. Applies immediately, persists to `localStorage`.
- Language — chevron + current value ("English"), navigates to language picker

Legal:
- Privacy settings (→ existing `PrivacySettings.jsx` content, restyled)
- About Bantayog Alert (→ version, credits, sponsor acknowledgement)

Danger zone:
- Sign out — red text, calls `signOut()` from `useAuth`, redirects to `/`
- Delete account — red text, triggers confirmation dialog before deletion

---

## Performance Strategy

| Change | Expected LCP impact |
|---|---|
| React Router v6 — only active route mounts | Removes Feed, Alerts, Profile from initial parse |
| Leaflet deferred to `/` route | Removes ~150KB from initial JS |
| Admin chunk fully lazy | Zero cost for citizens |
| App shell renders before any route chunk | Header + nav visible in <200ms |
| Firebase lazy init (preserved from current) | Auth/Storage load on demand |
| System font stack (no font fetch) | Removes render-blocking font load |
| Image optimization: WebP thumbnails in feed | Reduces LCP element size on Feed |

**LCP target: ≤ 1.5s.** Primary driver is removing Leaflet from initial parse. Secondary driver is system font (eliminates font fetch). Feed image optimization (WebP via existing `imageCompression.js` config) further reduces LCP on the Feed tab specifically. This target assumes a mid-range Android device on a 4G connection — consistent with Lighthouse mobile simulation.

---

## Preserved Infrastructure (no changes)

| File | Purpose |
|---|---|
| `firestore.rules` | Security and RBAC rules |
| `storage.rules` | Firebase Storage rules |
| `public/sw.js` | Service worker — offline queue, tile cache, push. Cache version must be bumped post-deploy (existing process). |
| `src/utils/geoFencing.js` | Municipality detection |
| `src/utils/imageCompression.js` | Client-side compression + thumbnails |
| `src/utils/rateLimiter.js` | Client-side rate limiting |
| `src/utils/sanitization.js` | XSS prevention |
| `src/utils/rbac.js` | Role-based access control |
| `src/utils/auditLogger.js` | Audit event logging |
| `src/utils/weatherAPI.js` | OpenWeather integration |
| `src/hooks/useAuth.js` | Auth logic |
| `src/hooks/useReports.js` | Firestore reports query + pagination |
| `src/hooks/useGeolocation.js` | Browser geolocation |
| `src/hooks/useWeather.js` | Weather data |
| `src/contexts/AuthContext.jsx` | Auth state |
| `src/contexts/ReportsContext.jsx` | Reports state |
| Firebase config, `.env`, CI/CD pipeline | Unchanged |

---

## What Gets Rebuilt (UI layer only)

Every component in `src/components/` and `src/pages/` is rebuilt following the new design system. The data layer above is preserved.

**Components rebuilt:**
- `Layout/` — Header, TabNavigation (real router links), Footer
- `Map/` — LeafletMap (async init), DisasterMarker, map popup
- `Feed/` — FeedList, FeedPost (Facebook-inspired), EngagementButtons, PhotoGrid, PhotoLightbox
- `Reports/` — ReportFlow (3 full-screen steps), ReportTypeStep, PhotoStep, DetailsStep
- `Admin/` — AdminShell, AdminNav, Triage Queue, DispatchForm, AdminMapView
- `Alerts/` — AlertsTab, SuspensionCard, WeatherCard, NearestReportCard (replaces Weather/)
- `Profile/` — ProfileTab, AvatarUpload, SettingsGroup
- `Common/` — Button, Modal, Toast, Skeleton, LoadingSpinner (restyled, API unchanged)

---

## Verification

End-to-end test checklist:

1. **LCP:** Lighthouse on production build — confirm LCP ≤ 1.5s on mobile simulation
2. **Bundle isolation:** DevTools network — navigating to `/feed` must not load admin JS chunk
3. **Map async load:** Open app → confirm header + nav render before Leaflet → map skeleton → tiles appear
4. **Citizen report flow:** Complete 3-step flow → Firestore doc created with location, type, severity, photo URL, weatherContext
5. **Feed photos:** 1 photo = full width; 2 = side-by-side; 3+ = 2+1 grid with +N badge; lightbox opens on tap
6. **Map popup:** Tap marker → popup with photo + summary → tap → `/report/:id`
7. **Alerts tab:** Suspension card hidden when no active suspensions; weather loads; nearest report shows correct distance
8. **Admin triage queue:** Log in as admin → queue sorted critical-first → inline Verify/Reject without navigation
9. **Admin dispatch:** Verify + Dispatch button disabled until responseAction + assignedUnit selected → on submit, Firestore `verification` contains all new fields → audit log entry created
10. **Profile avatar:** Camera badge → action sheet → upload → Firebase Storage → avatar updates in UI
11. **Dark mode toggle:** Toggles immediately, persists across page refresh
12. **Offline queue:** Disconnect network → submit report → reconnect → service worker replays to Firestore
13. **Admin role guard:** Non-admin user visiting `/admin` redirected to `/profile`
14. **Accessibility:** Run Lighthouse accessibility audit — maintain 100% score
