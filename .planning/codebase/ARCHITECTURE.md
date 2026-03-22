# Architecture

## Architectural Pattern

**Bantayog Alert** follows a **React component architecture** with the following characteristics:

- **Component-based UI**: Reusable, composable React components organized by domain (Admin, Alerts, Feed, Map, etc.)
- **Provider pattern**: Context providers for global state (Auth, Reports, Theme, Toasts)
- **Custom hooks**: Business logic encapsulated in reusable hooks (`src/hooks/`)
- **Lazy loading**: Routes and admin section code-split for performance
- **Firebase BaaS**: Real-time data via Firestore listeners, authentication, and storage
- **Security-first**: Defense in depth with input sanitization, RBAC, and Firestore security rules

## System Layers

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │   Map    │  │   Feed   │  │  Alerts  │  │  Admin   │  │
│  │   Tab    │  │   Tab    │  │   Tab    │  │   Tab    │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
├─────────────────────────────────────────────────────────────┤
│                     Component Layer                        │
│  Layout│ Common│ Profile│ Reports│ Weather│ Admin│ Map…  │
├─────────────────────────────────────────────────────────────┤
│                      State Layer                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Auth Ctx │  │Reports Ctx│ │Theme Ctx │  │Toasts    │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
├─────────────────────────────────────────────────────────────┤
│                      Hook Layer                            │
│  useAuth│useReports│useGeolocation│useWeather│useRateLimit│
├─────────────────────────────────────────────────────────────┤
│                     Service Layer                          │
│  Firebase Config│Firestore Listeners│Storage│Messaging│API│
├─────────────────────────────────────────────────────────────┤
│                     Infrastructure                        │
│  Firebase (Auth, Firestore, Storage, Hosting)              │
│  OpenWeather API │ Sentry │ Map Tile Providers            │
└─────────────────────────────────────────────────────────────┘
```

## Core Abstractions

### 1. Authentication (`src/contexts/AuthContext.jsx`, `src/hooks/useAuth.js`)

- **Provider**: `AuthProvider` wraps the entire app
- **Hook**: `useAuth()` manages Firebase Auth lifecycle
- **Data flow**:
  1. `onAuthStateChanged` listener triggers on auth state change
  2. Fetch user profile from Firestore `users/{uid}`
  3. Store `{ user, userProfile, loading }` in context
- **Methods**: `signIn`, `signUp`, `signOut`, `resetPassword`
- **Lazy loading**: Firebase Auth dynamically imported to reduce initial bundle

### 2. Reports (`src/contexts/ReportsContext.jsx`, `src/hooks/useReports.js`)

- **Provider**: `ReportsProvider` wraps authenticated routes
- **Real-time**: Firestore `onSnapshot` listeners for live updates
- **CRUD operations**: Create report, batch fetch with pagination (`getReports`), update status
- **Caching**: Reports stored in context state; `last reports` memoized
- **Subscription**: Auto-unsubscribe on unmount

### 3. Geolocation & Geofencing (`src/hooks/useGeolocation.js`, `src/utils/geoFencing.js`)

- **useGeolocation**: Browser geolocation API wrapper with error handling
- **geoFencing**: Turf.js `booleanPointInPolygon` determines which municipality a coordinate falls within
- **Boundary data**: Municipality polygons stored in Leaflet GeoJSON format (`src/components/Map/LeafletMap.jsx`)
- **Precision**: Point-in-polygon with tolerance for boundary edge cases

### 4. Map (`src/components/Map/LeafletMap.jsx`)

- **Library**: React-Leaflet 4.x with custom components
- **Marker clustering**: `react-leaflet-markercluster` for performance with many reports
- **Tile layers**: OpenStreetMap, CartoDB, ArcGIS (configurable)
- **Custom marker**: `DisasterMarker` component colored by disaster type (`MARKER_COLORS`)
- **Geofencing visualization**: Optional municipality boundary overlay
- **Fly-to animations**: `MapFlyToLocation` for smooth transitions

### 5. Reporting Flow (`src/pages/ReportPage.jsx`, `src/components/Reports/`)

- **Multi-step wizard**: Type → Location → Details → Photo → Review → Submit
- **Image compression**: Client-side using `browser-image-compression` before upload
- **Validation**: Client-side checks before submission
- **Rate limiting**: `useRateLimit` hook prevents spam (5 reports / 10 min)
- **Audit logging**: Every report event logged to `audit_logs` collection

### 6. Admin Interface (`src/components/Admin/`)

- **Protection**: `AdminGuard` component checks user role before rendering
- **RBAC**: Role-based UI element visibility (`hasPermission` from `rbac.js`)
- **Features**: 
  - Queue management (pending reports)
  - Verification panel (review evidence, approve/reject)
  - Dispatch form (create official announcements)
  - Analytics (view counts, trends)
- **Known gap**: Admin tab routing is non-functional under React Router v6 nested routes — marked for rebuild in Phase 3 (see `App.jsx` comment)

## Data Flow Patterns

### Reading Data

1. **Initial load**: Components use `useEffect` to call `getReports()` or similar from ReportsContext
2. **Real-time updates**: Firestore `onSnapshot` listeners subscribe in provider/hook
3. **State update**: New data triggers React re-render
4. **Cleanup**: Unsubscribe on unmount to prevent memory leaks

### Writing Data

1. **User action** → component event handler
2. **Validation** → client-side checks (required fields, file size, rate limit)
3. **Optimistic update** (if applicable) → update context state immediately
4. **Firestore write** → `setDoc`, `updateDoc`, or `addDoc`
5. **Error handling** → `try/catch`, display toast, rollback optimistic update
6. **Audit logging** → `logAuditEvent` records admin actions

### Image Upload

1. Select file(s) → browser file input
2. Compress → `browser-image-compression` (max 1MB, max 1920px dimension)
3. Upload → Firebase Storage `uploadBytes` with progress tracking
4. Store URL → Save download URL in report document
5. Cleanup → Old images deleted if report is rejected

## Routing Strategy

**Router**: `react-router-dom@6` with `createBrowserRouter`

```javascript
const router = createBrowserRouter([
  {
    element: <AppShell />,  // Layout wrapper (header, sidebar, footer)
    children: [
      { index: true, element: <MapTab /> },              // /
      { path: 'feed', element: <FeedTab /> },            // /feed
      { path: 'alerts', element: <AlertsTab /> },        // /alerts
      { path: 'profile', element: <ProfileTab /> },      // /profile
      { path: 'report', element: <ReportPage /> },       // /report
      { path: 'report/:id', element: <ReportPage /> },  // /report/:id
      {
        path: 'admin',
        element: <AdminGuard />,  // RBAC check
        children: [{ path: '*', element: <AdminShell /> }],
      },
    ],
  },
]);
```

**Lazy loading**: All routes use `React.lazy()` for code splitting:
- Citizen tabs → separate chunks (MapTab, FeedTab, etc.)
- Admin → separate chunk (AdminShell — zero bytes downloaded for citizens)

**Note**: AdminShell currently renders dashboard only; nested admin tab routing planned for Phase 3.

## Security Model

### Defense in Depth

1. **Input validation**: Client-side (required fields, file types, sizes)
2. **Sanitization**: `DOMPurify` for HTML content (announcements, user input)
3. **Rate limiting**: Client-side per-user limits (can be bypassed, complements server-side)
4. **Firestore rules**: Server-side authorization and validation (see `firestore.rules`)
5. **Storage rules**: File ownership and size enforcement
6. **CSP headers**: Content Security Policy prevents XSS and data injection
7. **Audit logging**: All admin actions recorded for accountability

### Role Hierarchy

```
  superadmin_provincial  (full access)
       ↑
       admin_municipality  (municipality-scoped)
       ↑
       moderator           (verification + analytics)
       ↑
       user                (report + view)
```

Roles are stored in `users` collection and checked via:
- Client: `src/utils/rbac.js` `hasPermission(role, permission)`
- Server: Firestore rules `userRole()`, `isAdmin()`, `isModerator()`

### Authentication State

- **Persistence**: Firebase Auth persists across browser sessions (localStorage)
- **Token refresh**: Automatic via Firebase SDK
- **Sign out**: Clears local state and redirects to map

## Performance Considerations

### Bundle Splitting

Manual code splitting via `rollupOptions.output.manualChunks` in `vite.config.js`:
- Vendor libraries grouped by domain (map, turf, firebase, sentry, react, date-fns)
- Reduces initial bundle size, improves caching

### Lazy Loading

- Route-based: Each tab (`MapTab`, `FeedTab`, etc.) loaded only when navigated to
- Feature-based: Firebase Auth, Storage, Remote Config, Messaging loaded on-demand
- Admin section: Separate chunk, not loaded for citizens

### Image Optimization

- Client-side compression before upload (5MB → 1MB max)
- Responsive images: Not implemented (all sizes equal)
- Caching: Asset caching via service worker (PWA)

### Firestore Query Optimization

- **Indexes**: `firestore.indexes.json` composite indexes for common queries
- **Pagination**: Feed uses offset-based pagination (`getReports` with `pageSize`)
- **Real-time**: Listeners limited to active views; unsubscribed on unmount
- **Cache**: 50MB Firestore cache configured

### Map Performance

- **Marker clustering**: Groups nearby markers at low zoom levels
- **GeoJSON simplification**: Not implemented — full boundaries loaded
- **Canvas renderer**: Not used — default SVG (Leaflet default)

## Error Handling

### Global Error Boundary

`src/components/Common/ErrorBoundary.jsx` catches React render errors:
- Displays fallback UI
- Reports to Sentry via `captureException`
- Allows user to retry

### Hook Error Handling

Hooks use `try/catch` and report to Sentry:
- `useAuth`: Auth failures, profile fetch errors
- `useReports`: Query errors, write errors
- `useWeather`: API errors, cache misses

Example: `useAuth` catches Firebase errors and sends to Sentry with context.

### Network Error Handling

- **Firestore offline**: Firestore SDK handles offline queue automatically
- **Image upload**: Retry logic not implemented — fails fast
- **API calls**: `weatherAPI` has try/catch, returns null on failure

## Known Issues & Gaps

1. **Admin routing**: Admin tab navigation broken — nested routes not properly connected (see `App.jsx` comment)
2. **Real-time for citizens**: Report updates only visible when user navigates to feed (no global listener)
3. **Image compression quality**: 1MB max may still be too large for slow connections
4. **TypeScript coverage**: JS files lack type safety (`.jsx` extensions, no JSDoc contracts)
5. **E2E test flakiness**: Playwright tests occasionally fail due to network timing (not stabilized)

## Entry Points

- **Application entry**: `src/main.jsx` → renders `App` into `#root`
- **App component**: `src/App.jsx` → sets up router, providers, error boundary
- **Build entry**: Vite uses `index.html` as HTML entry, `src/main.jsx` as JS entry

## Deployment Architecture

```
GitHub Repository
       ↓
   GitHub Actions (CI)
       ↓
   Firebase Hosting (Production)
   Firebase Hosting (Staging, preview deploys)
```

**Deploy workflow**:
1. Push to branch → GitHub Actions runs tests, lint, typecheck
2. Merge to main → Deploy to staging (preview URL)
3. Manual approval → Deploy to production (`firebase deploy --only hosting`)
4. Functions deployed separately (`firebase deploy --only functions`) if changed

**Environment separation**:
- **Firebase projects**: Separate Firebase projects for dev/staging/production (configurable via env vars)
- **API keys**: Different OpenWeather keys per environment (or shared)
