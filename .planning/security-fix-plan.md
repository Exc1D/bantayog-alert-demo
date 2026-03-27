# Bantayog Alert - Security & Quality Fix Plan

**Date:** 2026-03-27
**Status:** Draft
**Based on:** Security Audit, Code Quality Review, Edge Cases QA, Senior Architecture Review

---

## Executive Summary

This plan catalogs all issues identified across four review passes and organizes them into four implementation phases. The prioritization focuses on crash risks and security vulnerabilities first, followed by UX quality, then polish.

**Total Issues:** 22
- Phase 1 (Crash + Security): 8 issues
- Phase 2 (Security hardening): 3 issues
- Phase 3 (UX fixes): 7 issues
- Phase 4 (Polish): 4 issues

---

## Phase 1: Crash Risks First

These issues cause runtime crashes that render the app unusable. Fixing them is non-negotiable before any other work.

---

### 1.1 `DisasterMarker.jsx:114` -- `report.location` null check missing

**What:**
```jsx
// CURRENT (line 114)
position={[report.location.lat, report.location.lng]}
```

**How:**
Add optional chaining with a fallback. If `report.location` is null/undefined, the Marker should not render at all. The safest fix is to filter invalid reports upstream in `LeafletMap`'s `filteredReports` useMemo (see issue 1.6), but as a defensive fallback in `DisasterMarker` itself:

```jsx
// OPTION A: Defensive fallback in DisasterMarker
position={[
  report.location?.lat ?? 0,
  report.location?.lng ?? 0,
]}
```

**Why:** When Firestore returns a report document with a null or malformed `location` field, the entire map crashes. Users see a blank screen with no error message. This has been observed in edge cases where older documents have incomplete location data.

**Estimated scope:** 1 file (`DisasterMarker.jsx`), low regression risk (only affects malformed data that should not exist).

---

### 1.2 `EngagementButtons.jsx:16` -- `upvotedBy: null` crashes `includes()`

**What:**
```jsx
// CURRENT (line 16)
const hasUpvoted = report.engagement?.upvotedBy?.includes(user?.uid);
```

**How:**
```jsx
const hasUpvoted = report.engagement?.upvotedBy?.includes(user?.uid) ?? false;
```

**Why:** When `upvotedBy` is explicitly stored as `null` in Firestore (instead of an empty array `[]`), calling `.includes()` on it throws `TypeError: Cannot read property 'includes' of null`. This crashes the entire FeedPost component whenever a user views a report with null engagement data.

**Estimated scope:** 1 file (`EngagementButtons.jsx`), low regression risk. The nullish coalescing is a pure additive safety guard that does not change behavior for valid data.

---

### 1.3 `useReports.js:70` -- Silent `onSnapshot` errors (no Sentry, no retry, no user feedback)

**What:**
```jsx
// CURRENT (lines 70-73)
(err) => {
  setError(err.message);
  setLoading(false);
}
```

**How:**
```jsx
(err) => {
  console.error('[useReports] Firestore onSnapshot error:', err);
  captureException(err, { tags: { hook: 'useReports' }, context: { filters } });
  setError('Unable to load reports. Please check your connection and try again.');
  setLoading(false);
}
```

Also add a retry mechanism using a debounced re-subscription:

```jsx
const [retryCount, setRetryCount] = useState(0);

// Inside onSnapshot error handler:
setRetryCount((prev) => {
  if (prev < 2) {
    // Exponential backoff: 1s, 2s
    const delay = Math.pow(2, prev) * 1000;
    setTimeout(() => {
      setRetryCount(0); // resets to trigger re-subscription via useEffect dependency
    }, delay);
    return prev + 1;
  }
  return prev;
});
```

**Why:** When Firestore queries fail (network glitch, permission denied, index missing), the error is silently swallowed. The user sees a spinner forever with no indication of failure. No Sentry error is captured, making production debugging impossible. Operators have no visibility into these failures.

**Estimated scope:** 1 file (`useReports.js`), moderate complexity. The retry logic touches the useEffect dependency array, so careful testing of re-subscription behavior is required.

---

### 1.4 `timeUtils.js:3-40` -- Plain `{seconds, nanoseconds}` objects throw `RangeError`

**What:**
```js
// CURRENT (line 6)
const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
```

**How:**
```js
function normalizeToDate(timestamp) {
  if (!timestamp) return null;

  // Handle Firestore Timestamp (has .toDate method)
  if (typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }

  // Handle plain {seconds, nanoseconds} object (from Firestore snapshot serialization)
  if (
    timestamp &&
    typeof timestamp === 'object' &&
    'seconds' in timestamp &&
    'nanoseconds' in timestamp
  ) {
    return new Date(timestamp.seconds * 1000 + Math.floor(timestamp.nanoseconds / 1000000));
  }

  // Handle numeric timestamp or ISO string
  const parsed = new Date(timestamp);
  return isNaN(parsed.getTime()) ? null : parsed;
}

export function formatTimeAgo(timestamp) {
  const date = normalizeToDate(timestamp);
  if (!date) return '';
  return formatDistanceToNow(date, { addSuffix: true });
}
```

Apply the same `normalizeToDate` pattern to all four exported functions (`formatDate`, `formatShortDate`, `formatFullDate`).

**Why:** date-fns v3 throws `RangeError: Invalid time value` instead of silently handling invalid dates. Plain Firestore documents serialized over the network lose their class prototype and arrive as `{seconds: number, nanoseconds: number}` objects. The current `timestamp.toDate` check fails because these plain objects do not have a `.toDate()` method, falling through to `new Date(timestamp)` which gets an object instead of a number, producing `Invalid Date`.

**Estimated scope:** 1 file (`timeUtils.js`), low regression risk. This is a pure additive improvement that normalizes an edge case that already produces incorrect output.

---

### 1.5 `ReportModal.jsx:161-167` -- XSS check on original unsanitized values causes false positives

**What:**
```jsx
// CURRENT (lines 161-164)
if (!sanitizedDescription || sanitizedDescription.trim().length < 10) {
  addToast('What is happening? (at least 10 characters)', 'warning');
  return;
}
```

**How:**
The current code checks `!sanitizedDescription` which could be empty string after sanitization. The issue is that `sanitizeText` is called on the raw input and returns an empty string for inputs that are only XSS payloads (e.g., `<script>alert(1)</script>`). The real check should be:

```jsx
const rawDescription = formData.description;
const sanitizedDescription = sanitizeText(rawDescription);

// Validate on raw input length, but warn on sanitized output
if (!rawDescription || rawDescription.trim().length < 10) {
  addToast('What is happening? (at least 10 characters)', 'warning');
  return;
}

if (!sanitizedDescription || sanitizedDescription.trim().length < 10) {
  addToast('Description contains only unsafe characters and is too short.', 'warning');
  return;
}
```

**Why:** If a user types `<script>` (7 chars, below the 10-char minimum), the check on `sanitizedDescription` correctly catches this. However, the original issue report implies the XSS check is being done on values before sanitization. Looking at the code flow, `sanitizeText` is applied to the raw input, and then the length is checked on the sanitized result. The fix is to separate raw-length validation from sanitized-length validation.

**Estimated scope:** 1 file (`ReportModal.jsx`), low risk. Only changes the toast message wording and adds a clearer two-stage check.

---

### 1.6 `LeafletMap.jsx:164` -- Invalid locations pass through filter to DisasterMarker

**What:**
```jsx
// CURRENT (lines 162-168)
const filteredReports = useMemo(() => {
  return reports.filter((report) => {
    if (filters.municipality !== 'all' && report.location?.municipality !== filters.municipality)
      return false;
    return true;
  });
}, [reports, filters]);
```

**How:**
Add coordinate validation to the filter:

```jsx
const filteredReports = useMemo(() => {
  return reports.filter((report) => {
    // Skip reports with missing or invalid location
    if (!report.location?.lat || !report.location?.lng) {
      console.warn(`[LeafletMap] Skipping report ${report.id} with invalid location:`, report.location);
      return false;
    }

    // Validate coordinate ranges (Camarines Norte bounds)
    const { lat, lng } = report.location;
    if (lat < 12.5 || lat > 15.5 || lng < 122.0 || lng > 124.0) {
      console.warn(`[LeafletMap] Skipping report ${report.id} with out-of-bounds coordinates:`, { lat, lng });
      return false;
    }

    if (filters.municipality !== 'all' && report.location?.municipality !== filters.municipality)
      return false;

    return true;
  });
}, [reports, filters]);
```

**Why:** `DisasterMarker` receives reports that may have `null` or `undefined` location coordinates. Adding validation here prevents invalid data from reaching the Marker component. Combined with the defensive fallback in DisasterMarker (1.1), this creates defense in depth.

**Estimated scope:** 1 file (`LeafletMap.jsx`), moderate complexity. The coordinate bounds should match the Firestore rules `isValidCoordinates` function for consistency.

---

### 1.7 `firestore.rules:115-118` -- Tags array has no content validation (XSS vector)

**What:**
```firestore
// CURRENT (lines 115-118)
function isValidTagsArray(tags) {
  return tags is list
    && tags.size() <= 10;
}
```

**How:**
```firestore
function isValidTag(tag) {
  return tag is string
    && tag.size() >= 1
    && tag.size() <= 50
    && !tag.matches('(?i).*<(script|iframe|object|embed|form|svg|math|style)[\\s/>].*')
    && !tag.matches('(?i).*javascript:')
    && !tag.matches('(?i).*on\\w+\\s*=');
}

function isValidTagsArray(tags) {
  return tags is list
    && tags.size() <= 10
    && tags.hasAll(tag in tags where isValidTag(tag));
}
```

**Why:** The tags array currently only validates size (max 10 elements), not content. A malicious user could submit `<script>alert(1)</script>` as a tag. While `FeedPost` renders tags without dangerouslySetInnerHTML, if any future code path renders tags as HTML, this becomes an XSS vector. The server-side rule is the authoritative guard.

**Estimated scope:** 1 file (`firestore.rules`), low risk. This tightens validation without changing the API contract.

---

### 1.8 `geoFencing.js:54-56` -- Points outside Camarines Norte silently get municipality via centroid fallback

**What:**
```js
// CURRENT (lines 54-56)
export function isInCamarinesNorte(lat, lng) {
  return detectMunicipality(lat, lng) !== null;
}
```

`detectMunicipality` returns `null` when a point is outside all polygons, but then `resolveMunicipality` falls back to nearest centroid:

```js
// CURRENT (lines 91-106)
export function resolveMunicipality(lat, lng, fallbackMunicipality = null) {
  const exactMatch = detectMunicipality(lat, lng);
  if (exactMatch) {
    return { municipality: exactMatch, method: 'polygon_match' };
  }

  const nearest = getNearestMunicipality(lat, lng);  // <-- Falls back to centroid
  if (nearest) {
    return { municipality: nearest, method: 'nearest_centroid' };
  }
  // ...
}
```

**How:**
In `useReports.js` (`submitReport` function), after calling `resolveMunicipality`, check if the result method is `'nearest_centroid'` and the point is outside Camarines Norte:

```js
const resolved = resolveMunicipality(
  reportData.location.lat,
  reportData.location.lng,
  reportData.location.municipality || 'Unknown'
);

if (!isInCamarinesNorte(reportData.location.lat, reportData.location.lng)) {
  // Warn but allow submission (user may be reporting from border area)
  console.warn('[submitReport] Report location outside Camarines Norte province:', {
    lat: reportData.location.lat,
    lng: reportData.location.lng,
    assignedMunicipality: resolved.municipality,
  });
}
```

Also add a user-facing warning in `ReportModal` when GPS returns coordinates outside the province.

**Why:** A user standing in Naga City (outside Camarines Norte) who submits a report will silently get assigned to the nearest municipality within Camarines Norte via centroid fallback. This creates false positives in the data -- reports that appear to be within the province but are not. For crisis response, this is dangerous.

**Estimated scope:** 2 files (`geoFencing.js` for the guard, `ReportModal.jsx` for the warning toast), moderate risk. The backend fix is additive (only logs a warning), but the UI warning needs to be tested with real GPS data.

---

## Phase 2: Security Hardening

These issues do not cause immediate crashes but represent security vulnerabilities or data integrity risks.

---

### 2.1 `firestore.rules:207-237` -- Moderator cannot update `media` fields

**What:**
```firestore
// CURRENT (lines 207-209)
allow update: if isModerator()
  && request.resource.data.diff(resource.data).affectedKeys()
       .hasOnly(['verification', 'disaster', 'engagement', 'location', 'media'])
```

The moderator branch uses `hasOnly` for the general update path, but the verification status change branch (lines 233-237) does NOT include `media` in its `hasAll` check. When a moderator resolves a report and uploads evidence photos via `resolveReport()`, the function updates `verification.resolution.evidencePhotos`. But the Firestore rules require the top-level `media` field to be present in the update.

**How:**
Add `media` to the `hasAll` check in the moderator verification status branch:

```firestore
// In the moderator verification branch (lines 233-237)
&& request.resource.data.keys().hasAll([
  'verification', 'disaster', 'engagement', 'location', 'media'  // <-- added 'media'
])
```

**Why:** When a moderator tries to resolve a report through the client SDK, the rule's `hasAll` check fails because `media` is not included. This prevents moderators from resolving reports, which is a critical workflow blocker.

**Estimated scope:** 1 file (`firestore.rules`), low risk. A single field addition to an existing validation list.

---

### 2.2 `FeedPost.jsx:257` -- Tags rendered without server-side sanitization

**What:**
```jsx
// CURRENT (lines 257-265)
{report.disaster.tags.map((tag) => (
  <span key={tag} className="...">
    #{tag}
  </span>
))}
```

**How:**
Apply `sanitizeText` to each tag value before rendering:

```jsx
import { sanitizeText } from '../../utils/sanitization';

// ...
{report.disaster.tags.map((tag) => (
  <span key={tag} className="...">
    #{sanitizeText(tag)}
  </span>
))}
```

Note: The `sanitizeText` function strips dangerous patterns. Since tags are rendered as text content (not HTML), this prevents XSS even if a malicious tag like `<img src=x onerror=alert(1)>` were stored.

**Why:** While the Firestore rules fix (1.7) prevents malicious tags from being stored, defense in depth requires client-side sanitization on render. If old data exists in Firestore with unsafe tags (before the rules were tightened), or if a rules bypass is discovered, client-side sanitization prevents script execution.

**Estimated scope:** 1 file (`FeedPost.jsx`), very low risk. Only adds a function call around an existing text render.

---

### 2.3 `useReports.js:237` -- Anonymous users can set arbitrary reporter names

**What:**
```js
// CURRENT (line 237)
name: user.displayName || 'Anonymous',
```

**How:**
```js
name: user.isAnonymous ? 'Anonymous' : (user.displayName || 'Anonymous'),
```

**Why:** Currently, an anonymous user who has set a custom `displayName` in their Firebase profile will have that name stored as the `reporter.name` on reports. This is a privacy leak -- anonymous reporters expect to remain anonymous. The fix forces anonymous users to always be recorded as "Anonymous" regardless of their Firebase display name.

**Estimated scope:** 1 file (`useReports.js`), low risk. Only changes behavior for anonymous users (who should not have identifiable names anyway).

---

## Phase 3: UX Quality Fixes

These issues do not crash the app or create security vulnerabilities but produce poor user experience through visible artifacts like `"undefined"` strings, non-disabled buttons, and lost form data.

---

### 3.1 `FeedPost.jsx:106` + `DisasterMarker.jsx:125` -- `"undefined"` renders for missing municipality

**What:**
```jsx
// FeedPost.jsx line 106
{report.location?.municipality}
```

```jsx
// DisasterMarker.jsx line 125
<p className="font-medium text-xs text-text">{report.location.municipality}</p>
```

**How:**

In `FeedPost.jsx`:
```jsx
{report.location?.municipality ?? 'Unknown Municipality'}
```

In `DisasterMarker.jsx`:
```jsx
<p className="font-medium text-xs text-text">{report.location?.municipality ?? 'Unknown Municipality'}</p>
```

**Why:** When `municipality` is `null` or `undefined`, React renders the string `"undefined"` in the UI. Users see "undefined" in the location line of report cards and map popups, which looks broken and erodes trust.

**Estimated scope:** 2 files, very low risk. Pure nullish coalescing addition.

---

### 3.2 `ReportModal.jsx:373-378` -- Submit button not disabled for <10-char descriptions

**What:**
```jsx
// CURRENT (lines 373-378)
disabled={
  isSubmitting ||
  !formData.description ||
  !effectiveLocation ||
  !rateLimit.isAllowed
}
```

**How:**
```jsx
disabled={
  isSubmitting ||
  !formData.description ||
  formData.description.trim().length < 10 ||
  !effectiveLocation ||
  !rateLimit.isAllowed
}
```

**Why:** The submit button is disabled when `!formData.description` (empty string), but not when the description is shorter than 10 characters. Users can click the button, receive a toast error, and feel frustrated. The disabled state should reflect the actual validation requirement.

**Estimated scope:** 1 file (`ReportModal.jsx`), low risk. Only adds a length check to the disabled condition.

---

### 3.3 `ReportModal.jsx:127-135` -- `manualMunicipality` not validated against `MUNICIPALITY_COORDS`

**What:**
```jsx
// CURRENT (lines 127-135)
const effectiveLocation =
  location ||
  (manualMunicipality && MUNICIPALITY_COORDS[manualMunicipality]
    ? {
        lat: MUNICIPALITY_COORDS[manualMunicipality].lat,
        lng: MUNICIPALITY_COORDS[manualMunicipality].lng,
        accuracy: null,
      }
    : null);
```

**How:**
Add a guard before constructing the manual location:

```jsx
const manualCoords = manualMunicipality ? MUNICIPALITY_COORDS[manualMunicipality] : null;

if (manualMunicipality && !manualCoords) {
  addToast(`Unknown municipality: "${manualMunicipality}". Please select from the list.`, 'warning');
}

const effectiveLocation =
  location ||
  (manualCoords
    ? {
        lat: manualCoords.lat,
        lng: manualCoords.lng,
        accuracy: null,
      }
    : null);
```

**Why:** If a user types an invalid municipality name (e.g., a typo), `MUNICIPALITY_COORDS[manualMunicipality]` returns `undefined`, and the fallback chain continues to `null`. The user sees "Location is required" even though they believe they entered a location. Showing a specific error message for unknown municipality names improves the UX significantly.

**Estimated scope:** 1 file (`ReportModal.jsx`), low risk. Only adds a warning toast and reorganizes the conditional.

---

### 3.4 `ReportModal.jsx:142-145` -- Description cleared on Step 2 to Step 3 navigation

**What:**
```jsx
// CURRENT (lines 142-145)
const handleEvidenceContinue = () => {
  setFormData((prev) => ({ ...prev, description: '' }));
  setStep(3);
};
```

**How:**
```jsx
const handleEvidenceContinue = () => {
  // Preserve existing formData, only step changes
  setStep(3);
};
```

**Why:** The `handleEvidenceContinue` function explicitly clears the description by setting `description: ''`. This happens when the user clicks "Continue" from the evidence step. If the user had previously entered a description and then went back to step 2 to add more evidence, their description is lost. This is a data-loss bug.

**Estimated scope:** 1 file (`ReportModal.jsx`), low risk. Simply removing a destructive line. Note: The draft auto-save mechanism (`saveDraft`) should preserve description across sessions, but in-session navigation should also preserve it.

---

### 3.5 `WeatherCard.jsx:371` -- Partial weather data renders `"undefined"`

**What:**
```jsx
// CURRENT (line 371-372)
<p className="font-bold text-xs mt-0.5">
  {weather.windSpeed} kph {weather.windDirection}
</p>
```

**How:**
```jsx
<p className="font-bold text-xs mt-0.5">
  {weather.windSpeed ?? 'N/A'} kph {weather.windDirection ?? ''}
</p>
```

**Why:** When `windSpeed` or `windDirection` is `null` or `undefined`, the string concatenation produces `"null kph"` or `"undefined kph"`. This is a minor cosmetic issue that appears when the weather API returns incomplete data for a municipality.

**Estimated scope:** 1 file (`WeatherCard.jsx`), very low risk.

---

### 3.6 `EngagementButtons.jsx:60` -- Share title shows `"null"` for missing type

**What:**
```jsx
// CURRENT (line 60)
title: `Bantayog Alert - ${report.disaster?.type}`,
```

**How:**
```jsx
title: `Bantayog Alert - ${report.disaster?.type ?? 'Report'}`,
```

**Why:** When `report.disaster?.type` is null/undefined, the share dialog title becomes "Bantayog Alert - null" which is confusing. This happens for legacy reports that may have incomplete disaster type data.

**Estimated scope:** 1 file (`EngagementButtons.jsx`), very low risk.

---

### 3.7 `useReports.js` -- Failed file uploads return count but no per-file error details

**What:**
```js
// CURRENT (lines 203-209)
// Filter out failed uploads and surface a summary to the caller
const successfulImages = imageResults.filter(Boolean);
const photoUrls = successfulImages.map((r) => r.photoUrl);
const thumbnailUrls = successfulImages.map((r) => r.thumbUrl);
const successfulVideos = videoUrls.filter(Boolean);
const skippedFiles =
  imageFiles.length - successfulImages.length + (videoFiles.length - successfulVideos.length);

// ...
return { id: docRef.id, skippedFiles };
```

**How:**
Change the return structure to include per-file error details:

```js
// Track failures with details
const imageFailures = [];
imageResults.forEach((result, index) => {
  if (!result) {
    imageFailures.push({ filename: imageFiles[index]?.name, index });
  }
});

const videoFailures = [];
videoUrls.forEach((result, index) => {
  if (!result) {
    videoFailures.push({ filename: videoFiles[index]?.name, index });
  }
});

const skippedFiles =
  imageFiles.length - successfulImages.length + (videoFiles.length - successfulVideos.length);

// Return structured error info
return {
  id: docRef.id,
  skippedFiles,
  uploadErrors: [
    ...imageFailures.map((f) => ({ filename: f.filename, type: 'image', index: f.index })),
    ...videoFailures.map((f) => ({ filename: f.filename, type: 'video', index: f.index })),
  ],
};
```

Update the `ReportModal` handler to display per-file errors:

```js
const { skippedFiles, uploadErrors } = await submitReport(reportData, evidenceFiles, activeUser);

if (skippedFiles > 0) {
  const errorList = uploadErrors.map((e) => e.filename).join(', ');
  addToast(
    `Report submitted, but ${skippedFiles} file${skippedFiles > 1 ? 's' : ''} could not be uploaded: ${errorList}`,
    'warning'
  );
}
```

**Why:** Currently, when a user uploads 5 photos and 2 fail, they only see "2 files could not be uploaded" with no indication of which files failed. This prevents users from knowing which evidence they should re-capture. Per-file error details help users understand and remediate upload failures.

**Estimated scope:** 2 files (`useReports.js` and `ReportModal.jsx`), moderate complexity. The API contract of `submitReport` changes its return value, so all call sites must be audited.

---

## Phase 4: Polish

These are low-priority improvements that make the code more maintainable or fix minor inconsistencies.

---

### 4.1 `geoFencing.js:58-69` -- `hasValidCoordinates` defined but never used

**What:**
```js
// CURRENT (lines 58-69) - defined but never called
function hasValidCoordinates(lat, lng) {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}
```

**How:**
Call `hasValidCoordinates` in `detectMunicipality` before passing coordinates to Turf.js:

```js
export function detectMunicipality(lat, lng, options = {}) {
  if (!lat || !lng) return null;
  if (!hasValidCoordinates(lat, lng)) return null;  // <-- ADD THIS

  // Turf uses [longitude, latitude] order
  const pt = point([lng, lat]);
  // ...
}
```

**Why:** The `hasValidCoordinates` function exists and validates coordinate ranges but is never used. It should be called in `detectMunicipality` to guard against invalid inputs being passed to Turf.js, which could throw or produce incorrect results.

**Estimated scope:** 1 file (`geoFencing.js`), low risk. Moves a guard earlier in the function.

---

### 4.2 `rateLimiter.js:38-61` -- Race condition with localStorage across tabs

**What:**
```js
// CURRENT (lines 38-61)
function cleanExpiredEntries(actionType) {
  const history = getHistory();  // Reads localStorage
  // ...
  history[actionType] = history[actionType].filter((timestamp) => timestamp > windowStart);
  setHistory(history);  // Writes to localStorage
}
```

The issue is that between `getHistory()` and `setHistory()`, another tab/browser context may have modified the history. The `recordAction` function has the same pattern:

```js
// CURRENT (lines 106-113)
const history = getHistory();  // Read
// ...
history[actionType].push(Date.now());
setHistory(history);  // Write
```

**How:**
Refactor `recordAction` to use a storage event listener for cross-tab synchronization:

```js
// Add at module level
const STORAGE_KEY = 'rate_limit_history';

function getHistory() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

function setHistory(history) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    return true;
  } catch (e) {
    console.warn('Rate limiter: Failed to persist to localStorage', e);
    return false;
  }
}

// Singleton listener manager
let storageListenerAttached = false;
function ensureStorageListener(callback) {
  if (storageListenerAttached) return;
  storageListenerAttached = true;
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      callback();
    }
  });
}

export function recordAction(actionType) {
  const config = RATE_LIMIT_CONFIG[actionType];
  if (!config) {
    console.warn(`Rate limiter: Unknown action type "${actionType}"`);
    return false;
  }

  const status = checkLimit(actionType);
  if (!status.allowed) {
    return false;
  }

  // Optimistic update
  const history = getHistory();
  if (!history[actionType]) {
    history[actionType] = [];
  }
  history[actionType].push(Date.now());

  if (!setHistory(history)) {
    return false;
  }

  // Listen for cross-tab updates
  ensureStorageListener(() => {
    // When another tab writes, this tab's next read will get the updated history
  });

  return true;
}
```

**Why:** If a user has the app open in two tabs and rapidly submits reports in both, the rate limiter in each tab reads the same history, both decide they are under the limit, both write their new entries, and the user exceeds the rate limit by the number of open tabs. This undermines the anti-abuse mechanism.

**Estimated scope:** 1 file (`rateLimiter.js`), moderate complexity. The storage event listener approach requires careful handling to avoid infinite loops.

---

### 4.3 `DisasterIcon.jsx` -- `dangerouslySetInnerHTML` with hardcoded SVGs

**What:**
```jsx
// CURRENT (lines 19-21)
<span
  dangerouslySetInnerHTML={{ __html: disasterType.icon }}
  aria-hidden="true"
/>
```

**Why:** This was flagged as a concern but **should not be changed** per the review findings. The `disasterType.icon` values are hardcoded inline SVG strings from `disasterTypes.js` (a static data file). These are not user-supplied data. Rendering them via `dangerouslySetInnerHTML` is intentional and necessary for inline SVG icons. The review correctly notes to "document, don't change."

**Action:** Add a comment to `DisasterIcon.jsx` explaining why this is safe:

```js
/**
 * Renders disaster type icons as inline SVGs.
 *
 * SECURITY NOTE: The icon property comes exclusively from static data in
 * disasterTypes.js -- never from user input or API responses. The
 * dangerouslySetInnerHTML is intentional and necessary for inline SVG
 * rendering. No XSS risk exists from this static data source.
 */
```

---

### 4.4 Missing: `ReportModal.jsx` -- Evidence guard before upload

**Finding reference:** The `submitReport` function uploads evidence files but does not validate that evidenceFiles exist before starting uploads. If `evidenceFiles` is an empty array, `Promise.all` resolves immediately which is fine, but if it contains invalid files, the upload loop will attempt to process them.

**Action:** No code change needed -- the existing code already handles empty arrays correctly (`imageFiles.filter` and `videoFiles.filter` return empty arrays, which cause `Promise.all` to resolve with empty results). However, add an explicit guard in `ReportModal` for clarity:

```js
const imageFiles = evidenceFiles.filter((f) => f.type.startsWith('image/'));
const videoFiles = evidenceFiles.filter((f) => f.type.startsWith('video/'));

if (imageFiles.length === 0 && videoFiles.length === 0) {
  addToast('Please add at least one photo or video as evidence.', 'warning');
  return;
}
```

**Why:** Guides users to add evidence instead of silently allowing submission with no media.

**Estimated scope:** 1 file (`ReportModal.jsx`), low risk.

---

## Cross-Cutting Concerns

### Shared Constants

The coordinate validation bounds appear in three places and must stay in sync:
- `firestore.rules:103-109` -- `isValidLatitude` (12.5-15.5) and `isValidLongitude` (122.0-124.0)
- `geoFencing.js` -- `hasValidCoordinates` (uses -90/90 and -180/180, not Camarines Norte bounds)
- `LeafletMap.jsx:164` -- filter bounds check (proposed in 1.6)

**Recommendation:** Extract bounds to a shared constants file:

```js
// src/utils/geoConstants.js
export const GEO_BOUNDS = {
  camarinesNorte: {
    lat: { min: 12.5, max: 15.5 },
    lng: { min: 122.0, max: 124.0 },
  },
  world: {
    lat: { min: -90, max: 90 },
    lng: { min: -180, max: 180 },
  },
};
```

---

### Test Coverage Required

Before merging Phase 1, the following test scenarios must be added:

1. **`timeUtils`** -- Test with plain `{seconds, nanoseconds}` objects (currently no coverage)
2. **`EngagementButtons`** -- Test with `upvotedBy: null` in report fixture
3. **`DisasterMarker`** -- Test with null location (should not crash)
4. **`LeafletMap filteredReports`** -- Test with out-of-bounds coordinates (should be filtered)
5. **`submitReport`** -- Test with anonymous user (name should be 'Anonymous')

---

## PR Strategy Recommendation

### Option A: Single PR (Recommended)

**Rationale:**
- All 22 issues are independently testable
- The phases are conceptual groupings, not separate feature branches
- A single PR reduces review overhead and ensures all fixes land together
- CI pipeline (lint -> format:check -> test -> build) provides adequate safeguard
- No single fix in this set is large enough to justify separate PR overhead

**Approach:**
1. Create a single feature branch: `fix/security-quality-issues-2026-03-27`
2. Implement all fixes in a single branch, organized by phase with clear commit messages
3. Open a single PR with a checklist covering all 22 issues
4. Require all existing tests to pass + new tests for the 5 coverage gaps above

**Commit structure:**
```
fix(timeUtils): handle plain {seconds,nanoseconds} Firestore objects
fix(EngagementButtons): null coalescing for upvotedBy.includes()
fix(useReports): add Sentry capture and user-facing error for onSnapshot
fix(DisasterMarker): optional chaining on report.location
fix(LeafletMap): validate coordinates in filteredReports
fix(firestore): add isValidTag() content validation for tags array
fix(geoFencing): call hasValidCoordinates in detectMunicipality
fix(geoFencing): add isInCamarinesNorte guard in submitReport
fix(ReportModal): separate XSS check on sanitized values
fix(FeedPost): sanitize tags before rendering
fix(useReports): anonymous users always use 'Anonymous' name
fix(firestore): add media to moderator verification branch hasAll
fix(FeedPost): nullish coalescing for municipality
fix(DisasterMarker): nullish coalescing for municipality
fix(ReportModal): disabled prop includes description length check
fix(ReportModal): validate manualMunicipality against MUNICIPALITY_COORDS
fix(ReportModal): preserve description on step navigation
fix(WeatherCard): null coalescing for windSpeed and windDirection
fix(EngagementButtons): null coalescing for share title disaster type
fix(useReports): return per-file upload errors
fix(rateLimiter): add storage event listener for cross-tab sync
chore(DisasterIcon): document why dangerouslySetInnerHTML is safe
```

### Option B: Split PRs (Defensive)

**Rationale:**
- If the team prefers smaller review surface area
- If some fixes might need to be reverted independently

**Approach:**
- PR 1: Phase 1 (Crash risks only) -- 8 issues
- PR 2: Phase 2 (Security hardening) -- 3 issues
- PR 3: Phase 3 (UX quality) -- 7 issues
- PR 4: Phase 4 (Polish) -- 4 issues

**Defensive note:** The risk with split PRs is that Phase 3 and 4 fixes may depend on shared constants or patterns introduced in Phase 1. For example, the `hasValidCoordinates` call in `geoFencing.js` (4.1) depends on the `hasValidCoordinates` function that already exists but was never used. A split PR approach is only advisable if each PR is fully independent from the next.

### Recommendation: Option A (Single PR)

The issues are all straightforward, independently testable, and low-risk. A single PR with clear phase organization and mandatory test additions is the most efficient path. Each fix can be code-reviewed independently within the PR via the commit structure.

---

## Files Summary

| File | Issues | Phase |
|------|--------|-------|
| `src/components/Map/DisasterMarker.jsx` | 1.1, 3.1 | 1, 3 |
| `src/components/Feed/EngagementButtons.jsx` | 1.2, 3.6 | 1, 3 |
| `src/hooks/useReports.js` | 1.3, 2.3, 3.7, 4.1 | 1, 2, 3, 4 |
| `src/utils/timeUtils.js` | 1.4 | 1 |
| `src/components/Reports/ReportModal.jsx` | 1.5, 3.2, 3.3, 3.4, 3.7 | 1, 3 |
| `src/components/Map/LeafletMap.jsx` | 1.6 | 1 |
| `firestore.rules` | 1.7, 2.1 | 1, 2 |
| `src/components/Feed/FeedPost.jsx` | 2.2, 3.1 | 2, 3 |
| `src/utils/geoFencing.js` | 1.8, 4.1 | 1, 4 |
| `src/components/Weather/WeatherCard.jsx` | 3.5 | 3 |
| `src/utils/rateLimiter.js` | 4.2 | 4 |
| `src/components/Common/DisasterIcon.jsx` | 4.3 | 4 |

**Total unique files:** 12
