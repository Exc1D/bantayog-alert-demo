# Frontend Coding Standards

## Tooling

| Tool | Config File | Purpose |
|---|---|---|
| ESLint 9 (flat config) | `eslint.config.js` | Linting — zero warnings policy |
| Prettier | `.prettierrc` (implicit) | Formatting |
| TypeScript | `tsconfig.json` | Type checking (`npm run typecheck`) |

**Before committing:** `npm run lint && npm run format:check && npm run typecheck`

CI enforces all three — zero warnings, no formatting drift, no type errors.

## Naming Conventions

| Entity | Convention | Example |
|---|---|---|
| React components | PascalCase | `ReportModal.jsx`, `WeatherCard.jsx` |
| Custom hooks | camelCase, `use` prefix | `useGeolocation.js`, `useRateLimit.js` |
| Utilities | camelCase | `geoFencing.js`, `sanitization.js` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_PHOTOS`, `DISASTER_TYPES` |
| CSS classes | Tailwind utilities only (no custom class names) | `flex items-center gap-2` |

## File Organization

- One component per file
- Co-locate test files in `src/test/` or alongside the component (see `src/test/`)
- `src/utils/` for pure functions (no React): Firebase config, geofencing, sanitization, rate limiting
- `src/hooks/` for React-specific stateful logic
- `src/data/` for static JSON/JS data (disaster types, boundary data)
- `src/config/` for app configuration and Sentry setup

## React Patterns

**Prefer:**
- Functional components + hooks
- Destructuring props at the function signature
- Early returns for guard clauses (avoids deep nesting)
- Named exports (not default exports for hooks/utilities)

**Avoid:**
- Class components
- Direct DOM manipulation outside of refs
- Inline functions in JSX that create expensive new function references on every render
- `any` TypeScript type

## Performance Patterns

- `React.memo` on components that receive stable props and render often
- `useMemo` for derived/filtered data (e.g., filtered reports list)
- `useCallback` for event handlers passed to memoized children
- Image compression via `browser-image-compression` before upload
- Leaflet map tiles cached by service worker (see `public/sw.js`)
- Vite code splitting configured in `vite.config.js` — vendor, firebase, leaflet chunks

## Import Order

1. React and React DOM
2. Third-party libraries (firebase, leaflet, etc.)
3. Internal — contexts, hooks, utils
4. Internal — components
5. Assets and styles

Prettier and ESLint enforce consistent formatting.
