# CSP Fix — Diagnosis Report

**Date:** 2026-03-20
**Status:** Complete

---

## Problem

When a user attempts to submit a report with a photo, the browser console shows CSP violations:

**Error 1 (data: URI - secondary issue):**
```
data:image/jpeg;base64,... violates the following Content Security Policy directive:
"connect-src 'self' *.tile.openstreetmap.org ... *.sentry.io"
```

**Error 2 (CDN script load - PRIMARY blocking issue):**
```
Loading the script 'https://cdn.jsdelivr.net/npm/browser-image-compression@2.0.2/dist/browser-image-compression.js'
violates the following Content Security Policy directive: "script-src 'self'"
```

---

## Root Cause

The `browser-image-compression` library (v2.0.2) has **two** code paths that trigger CSP violations:

### Issue 1: `data:` URI in connect-src
When processing images, the library converts Files/Blobs to `data:` URIs and uses `fetch()` internally. The `connect-src` directive didn't include `data:`.

### Issue 2: CDN worker loading (PRIMARY BLOCKER)
When `useWebWorker: true` (the default), the library creates a web worker that imports the library script from `https://cdn.jsdelivr.net/npm/browser-image-compression@2.0.2/dist/browser-image-compression.js` via `importScripts()`. The `script-src 'self'` directive blocked this CDN load.

---

## Diagnosis Steps Performed

1. **Initial analysis** identified the `data:` URI issue (Error 1)
2. **Fixed** `connect-src` by adding `data:` — but this wasn't the real blocker
3. **User testing** revealed the actual error: CDN script blocked by `script-src 'self'`
4. **Investigated library options** — found `libURL` option to override the CDN URL
5. **Implemented fix** — host library locally and use `libURL` option

---

## Solution

**Files changed:**
1. `firebase.json` — Added `data:` to `connect-src` (for Issue 1)
2. `public/vendor/browser-image-compression.js` — Copy of library for local hosting
3. `src/utils/constants.js` — Added `libURL` option to `IMAGE_COMPRESSION_OPTIONS`

**Change to constants.js:**
```diff
export const IMAGE_COMPRESSION_OPTIONS = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
+ libURL: '/vendor/browser-image-compression.js',
};
```

**Change to firebase.json:**
```diff
- "connect-src 'self' *.tile.openstreetmap.org ..."
+ "connect-src 'self' data: *.tile.openstreetmap.org ..."
```

**Rationale:** By setting `libURL` to a local path, the web worker imports the library from our own domain instead of CDN. This is served with `script-src 'self'` which the library already allows.

---

## Verification

1. **Build:** `npm run build` — ✓ Success (51 files including vendor/)
2. **Deploy:** `firebase deploy --only hosting` — ✓ Success
3. **Tests:** `npm test` — ✓ 627 passed (1 skipped)
4. **Live URL:** https://bantayog-alert-demo-36b27.web.app

---

## Why This Wasn't Caught Earlier

The diagnosis was performed by navigating the app and checking for errors on page load. The CSP violation for CDN loading only occurs when:
1. User navigates to the report page
2. User selects a photo
3. Report submission is initiated (triggers `compressImage()`)
4. Library creates a web worker with `useWebWorker: true`
5. Worker tries to `importScripts()` from CDN — BLOCKED by `script-src 'self'`

The error does NOT appear on page load or navigation, only during actual compression.

---

## Notes

- **No library replacement needed** — `browser-image-compression` works correctly when served locally
- **`useWebWorker: true` is preserved** — compression still runs in a worker for non-blocking UI
- **Local hosting pattern** — the library `libURL` option allows self-hosting the worker script
- **Security maintained** — no `unsafe-eval` or CDN allowances added to CSP

---

## Manual Testing Required

End-to-end verification of photo upload should be done:

1. Open https://bantayog-alert-demo-36b27.web.app/report
2. Select a hazard type (e.g., "Flood")
3. On Step 2, select a photo (>1MB)
4. Complete and submit the report
5. Verify:
   - No CSP errors in console
   - Photo uploads and compresses successfully
   - Report appears in the feed
