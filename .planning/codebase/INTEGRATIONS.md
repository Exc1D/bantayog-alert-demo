# Integrations

## External Services & APIs

### Firebase

The application uses Firebase as its primary backend-as-a-service platform.

#### Firestore (NoSQL Database)

- **Usage**: Primary data store for users, reports, announcements, and audit logs
- **Rules file**: `firestore.rules`
- **Indexes**: `firestore.indexes.json`
- **Collections**:
  - `users/{userId}` — User profiles with role, municipality, verification status
  - `reports/{reportId}` — Hazard reports with geolocation, photos, status (pending/verified/resolved)
  - `announcements/{announcementId}` — Official announcements and alerts
  - `audit_logs/{logId}` — Audit trail of admin actions
- **Configuration**: 50MB cache size (`src/utils/firebaseConfig.js`)

#### Firebase Authentication

- **Method**: Email/password sign-up and sign-in
- **User profile**: Stored in Firestore `users` collection with additional metadata (municipality, role, isVerified)
- **Anonymous access**: Allowed for browsing reports (no auth required for read-only features)
- **Role-based access control**: Custom RBAC implemented in `src/utils/rbac.js` and Firestore rules
  - Roles: `user` (citizen), `moderator`, `admin_municipality`, `superadmin_provincial`
  - Permissions: View reports, create reports, moderate, manage users, view analytics, manage settings

#### Firebase Storage

- **Purpose**: Store report evidence photos and user avatar uploads
- **Rules file**: `storage.rules`
- **Bucket**: `bantayog-alert-demo-36b27.firebasestorage.app`
- **Image compression**: Client-side compression before upload (max 5MB per image, 1MB after compression)
- **Security**: Storage rules enforce user ownership and content type validation

#### Firebase Hosting

- **Configuration**: `firebase.json`
- **PWA**: Service worker (`public/sw.js`) for offline caching
- **Rewrite rules**: SPA fallback to `index.html`
- **Security headers**: CSP, HSTS, X-Content-Type-Options, X-Frame-Options, etc.
- **Cache control**:
  - Assets: 1 year immutable
  - `index.html` and `sw.js`: no-cache

#### Remote Config (Lazy-Loaded)

- **Purpose**: Feature flags and runtime configuration
- **Implementation**: Dynamically imported to reduce initial bundle (`src/utils/firebaseConfig.js`)
- **Fetch interval**: 1 hour (3600000ms)

#### Cloud Functions

- **Runtime**: Node.js 20
- **Source directory**: `functions/`
- **Used for**: Server-side logic (not extensively documented in main codebase)

### OpenWeather API

- **Purpose**: Live weather data and alerts display
- **Endpoint**: Weather data for Camarines Norte municipalities
- **Configuration**: `VITE_OPENWEATHER_API_KEY` environment variable
- **Implementation**: `src/utils/weatherAPI.js`
- **Caching**: 30-minute cache to reduce API calls (`WEATHER_CACHE_DURATION`)
- **Display**: Weather tab shows current conditions and forecasts

### Sentry

- **Purpose**: Error tracking and performance monitoring
- **SDK**: `@sentry/react` with Vite plugin
- **DSN**: `VITE_SENTRY_DSN` (production environment)
- **Configuration**: `src/config/sentry.js`
- **Release tracking**: Automatic release name `bantayog-alert@{version}`
- **Source maps**: Uploaded in production builds when `SENTRY_AUTH_TOKEN` is set
- **Telemetry**: Disabled (`telemetry: false`)
- **Ingest domains**: `*.ingest.sentry.io`, `*.sentry.io` (whitelisted in CSP)

### Map Tile Providers

The Leaflet map uses multiple tile sources:

- **OpenStreetMap**: `*.tile.openstreetmap.org`, `*.openstreetmap.org`
- **CartoDB basemaps**: `*.basemaps.cartocdn.com`
- **ArcGIS**: `server.arcgisonline.com` (satellite imagery)

These are configured in map components (e.g., `src/components/Map/LeafletMap.jsx`).

## Webhooks

No webhooks configured. All real-time updates use Firebase Firestore listeners.

## Local Storage

- **Auth persistence**: Firebase Auth handles session persistence automatically
- **Geolocation**: Browser geolocation API used (no persistent storage)
- **Feature flags**: None beyond Firebase Remote Config

## Third-Party Authentication

None. Only Firebase email/password authentication is supported.

## Database Schema (Firestore)

### users

```javascript
{
  userId: string,           // Firebase UID
  email: string,
  displayName: string,
  photoURL: string,         // Optional avatar
  municipality: string,     // One of 12 municipalities in Camarines Norte
  role: string,             // user | admin_municipality | superadmin_provincial
  isVerified: boolean,      // Admin verification status
  createdAt: timestamp,
  lastActive: timestamp
}
```

### reports

```javascript
{
  reportId: string,
  type: string,             // situation | alert | info | emergency
  disasterType: string,     // flood | landslide | fire | earthquake | typhoon | ...
  severity: string,         // critical | moderate | minor | pending
  title: string,
  description: string,
  location: {
    address: string,
    municipality: string,
    coordinates: [number, number]  // [lat, lng]
  },
  photos: [string],         // Storage URLs
  evidence: [string],       // Additional evidence URLs
  status: string,           // pending | verified | rejected | resolved
  reporterId: string,       // userId
  upvotes: [string],        // userIds who upvoted
  verifiedBy: string,       // admin userId
  verifiedAt: timestamp,
  resolvedBy: string,
  resolvedAt: timestamp,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### announcements

```javascript
{
  announcementId: string,
  title: string,
  content: string,          // Sanitized HTML
  municipality: string | null,  // null = province-wide
  createdBy: string,        // admin userId
  createdAt: timestamp,
  expiresAt: timestamp | null
}
```

### audit_logs

```javascript
{
  logId: string,
  userId: string,
  eventType: string,        // LOGIN | REPORT_CREATE | REPORT_VERIFY | ...
  targetType: string,       // user | report | announcement
  targetId: string,
  municipality: string,
  metadata: object,
  ipAddress: string,
  userAgent: string,
  timestamp: timestamp
}
```

## Security Integration Points

- **Content Security Policy**: Defined in `firebase.json` hosting headers — restricts script, style, img, connect, frame sources
- **Firestore Security Rules**: `firestore.rules` enforces RBAC, input validation, and data integrity
- **Storage Security Rules**: `storage.rules` enforces file ownership and size limits
- **Input Sanitization**: `src/utils/sanitization.js` using DOMPurify for HTML content
- **Rate Limiting**: `src/utils/rateLimiter.js` client-side protection against spam

## API Rate Limits

- **OpenWeather API**: External service limits (application-specific, check OpenWeather dashboard)
- **Firebase**: Soft limits per project (monitor Firebase console)
- **Client-side rate limiting**: 5 reports per 10 minutes per user (configurable in `src/utils/rateLimiter.js`)

## Environment-Specific Configurations

The app supports three environments via Vite modes:

- **development** (`vite --mode development`): Local dev, no Sentry, debug console
- **staging** (`npm run build:staging`): Staging Firebase project, Sentry disabled
- **production** (`npm run build`): Production Firebase project, Sentry enabled, minification, gzip

Environment variables are loaded from:
- `.env` (loaded in all environments)
- `.env.development` (development overrides)
- `.env.staging` (staging overrides)
- `.env.production` (production overrides)
- `.env.local` (local overrides, gitignored)
