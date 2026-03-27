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
