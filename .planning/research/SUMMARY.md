# Project Research Summary

**Project:** Bantayog Alert
**Domain:** Emergency/disaster reporting and response system
**Researched:** 2026-03-20
**Confidence:** HIGH

---

## Executive Summary

Bantayog Alert is a civic emergency reporting system built with React + Firebase that enables citizens to submit disaster reports (photo + description + location) and allows administrators to verify, dispatch, and resolve incidents. The architecture follows a hub-and-spoke pattern with centralized state management via React Context providers, real-time Firestore subscriptions, and route-based code splitting.

The codebase is substantially complete (all three rebuild phases deployed, 588 tests passing), but has three critical stabilization items blocking full functionality: a Content Security Policy violation blocking photo uploads, 11 missing profile subpage features, and approximately 30 potentially unused hooks requiring conservative audit before removal. Performance optimization (Lighthouse LCP ≤ 1.5s) was already achieved in the rebuild but needs verification.

Recommended priority order: (1) Fix CSP first — blocks core report submission; (2) Complete profile subpages incrementally; (3) Conservative dead code removal after audit; (4) Performance verification as optimization pass. Admin routing is already correct — do not modify.

---

## Key Findings

### Recommended Stack

The current stack is well-chosen for an emergency reporting PWA and requires no changes:

**Core technologies:**
- **React + React Router v6**: Client-side routing with nested routes and Suspense-based lazy loading
- **Firebase (Auth, Firestore, Storage)**: Managed backend with real-time listeners and authentication
- **Vite**: Fast build tool with manual chunking for vendor splitting (react, firebase, map, turf)
- **Tailwind CSS**: Utility-first styling with design tokens for consistency
- **Leaflet + Turf.js**: Interactive mapping with point-in-polygon geofencing for municipality detection
- **Workbox service worker**: PWA caching strategies for offline capability

### Expected Features

**Must have (table stakes) — already implemented:**
- Quick photo/video capture (broken by CSP)
- Brief description text
- Automatic location detection (GPS + geofencing)
- Disaster type selection
- Severity indicator
- Submit confirmation
- Feed of verified reports
- Real-time admin triage queue
- Verification workflow
- Dispatch/assignment
- Resolution with evidence
- Rejection with reason
- Municipality-scoped access
- Mass announcement publishing

**Should have (competitive) — defer to Phase 2+ or Phase 3:**
- Offline report queuing (High complexity)
- Report status tracking (Medium)
- Witness count aggregation (Medium)
- One-tap anonymous reporting (High)
- Admin analytics dashboard (High)
- Bulk verification operations (Medium)
- Export reports to CSV (Low)
- Response unit tracking (High)

**Nice-to-have but non-essential:**
- Edit profile (name, municipality)
- My reports history
- Language selection (i18n)
- About / Privacy policy pages
- Notification preferences (critical but belongs in global settings, not Profile tab)

**Anti-features (deliberately avoid):**
- Rich text editing, social interactions (likes/comments), gamification, incentives for reporting, complex role hierarchies, live admin chat, performance metrics that incentivize speed over quality.

### Architecture Approach

The system uses a layered architecture with clear separation of concerns:

- **Presentation Layer**: Tab-based navigation (Map, Feed, Alerts, Profile) with route-based lazy loading; admin section isolated behind AdminGuard
- **Component Layer**: Reusable UI components (Layout, Common, Profile, Admin, Feed, Map)
- **State Layer**: Three React Context providers (Auth, Reports, Theme) with custom hooks for consumption
- **Hook Layer**: Business logic abstraction (useGeolocation, useWeather, useRateLimit, useAnnouncements)
- **Service Layer**: Firebase SDK wrappers, OpenWeather API, image compression, sanitization, audit logging
- **Infrastructure**: Firebase Hosting, Firestore, Storage, Cloud Functions

The hub-and-spoke data flow centers on ReportsContext, which feeds the Feed, Admin, Map, and Alerts views. Report submission follows a 3-step wizard with local state before committing to Firestore. Admin workflows use real-time listeners and update documents with verification metadata and audit logging.

**Major components:**
1. AuthContext — authentication state and user profile management
2. ReportsContext — centralized data source with CRUD operations and real-time listeners
3. AdminGuard — role-based access control for admin routes
4. LeafletMap — geofenced display with critical alert banner overlay
5. TriageQueue — sorted pending reports with verification/dispatch modals

### Critical Pitfalls

1. **CSP violations blocking photo upload** — likely missing `connect-src` directive for Firebase Storage endpoints. Diagnose via DevTools Network/Console, add minimal needed sources. This is the #1 blocker for core functionality.
2. **Dead code accumulation** — ~30 hooks in `src/hooks/` may be unused. Conservative audit required: run ESLint `no-unused-vars`, grep for imports, comment out exports with `.dead` suffix, run full test suite before deletion. High risk of breaking hidden features if aggressive.
3. **Admin routing confusion** — `App.jsx` comment suggests routing issues, but `AdminShell.jsx` nested routes are correct. Do not modify working admin navigation; only update outdated comment if desired.
4. **Incomplete profile features** — 11 missing subpages (`/profile/edit`, `/password`, `/reports`, `/language`, `/privacy`, `/about`, notifications toggle, delete account). Implementation is straightforward but requires coordination across multiple routes.
5. **Performance regression risk** — Rebuild already achieved LCP ≤ 1.5s target, but needs verification. If degraded, optimize images (WebP), check bundle sizes, consider route-based prefetching.

---

## Implications for Roadmap

Based on research, suggested phase structure aligns with existing rebuild completion (all three phases deployed) but focuses on stabilization and polish:

### Phase 0: Stabilization (Pre-requisites)
**Rationale:** Establish baseline before feature work
**Delivers:** Reliable test suite, codebase audit, performance benchmark
**Tasks:**
- Fix E2E test flakiness (unreliable CI)
- Complete dead code audit (document usage)
- Run Lighthouse baseline measurement

### Phase 1: Critical Path Fixes
**Rationale:** Core report submission is blocked by CSP; this must be unblocked first
**Delivers:** Working photo upload for citizen reports
**Addresses:** CSP pitfall, photo upload feature
**Avoids:** Wasting effort building features on broken foundation
**Research flag:** Requires DevTools analysis to identify exact CSP directive violation

### Phase 2: Profile Feature Completion
**Rationale:** Profile features are user-facing but not core emergency flow; can be built incrementally after CSP fix
**Delivers:** All 11 missing profile subpages (`/profile/*`)
**Addresses:** Profile differentiators (edit, password reset, my reports, language, privacy, about, notifications toggle, delete account)
**Uses:** Existing AuthContext, ReportsContext, ThemeContext
**Implements:** Route-based lazy loading pattern from architecture
**Avoids:** Over-engineering by building one route at a time with immediate testing

### Phase 3: Cleanup & Optimization
**Rationale:** After features stable, remove technical debt and verify performance targets
**Delivers:** Reduced bundle size, verified Lighthouse scores
**Tasks:**
- Conservative dead code removal (only confirmed unused hooks)
- Performance tuning (images, bundle analysis)
- Bundle analysis with vite-bundle-analyzer

### Phase Ordering Rationale

- **CSP first** because it blocks the primary user flow (report submission with photos). No dependencies, high impact.
- **Profile features second** because they depend only on existing hooks and can be built incrementally in parallel with cleanup. They don't block citizen workflows but improve UX.
- **Dead code removal third** because it requires a stable baseline to avoid false positives; requires audit first, then cautious deletion with full test suite validation.
- **Performance verification last** because it's an optimization pass that should be measured against stable code; regressions are low risk but harder to diagnose if done on changing codebase.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1 (CSP fix):** Requires specific DevTools investigation to identify which CSP directive is blocking Firebase Storage uploads. Pattern is well-known but exact fix depends on `firebase.json` headers and observed violations.
- **Phase 2 (Profile features):** "My reports" feature depends on data model — verify that `reports` collection includes `reportedBy` user ID field. If missing, requires schema reconsideration.
- **Phase 2 (Notifications):** Global notification settings need FCM integration audit — check if Firebase Cloud Messaging is already configured in `manifest.json` and Firebase project.
- **Phase 3 (Offline queuing deferred):** Service worker exists but offline write buffering requires IndexedDB library selection and sync conflict resolution — defer to v2+.

Phases with standard patterns (skip research-phase):
- **Phase 3 dead code removal** — well-documented ESLint + test validation pattern
- **Route-based lazy loading** — already implemented pattern in `App.jsx`

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Firebase + React is standard for PWAs; thoroughly reviewed in codebase |
| Features | HIGH | Codebase analysis confirms implementation status; external patterns limited by tool issues but domain knowledge sufficient |
| Architecture | HIGH | Based on extensive codebase analysis and rebuild design spec |
| Pitfalls | HIGH | Issues identified align with common Firebase/CSP/dead-code patterns |

**Overall confidence:** HIGH

### Gaps to Address

- **CSP violation specifics**: Exact directive and endpoint blocked needs DevTools capture during photo upload attempt.
- **FCM infrastructure**: Unclear if push notifications are already configured; requires audit of `manifest.json` and Firebase project settings.
- **Dead code certainty**: ESLint `no-unused-vars` in strict mode needed to confirm which hooks truly unused (tests may use them indirectly).
- **User validation**: Emergency-app UX patterns (minimizing cognitive load during stress) should be validated with actual non-technical users in a follow-up usability study.

---

## Sources

### Primary (HIGH confidence)
- Bantayog codebase architecture: `.planning/codebase/ARCHITECTURE.md`
- Rebuild design spec: `docs/superpowers/specs/2026-03-17-bantayog-rebuild-design.md`
- Phase completion plans: `docs/superpowers/plans/phase-*.md`
- Known issues: `.planning/codebase/CONCERNS.md`
- Project memory: `.claude/projects/-home-exxeed-dev-projects-bantayog-alert-demo/memory/MEMORY.md`
- Routing implementation: `src/App.jsx`, `src/components/Admin/AdminShell.jsx`
- CSP configuration: `firebase.json` (hosting.headers)

### Secondary (MEDIUM confidence)
- Feature landscape research: `.planning/research/FEATURES.md` (codebase verification HIGH, external best practices MEDIUM due to tool limitations)
- Emergency reporting domain patterns: Based on internal analysis; requires validation against Ushahidi/CrisisMapper patterns when search tools functional

### Tertiary (LOW confidence)
- External UX patterns for stress-optimized interfaces: Blocked by WebSearch errors; needs follow-up research

---

*Research completed: 2026-03-20*
*Ready for roadmap: yes*
