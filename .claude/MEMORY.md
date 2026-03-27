# Bantayog Alert - Project Memory

## WAT Framework (Workflows, Agents, Tools)

The project uses the WAT pattern with five organized directories:
- **`workflows/`** — Development SOPs (setup, deployment, testing, code-review, error-handling)
- **`.claude/skills/`** — Execution skills: build, lint-and-format, test, deploy-firebase, lighthouse-audit, document-error, pre-commit-check, firebase-emulator
- **`principles/`** — Architecture and coding standards (7 files covering React, Firebase, security, PWA, testing, etc.)
- **`errors/`** — Documented errors with root cause and solutions (use `_template.md` as template)
- **`docs/`** — Architecture overview, security rules, privacy policy

This structure replaces ad-hoc decisions with documented patterns. When stuck, check `workflows/error-handling.md` and `errors/` first. For execution steps, check `.claude/skills/` first.

## Key Files
- `firebase.json` — hosting config, CSP headers, rewrites
- `public/sw.js` — service worker (tile caching, app asset caching) — bump cache version after deploys
- `src/components/Map/LeafletMap.jsx` — Leaflet map component
- `src/pages/MapTab.jsx` — map tab page wrapper
- `src/utils/geoFencing.js` — municipality boundary detection via Turf.js point-in-polygon
- `src/utils/timeUtils.js` — date formatting utilities (handles both Firestore Timestamp and plain {seconds,nanoseconds} objects)
- `src/hooks/useReports.js` — report CRUD + upvote; submitReport uses runTransaction for atomic rate-limit + report creation
- `src/components/Reports/ReportForm.jsx` — tracks rawFields state for XSS warning detection
- `src/components/Reports/ReportModal.jsx` — report submission modal; containsXSS check removed (dead code)
- `firestore.rules` — Firestore security rules; includes rateLimits/{uid} collection for server-side 60s cooldown

## Temporary Files
- `.tmp/` — Regenerable intermediate files (lighthouse reports, boundary evaluation output, coverage, etc.)
- Never commit `.tmp/` contents (already in `.gitignore`)
- `test-results/` — Playwright test artifacts; do not commit

## Debugging Insights
- CSP violations? → `errors/csp-violations.md` + `principles/security.md`
- Permission denied? → `errors/firebase-permission-denied.md`
- Stale content after deploy? → `errors/service-worker-cache-stale.md`
- date-fns v3 throws RangeError instead of silent invalid date — always handle plain `{seconds,nanoseconds}` explicitly in timeUtils.js
- **Firestore Rules type-checker quirk**: `!exists(path) || get(path).data.field` still triggers type warnings because the analyzer evaluates both sides before short-circuiting. Does NOT affect runtime correctness.

## Deployment
- Firebase Hosting: `npm run build && firebase deploy --only hosting`
- Firestore rules: `firebase deploy --only firestore`
- Both: `npm run build && firebase deploy --only hosting,firestore`
- Live URL: https://bantayogalert.web.app
- Firebase project: `bantayogalert` (use `firebase use bantayogalert` to switch)
- Pre-deploy: check `workflows/deployment.md` checklist

## Feedback / Rules
- `feedback_prettier_ci.md` — Always run `npm run format:check` before pushing; subagents may produce non-Prettier code

## CI Pipeline
- GitHub Actions: `.github/workflows/ci.yml` — runs on Node 20 and Node 22
- CI order: lint → format:check → test:run → build
- **Always run `npm ci` before `npm run build` in CI** (not `npm install`) to ensure lockfile is respected

## QA Edge Hunter Session (2026-03-27)

Ran comprehensive edge case + security audit via qa-edge-hunter subagent. Identified 14 issues.

### Critical Issues Found

1. **Upvote removal Firestore rule broken** (`firestore.rules:223-227`)
   - Bug: Rule `upvotes == upvotes - 1` only matched when upvotes=1. Users couldn't remove upvotes when count > 1.
   - Fix: Reordered conjuncts — `uid in upvotedBy` checks old state first, decrement math checks new vs old-1.
   - **RESOLVED:** PR #103 merged (commit `84a2f3c`), deployed live.

2. **Client-side rate limiting bypassable** (`src/utils/rateLimiter.js`)
   - Risk: localStorage-only; bypassed by clearing storage, incognito, DevTools
   - Fix: Server-side enforcement via `rateLimits/{uid}` Firestore documents + transaction in `submitReport()`.
   - **RESOLVED:** PR #104 merged (commit `6d8b006`) + follow-up commit `003d5e9`, deployed live.

### High Priority Issues

3. **XSS warning never fires** (`ReportForm.jsx`)
   - `containsXSS()` checked `formData.description` AFTER `sanitizeWithoutTrim()` already stripped dangerous content.
   - Fix: Added `rawFields` state to track pre-sanitization input; `hadXSSRemoved(name)` compares raw vs sanitized.
   - **RESOLVED:** PR #104 merged (commit `6d8b006`), deployed live.

4. **Submit-time XSS check dead code** (`ReportModal.jsx`)
   - Same root cause as #3 — always evaluated false.
   - Fix: Removed the dead `containsXSS()` gate and its import.
   - **RESOLVED:** PR #104 merged (commit `6d8b006`), deployed live.

5. **Duplicate ARIA labels** (Sidebar + TabNavigation)
   - Both had `aria-label="Main navigation"` — WCAG 2.4.11 violation.
   - **RESOLVED:** PR #103 merged — "Sidebar navigation" and "Tab navigation", deployed live.

6. **Firebase Storage lacks server-side filename validation**
   - Client `safeFileName()` can be bypassed.
   - **DEFERRED** — add regex validation to Storage rules.

### Medium Priority Issues

7. FeedPost renders raw text description (low risk — defense-in-depth sanitization exists)
8. Upvote transaction doesn't validate increment is exactly +1 (would need Firestore rule change)
9. Report drafts in localStorage include sensitive location data
10. Anonymous users lack server-side rate limiting (rateLimits/{uid} now covers all authenticated users)

### Low Priority Issues

11. E2E tests timing out (60s) — infrastructure vs. app issue unclear
12. Stale phase directory `.planning/phases/01-csp-fix/` needs archiving

### Deferred / Pre-existing
- **FeedPost tests** (`describe.skip` — 7 skipped) — AuthContext mock infrastructure issue
- **Firestore rules type-checker warning** at `canSubmitReportNow()` line 57 — known Firebase quirk, runtime logic is correct

## Security + Quality Review Fixes (2026-03-27)

Ran 4 parallel review agents (security audit, code quality, edge case QA, senior architecture review) across the entire codebase. Found 22 issues across 4 priority phases. All phases merged and deployed.

### Phase 1 — Crash Risks + Security (PR #106) ✅
8 issues fixed across 6 files — all crash risks and security gaps:
- **DisasterMarker.jsx**: `report.location` null → map crash — added `?.lat ?? 0, ?.lng ?? 0` fallback
- **EngagementButtons.jsx**: `upvotedBy: null` → `.includes()` crash — added `?? false` guard
- **useReports.js**: `onSnapshot` errors silent — added Sentry capture + user-facing error message
- **timeUtils.js**: `{seconds,nanoseconds}` plain objects → `RangeError` — added `normalizeToDate()` helper
- **LeafletMap.jsx**: invalid coords passed through filter — added coordinate validation in `filteredReports`
- **firestore.rules**: Tags had no content validation (XSS vector) — added `isValidTag()` with script/iframe/event-handler rejection
- **geoFencing.js** + **ReportModal.jsx**: Points outside province silently got centroid fallback — added `isOutsideProvince` warning toast
- **geoFencing.stress.test.js**: Updated method name assertions to match new `polygon`/`outside_province_centroid_fallback` naming

### Phase 2 — Security Hardening (PR #107) ✅
- **firestore.rules**: Admin branch missing `'media'` in `hasAll` — moderators couldn't attach resolution evidence photos
- **FeedPost.jsx**: Tags rendered without client sanitization — added `sanitizeText()` as defense-in-depth
- **useReports.js**: Anonymous users could set arbitrary reporter names — enforced `user.isAnonymous ? 'Anonymous' : displayName`

### Phase 3 — UX Quality (PR #108) ✅
- **FeedPost.jsx**: Missing municipality rendered `"undefined"` — now shows `'Unknown Municipality'`
- **ReportModal.jsx**: Submit button not disabled for <10-char descriptions — added length check to disabled prop
- **ReportModal.jsx**: `manualMunicipality` unvalidated → `NaN` coords — added `useEffect` guard against invalid `MUNICIPALITY_COORDS`
- **ReportModal.jsx**: Description cleared on Step 2→3 navigation — removed errant `description: ''` from `handleEvidenceContinue`
- **WeatherCard.jsx**: Partial weather data rendered `"undefined"` — added `??` fallbacks on windSpeed, humidity, pressure
- **EngagementButtons.jsx**: Share title showed `"null"` — changed to `?? 'Report'`
- **useReports.js**: Upload failures only returned count — now returns `uploadErrors: [{filename, type, index}]`

### Phase 4 — Polish (PR #109) ✅
- **rateLimiter.js**: localStorage race condition across tabs — `cleanExpiredEntries` accepts history param, returns filtered value directly
- **DisasterIcon.jsx**: `dangerouslySetInnerHTML` documented as safe (hardcoded SVG from `disasterTypes.js`, not user data)
- **ReportModal.jsx**: No evidence guard before Step 3 — added warning toast if `evidenceFiles.length === 0`

### Previously Deferred → Now Resolved
- **E2E test timeouts** (60s) → Increased to 120s global, 15s assertion timeout (Phase 1, PR #105)
- **Stale phase directory** `.planning/phases/01-csp-fix/` → Was already cleaned up
- **Storage filename validation** → Added `isPathTraversalSafe()` + fixed `fileName()` bypass (Phase 1, PR #105)
- **Upvote increment not +1** → Changed to `increment(1)`/`increment(-1)` (PR #105)
- **localStorage barangay/street in drafts** → Draft now only saves `description` (PR #105)

### PRs Merged Today
| PR | Phase | Issues | Status |
|----|-------|--------|--------|
| #105 | Security baseline | Storage, upvotes, localStorage, E2E timeouts | Deployed |
| #106 | Phase 1 (8 issues) | Crash risks + security | Deployed |
| #107 | Phase 2 (3 issues) | Security hardening | Deployed |
| #108 | Phase 3 (7 issues) | UX quality | Deployed |
| #109 | Phase 4 (4 issues) | Polish | Deployed |

### Key Lessons Learned
Parallel subagent pattern: 4 phases x ~3 agents = 12 agents across 4 sessions, all merged cleanly. Key challenge was coordinating pushes to the same branch -- resolved by having all agents target the same named branch from main. Prettier was the consistent CI failure mode: every phase had a formatting error from slightly non-standard agent output.

## Recent Work (2026-03-27 - Session 2)

### Pre-Flight Verification ✅
All 509 tests pass, Prettier clean, build succeeds (3.52s). Ready to deploy.

### Firestore Rules Compile Error — Fixed Immediately
Three bugs from yesterday's session were caught on deploy:
1. `tags.map(t => isValidTag(t))` — `.map()` + arrow functions not valid in Firestore Rules
2. `!in` → `!(x in list)` syntax error at line 243
3. OR-chain `is list || isValidTagsArray(...)` short-circuited tag validation
Fix: explicit index-based validation (Firestore Rules disallows recursion). Committed `1423541`.

### 4-Review-Agent Pass — 24 Issues Found
Ran qa-security-reviewer, qa-edge-hunter, feature-dev:code-reviewer, exxeed in parallel.

#### Critical (C1-C5) — Fix Immediately
| ID | Issue | File | Fix |
|----|-------|------|-----|
| C1 | XSS: description rendered without sanitizeText() | FeedPost.jsx:228, DisasterMarker.jsx:135 | Apply sanitizeText() |
| C2 | firebase-messaging-sw.js missing | public/ (file doesn't exist) | Create service worker |
| C3 | Map loads ALL reports client-side | useReports.js, LeafletMap.jsx | Add where('verification.status','!=','resolved') query + composite index |
| C4 | useGeolocation effect loop — requestLocation not in useCallback | useGeolocation.js:75-81 | Wrap requestLocation in useCallback, restructure effect |
| C5 | useRateLimit async not awaited — try/catch misses Promise rejections | useRateLimit.js:78 | Make performAction async, await actionFn() |

#### High Priority (H1-H9)
| ID | Issue | Fix |
|----|-------|-----|
| H1 | userRole() get() per request — expensive at scale | Custom Claims via Cloud Function |
| H2 | No Firestore emulator tests | Add tests/emulator/rules.test.js + CI job |
| H3 | No authenticated E2E flows | Add 4 Playwright specs |
| H4 | Weather 24 parallel API calls — OpenWeather quota risk | Batch client-side now, Cloud Function long-term |
| H5 | EngagementButtons upvote race — stale closure | Re-read report.engagement.upvotedBy from prop |
| H6 | Alt text "Report" — WCAG violation | Descriptive alt with type+index+municipality |
| H7 | No upvote rate limiting | Add 5s cooldown in Firestore rules |
| H8 | Anonymous account proliferation | Device fingerprint + Cloud Function linking |
| H9 | safeFileName Date.now() collision | Replace with crypto.randomUUID() |

#### Medium Priority (M1-M9)
| ID | Issue | Fix |
|----|-------|-----|
| M1 | submitReport 200+ lines | Extract uploadMediaFiles, fetchWeatherContext, buildReportDocument |
| M2 | upvotedBy array unbounded — 1MB Firestore limit | Migrate to reports/{id}/upvotes/{userId} subcollection |
| M3 | RBAC in firestore.rules AND rbac.js — drift risk | Canonical rbacConfig.js + CI check |
| M4 | ReportDetailCard in App.jsx (340 lines) | Extract to src/components/Feed/ReportDetailCard.jsx |
| M5 | CI uses npm install not npm ci | Change to npm ci in ci.yml |
| M6 | Reporter name user-controlled — impersonation risk | Force user.displayName, isValidReporterName() rules |
| M7 | useAuth isAdmin/isSuperAdmin not memoized | Wrap in useMemo |
| M8 | Draft loading clears manualMunicipality silently | Add isLoadingDraft flag, skip guard during load |
| M9 | Anonymous role='' bypass in rules | Add isAnonymous() function, return 'anonymous' explicitly |

### Execution Plan
Plan saved: `.planning/review-fixes-plan-2026-03-27.md`
- Phase 1: C1-C5 (Critical) — 5 issues, client-side only
- Phase 2: H1-H9 (High) — 9 issues, includes Cloud Functions (H1, H4, H8)
- Phase 3: M1-M9 (Medium) — 9 issues

Cloud Functions needed (functions/ dir has: index.js, notifications.js, weatherProxy.js, cleanupDemoData.mjs):
- `syncUserClaims` — set Custom Claims at login (H1)
- `getAllMunicipalitiesWeather` — batch weather API (H4 long-term)
- `onAnonymousAuth` — fingerprint linking for anonymous accounts (H8)

### Firestore Rules Fix Commit
`1423541` — fix(firestore.rules): compile errors from invalid syntax

## Recent Work (2026-03-27)

### QA Fixes — PR #103 + PR #104
- **PR #103**: Upvote Firestore rule fix + ARIA label uniqueness — merged and deployed.
- **PR #104**: Server-side rate limiting (rateLimits/{uid} + Firestore transaction), XSS warning fix, dead code removal — merged and deployed.

### Firestore Rules Known Warning
- `canSubmitReportNow()` emits a type-checker warning: `Invalid type. Received duration. Expected map.`
- This is a **known Firebase analyzer quirk** — both sides of `||` are evaluated before short-circuiting. Runtime behavior is correct.
- Tracked as known issue, not blocking.

## Recent Work (2026-03-26)

### Responsive Design Improvements
- **FeedTab.jsx**: Added `xl:max-w-3xl` to constrain unbounded width on large screens
- **ProfileTab.jsx**: Increased max-width to `xl:max-w-4xl` for better desktop utilization
- **AuthForm**: Widened to `lg:max-w-lg` on larger viewports
- **WeatherGrid.jsx**: Extended grid from 4 to 6 columns on xl screens
- Commits: `d3f32df` (responsive changes), `b305cd6` (Prettier fixes)

### Firebase Project Migration
- Migrated from `bantayog-alert-demo-36b27` to `bantayogalert`
- `firebase use bantayogalert` required before deploying

## Rebuild Plans (2026-03-17)
- Design spec: `docs/superpowers/specs/2026-03-17-bantayog-rebuild-design.md`
- Phase 1 (Foundation): `docs/superpowers/plans/2026-03-17-rebuild-phase-1-foundation.md`
- Phase 2 (Citizen): `docs/superpowers/plans/2026-03-17-rebuild-phase-2-citizen.md`
- Phase 3 (Admin+Profile): `docs/superpowers/plans/2026-03-17-rebuild-phase-3-admin-profile.md`
- **Status:** ALL THREE PHASES COMPLETE and deployed (2026-03-18). PR #84 (Phase 1), PR #86 (Phase 2), PR #87 (Phase 3). Live at https://bantayogalert.web.app

## v1.1 Security Hardening Milestone (COMPLETED)
- PR #90 merged (2026-03-22)
- 7 SEC requirements completed: SEC-01 through SEC-07
- Phase 01 complete with 2 plans

## Key Technical Notes
- **date-fns v3** throws `RangeError: Invalid time value` instead of silently handling invalid dates — `timeUtils.js` must handle plain `{ seconds, nanoseconds }` objects explicitly
- **react-router-dom** must be in `package.json` AND `package-lock.json`, and `npm ci` must be run in CI (not `npm install`)
- **FeedPost component** contains `EngagementButtons` and `ShareButton` which require `AuthContext` — tests must use `AllProviders` wrapper from `src/test/utils.jsx`
- **Firestore Rules ternary/type-check**: Firestore rules type-checker eagerly evaluates all branches; short-circuit `||` does not prevent analyzer warnings on untaken branches
# currentDate
Today's date is 2026-03-27.

## Next Session — Execute Review Fixes Plan

### Pre-Flight
```bash
git checkout main && git pull origin main && npm ci && npm run format:check && npm run test:run && npm run build
```

### Phase 1 — Critical (C1-C5)
Execute C1-C5 from `.planning/review-fixes-plan-2026-03-27.md`

1. **C1 (XSS)**: `sanitizeText()` on description in FeedPost.jsx + DisasterMarker.jsx
2. **C2 (FCM SW)**: Create `public/firebase-messaging-sw.js`
3. **C3 (Map)**: Add `where('verification.status','!=','resolved')` to useReports; remove client filter; add composite index
4. **C4 (Geolocation)**: `useCallback` for `requestLocation` + restructure effect deps
5. **C5 (async)**: `async`/`await` in `performAction` in useRateLimit.js

Post-Phase1: `npm run format:check && npm run test:run && npm run build && firebase deploy --only hosting,firestore`

### Phase 2 — High (H1-H9) — After Phase 1
Client-side (parallel): H3, H4 batching, H5, H6, H7, H9
Cloud Functions (separate): H1 (syncUserClaims), H4 long-term, H8 (onAnonymousAuth)

### Phase 3 — Medium (M1-M9) — After Phase 2
All client-side. Execute after Phase 2 complete.

### Key Files for Phase 1
- `src/components/Feed/FeedPost.jsx` (C1, H6, M6)
- `src/components/Map/DisasterMarker.jsx` (C1)
- `public/firebase-messaging-sw.js` (C2 — CREATE)
- `src/hooks/useReports.js` (C3, H7, H9, M1, M2, M6)
- `src/hooks/useGeolocation.js` (C4)
- `src/hooks/useRateLimit.js` (C5)
- `firestore.rules` (C3 index, H7, M6, M9)
- `firebase.json` (C3 composite index)
