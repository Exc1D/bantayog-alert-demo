# Code Organization Principles

## Directory Structure

```
src/
├── components/          # Reusable UI components, grouped by feature
│   ├── Admin/           # Admin dashboard, verification, resolution panels
│   ├── Common/          # Shared UI (Button, Modal, Toast, ErrorBoundary, LoadingSpinner, etc.)
│   ├── Feed/            # Report feed, filters, engagement (upvote)
│   ├── Layout/          # Header, Footer, TabNavigation, ThemeToggle
│   ├── Map/             # Leaflet map, markers, clusters, municipality boundaries
│   ├── Reports/         # ReportModal, evidence capture, media upload
│   └── Weather/         # WeatherCard, WeatherGrid, alerts
├── config/              # App configuration (firebase init, Sentry setup)
├── contexts/            # React contexts (AuthContext, ReportsContext)
├── data/                # Static data — disaster types, municipality names, boundary GeoJSON
├── hooks/               # Custom hooks — one concern per file
├── pages/               # Page-level components (MapTab, FeedTab, WeatherTab, ProfileTab)
├── test/                # Test utilities, fixtures, mocks
└── utils/               # Pure utility functions (no React)
```

**Outside src/:**
```
scripts/                 # Node.js automation scripts (boundary evaluation, etc.)
public/                  # Static assets served as-is (sw.js, manifest.json, icons)
docs/                    # Project documentation
principles/              # Architecture and coding principles (this directory)
workflows/               # Development SOPs
errors/                  # Error documentation
```

## Module Boundaries

**Dependency direction (one-way):**
```
pages → components → hooks → utils/contexts → firebase
```

- `utils/` must not import from `components/` or `hooks/`
- `hooks/` must not import from `components/`
- `contexts/` may import from `hooks/` and `utils/`
- `data/` is pure JSON/static — no imports from other src directories

Breaking this direction creates circular dependencies and makes testing harder.

## Component File Conventions

Each component file exports one primary component. Supporting sub-components for that component (not reused elsewhere) may live in the same file, but prefer splitting them out once they grow.

```js
// Named export preferred for utilities and hooks
export function useRateLimit() { ... }
export function sanitizeText(input) { ... }

// Default export acceptable for page/feature components
export default function MapTab() { ... }
```

## Build Chunking (vite.config.js)

Vite is configured with manual chunk splitting:
- `vendor` — React, React DOM
- `firebase` — Firebase SDK modules
- `leaflet` — Leaflet + React-Leaflet + MarkerCluster
- `sentry` — Sentry SDK

This keeps the initial app chunk small and lets browsers cache stable vendor code independently of app code changes.

## Scripts Directory

`scripts/` contains Node.js automation scripts that run outside the app:
- `evaluateMunicipalityBoundaries.mjs` — boundary accuracy audit (`npm run check:boundaries`)

Scripts use ES modules (`"type": "module"` in package.json). Do not import these scripts from `src/`.

## Feature Flags

Feature flags are not yet formalized. New features that need gradual rollout should check an environment variable (`import.meta.env.VITE_FEATURE_X`) or a Firestore `system/config` document value.
