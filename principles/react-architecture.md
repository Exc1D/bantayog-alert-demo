# React Architecture Principles

## Component Hierarchy

```
App.jsx
└── Context Providers (AuthContext, ReportsContext)
    └── Layout (Header, TabNavigation, Footer)
        └── Pages (MapTab, FeedTab, WeatherTab, ProfileTab)
            └── Feature Components (Map, Feed, Weather, Admin, Reports)
                └── Common UI (Button, Modal, Toast, ErrorBoundary, etc.)
```

**Rule:** Data flows down via props; events flow up via callbacks. Siblings communicate through shared context, not direct coupling.

## State Management

Use the appropriate state layer for the job:

| State Type | Tool | Examples |
|---|---|---|
| Server / remote state | `useReports`, `useAuth` hooks backed by Firestore real-time listeners | reports list, auth user |
| Shared app state | React Context (`src/contexts/`) | current user, reports collection |
| Local UI state | `useState` / `useReducer` inside the component | modal open, form values, loading flags |
| Derived state | Computed inside `useMemo` | filtered reports, sorted feed |

**Key files:**
- `src/contexts/AuthContext.jsx` — Firebase Auth state + user profile
- `src/contexts/ReportsContext.jsx` — Firestore real-time reports subscription
- `src/hooks/` — All custom hooks (useAuth, useReports, useGeolocation, useWeather, useRateLimit, etc.)

## Tab Routing

The app uses tab-based navigation (no URL router). `App.jsx` manages `activeTab` state and conditionally renders page components. All four tabs (`map`, `feed`, `weather`, `profile`) are mounted but hidden/shown with CSS to preserve map state across tab switches.

## Lazy Loading

Heavy components (Leaflet map, Admin dashboard) should be loaded with `React.lazy()` + `Suspense` to keep the initial bundle small.

## Error Boundaries

`src/components/Common/ErrorBoundary.jsx` wraps each page-level component and the root. Errors are also reported to Sentry (`src/config/sentry.js`). Do not swallow errors silently — always let the boundary catch and report them.

## Re-render Discipline

- Wrap expensive computations in `useMemo`
- Wrap callbacks passed to child components in `useCallback` when the child is memoized with `React.memo`
- Avoid creating object/array literals directly in JSX props (creates new references every render)
- Prefer context selectors or splitting contexts to avoid over-subscribing
