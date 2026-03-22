# Security Principles

> For the detailed security audit findings and pre-deployment checklist, see `docs/security-checklist.md`.
> For Firebase security rules and permission matrix, see `docs/security-rules.md`.

## Content Security Policy (CSP)

CSP headers are set in `firebase.json` under `hosting.headers`.

**Current directives:**
- `default-src 'self'`
- `script-src 'self' 'unsafe-eval'` (Vite + Sentry require eval in dev; review for prod)
- `style-src 'self' 'unsafe-inline'` (Tailwind inline styles)
- `img-src 'self' data: blob: *.tile.openstreetmap.org *.firebasestorage.app`
- `connect-src 'self' *.googleapis.com *.firebaseapp.com api.openweathermap.org *.ingest.sentry.io`
- `frame-src 'self' *.firebaseapp.com`
- `frame-ancestors 'none'` (prevents clickjacking)
- `upgrade-insecure-requests` (auto-upgrades HTTP to HTTPS)
- `object-src 'none'`

When adding new external connections (new API, CDN, etc.), update `connect-src` in `firebase.json` before deploying. CSP violations will show in the browser console.

See `errors/csp-violations.md` for how to diagnose and fix CSP blocks.

## XSS Prevention

- All user-supplied text rendered in JSX uses `{text}` interpolation (React escapes by default)
- Any HTML string (from external sources) is sanitized with **DOMPurify** before use
- `dangerouslySetInnerHTML` is forbidden unless the content has been DOMPurify-sanitized
- Firestore security rules reject strings matching XSS patterns (`<script>`, `javascript:`, `on*`)

**Key file:** `src/utils/sanitization.js`

## Input Validation

Client-side validation uses the `validator` npm library. All validation is also enforced server-side in Firestore security rules (never trust client-only validation).

**Key constraints:**
- Report description: 10–2000 characters
- Disaster type: must be one of the enum values in `src/data/disasterTypes.js`
- Location coordinates: lat 12.5–15.5, lng 122.0–124.0 (Camarines Norte bounds)
- Media URLs: HTTPS only, no data URIs except allowed image MIME types, max 2048 chars

**Key file:** `src/utils/mediaSafety.js` (media URL sanitization)

## RBAC (Role-Based Access Control)

Roles are stored in `users/{uid}.role` in Firestore, never in the JWT or client-side state. The role field is locked against self-modification by security rules.

| Role | Description |
|---|---|
| `user` | Citizens — create reports, upvote |
| `moderator` | Verify/reject reports |
| `admin_<municipality>` | Municipal admin — full report management |
| `superadmin_provincial` | Provincial admin — full system access |

Admin routes in the UI check the role from `AuthContext` before rendering. Security rules are the authoritative enforcement layer.

## Rate Limiting

Client-side rate limiting: max 10 reports per hour per user.
**Key file:** `src/hooks/useRateLimit.js`

Server-side rate limiting via Cloud Functions is planned but not yet deployed.

## Security Headers (firebase.json)

| Header | Value |
|---|---|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` |
| `Cross-Origin-Opener-Policy` | `same-origin` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(self), microphone=(), geolocation=(self)` |

## Audit Logging

Admin actions (verify, reject, resolve) are written to the `audit` Firestore collection. Collection is admin-readable, system-writable only.

## Environment Variables

- Never commit `.env` — it is gitignored
- All secrets in `.env.local` locally, GitHub Secrets in CI
- `VITE_*` prefix means the value is bundled into client JS — don't put server secrets here
- `VITE_OPENWEATHER_API_KEY` should be moved to a Cloud Function proxy (currently exposed in client bundle)

See the rotation schedule in `docs/security-checklist.md`.
