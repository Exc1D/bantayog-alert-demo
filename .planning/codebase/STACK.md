# Tech Stack

## Languages & Runtime

- **Frontend Language**: JavaScript (ES2020+) with JSX, TypeScript 5.9.3 type definitions present
- **Runtime**: Browser (ES2020 target)
- **Node.js**: >=18.x (20.x recommended) for development

## Frameworks & Core Libraries

| Library | Version | Purpose |
|---------|---------|---------|
| React | 18.3.1 | UI component framework |
| React DOM | 18.3.1 | DOM renderer |
| React Router DOM | 6.30.3 | Client-side routing |
| Vite | 5.3.0 | Build tool and dev server |
| @vitejs/plugin-react | 4.3.0 | React integration for Vite |

## Styling & UI

| Library | Version | Purpose |
|---------|---------|---------|
| Tailwind CSS | 3.4.4 | Utility-first CSS framework |
| PostCSS | 8.4.38 | CSS transformations |
| Autoprefixer | 10.4.27 | Vendor prefixing |

## Backend / BaaS (Firebase)

| Service | Version | Purpose |
|---------|---------|---------|
| Firebase (firebase/app) | 10.14.1 | Core Firebase SDK |
| Firestore | 10.14.1 | NoSQL database (50MB cache configured) |
| Firebase Auth | 10.14.1 | Authentication (email/password) |
| Firebase Storage | 10.14.1 | File storage for evidence photos |
| Firebase Messaging | 10.14.1 | Push notifications (lazy-loaded) |
| Firebase Remote Config | 10.14.1 | Feature flags and config (lazy-loaded) |

## Geospatial & Maps

| Library | Version | Purpose |
|---------|---------|---------|
| Leaflet | 1.9.4 | Interactive map library |
| React Leaflet | 4.2.1 | React bindings for Leaflet |
| react-leaflet-markercluster | 3.0.0-rc1 | Marker clustering |
| Turf.js (turf/*) | 7.3.4 | Geospatial analysis (point-in-polygon, distance, centroid) |

## Utilities

| Library | Version | Purpose |
|---------|---------|---------|
| date-fns | 3.6.0 | Date/time manipulation |
| DOMPurify | 3.3.1 | XSS prevention (HTML sanitization) |
| validator | 13.15.26 | Data validation utilities |
| browser-image-compression | 2.0.2 | Client-side image compression |
| web-vitals | 5.1.0 | Performance metrics |
| terser | 5.46.0 | JavaScript minification (production) |

## Error Monitoring & Performance

| Library | Version | Purpose |
|---------|---------|---------|
| Sentry React | 10.40.0 | Error tracking and performance monitoring |
| @sentry/vite-plugin | 5.1.1 | Sentry integration for Vite build |

## Development Tools

### Testing
- **Vitest**: 4.0.18 — Unit and integration tests
- **@testing-library/react**: 16.3.2 — React component testing utilities
- **@testing-library/jest-dom**: 6.9.1 — Custom DOM matchers
- **@testing-library/user-event**: 14.6.1 — User interaction simulation
- **@playwright/test**: 1.58.2 — End-to-end browser tests

### Linting & Formatting
- **ESLint**: 9.39.3 — JavaScript/JSX linting with flat config
- **eslint-plugin-react**: 7.37.5 — React-specific lint rules
- **eslint-plugin-react-hooks**: 7.0.1 — React Hooks rules
- **eslint-config-prettier**: 10.1.8 — Prettier compatibility
- **Prettier**: 3.8.1 — Code formatting

### TypeScript Support
- **TypeScript**: 5.9.3 (dev dependency) — Type checking (`npm run typecheck`)
- **@types/leaflet**: 1.9.21
- **@types/react**: 19.2.14
- **@types/react-dom**: 19.2.3
- **@types/dompurify**: 3.2.0

### Build Optimizations
- **vite-plugin-compression**: 0.5.1 — Gzip compression for production assets
- **vite-tsconfig-paths**: 6.1.1 — TypeScript path alias support

## Configuration Files

- `package.json` — Dependencies and npm scripts
- `tsconfig.json` — TypeScript compilation settings
- `tsconfig.node.json` — TypeScript config for Node.js (Vite plugin)
- `vite.config.js` — Vite build and dev server configuration
- `eslint.config.js` — ESLint flat config (ES2020, React 18, hooks)
- `.prettierrc` — Prettier formatting rules
- `.prettierignore` — Files Prettier should skip
- `tailwind.config.js` — Tailwind CSS customization
- `postcss.config.js` — PostCSS plugins

## Build Output

- Production builds output to `dist/`
- Source maps generated in production when `SENTRY_AUTH_TOKEN` is set
- Code splitting with manual chunks:
  - `vendor-turf` — Turf.js geospatial library
  - `vendor-date` — date-fns utilities
  - `vendor-sentry` — Sentry SDK
  - `vendor-map` — Leaflet and React-Leaflet
  - `vendor-firebase` — Firebase SDKs (auth, firestore, storage)
  - `vendor-firebase-auth` — Firebase Auth specific
  - `vendor-firebase-storage` — Firebase Storage specific
  - `vendor-react` — React and React Router

## Environment Variables

See `.env.example` for all configuration options. Key variables:

- `VITE_FIREBASE_*` — Firebase credentials
- `VITE_OPENWEATHER_API_KEY` — Weather data API key
- `VITE_APP_ENV` — Environment (development/staging/production)
- `VITE_SENTRY_DSN` — Sentry error tracking
- `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` — Sentry publish (CI)
