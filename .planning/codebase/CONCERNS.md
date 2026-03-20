# Concerns

## Technical Debt

### 1. Admin Routing is Non-Functional

**Location**: `src/App.jsx` comment at lines 19-22, `src/components/Admin/AdminShell.jsx`

**Issue**: The admin tab navigation (activeTab/onTabChange props) works under the old router but is non-functional under React Router v6 nested routes. AdminShell always renders AdminDashboard regardless of intended tab routing.

**Impact**: Admin UI works but disables planned multi-tab admin interface. New admin features (e.g., analytics, user management) cannot be added until routing is fixed.

**Mitigation**: Documented in `App.jsx` with clear intent to rebuild in Phase 3.

**Priority**: HIGH — Blocks Phase 3 admin features.

### 2. TypeScript Coverage is Partial

**Issue**: Codebase uses `.jsx` and `.js` extensions with no JSDoc contracts. TypeScript (`tsconfig.json`) provides some checks but not full type safety.

**Impact**:
- Runtime errors that TypeScript could catch
- harder to refactor safely
- IDE autocomplete less accurate

**Files affected**: Majority of src/ except some `.ts` config files

**Recommendation**:
- Migrate to `.tsx`/`.ts` extensions incrementally
- Add JSDoc for complex functions as interim step
- Use `allowJs: false` after migration complete

**Priority**: MEDIUM — Long-term maintainability improvement.

### 3. No Real-Time Updates for Citizens

**Location**: `src/contexts/ReportsContext.jsx`, citizen-facing pages

**Issue**: Reports are fetched once on mount in FeedTab. Citizens don't see new reports appear in real-time while viewing the feed. Only when they navigate away and back (or refresh) do new reports appear.

**Impact**: Degraded user experience; citizens must manually refresh to see latest reports.

**Root cause**: `useEffect` dependency array doesn't include listener setup for real-time updates in FeedTab. `getReports` is a one-time fetch, not a subscription.

**Recommendation**:
- Add Firestore `onSnapshot` listener in `ReportsContext` or `FeedTab` for real-time updates
- Consider using `useReports` hook's subscription if available
- Debounce updates to avoid excessive re-renders

**Priority**: MEDIUM — Important for citizen engagement.

### 4. Image Compression Quality May Be Too Low

**Location**: `src/utils/imageCompression.js` (referenced but not explicitly shown), `src/components/Reports/PhotoStep.jsx`

**Issue**: Images compressed to max 1MB and 1920px. On slow connections, 1MB images still load slowly. No progressive loading or adaptive quality based on connection speed.

**Impact**: Poor UX on mobile/slow networks, high data usage.

**Recommendation**:
- Implement adaptive compression (lower quality for slower networks via `navigator.connection`)
- Add image lazy loading (Intersection Observer)
- Consider WebP format support with fallback to JPEG

**Priority**: LOW — Nice to have, but not blocking.

### 5. E2E Test Flakiness

**Location**: `e2e/` directory, Playwright tests

**Issue**: Tests occasionally fail due to network timing issues, especially around Firebase authentication and Firestore writes.

**Impact**: CI unreliable; flaky tests erode confidence in test suite.

**Root causes likely**:
- Race conditions: Tests don't wait for Firestore writes to propagate
- Hardcoded `waitForTimeout` instead of condition-based waiting
- Test data not properly isolated (tests interfering with each other)

**Recommendation**:
- Replace `page.waitForTimeout()` with `await expect(locator).toBeVisible()`
- Use unique test data (UUIDs) per test run
- Add `test.beforeEach` to clean up test data
- Enable Playwright tracing (`--trace=on-first-retry`) to debug failures

**Priority**: HIGH — CI reliability important.

## Security Concerns

### 1. Client-Side Rate Limiting Can Be Bypassed

**Location**: `src/utils/rateLimiter.js`, used in report submission

**Issue**: Rate limiting implemented purely on client-side. Malicious user can bypass by modifying JavaScript or sending direct API calls.

**Impact**: Spam/DoS attacks possible if user tampers with client code.

**Mitigation**: Should implement server-side rate limiting as well. Since using Firebase BaaS, consider:
- Cloud Functions rate limiting per user/IP
- Firestore rules with per-document limits (complex)
- Firebase App Check to ensure requests come from the app

**Current status**: Acknowledged limitation. Acceptable for MVP with monitoring.

**Priority**: MEDIUM — Trade-off between complexity and security.

### 2. Content Security Policy (CSP) May Be Too Permissive

**Location**: `firebase.json` line 42-43

**Issue**: CSP allows many external domains (`*.firebaseapp.com`, `*.googleapis.com`, `*.firebasestorage.app`, `*.cloudfunctions.net`, `api.openweathermap.org`, `*.ingest.sentry.io`). Some wildcards increase attack surface.

**Impact**: Potential for data exfiltration via malicious subdomain if any whitelisted domain is compromised.

**Recommendation**:
- Replace wildcards with explicit domains
- Review all `connect-src` and `img-src` sources — remove unused
- Consider nonce-based script-src for inline scripts (if any)

**Priority**: LOW-MEDIUM — Acceptable for current threat model but should tighten before public launch.

### 3. Input Sanitization Coverage Unknown

**Location**: `src/utils/sanitization.js`, `src/components/Common/SanitizedHTML.jsx`

**Issue**: Not clear which components use sanitization. DOMPurify configured but may be inconsistently applied.

**Impact**: XSS vulnerabilities if user-generated content rendered without sanitization.

**Recommendation**:
- Audit all places where user input is rendered as HTML
- Enforce usage of `SanitizedHTML` component for any HTML rendering
- Add ESLint rule to flag `dangerouslySetInnerHTML` usage
- Consider Content Security Policy `script-src 'self'` (already present) as defense-in-depth

**Priority**: MEDIUM — Needs verification.

### 4. Firestore Rules Complexity

**Location**: `firestore.rules` (200+ lines)

**Issue**: Complex security rules with multiple helper functions. Hard to audit manually. Potential for logic gaps.

**Current rules**: Cover role-based access, input validation, geographic constraints.

**Recommendation**:
- Add unit tests for Firestore rules using `@firebase/rules-unit-testing`
- Document rule logic inline with comments explaining each match block
- Regular security audits (quarterly)

**Priority**: MEDIUM — Rules appear thorough but need test coverage.

## Performance Considerations

### 1. Map Marker Performance at Scale

**Issue**: Current implementation uses marker clustering, but with 1000+ markers on screen at once (e.g., province-wide view), performance may degrade.

**Impact**: Janky map interactions, high CPU usage on mobile.

**Current mitigation**: `react-leaflet-markercluster` groups markers automatically based on zoom.

**Recommendation**:
- Test with 5000+ markers to find breaking point
- Consider canvas-based renderer (Leaflet Canvas) if SVG becomes slow
- Implement server-side tile-based marker rendering if needed

**Priority**: LOW — Performance acceptable at expected scale (few hundred active reports).

### 2. Firestore Query Performance

**Issue**: Some queries may lack composite indexes, causing full collection scans.

**Current state**: `firestore.indexes.json` defined but may not cover all query patterns.

**Recommendation**:
- Monitor Firebase console for slow queries
- Add indexes proactively for common query patterns (municipality + status, date ranges)
- Use `explain()` in Firestore emulator to verify index usage

**Priority**: LOW — Performance acceptable for now, monitor in production.

### 3. Bundle Size

**Issue**: Manual chunking configured but bundle may still be large for initial load.

**Current config**: Chunks for vendors (react, firebase, map, turf, etc.)

**Recommendation**:
- Measure with `vite build --report` or source map explorer
- Consider further code splitting if initial load >200KB gzipped
- Lazy load more aggressively (e.g., `useWeather` only on Weather tab)

**Priority**: LOW — Check actual bundle size metrics.

## Operational Concerns

### 1. Monitoring & Alerting

**Current setup**: Sentry for error tracking and performance monitoring.

**Gaps**:
- No uptime monitoring (is app accessible?)
- No performance budgets (LCP, CLS, INP tracking)
- No log aggregation (Firebase functions logs not centralized)

**Recommendation**:
- Add uptime monitoring (UptimeRobot, Pingdom)
- Set up Google Analytics 4 or similar for Core Web Vitals
- Firebase console alerts for error rate, quota limits

**Priority**: MEDIUM — Important for production reliability.

### 2. Backup & Disaster Recovery

**Current state**: Firestore automatic backups (Firebase feature) but unknown retention/restore process.

**Gaps**:
- No documented restore procedure
- No backup verification (test restore quarterly)
- No RPO/RTO defined

**Recommendation**:
- Document Firestore backup/restore process
- Schedule quarterly restore tests to staging
- Consider export to Cloud Storage with retention policy

**Priority**: MEDIUM — Data loss risk if not tested.

### 3. Dependency Updates

**Issue**: Dependencies pinned to exact versions in `package-lock.json`. No automated security updates.

**Risk**: Vulnerable dependencies if not manually updated.

**Recommendation**:
- Enable Dependabot or Renovate for automated PRs
- Subscribe to `npm audit` alerts
- Schedule monthly dependency review

**Priority**: LOW-MEDIUM — Standard maintenance.

## Code Quality

### 1. Incomplete Test Coverage

**Location**: `coverage/` reports (if available)

**Known gaps**:
- `src/hooks/useAuth.js` — Complex async logic, partial coverage
- `src/hooks/useReports.js` — Subscription management, edge cases
- `src/utils/firebaseConfig.js` — Lazy loading logic
- `src/components/Admin/` — Admin components have tests but coverage incomplete

**Recommendation**:
- Set coverage target (80%+)
- Prioritize tests for critical paths (auth, report submission)
- Use `npm run test:coverage` to track progress

**Priority**: MEDIUM — Good but not great coverage.

### 2. Inconsistent Async Error Handling

Some hooks catch errors and report to Sentry; others don't.

**Example**: `useWeather` has try/catch; `useAuth` has partial catch.

**Recommendation**:
- Standardize error handling pattern across hooks
- Document expected error handling in `principles/error-handling.md`
- Consider higher-order error wrapper for all hooks

**Priority**: LOW — Functional but inconsistent.

### 3. Magic Numbers and Strings

Hardcoded values scattered throughout:

- `MAX_PHOTOS = 5` (good) but inline `5` in rate limiter
- Municipality names as strings in arrays (should be enum-like constant)
- Disaster type strings repeated

**Recommendation**: Consolidate in `src/utils/constants.js` (already partially done).

**Priority**: LOW — Minor refactor.

## Legal & Compliance

### 1. Privacy Policy

**File**: `PRIVACY.md` exists but may need review.

**Considerations**:
- Data retention policy (how long reports stored?)
- User rights (delete account, delete reports)
- GDPR/Philippine Data Privacy Act compliance

**Action**: Legal review recommended before public launch.

**Priority**: MEDIUM — Compliance requirement.

### 2. Terms of Service

**Status**: Not present.

**Recommendation**: Create TOS covering:
- Acceptable use (no false reports)
- Data ownership
- Disclaimer of liability

**Priority**: MEDIUM — Legal protection.

## Infrastructure

### 1. Firebase Project Structure

**Question**: Are dev/staging/production Firebase projects properly isolated? Check `.firebaserc`.

**Recommendation**: Ensure separate projects for each environment with appropriate security rules.

**Priority**: LOW — Verify existing setup.

### 2. CI/CD Security

**Concern**: GitHub Actions workflows may contain Firebase tokens.

**Check**: Ensure Firebase deployment tokens stored as GitHub Secrets, not in repo.

**Priority**: HIGH — Prevent credential leaks.

## Maintenance

### 1. Service Worker Updates

**Location**: `public/sw.js`

**Issue**: Service worker cache version needs manual bump after deploys. Stale content risk if forgotten.

**Current process**: Manual step in `workflows/deployment.md` (check).

**Recommendation**: Automate cache version in build script (e.g., inject timestamp or git SHA).

**Priority**: LOW-MEDIUM — Manual process error-prone.

### 2. Firebase Indexes

**Location**: `firestore.indexes.json`

**Issue**: Indexes must be deployed with `firebase deploy --only firestore:indexes`. May drift from code queries.

**Recommendation**: Include index deployment in CI/CD pipeline or deployment checklist.

**Priority**: LOW — Only matters when queries change.

## Summary of Priorities

| Concern | Priority | Effort |
|---------|----------|--------|
| Admin routing fix | HIGH | Medium |
| E2E test flakiness | HIGH | Medium |
| CI/CD security | HIGH | Low |
| Real-time feed updates | MEDIUM | Medium |
| Partial TypeScript | MEDIUM | High |
| Rate limiting server-side | MEDIUM | High |
| Input sanitization audit | MEDIUM | Low |
| Firestore rules test coverage | MEDIUM | Medium |
| Privacy policy review | MEDIUM | Low |
| Test coverage gaps | MEDIUM | Medium |

**Recommendation**: Address HIGH priorities first, then 2-3 MEDIUM items before v1.0 production launch.
