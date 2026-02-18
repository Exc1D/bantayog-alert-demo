# Security Checklist — Bantayog Alert

## Critical Issues Found (Audit Results)

### 1. Real API Keys in `.env` (LOCAL ONLY — not committed)

- **Status**: `.env` contains real Firebase and OpenWeather API keys on disk
- **Risk**: LOW — `.env` is in `.gitignore` and was never committed to git history
- **Action**: Ensure `.env` is never committed; use `.env.example` for templates

### 2. OpenWeather API Key Exposure

- **Status**: `VITE_OPENWEATHER_API_KEY` is bundled into the client JS by Vite
- **Risk**: MEDIUM — any user can extract this key from the browser bundle
- **Action**: Proxy weather requests through a Firebase Cloud Function to keep the key server-side

### 3. npm Audit: 17 Moderate Vulnerabilities

- **Packages**: `ajv` (ReDoS), `esbuild` (dev server request leak), `undici` (multiple — random values, decompression bomb, bad cert DoS)
- **Risk**: MODERATE — `esbuild`/`vite` only affect dev server; `undici` affects Firebase SDK at runtime
- **Action**: Run `npm audit fix --force` to upgrade to latest majors, or wait for compatible patch releases

### 4. Firestore `reports` Collection — Public Read

- **Status**: `allow read: if true` — all reports are publicly readable
- **Risk**: LOW if intentional (public alert system), but allows data scraping
- **Action**: Accept if by design; consider rate limiting via App Check

---

## Pre-Deployment Checklist

### Environment Variables

- [ ] All `VITE_*` env vars set in CI/CD (GitHub Secrets or Firebase env config)
- [ ] `.env` file is NOT committed (verify with `git ls-files .env`)
- [ ] `.env.production` contains only placeholder values (no real keys)
- [ ] `.env.development` contains only placeholder values (no real keys)
- [ ] `SENTRY_AUTH_TOKEN` is set only in CI, never in client-side env vars
- [ ] Consider moving `VITE_OPENWEATHER_API_KEY` to a server-side proxy

### Environment Variable Rotation Schedule

| Variable                      | Rotation Frequency         | How to Rotate                                    |
| ----------------------------- | -------------------------- | ------------------------------------------------ |
| Firebase API Key              | On suspected compromise    | Firebase Console → Project Settings → regenerate |
| OpenWeather API Key           | Quarterly or on compromise | openweathermap.org → API Keys → generate new     |
| Sentry Auth Token             | Annually                   | Sentry → Settings → Auth Tokens                  |
| Firebase service account keys | Quarterly                  | Firebase Console → Service Accounts              |

### Firebase Security Rules

- [ ] `firestore.rules` deployed and tested with Firebase Emulator
- [ ] `storage.rules` deployed and tested with Firebase Emulator
- [ ] Reports: authenticated create with owner check (`reporter.userId == auth.uid`)
- [ ] Reports: input validation on description (10–2000 chars), severity (enum), location
- [ ] Reports: XSS pattern rejection in string validation
- [ ] Reports: upvote updates restricted to `engagement` field only
- [ ] Users: cannot self-assign admin roles (`role` field locked on update)
- [ ] Users: cannot modify `userId` field after creation
- [ ] Users: delete disallowed (admin manages via Admin SDK)
- [ ] Storage: image types restricted to jpeg/png/gif/webp
- [ ] Storage: video types restricted to mp4/quicktime/webm
- [ ] Storage: size limits enforced (images 10MB, videos 50MB, avatars 5MB)
- [ ] Storage: avatar path enforces `auth.uid == userId`

### Firebase App Check

- [ ] Enable App Check with reCAPTCHA Enterprise for web
- [ ] Enforce App Check on Firestore
- [ ] Enforce App Check on Storage
- [ ] Enforce App Check on Authentication

---

## Client-Side Security Measures

### Implemented

- [x] Firebase config loaded from environment variables (`src/config/index.js`)
- [x] Config validation on startup (missing keys throw)
- [x] Config objects frozen with `Object.freeze()`
- [x] HTML sanitization via DOMPurify (`dompurify` in dependencies)
- [x] Input validation via `validator` library
- [x] Media URL sanitization (`src/utils/mediaSafety.js`)
  - HTTPS and blob protocols only
  - Data URI restricted to allowed image MIME types
  - URL length limits
  - Credential stripping from URLs
- [x] Firestore XSS pattern rejection in security rules
- [x] Anonymous auth for report submissions (no open write)

### Recommended Additions

- [ ] Add Content Security Policy meta tag or HTTP header (see `src/utils/securityHeaders.js`)
- [ ] Add Subresource Integrity (SRI) for CDN scripts if any
- [ ] Implement client-side rate limiting for report submissions
- [ ] Add CAPTCHA or App Check attestation before report submission
- [ ] Sanitize all user input with DOMPurify before rendering (verify all render paths)

---

## Server-Side Security Measures (To Implement)

### Firebase Cloud Functions

- [ ] Proxy OpenWeather API calls to hide API key from client
- [ ] Implement server-side rate limiting for report creation
- [ ] Add abuse detection (duplicate reports, spam patterns)
- [ ] Send admin notifications on critical severity reports
- [ ] Log security events (failed auth attempts, rule violations)

### Firebase Authentication

- [ ] Enable email enumeration protection
- [ ] Configure password policy (minimum length, complexity)
- [ ] Enable multi-factor authentication for admin accounts
- [ ] Set session duration limits
- [ ] Review and restrict OAuth redirect domains

### Firebase Hosting

- [ ] Add security headers in `firebase.json` hosting config:
  ```json
  {
    "hosting": {
      "headers": [
        {
          "source": "**",
          "headers": [
            { "key": "X-Content-Type-Options", "value": "nosniff" },
            { "key": "X-Frame-Options", "value": "DENY" },
            { "key": "X-XSS-Protection", "value": "0" },
            { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
            {
              "key": "Permissions-Policy",
              "value": "camera=(self), microphone=(), geolocation=(self)"
            },
            {
              "key": "Content-Security-Policy",
              "value": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: *.tile.openstreetmap.org *.firebasestorage.app; connect-src 'self' *.googleapis.com *.firebaseapp.com api.openweathermap.org *.ingest.sentry.io; frame-src 'self' *.firebaseapp.com; object-src 'none'; base-uri 'self'"
            }
          ]
        }
      ]
    }
  }
  ```

### Network and Infrastructure

- [ ] Enable Firebase Hosting HTTPS-only (enabled by default)
- [ ] Configure CORS on Cloud Functions
- [ ] Set up VPC Service Controls if using GCP services beyond Firebase
- [ ] Enable Cloud Audit Logs

---

## Monitoring and Alerting

### Error Tracking

- [ ] Sentry DSN configured for production (`VITE_SENTRY_DSN`)
- [ ] Sentry source maps uploaded during CI build
- [ ] Alert rules configured for error spikes

### Firebase Monitoring

- [ ] Enable Firebase Performance Monitoring
- [ ] Set up Firestore usage alerts (reads/writes/deletes)
- [ ] Set up Storage usage alerts (bandwidth, storage size)
- [ ] Set up Authentication alerts (unusual sign-in patterns)
- [ ] Monitor Firebase Security Rules evaluation metrics

### Abuse Detection

- [ ] Alert on > 100 report creations per hour
- [ ] Alert on > 1000 storage uploads per hour
- [ ] Alert on failed authentication spikes (> 50/minute)
- [ ] Monitor for unusual data access patterns (bulk reads)
- [ ] Set up budget alerts for Firebase billing

### Incident Response

- [ ] Document API key rotation procedure
- [ ] Document Firebase rules emergency lockdown procedure
- [ ] Establish on-call rotation for production alerts
- [ ] Maintain list of all third-party API keys and their owners

---

## Dependency Management

- [ ] Dependabot enabled (`.github/dependabot.yml` ✓)
- [ ] Run `npm audit` in CI pipeline
- [ ] Review and merge dependency update PRs weekly
- [ ] Pin major versions in `package.json` to prevent breaking changes
