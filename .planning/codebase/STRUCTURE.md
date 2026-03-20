# Directory Structure

## Top-Level Structure

```
bantayog-alert-demo/
├── .claude/              # Claude Code project configuration
├── .github/              # GitHub Actions workflows
├── .planning/            # GSD planning artifacts (created by workflow)
├── .serena/              # Serena agent configuration
├── .tmp/                 # Temporary build/test artifacts (ignored)
├── coverage/             # Test coverage reports
├── docs/                 # Project documentation (SECURITY.md, PRIVACY.md, etc.)
├── e2e/                  # Playwright end-to-end tests
├── errors/               # Error troubleshooting guides
├── functions/            # Firebase Cloud Functions (Node.js)
├── nginx/                # Docker Nginx configuration
├── node_modules/         # npm dependencies
├── principles/           # Architecture and coding standards
├── public/               # Static assets (favicon, manifest, sw.js)
├── scripts/              # Build and utility scripts
├── src/                  # Application source code
├── workflows/            # GSD workflow definitions
├── .env.example          # Environment variables template
├── .firebase/            # Firebase CLI configuration
├── firebase.json         # Firebase Hosting configuration
├── firestore.rules       # Firestore security rules
├── firestore.indexes.json # Firestore composite indexes
├── index.html            # HTML entry point
├── package.json          # Dependencies and scripts
├── vite.config.js        # Vite build configuration
├── tailwind.config.js    # Tailwind CSS configuration
├── postcss.config.js     # PostCSS configuration
├── tsconfig.json         # TypeScript configuration
├── eslint.config.js      # ESLint flat configuration
├── .prettierrc           # Prettier configuration
└── README.md             # Project overview

```

## Source Code Structure (`src/`)

```
src/
├── main.jsx                      # Application entry point
├── App.jsx                       # Root component with router setup
├── App.test.jsx                  # App component tests
├── App.css                       # Global styles
│
├── components/                   # React components organized by domain
│   ├── Admin/                    # Administrator interface
│   │   ├── AdminDashboard.jsx
│   │   ├── AdminAlertsTab.jsx
│   │   ├── AdminGuard.jsx        # RBAC protection
│   │   ├── AdminMapView.jsx
│   │   ├── AdminNav.jsx
│   │   ├── AdminShell.jsx        # Main admin layout
│   │   ├── AllReports.jsx
│   │   ├── AnnouncementItem.jsx
│   │   ├── CreateAnnouncementForm.jsx
│   │   ├── DispatchForm.jsx
│   │   ├── QueueItem.jsx
│   │   ├── ReportDetail.jsx
│   │   ├── StatusBar.jsx
│   │   ├── TriageQueue.jsx
│   │   ├── VerificationPanel.jsx
│   │   ├── EvidenceUpload.jsx
│   │   ├── ResolutionModal.jsx
│   │   └── (*.test.jsx)         # Component tests
│   │
│   ├── Alerts/                   # Alert display components
│   │   ├── AnnouncementCard.jsx
│   │   ├── NearestReportCard.jsx
│   │   ├── SuspensionCard.jsx
│   │   ├── WeatherCard.jsx
│   │   └── (*.test.jsx)
│   │
│   ├── Common/                   # Reusable UI components
│   │   ├── A11yProvider.jsx
│   │   ├── Button.jsx            # Standardized button with variants
│   │   ├── ConfirmDialog.jsx
│   │   ├── EmptyState.jsx
│   │   ├── ErrorBoundary.jsx     # Global error catcher
│   │   ├── ErrorFallback.jsx
│   │   ├── FeatureFlag.jsx
│   │   ├── LoadingSpinner.jsx
│   │   ├── Modal.jsx
│   │   ├── NotificationCenter.jsx
│   │   ├── OfflineIndicator.jsx
│   │   ├── PrivacySettings.jsx
│   │   ├── PullToRefresh.jsx
│   │   ├── RateLimitIndicator.jsx
│   │   ├── ReportErrorButton.jsx
│   │   ├── RequirePermission.jsx
│   │   ├── SanitizedHTML.jsx
│   │   ├── ShareButton.jsx
│   │   ├── SignUpPromptModal.jsx
│   │   ├── Skeleton.jsx
│   │   ├── Toast.jsx
│   │   └── (*.test.jsx)
│   │
│   ├── Feed/                     # Feed tab components
│   │   ├── EngagementButtons.jsx
│   │   ├── FeedFilters.jsx
│   │   ├── FeedList.jsx
│   │   ├── FeedPost.jsx
│   │   ├── PhotoGrid.jsx
│   │   ├── ResolutionSheet.jsx
│   │   └── (*.test.jsx)
│   │
│   ├── Layout/                   # App layout components
│   │   ├── AppShell.jsx          # Main layout wrapper
│   │   ├── EnhancedSidebar.jsx
│   │   ├── Footer.jsx
│   │   ├── Header.jsx
│   │   ├── IconSidebar.jsx
│   │   ├── TabNavigation.jsx
│   │   └── (*.test.jsx)
│   │
│   ├── Map/                      # Map tab components
│   │   ├── CriticalAlertBanner.jsx
│   │   ├── DisasterMarker.jsx
│   │   ├── LeafletMap.jsx        # Main map component
│   │   ├── MapControls.jsx
│   │   ├── MapErrorBoundary.jsx
│   │   ├── MapFlyToLocation.jsx
│   │   ├── MapSkeleton.jsx
│   │   ├── MarkerClusterGroup.jsx
│   │   ├── PersistentMapPanel.jsx
│   │   └── (*.test.jsx)
│   │
│   ├── Profile/                  # User profile components
│   │   ├── AvatarUpload.jsx
│   │   ├── SettingsGroup.jsx
│   │   └── (*.test.jsx)
│   │
│   ├── Reports/                  # Report creation and submission
│   │   ├── DetailsStep.jsx
│   │   ├── DisasterTypeSelector.jsx
│   │   ├── EvidenceCapture.jsx
│   │   ├── PhotoStep.jsx
│   │   ├── ReportForm.jsx
│   │   ├── ReportModal.jsx
│   │   ├── ReportSubmission.jsx
│   │   ├── ReportTypeSelector.jsx
│   │   ├── ReportTypeStep.jsx
│   │   └── (*.test.jsx)
│   │
│   ├── Settings/                 # User settings
│   │   └── NotificationSettings.jsx
│   │
│   ├── Weather/                  # Weather tab components
│   │   ├── WeatherAlerts.jsx
│   │   ├── WeatherCard.jsx
│   │   └── WeatherGrid.jsx
│   │
│   └── (*.test.jsx)              # Component tests follow naming pattern
│
├── contexts/                     # React Context providers
│   ├── AuthContext.jsx
│   ├── AuthContext.test.jsx
│   ├── MapPanelContext.jsx
│   ├── MapPanelContext.test.jsx
│   ├── ReportsContext.jsx
│   ├── ReportsContext.test.jsx
│   └── ThemeContext.jsx
│
├── hooks/                        # Custom React hooks
│   ├── useAccessibility.js
│   ├── useAnnouncements.js
│   ├── useAnnouncements.test.js
│   ├── useAuditLog.js
│   ├── useAuth.js                # Authentication logic
│   ├── useAuth.test.js
│   ├── useErrorBoundary.js
│   ├── useErrorReporting.js
│   ├── useFeatureFlag.js
│   ├── useFeatureFlag.test.js
│   ├── useFirestorePersistence.js
│   ├── useGeolocation.js
│   ├── useGeolocation.test.js
│   ├── useInfiniteScroll.js
│   ├── useIsLg.js
│   ├── useIsLg.test.js
│   ├── useNearestReport.js
│   ├── useNearestReport.test.js
│   ├── useOffline.js
│   ├── usePermissions.js
│   ├── usePushNotifications.js
│   ├── useRateLimit.js
│   ├── useRateLimit.test.js
│   ├── useReports.js
│   ├── useReports.test.js
│   ├── useSanitization.js
│   ├── useWeather.js
│   ├── useWeather.test.js
│   └── useWebVitals.js
│
├── pages/                        # Page-level components (routes)
│   ├── AlertsTab.jsx
│   ├── FeedTab.jsx
│   ├── MapTab.jsx
│   ├── ProfileTab.jsx
│   └── ReportPage.jsx
│
├── utils/                        # Utility functions and modules
│   ├── auditLogger.js           # Audit logging
│   ├── cn.js                    # classnames utility
│   ├── constants.js             # App constants (municipalities, colors, etc.)
│   ├── firebaseConfig.js       # Firebase initialization and lazy loading
│   ├── firebaseStorage.js      # Storage operations
│   ├── geoFencing.js           # Turf.js geofencing logic
│   ├── imageCompression.js
│   ├── mediaSafety.js
│   ├── rateLimiter.js          # Client-side rate limiting
│   ├── rbac.js                 # Role-based access control
│   ├── sanitization.js         # DOMPurify wrapper
│   ├── securityHeaders.js
│   ├── sentry.js               # Sentry configuration
│   ├── timeUtils.js
│   ├── weatherAPI.js           # OpenWeather API client
│   ├── webVitals.js
│   └── (*.test.js, *.stress.test.js)
│
├── config/                      # Configuration modules
│   ├── featureFlags.js         # Feature toggle definitions
│   ├── featureFlags.test.js
│   ├── index.js                # Main config aggregator
│   ├── sentry.js               # Sentry config
│   └── tabs.jsx                # Tab navigation configuration
│
├── data/                        # Static data
│   └── disasterTypes.js        # Disaster type definitions
│
├── test/                        # Test utilities and fixtures
│   ├── fixtures.js
│   └── utils.jsx
│
└── setupTests.js                # Vitest global setup
```

## Key File Locations

### Configuration

| Purpose | File |
|---------|------|
| Build configuration | `vite.config.js` |
| TypeScript config | `tsconfig.json` |
| ESLint rules | `eslint.config.js` |
| Prettier format | `.prettierrc` |
| Tailwind CSS | `tailwind.config.js` |
| Firebase hosting | `firebase.json` |
| Firestore rules | `firestore.rules` |
| Storage rules | `storage.rules` |
| Environment vars | `.env`, `.env.*` |

### Testing

| Purpose | File |
|---------|------|
| Test framework config | `vitest` section in `vite.config.js` |
| Test setup file | `src/setupTests.js` |
| E2E tests | `e2e/` directory |
| Coverage report | `coverage/` directory |
| Playwright config | `playwright.config.js` |

### Deployment

| Purpose | File |
|---------|------|
| Firebase project config | `.firebaserc` |
| GitHub Actions workflows | `.github/workflows/` |
| Docker development | `docker-compose.dev.yml` |
| Docker production | `Dockerfile`, `docker-compose.yml` |
| Nginx reverse proxy | `nginx/` |

## Naming Conventions

### Files

- **Components**: `PascalCase.jsx` (e.g., `AdminDashboard.jsx`)
- **Hooks**: `camelCase.js` with `use` prefix (e.g., `useAuth.js`)
- **Utils**: `camelCase.js` (e.g., `firebaseConfig.js`)
- **Tests**: Same name as source with `.test.jsx` or `.test.js` suffix
- **Pages**: `PascalCase.jsx` (e.g., `MapTab.jsx`)
- **Contexts**: `PascalContext.jsx` (e.g., `AuthContext.jsx`)

### Directories

- **Domain grouping**: Components organized by feature (`Admin/`, `Map/`, `Feed/`)
- **Shared components**: `Common/` directory for reusable UI
- **Layout**: `Layout/` for app shell and navigation
- ** Utilities**: `utils/` for pure functions, `hooks/` for React state logic

### Exports

- **Default export**: Single component or main function per file
- **Named exports**: Constants, utilities, helper functions
- **Index files**: `index.js` re-exports for convenience (e.g., `config/index.js`)

## Code Organization Patterns

### Component Structure

Components follow functional React patterns with hooks:

```jsx
// 1. Imports (React, external libs, local modules)
// 2. Component definition with props destructuring
// 3. Custom hooks for state/effects
// 4. Event handlers (memoized if needed)
// 5. Render logic (conditional, map, etc.)
// 6. Default export
```

Example: `src/components/Common/Button.jsx`

### Hook Structure

Hooks encapsulate business logic and side effects:

```javascript
// 1. Imports
// 2. Hook function with parameters
// 3. State/ref initialization
// 4. useEffect for side effects (subscriptions, listeners)
// 5. Memoized callbacks (useCallback) if exposed
// 6. Return value (state, methods, both)
```

Example: `src/hooks/useAuth.js`

### Context Providers

Providers combine hooks and context to share state:

```jsx
const Context = createContext();
export function Provider({ children }) {
  const state = useSomeHook();
  return <Context.Provider value={state}>{children}</Context.Provider>;
}
export function useContext() {
  return useContext(Context);
}
```

Example: `src/contexts/AuthContext.jsx`
