# Error: Service Worker Serving Stale Content After Deploy

## Symptom

After deploying a new version of the app, users (or you in the browser) see the old version. Hard refresh doesn't help. The app appears stuck on a previous deploy.

## When It Occurs

- After any `firebase deploy --only hosting`
- After changing JS/CSS assets (Vite generates new hashed filenames, but the SW may still serve the old `index.html` pointing to old hashes)
- After bumping a Vite chunk that is cached under the old name

## Root Cause

The service worker (`public/sw.js`) caches `index.html` and app assets under a versioned cache name (e.g., `bantayog-app-cache-v1`). When the SW is already active in the browser, it keeps serving cached responses until:

1. The browser detects the new `sw.js` file has changed (byte-level comparison)
2. The user closes all tabs of the app
3. The new SW activates and takes control

If the cache version in `sw.js` was not bumped when assets changed, the new deployment won't clear the old cache.

## Solution

### Immediate: Force cache clear for development

In Chrome DevTools → Application → Service Workers:
1. Check "Update on reload"
2. Click "Unregister" on the current SW
3. Hard reload (Ctrl+Shift+R)

Or: Application → Storage → Clear site data (clears all caches, localStorage, IndexedDB).

### Permanent: Bump the SW cache version

In `public/sw.js`, increment the cache version constants:

```js
// Before
const TILE_CACHE = 'bantayog-tile-cache-v1';
const APP_CACHE = 'bantayog-app-cache-v1';

// After
const TILE_CACHE = 'bantayog-tile-cache-v2';
const APP_CACHE = 'bantayog-app-cache-v2';
```

The `activate` event in the SW deletes old caches when the version changes:

```js
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== TILE_CACHE && key !== APP_CACHE)
            .map(key => caches.delete(key))
      )
    )
  );
});
```

After bumping the version, deploy both `public/sw.js` and the new build:

```bash
npm run build
firebase deploy --only hosting
```

### SW Lifecycle

```
Install → Waiting (old SW still active) → Activate (on tab close/reopen) → Fetch
```

New SW won't take control until all tabs running the old SW are closed. To skip waiting (use only for critical updates):

```js
self.addEventListener('install', event => {
  self.skipWaiting(); // takes control immediately
});
```

## Prevention

- Bump `APP_CACHE` version whenever you deploy code changes
- Add a comment at the top of `sw.js` with the last-bumped version and date
- Check for SW issues in Chrome DevTools → Application → Service Workers before filing a bug

## Related Files

- `public/sw.js` (service worker — cache names and lifecycle)
- `firebase.json` (hosting config)
- `principles/pwa-offline-first.md` (caching strategy overview)
