# Architecture Overview — Bantayog Alert

## System Summary

Bantayog Alert is a React 18 single-page application (PWA) backed by Firebase serverless infrastructure. Citizens report hazards, administrators verify them, and all data is surfaced on an interactive Leaflet map. The app is deployed to Firebase Hosting and installable as a PWA.

**Province:** Camarines Norte, Philippines
**Live URL:** https://bantayog-alert-demo-36b27.web.app

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| UI Framework | React 18 + Vite 5 | SPA with HMR, code splitting |
| Styling | Tailwind CSS 3 | Utility-first, responsive, dark mode |
| Backend / BaaS | Firebase (Firestore, Auth, Storage, Hosting) | Real-time DB, auth, file storage, CDN hosting |
| Maps | Leaflet + React-Leaflet + MarkerCluster | Interactive hazard map |
| Geospatial | Turf.js (point-in-polygon, centroid, distance) | Municipality detection from GPS |
| Weather | OpenWeather API | Live weather data for 12 municipalities |
| Error Tracking | Sentry | Production error monitoring |
| Testing | Vitest + React Testing Library + Playwright | Unit, integration, E2E |
| CI/CD | GitHub Actions | Lint, test, build, deploy |
| Containerization | Docker + Nginx | Alternative deployment target |

---

## Application Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     React SPA (Vite)                    │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌─────────┐  ┌─────────┐  │
│  │  MapTab  │  │ FeedTab  │  │Weather  │  │Profile  │  │
│  │(Leaflet) │  │ (Feed)   │  │  Tab    │  │  Tab    │  │
│  └─────┬────┘  └────┬─────┘  └────┬────┘  └────┬────┘  │
│        └────────────┴─────────────┴─────────────┘       │
│                          │                               │
│  ┌───────────────────────┴──────────────────────────┐   │
│  │            Context Providers                     │   │
│  │       AuthContext · ReportsContext               │   │
│  └───────────────────────┬──────────────────────────┘   │
│                          │                               │
│  ┌───────────────────────┴──────────────────────────┐   │
│  │            Custom Hooks Layer                    │   │
│  │  useAuth · useReports · useGeolocation           │   │
│  │  useWeather · useRateLimit · useTheme · ...      │   │
│  └───────────────────────┬──────────────────────────┘   │
└──────────────────────────┼──────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
     ┌────┴────┐    ┌──────┴──────┐  ┌──────┴──────┐
     │Firebase │    │ OpenWeather │  │   Sentry    │
     │Firestore│    │    API      │  │  (errors)   │
     │  Auth   │    └─────────────┘  └─────────────┘
     │ Storage │
     └─────────┘
```

### Component Hierarchy

```
App.jsx
└── ErrorBoundary
    └── AuthContext.Provider
        └── ReportsContext.Provider
            └── Layout (Header, TabNavigation)
                ├── MapTab → LeafletMap, ReportModal
                ├── FeedTab → ReportFeed, ReportCard
                ├── WeatherTab → WeatherGrid, WeatherCard
                └── ProfileTab → ProfileForm, AdminDashboard (role-gated)
```

---

## Data Flow

1. **Citizen submits report** → `ReportModal` captures GPS (Turf.js detects municipality), optional photo (compressed via `browser-image-compression`), and form data
2. **Upload** → Photo to Firebase Storage, report document to Firestore `reports` collection
3. **Real-time sync** → `ReportsContext` (via Firestore `onSnapshot`) pushes new reports to all connected clients instantly
4. **Admin verifies** → Admin dashboard updates `verification.status`; verified reports appear on the map and feed
5. **Weather** → `useWeather` hook fetches OpenWeather API on tab mount (one call per municipality, cached in component state)

---

## Security Layers

```
Browser
  ↓ CSP headers (firebase.json)       ← blocks unauthorized origins
  ↓ DOMPurify + validator             ← sanitizes user input
  ↓ Firebase Auth JWT                 ← identifies the user
  ↓ Firestore Security Rules          ← authoritative server-side enforcement
  ↓ Firebase Storage Rules            ← file type/size/path enforcement
  ↓ Rate limiting (useRateLimit.js)   ← 10 reports/hour client-side
```

Security rules are the only server-side enforcement layer. Client-side validation is UX-only.

---

## Geofencing

Municipality detection uses Turf.js with GeoJSON polygons from `src/data/camarines-norte-boundaries.json`.

**Layered fallback (`geoFencing.js` → `resolveMunicipality`):**
1. Point-in-polygon match (primary)
2. Nearest municipality centroid (fallback when point is outside all polygons)
3. Caller-supplied fallback / `'Unknown'` (last resort)

Detection method stored as `location.municipalityDetectionMethod` on each report for auditability.

**Note:** Current boundary polygons are simplified demo shapes with known overlaps. See `docs/boundary-accuracy-evaluation.md` for details and recommendations.

---

## Deployment Architecture

```
GitHub (main branch)
    ↓ GitHub Actions CI (lint → test → build)
    ↓ Firebase CLI (firebase deploy)
Firebase Hosting (CDN-distributed, HTTPS-only)
    ├── /index.html     ← SPA entry point
    ├── /assets/        ← Vite-chunked JS/CSS (hashed filenames)
    ├── /sw.js          ← Service worker
    └── /manifest.json  ← PWA manifest

Service Worker (public/sw.js)
    ├── App cache (stale-while-revalidate)
    └── Tile cache (cache-first, 500 tile LRU)
```

Firebase Hosting handles:
- HTTPS termination
- Global CDN distribution
- Security headers (CSP, HSTS, X-Frame-Options, etc.)
- SPA rewrite (all routes → `/index.html`)
- Gzip/Brotli compression

---

## Key Architectural Decisions

| Decision | Rationale |
|---|---|
| Firebase (no custom backend) | Eliminates server management; real-time Firestore sync ideal for alerts |
| Tab navigation (no URL router) | Preserves Leaflet map state across tab switches without remounting |
| Anonymous auth for reports | Removes friction for citizen reporting; still authenticated (not truly open) |
| Turf.js geofencing client-side | Avoids server round-trip for municipality detection; polygons are small |
| Service worker tile cache | Map usable offline for previously viewed areas; reduces tile bandwidth |
| Vite chunk splitting | Vendor/firebase/leaflet/sentry in separate chunks → better cache reuse |
| DOMPurify + Firestore XSS rules | Defense in depth — sanitize at render AND reject at write |

---

## Directory Map

```
src/
├── components/   → Feature UI components
├── config/       → Firebase init, Sentry setup
├── contexts/     → AuthContext, ReportsContext
├── data/         → Static GeoJSON, disaster types
├── hooks/        → Custom React hooks
├── pages/        → Tab page components
├── test/         → Test utilities
└── utils/        → Pure utilities (geoFencing, sanitization, rateLimit, firebase)

docs/             → Project documentation
principles/       → Architecture and coding principles
workflows/        → Development SOPs
errors/           → Error documentation
scripts/          → Node.js automation (boundary evaluation)
public/           → Static assets (sw.js, manifest.json, icons)
```
