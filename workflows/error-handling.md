# Workflow: Error Handling

## Objective

Identify, reproduce, diagnose, fix, and document errors systematically. Don't patch symptoms — fix root causes.

## The Error Handling Loop

```
1. Identify   → error appears (Sentry alert, user report, local testing)
2. Reproduce  → confirm the error is reproducible
3. Diagnose   → find root cause (check error docs first)
4. Fix        → implement fix, verify locally
5. Test       → confirm fix with tests
6. Document   → add/update error doc if it's a recurring pattern
7. Deploy     → ship the fix
```

## Step 1: Identify

**Sources:**
- **Sentry** (`VITE_SENTRY_DSN`) — production error tracking with stack traces and context
- **Browser console** — CSP violations, Firebase errors, JS errors
- **User reports** — GitHub Issues, support channels
- **CI failure** — test or build failures in GitHub Actions

## Step 2: Reproduce

- Reproduce locally first using `npm run dev`
- If environment-specific (prod only), check Sentry breadcrumbs and user context
- For Firebase permission errors, test against Firebase Emulator

## Step 3: Diagnose

**Check the error docs first** — common errors are already documented in `errors/`:

| Error Pattern | Doc |
|---|---|
| `FirebaseError: Missing or insufficient permissions` | `errors/firebase-permission-denied.md` |
| CSP blocked (console warning) | `errors/csp-violations.md` |
| App shows old content after deploy | `errors/service-worker-cache-stale.md` |

If not documented, check:
- Sentry stack trace for the line of code
- Browser DevTools → Console, Network, Application tabs
- Firebase Console → Firestore → Usage, Rules Playground
- GitHub Actions logs for CI failures

## Step 4: Fix

Make the minimal targeted fix. Don't refactor surrounding code unless it's the root cause. Confirm the fix resolves the reproduction case locally.

If the fix involves Firebase security rules, test against the emulator before deploying.

## Step 5: Test

- Add a test that covers the bug scenario (regression test)
- Run `npm run test:run` — all tests pass
- For security rule changes: run `firebase emulators:exec --only firestore "npm run test:run"`

## Step 6: Document

If the error is likely to recur (Firebase permission patterns, CSP, SW cache), add or update the relevant file in `errors/`. Use `errors/_template.md` as the starting point.

## Step 7: Deploy

Follow `workflows/deployment.md`. For production bugs:
- Hotfix branch: `fix/<description>` off `main`
- PR → CI → review → merge → auto-deploy

## Error Categories

| Category | First Responder | Tools |
|---|---|---|
| Firebase Auth/Firestore | Dev with Firebase access | Firebase Console, Emulator, Sentry |
| CSP / security headers | Dev | Browser console, `firebase.json` |
| Service worker / caching | Dev | Chrome DevTools → Application tab |
| Map rendering (Leaflet) | Dev | Browser console, Leaflet debug mode |
| Build failures | Dev | GitHub Actions logs, local `npm run build` |
| Dependency vulnerabilities | Dev | `npm audit`, Dependabot PR |

## Escalation

- **Critical bugs** (data loss, auth bypass, app down): immediately patch + deploy hotfix, notify users
- **Security vulnerabilities**: follow `SECURITY.md` responsible disclosure process
- **Production outage**: check Firebase Status page first (https://status.firebase.google.com/)

## Sentry Configuration

**File:** `src/config/sentry.js`

Sentry is initialized in `src/main.jsx` and wraps the React tree with an error boundary. It captures:
- Unhandled JS exceptions
- React rendering errors (via ErrorBoundary integration)
- Performance transactions

Sentry is disabled when `VITE_SENTRY_DSN` is empty (local development).
