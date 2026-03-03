# PWA & Offline-First Principles

## Service Worker

**File:** `public/sw.js`

The service worker handles two caching concerns:

### 1. Map Tile Caching (Cache-first)
OpenStreetMap tiles are cached indefinitely (up to 500 tiles, LRU eviction). This lets the map work offline for previously viewed areas.

```
Cache name: bantayog-tile-cache-v1
Strategy:   Cache-first → network fallback
Scope:      *.tile.openstreetmap.org
```

### 2. App Asset Caching (Stale-while-revalidate)
Built JS/CSS/HTML assets are served from cache, then refreshed in background.

```
Cache name: bantayog-app-cache-v1
Strategy:   Stale-while-revalidate
Scope:      /assets/*, /index.html, /manifest.json
```

### Cache Invalidation
On new deployment, the SW cache version must be bumped (`v1` → `v2`). Old clients will get the new SW on next navigation + close cycle. See `errors/service-worker-cache-stale.md` for debugging stale content issues.

## Caching Strategy by Content Type

| Content | Strategy | Rationale |
|---|---|---|
| Map tiles | Cache-first | Tiles don't change; saves bandwidth |
| App assets | Stale-while-revalidate | Fast load + background update |
| API data (Firestore) | Real-time listener | Always fresh; offline handled by Firestore SDK |
| Weather data | Network-only | Time-sensitive; must be fresh |

## Firestore Offline Persistence

Firebase SDK persistence is enabled in `src/utils/firebase.js`. When offline:
- Reads return cached data
- Writes queue locally and sync when connectivity resumes

This means the report feed works offline (cached) but weather data does not.

## Offline Indicator

An offline/online UI indicator should be surfaced to users when `navigator.onLine === false`. Implement using `window.addEventListener('online'/'offline')` or the `useNetworkStatus` hook.

## Installability

`public/manifest.json` defines the PWA manifest:
- `name`: Bantayog Alert
- `short_name`: Bantayog
- `start_url`: `/`
- `display`: `standalone`
- `theme_color` and `background_color` match the app color scheme
- Icon sizes: 192×192, 512×512 PNG

The SW must be registered for the install prompt to appear. Registration is in `src/main.jsx`.

## Lighthouse Targets

| Metric | Target |
|---|---|
| Performance | ≥ 90 |
| Accessibility | ≥ 90 |
| Best Practices | ≥ 90 |
| SEO | ≥ 90 |
| PWA | All checks pass |

Reports are generated to `.tmp/lighthouse-*.json` and `.tmp/lighthouse-*.html` (gitignored, regenerated as needed).
