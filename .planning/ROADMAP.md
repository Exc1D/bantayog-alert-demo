# Bantayog Alert - Implementation Roadmap

**Created:** 2026-03-20
**Purpose:** Stabilization and completion of v1 requirements
**Total Requirements:** 30 (REP:6, ADM:7, PRF:11, SYS:6)
**Phases:** 4

---

## Phase 1: Critical Blocker — CSP Fix

**Goal:** Unblock core report submission by resolving CSP violations preventing image compression library from loading.

**Rationale:** The app's primary function—citizens submitting emergency reports with photos—is blocked. This is the highest priority item with no dependencies.

**Requirements Addressed:**
- SYS-01: Content Security Policy header must allow loading of image compression library without using 'unsafe-eval'

**Success Criteria:**
1. User can select/take a photo in the report submission flow without console errors
2. Image compression library loads successfully and compresses images to ≤1MB
3. Report submission completes successfully with photo attachment on Slow 3G (≤30 seconds)
4. No CSP violations appear in browser console during photo upload

**Key Tasks:**
- Diagnose exact CSP violation via DevTools (Network/Console tab)
- Update `firebase.json` hosting headers with correct `script-src`, `connect-src`, `img-src` directives
- Replace `browser-image-compression` with CSP-compliant alternative (Squoosh/Sharp) if needed
- Test photo upload end-to-end on mobile viewport and Slow 3G emulation

**Risk:** Low — well-understood CSP pattern; minimal changes to configuration

---

## Phase 2: Profile Feature Completion

**Goal:** Implement all 11 missing profile subpage features to provide complete account management.

**Rationale:** Profile features are independent of CSP fix and don't block citizen reporting workflows. They can be built incrementally using existing context providers (Auth, Reports, Theme). Implements all PRF requirements.

**Requirements Addressed:**
- PRF-01: Sign out from any page
- PRF-02: Delete account with cascade cleanup
- PRF-03: Change password via Firebase reset flow
- PRF-04: Edit profile (name, municipality, avatar)
- PRF-05: Notification preferences toggle (announcements, report status)
- PRF-06: Dark mode toggle (persisted)
- PRF-07: Language selection (i18n)
- PRF-08: Privacy settings page
- PRF-09: "About Bantayog Alert" page
- PRF-10: "My Reports" page with status tracking
- PRF-11: Admin Dashboard shortcut link

**Success Criteria:**
1. User can sign out via Profile tab and is redirected to login page
2. User can edit display name (max 50 chars), select municipality, and upload avatar image
3. User can change password and receives reset email (test mode)
4. User can delete account and sees confirmation; all user data removed from Firestore/Storage
5. User can toggle dark mode and preference persists across sessions
6. User can switch language and all UI text updates immediately
7. User can view Privacy and About pages with static content
8. User can access "My Reports" page showing their submitted reports with status badges
9. Admin users see "Admin Dashboard" link in Profile tab
10. Notifications toggle works (FCM subscription/unsubscription)

**Key Tasks:**
- Create route structure: `/profile/edit`, `/profile/password`, `/profile/reports`, `/profile/language`, `/profile/privacy`, `/profile/about`
- Implement forms and components using existing design system
- Integrate with AuthContext for auth operations
- Add i18n support with language switcher
- Implement FCM token management for notifications
- Write tests for all new routes and components

**Risk:** Medium — multiple new routes but low complexity; relies on existing contexts and Firebase SDK

---

## Phase 3: Cleanup & Dead Code Removal

**Goal:** Remove unused code to reduce bundle size and improve maintainability without breaking existing functionality.

**Rationale:** After features are stable, we can safely audit and remove dead code. Requires conservative approach with full test validation.

**Requirements Addressed:**
- SYS-04: All unused hooks, utilities, and tests identified by audit are removed without breaking existing functionality

**Success Criteria:**
1. ESLint `no-unused-vars` runs without warnings in strict mode
2. All files marked for deletion are backed up or removed only after CI passes
3. Bundle size decreased by ≥5% (target: remove ~1,550 lines)
4. Full test suite (588 tests) passes after each removal batch
5. No runtime errors in production build

**Key Tasks:**
- Run conservative audit: `eslint --max-warnings=0`, grep for imports, review export usage
- Comment out potentially unused exports with `.dead` suffix and run tests
- Remove only confirmed unused files (hooks, utilities, tests)
- Bundle analysis with `vite-bundle-analyzer` to verify size reduction
- Incremental removal in small batches with commit per batch

**Risk:** Medium-High — aggressive removal could break features; conservative approach with test guardrails essential

---

## Phase 4: Performance Verification & Optimization

**Goal:** Achieve and verify Lighthouse performance targets.

**Rationale:** Performance optimization is a tuning pass that should be applied to stable code. Rebuild already achieved targets but needs verification and validation against current baseline.

**Requirements Addressed:**
- SYS-02: Lighthouse performance scores ≥95 (Performance), ≥98 (Accessibility), ≥95 (Best Practices), ≥90 (PWA)
- SYS-03: Initial bundle size ≤150KB gzipped after optimizations
- SYS-05: Service worker uses Workbox with proper caching strategies; offline functionality works
- SYS-06: Report submission flow works reliably on Slow 3G network (≤30 seconds)

**Success Criteria:**
1. Lighthouse CI shows all targets met on production build
2. Bundle analyzer confirms initial load ≤150KB gzipped
3. Service worker registered and caching strategies verified (Workbox)
4. Offline mode shows cached app shell; previously visited pages load without network
5. Report submission (with photo) completes in ≤30 seconds on Slow 3G emulation in Chrome DevTools
6. No console errors or warnings in production build

**Key Tasks:**
- Run Lighthouse audit via CLI or GitHub Action; compare to baseline
- Optimize images: convert to WebP, implement lazy loading for below-the-fold images
- Configure Workbox in Vite build for service worker generation
- Test offline functionality: app shell caching, stale-while-revalidate for feeds
- Bundle splitting verification: vendor chunk sizes, route-based lazy loading working
- Fix any performance regressions (code splitting, preloading, resource hints)

**Risk:** Low — mostly verification; minor tweaks needed if scores dip

---

## Traceability Matrix

| Requirement | Phase | Status |
|-------------|-------|--------|
| REP-01 | 0 (Deployed) | Completed |
| REP-02 | 0 (Deployed) | Completed |
| REP-03 | 1 (Pending) | Pending |
| REP-04 | 1 (Pending) | Pending |
| REP-05 | 0 (Deployed) | Completed |
| REP-06 | 0 (Deployed) | Completed |
| ADM-01 | 0 (Deployed) | Completed |
| ADM-02 | 0 (Deployed) | Completed |
| ADM-03 | 0 (Deployed) | Completed |
| ADM-04 | 0 (Deployed) | Completed |
| ADM-05 | 0 (Deployed) | Completed |
| ADM-06 | 0 (Deployed) | Completed |
| ADM-07 | 0 (Deployed) | Completed |
| PRF-01 | 2 (Pending) | Pending |
| PRF-02 | 2 (Pending) | Pending |
| PRF-03 | 2 (Pending) | Pending |
| PRF-04 | 2 (Pending) | Pending |
| PRF-05 | 2 (Pending) | Pending |
| PRF-06 | 2 (Pending) | Pending |
| PRF-07 | 2 (Pending) | Pending |
| PRF-08 | 2 (Pending) | Pending |
| PRF-09 | 2 (Pending) | Pending |
| PRF-10 | 2 (Pending) | Pending |
| PRF-11 | 2 (Pending) | Pending |
| SYS-01 | 1 (Pending) | Pending |
| SYS-02 | 4 (Pending) | Pending |
| SYS-03 | 4 (Pending) | Pending |
| SYS-04 | 3 (Pending) | Pending |
| SYS-05 | 4 (Pending) | Pending |
| SYS-06 | 4 (Pending) | Pending |

**Coverage:**
- v1 requirements: 30 total
- Mapped to phases: 30 (100%)
- Unmapped: 0

**Deployed Baseline:** The REP and ADM requirements (13 items) are already implemented and deployed from the recent rebuild (Phases 1-3 complete, PR #84, #86, #87). This roadmap completes the remaining 17 v1 requirements.

---

## Phase Dependencies & Ordering

```
Phase 1 (CSP Fix)
   └─> Phase 2 (Profile Features) — no direct dependency but CSP fix unblocks photo-related profile features (avatar upload)
           └─> Phase 3 (Dead Code Removal) — requires stable feature set
                   └─> Phase 4 (Performance) — optimization pass on final codebase
```

**Note:** Phases 1 and 2 could theoretically run in parallel for non-photo profile features, but Phase 1 is tiny (configuration change) and should be completed first to unblock the entire reporting flow.

---

## Risks & Mitigations

| Risk | Phase | Impact | Mitigation |
|------|-------|--------|------------|
| CSP fix more complex than expected | 1 | High | Allow extra research time; consult CSP reference docs; test in staging |
| Dead code removal breaks hidden features | 3 | High | Conservative audit; batch removals; test suite gate; keep backups |
| Profile features more complex than assumed | 2 | Medium | Implement incrementally one route at a time; use existing patterns |
| Performance targets already met | 4 | Low | Verification phase may result in no changes; still document baseline |

---

*Roadmap approved for execution.*
*Next: Execute Phase 1 (CSP Fix).*
