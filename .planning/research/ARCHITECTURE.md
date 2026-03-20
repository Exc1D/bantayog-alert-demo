# Architecture Patterns for Emergency Reporting Systems

**Project:** Bantayog Alert
**Researched:** 2026-03-20
**Confidence:** HIGH

---

## Typical Emergency Reporting System Structure

Emergency reporting systems follow a **hub-and-spoke pattern** with these core components:

```
                    ┌─────────────────┐
                    │   App Shell     │ (layout, navigation, auth wrapper)
                    └────────┬─────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
    ┌─────▼─────┐    ┌──────▼──────┐   ┌─────▼──────┐
    │   Map      │    │    Feed     │   │  Alerts    │
    │   (citizen)│    │  (citizen)  │   │ (citizen)  │
    └─────┬─────┘    └──────┬──────┘   └─────┬─────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │
                    ┌────────▼─────────┐
                    │   Report Flow    │ (wizard: type → photo → details)
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │   Data Layer     │ (contexts, hooks, Firebase)
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │   Admin Section  │ (guard, triage, dispatch)
                    └──────────────────┘
```

### Key Architectural Patterns

1. **Provider-Based Global State**: Auth, Reports, Theme via React Context
2. **Custom Hook Abstraction**: Business logic (geolocation, weather, rate limiting) isolated from UI
3. **Real-Time Subscriptions**: Firestore `onSnapshot` listeners for live updates
4. **Route-Based Code Splitting**: `React.lazy()` per route, admin section isolated
5. **Role-Based Access Control**: `rbac.js` + Firestore rules + AdminGuard
6. **Wizard Pattern**: Multi-step report submission with local state
7. **Optimistic Updates**: (Optional) UI updates before server confirmation

---

## Bantayog-Specific Architecture

### Current Layer Structure

```
┌─────────────────────────────────────────────────────────────┐
│                  Presentation Layer                         │
│  MapTab | FeedTab | AlertsTab | ProfileTab | ReportPage    │
│  AdminShell (Queue · Map · Reports · ReportDetail)         │
├─────────────────────────────────────────────────────────────┤
│                  Component Layer                           │
│  Layout/ (AppShell, Header, TabNav)                        │
│  Common/ (ErrorBoundary, Toast, LoadingSpinner)            │
│  Profile/ (AvatarUpload, SettingsGroup)                    │
│  Admin/ (TriageQueue, DispatchForm, QueueItem)             │
│  Feed/ (FeedPost, PhotoGrid)                               │
│  Map/ (LeafletMap, CriticalAlertBanner)                    │
├─────────────────────────────────────────────────────────────┤
│                      State Layer                           │
│  AuthContext ── useAuth()                                   │
│  ReportsContext ── useReports()                            │
│  ThemeContext ── useTheme()                                │
│  MapPanelContext ── useMapPanel()                          │
├─────────────────────────────────────────────────────────────┤
│                      Hook Layer                             │
│  useGeolocation │ useWeather │ useRateLimit │ useAnnouncements│
│  useNearestReport │ usePushNotifications │ useOffline       │
├─────────────────────────────────────────────────────────────┤
│                     Service Layer                           │
│  Firebase (Auth, Firestore, Storage)                        │
│  OpenWeather API ── weatherAPI.js                           │
│  Image Compression ── imageCompression.js                   │
│  Sanitization ── sanitization.js                            │
│  Audit Logging ── auditLogger.js                            │
├─────────────────────────────────────────────────────────────┤
│                     Infrastructure                         │
│  Firebase Hosting │ Firestore │ Storage │ Cloud Functions   │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

**Reading Reports (Citizen Feed):**
```
ProfileTab → useAuth() → AuthContext
                ↓
         useReports() → ReportsContext
                ↓
         Firestore onSnapshot listener
                ↓
         reports[] state updated
                ↓
         FeedTab re-renders
```

**Writing Reports (Submission):**
```
ReportPage → local state (type, photo, description, severity)
                ↓
         handleSubmit()
                ↓
         useReports.submitReport()
                ↓
         imageCompression() → Firebase Storage upload
                ↓
         Firestore addDoc() + audit log
                ↓
         Optimistic update? (no — redirects to feed)
```

**Admin Dispatch Flow:**
```
AdminGuard → checks isAdmin(userProfile.role)
                ↓
         TriageQueue → useReports() real-time listener
                ↓
         QueueItem.onVerify → navigate(/admin/report/:id)
                ↓
         ReportDetail → verifyReport(id, dispatchData)
                ↓
         updateDoc(reports/{id}, verification: {...})
                ↓
         logAuditEvent(REPORT_VERIFIED)
```

---

## Critical Architecture Concerns

### 1. Admin Routing — Already Fixed (Verified)

**Status:** ✅ **Resolved in Phase 1/3 rebuild**

The `AdminShell.jsx` file (lines 19-35) already implements proper React Router v6 nested routing:

```jsx
export default function AdminShell() {
  return (
    <div className="flex flex-col h-full">
      <AdminNav />  // inner tab navigation
      <div className="flex-1 overflow-hidden">
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route index element={<TriageQueue />} />
            <Route path="map" element={<AdminMapView />} />
            <Route path="reports" element={<AllReports />} />
            <Route path="report/:id" element={<ReportDetail />} />
          </Routes>
        </Suspense>
      </div>
    </div>
  );
}
```

This is nested inside the main router's `AdminGuard`:

```jsx
{
  path: 'admin',
  element: <AdminGuard />,
  children: [{ path: '*', element: <AdminShell /> }],
}
```

**App.jsx comment (lines 19-22) is outdated.** The admin routing **works correctly**. The nested routes inside `AdminShell` render based on `/admin/*` URL path. No rebuild needed.

**Risk if modified:** Medium — Changing this would break working admin navigation.

---

### 2. CSP Violations Blocking Report Submission — Critical Path

**Status:** 🚨 **URGENT FIX REQUIRED**

**Symptom:** Report submission failing due to Content Security Policy restrictions.

**Current CSP** (from `firebase.json` line 42-43):
- Uses `blob:` for `worker-src` (service worker) and `media-src`
- Allows many external domains with wildcards
- `style-src` includes `'unsafe-inline'` (necessary for Tailwind)
- `img-src` includes map tile providers, Firebase Storage, etc.

**Common CSP failure points for report submission:**
1. **Firebase Storage upload**: Needs `connect-src` to include `*.firebasestorage.app`
2. **Image compression**: `blob:` URLs created and read — `img-src blob:` already present
3. **Firestore writes**: `connect-src` covers `*.firebaseapp.com` (should cover Firestore)
4. **Service worker**: `worker-src 'self' blob:` is correct

**Diagnosis needed:**
- Open DevTools → Network tab → filter by "CSP" or "csp"
- Check console for CSP violation errors during report submission
- Identify which directive is blocking (likely `connect-src` for some Firebase endpoint)

**Fix strategy:**
1. **Do not loosen CSP globally** — add only the missing source.
2. Common additions for Firebase Storage:
   - Already has `*.firebasestorage.app` in `connect-src` — good.
   - Already has `blob:` in `img-src` and `media-src` — good.
3. If violation shows a specific URL, add that domain only (avoid wildcards).
4. If using Firebase App Check, may need `*.firebaseapp.com` in additional directives.

**Example CSP fix** (if `*.firebasestorage.app` missing from connect-src):
```json
"connect-src 'self' ... *.firebasestorage.app ..."  // ensure present
```

**Testing:** After CSP update, submit a report with photo and verify no console errors.

**Build order priority:** **FIX THIS FIRST** — blocks core functionality. Cleanup and profile rebuild can wait.

---

### 3. Dead Code Removal — 1,550+ Lines of Unused Hooks/Utils

**Status:** 📦 **Refactoring needed**

**Scope:**
- 30 hook files in `src/hooks/`
- Many appear unused: `useInfiniteScroll`, `useErrorBoundary`, `useErrorReporting`, `useSanitization`, `useFirestorePersistence`, `useOffline`, `usePushNotifications`, `useFeatureFlag`, `useAccessibility`, `useWebVitals`, `useIsLg`, `useAuditLog` (some are used, need audit)

**Strategy: Conservative approach**

**Phase A: Audit First (Don't Delete Yet)**
1. Run ESLint with `no-unused-vars` rule (strict mode) to detect unused exports
   ```bash
   npx eslint src/hooks/ --rule 'no-unused-vars: 2'
   ```
2. Search for imports:
   ```bash
   grep -r "useInfiniteScroll\|useErrorBoundary\|useFeatureFlag" src/
   ```
3. Check which hooks are imported anywhere in the codebase (including tests).
4. Document findings: "Used by X component" vs "No imports found".

**Phase B: Safe Removal**
1. **Do NOT delete entire files** — comment out exports and rename with `.dead` suffix
2. Run full test suite — if 0 failures, those hooks truly unused
3. If tests fail, investigate why and restore if needed
4. Only after confident removal, delete files

**Risk:** High — Removing used hooks breaks functionality.

**Example hook audit:**
- `usePushNotifications` — likely used in Profile Notifications toggle (see ProfileTab.jsx line 120) — **KEEP**
- `useFeatureFlag` — search for usage — if none, **REMOVE**
- `useWebVitals` — probably for analytics, check if needed — **AUDIT**
- `useAccessibility` — might be used by components — **AUDIT**
- `useIsLg` — utility for responsive design, likely used — **AUDIT**
- `useAuditLog` — used by `useReports` for admin actions — **KEEP**

**Recommended approach:**
- Create `.planning/dead-code-audit.md` documenting each hook's usage status
- Remove only confirmed unused (no imports in src/, no test references)
- Keep ambiguous ones until proven unused

**Build order:** Cleanup can happen **in parallel** with Profile feature completion, but **after** CSP fix. Cleanup is low-risk if done conservatively.

---

### 4. Profile Tab "Rebuild" — Actually Feature Completion

**Status:** 🏗️ **11 missing features to add**

**Current ProfileTab** (`src/pages/ProfileTab.jsx`) has:
- Avatar upload (✅ working)
- Settings groups with links to subpages (🔲 subpages mostly missing)

**Missing subpages (11 features):**

1. `/profile/edit` — Edit profile form (name, municipality)
2. `/profile/password` — Password reset request
3. `/profile/reports` — Filtered feed showing only user's reports
4. `/profile/language` — Language picker (i18n setup)
5. `/profile/privacy` — Privacy settings (existing PrivacySettings.jsx content but restyled)
6. `/profile/about` — About page (version, credits, sponsor)
7. Notifications toggle integration (`usePushNotifications`)
8. Dark mode toggle (✅ works via ThemeContext)
9. Sign out (✅ works)
10. Delete account (stub exists, needs implementation)
11. Language persistence (if i18n added)

**Architecture decision: How should these subpages be structured?**

**Recommended pattern:**
```
/profile
├── / (ProfileTab — settings list)
├── /edit (ProfileEdit page — form)
├── /password (PasswordReset page — email form)
├── /reports (UserReports page — filtered feed)
├── /language (LanguagePicker page)
├── /privacy (PrivacySettings page)
└── /about (About page — static content)
```

**Implementation approach:**
- Create `src/pages/Profile/` directory for these pages
- Each page is a separate `React.lazy()` route (for code splitting)
- Use existing hook: `useAuth` for user data, `useReports` for user's reports (filter by `reporter.uid`)
- Reuse components: `SettingsGroup` for consistency

**Example ProfileEdit:**
```jsx
// src/pages/Profile/ProfileEdit.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function ProfileEdit() {
  const { userProfile, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(userProfile?.displayName ?? '');
  const [municipality, setMunicipality] = useState(userProfile?.municipality ?? '');

  async function handleSave() {
    await updateProfile({ displayName: name, municipality });
    navigate(-1);
  }

  return (
    <div className="h-full overflow-y-auto bg-app-bg p-4">
      <h1 className="text-lg font-bold text-text-primary mb-4">Edit profile</h1>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Name" />
      <input value={municipality} onChange={e => setMunicipality(e.target.value)} placeholder="Municipality" />
      <button onClick={handleSave}>Save</button>
    </div>
  );
}
```

**Build order:** This is the **second priority** after CSP fix. Can be done incrementally (one subpage at a time) to reduce risk.

---

### 5. Performance Optimization — Lighthouse 56% → 95+

**Status:** ⚡ **Already addressed in rebuild, but needs verification**

**Current target from spec** (`docs/superpowers/specs/2026-03-17-bantayog-rebuild-design.md` line 244):
- LCP ≤ 1.5s on mobile (4G simulation)
- 588 tests passing (per MEMORY.md)

**Architectural performance wins already implemented:**
1. ✅ **Route-based lazy loading** — only active tab mounts
2. ✅ **Leaflet deferred** — loads only on `/` route, not initial bundle
3. ✅ **Admin chunk isolated** — zero bytes for citizens
4. ✅ **Design tokens** — system fonts, minimal design overhead
5. ✅ **Manual chunking** — `vite.config.js` splits vendors (react, firebase, map, turf)

**What to verify:**
- Run Lighthouse on production build:
  ```bash
  npm run build && npx serve dist &
  npx lighthouse http://localhost:3000 --output=html --output-path=.tmp/lighthouse.html
  ```
- Check LCP score. If > 1.5s, investigate:
  - Large images in feed (optimize with WebP)
  - Unoptimized map tiles (Leaflet handles this well)
  - Bundle size too large (run `vite-bundle-analyzer`)

**Potential additional optimizations (if needed):**
1. **Image lazy loading** — add `loading="lazy"` to feed images
2. **Code splitting for heavy components** — e.g., PhotoGrid, FeedPost (unlikely needed)
3. **Prefetch next route** — `<link rel="prefetch">` for likely navigation (e.g., from Map → Report page)

**Risk:** Low — Rebuild already applied these patterns. Just need validation.

**Build order:** Performance verification can be done **after** CSP and Profile features. It's an optimization pass, not a blocker.

---

## Component Boundaries & Coupling

### Tightly Coupled Components (High Risk to Modify)

| Component | Coupled To | Reason |
|-----------|------------|--------|
| `App.jsx` | Router + all lazy imports | Central routing — changes affect all pages |
| `AppShell.jsx` | Header + TabNavigation + Outlet | Layout changes ripple to all pages |
| `AuthContext` | All pages (through useContext) | Global state — breaking changes cascade |
| `ReportsContext` | Feed, Admin, Map, Alerts | Central data source — mutations affect many |
| `useReports` hook | Firestore queries, report subcollections | Data-fetching logic used across features |
| `ProfileTab` | `useAuth`, `useTheme`, navigation | Integrates multiple contexts |

### Loosely Coupled Components (Safe to Modify)

| Component | Independence | Reason |
|-----------|--------------|--------|
| `FeedPost` | Receives report as prop | Self-contained card — isolated |
| `PhotoGrid` | Pure function of photos array | No external dependencies |
| `QueueItem` | Receives report + callbacks | Can test in isolation |
| `DispatchForm` | Controlled inputs via props | Simple state container |
| `AvatarUpload` | Calls `onUpload` callback | No direct Firebase coupling (parent handles upload) |

---

## Testing Strategy

### Unit Tests (Fast, Isolated)
**Scope:**
- All hooks: `useAuth.test.jsx`, `useReports.test.jsx`, `useGeolocation.test.jsx`, etc.
- All components in isolation: `FeedPost.test.jsx`, `QueueItem.test.jsx`, `AvatarUpload.test.jsx`, etc.
- Pure utilities: `geoFencing.test.js`, `imageCompression.test.js`

**Coverage target:** 80%+ (existing 588 tests already passing)

### Integration Tests (Medium Scope)
**Scope:**
- Route rendering: Does `/report/:id` load `ReportPage` correctly?
- Context integration: Does `ProfileTab` properly consume `useAuth`?
- Hook + component: Does `TriageQueue` correctly filter reports from `useReports`?

**Current coverage:** Partial — existing `App.test.jsx` and context tests cover some integration.

### E2E Tests (Full Stack)
**Scope:**
- User flows: Auth → report submission → admin dispatch
- Real browser with Firebase emulator or test project
- Playwright tests in `e2e/` directory

**Flakiness fix needed** (from CONCERNS.md):
- Replace `waitForTimeout()` with condition-based waits
- Use unique test data (UUIDs) to avoid collisions
- Add `test.beforeEach` to clean up data

**Build order consideration:** E2E stability should be addressed **before** major refactoring to catch regressions early.

---

## Suggested Build Order (with Dependencies)

```
PHASE 0: Stabilization (Pre-requisites)
├─ [A] E2E test flakiness fix (HIGH priority — unreliable CI)
├─ [B] Dead code audit (document usage before removal)
└─ [C] Performance baseline (measure current Lighthouse, document gap)

PHASE 1: Critical Path Fixes (Do First)
├─ [1] CSP fix for report submission (BLOCKER)
│   └─ Diagnose violations → update firebase.json → verify report+photo upload
│   └─ Test: submit report with photo, check console for CSP errors
│
├─ [2] Profile feature completion (11 missing features)
│   ├─ Create src/pages/Profile/ directory
│   ├─ Implement: /profile/edit, /profile/password, /profile/reports
│   ├─ Implement: /profile/language, /profile/privacy, /profile/about
│   ├─ Implement: Notification toggle integration (usePushNotifications)
│   ├─ Implement: Delete account (with confirmation)
│   └─ Test: all profile routes render, auth flows work
│
└─ [3] Profile tab integration
    └─ Ensure new subpages work with existing ProfileTab navigation
    └─ Test: all SettingsGroup links navigate correctly

PHASE 2: Cleanup & Optimization (Parallelizable)
├─ [4] Dead code removal (conservative)
│   ├─ Remove only confirmed unused hooks (based on audit)
│   ├─ Remove unused utility functions
│   ├─ Remove dead imports from components
│   └─ Test: all existing tests pass after removal
│
├─ [5] Performance tuning
│   ├─ Run Lighthouse → compare to target (LCP ≤ 1.5s)
│   ├─ If LCP high: optimize images (WebP), check bundle sizes
│   ├─ Consider route-based prefetching for common navigations
│   └─ Test: Lighthouse scores 95+ on mobile simulation
│
└─ [6] Bundle analysis
    └─ Use `vite-bundle-analyzer` to verify chunk sizes reasonable
    └─ Ensure admin chunk remains separate (< 50KB for citizens)

PHASE 3: Polish & Documentation
├─ [7] TypeScript migration (if desired)
│   └─ Incremental: convert .jsx to .tsx one file at a time
│   └─ Add JSDoc contracts during migration
│
├─ [8] Documentation updates
│   └─ Update ARCHITECTURE.md with final decisions
│   └─ Update FEATURES.md if new features added
│   └─ Update PITFALLS.md with lessons learned
│
└─ [9] Final verification
    ├─ Run full test suite: 588+ tests passing
    ├─ Run Lighthouse: 95+ score, LCP ≤ 1.5s
    ├─ Manual smoke test all flows: report, admin triage, profile edit
    └─ CSP: no violations in console during any flow
```

### Dependency Graph

```
CSP fix → can proceed independently (no dependencies)

Profile features → depends on: existing ProfileTab + hooks (already present)
                → blocks: nothing else
                → parallel with: dead code removal, performance tuning

Dead code removal → depends on: dead code audit completed
                  → blocks: nothing (cleanup only)
                  → risk: high if not conservative

Performance tuning → depends on: CSP fixed, Profile features stable
                    → requires: Lighthouse measurements
                    → parallel with: TypeScript migration

E2E flakiness fix → depends on: nothing (test infrastructure only)
                   → should be done FIRST to stabilize CI
```

**Recommended sequence:**
1. **Week 1:** E2E fixes + CSP fix (unblock core functionality)
2. **Week 2-3:** Profile features (implement all 11 subpages incrementally)
3. **Week 4:** Dead code removal (audit → remove → test)
4. **Week 5:** Performance tuning + bundle analysis
5. **Week 6:** Polish, docs, final verification

---

## Risk Assessment

| Task | Severity if Broken | Likelihood | Mitigation |
|------|-------------------|------------|------------|
| CSP fix | HIGH — blocks report submission | LOW-MEDIUM — well-understood pattern | Test photography flow end-to-end; keep backup CSP value |
| Profile features | MEDIUM — incomplete UX | MEDIUM — multiple routes to coordinate | Implement one route at a time, test immediately |
| Dead code removal | HIGH — could break hidden features | HIGH — conservative audit needed | Comment out first, run full test suite before delete |
| Performance tuning | LOW — cosmetic improvements | LOW — mostly configuration | Verify with Lighthouse before/after; rollback if worse |
| Admin routing changes | HIGH — breaks admin workflows | LOW — currently works | **Do NOT modify** AdminShell routing (it's correct) |
| TypeScript migration | MEDIUM — introduces type errors | MEDIUM — gradual process | Migrate one file at a time; allow `// @ts-nocheck` temporarily |

---

## Key Recommendations

1. **Fix CSP first** — This is blocking report submission with photos. Diagnose exact violation, add minimal needed source.
2. **Profile subpages second** — These are missing features, not architectural changes. Build incrementally, one route at a time.
3. **Conservative dead code removal** — Audit via ESLint + grep, comment out before delete, run full test suite.
4. **Don't touch working Admin routing** — The nested routes in `AdminShell.jsx` are correct. The outdated comment in `App.jsx` should be updated, not the code.
5. **Performance already optimized** — Rebuild achieved LCP ≤ 1.5s target. Just verify and document baseline.
6. **Testing strategy:** Unit tests for new Profile pages + integration tests for routing + stabilized E2E for flows.

---

## Alternative Approaches Considered

### Alternative 1: Full TypeScript Migration Now
**Why not:** High risk, long timeline, low immediate value. Can be done incrementally later.

### Alternative 2: Remove All Unused Hooks Aggressively
**Why not:** Too risky — some hooks may be used indirectly or in tests. Conservative audit first.

### Alternative 3: Redesign Profile with Tabs Instead of Modal Stack
**Why not:** Spec already defines iOS grouped list pattern. Stick with design spec for consistency.

### Alternative 4: Move to Server-Side Rendering
**Why not:** Out of scope, huge architecture change, breaks Firebase Hosting SPA model. Not needed for PWA.

---

## Sources

- Current architecture analysis: `/home/exxeed/dev/projects/bantayog-alert-demo/.planning/codebase/ARCHITECTURE.md`
- Rebuild design spec: `docs/superpowers/specs/2026-03-17-bantayog-rebuild-design.md`
- Phase plans: `docs/superpowers/plans/phase-*.md`
- Known issues: `.planning/codebase/CONCERNS.md`
- Project memory: `.claude/projects/.../MEMORY.md`
- Routing implementation: `src/App.jsx`, `src/components/Admin/AdminShell.jsx`
- CSP configuration: `firebase.json` (hosting.headers)

**Confidence:** HIGH — Based on extensive codebase analysis and official rebuild plans (all three phases complete as of 2026-03-18).
