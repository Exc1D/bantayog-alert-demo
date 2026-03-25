# Bantayog Alert — Production Build Fix (2026-03-25)

## Problem
Production build crashed at runtime with:
```
Uncaught TypeError: Cannot read properties of undefined (reading 'forwardRef')
```

## Root Cause: Circular Chunk Dependency

Vite's `manualChunks` was creating a circular ES module dependency:

```
vendor (base) → vendor-react (react+date-fns separately) → vendor-date (date-fns) → vendor-react
```

This made the React export undefined at execution time, crashing any component
calling `forwardRef` (recharts charts, react-router components).

### Diagnosis
```bash
# Check chunk imports
python3 -c "
import re
for chunk in ['vendor-react.js', 'vendor.js']:
    data = open(f'dist/assets/{chunk}')
    imports = re.findall(r'import\{(.*?)\}from\"(.*?)\"', data)
    for spec, src in imports:
        if 'vendor' in src:
            print(f'{chunk} imports from {src}')
"
```

### Chunk composition before fix
- `vendor-IUYtJoaz.js` (455KB): generic vendor + recharts + date-fns
- `vendor-react-BK1-OA2C.js` (141KB): react + react-dom
- Circular: `vendor-react` imported `s as rf` (date-fns) from `vendor-IUYtJoaz`, 
  while `vendor-IUYtJoaz` imported `r as y` (React) from `vendor-react`

## Fix

### 1. Chunking: route recharts + date-fns to vendor-react
```js
// vite.config.js manualChunks
if (id.includes('recharts') || id.includes('date-fns')) {
    return 'vendor-react';
}
// Remove explicit react/react-dom rule — let them fall through to vendor base
```

### 2. Remove terser (was already done — use esbuild)
```js
build: {
    minify: isProduction ? 'esbuild' : false,
}
```

### 3. Bump service worker cache
Old SW cached stale JS chunks from broken builds. Bumped to v4:
```js
const CACHE_NAME = 'bantayog-alert-v4';
const TILE_CACHE = 'bantayog-tiles-v2';
```

## Verification
```bash
npm run build  # Should show NO circular chunk warnings
firebase deploy --only hosting
# Test with SW unregistered to confirm fix:
# navigator.serviceWorker.getRegistration().then(r => r.unregister())
```

## Related Issue
`react-leaflet-markercluster@3.0.0-rc1` has nested React 17 in its own deps
(`@react-leaflet/core@1.1.1` → `react@17.0.2`), but it was NOT the cause of this
particular error. The aliases in vite.config.js protect against it.

## Commits
- `cdb76ca` fix: resolve circular chunk dependency causing forwardRef crash
- `536d09d` fix: resolve dual-React production build failure (esbuild + aliases)
