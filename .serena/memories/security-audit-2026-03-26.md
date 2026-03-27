# Security Audit Follow-up (2026-03-26)

## Completed Fixes ✅
- C-01: weatherAPI.js routes through weatherProxy CF (API key no longer in bundle)
- H-01: sanitizeForNotification() added to notifications.js
- H-02: Storage rules now validate ownership via isReportOwner()/isModeratorOrAdmin()
- Bonus: firebase-admin moved to dependencies in functions/package.json

## N-01 through N-04 — All Fixed ✅ (PR #100, merged `be27781`)

### N-01 (MEDIUM) — Admin Notification Sanitization ✅
- **Files**: `functions/notifications.js` (sendAlertToAll line 237, sendPushNotification line 312)
- **Fix**: Applied `sanitizeForNotification()` to admin-provided title/body
- **Note**: `sanitizeForNotification()` was already defined at line 8 in main

### N-02 (MEDIUM) — WeatherProxy CORS ✅
- **File**: `functions/weatherProxy.js`
- **Fix**: Origin-aware CORS allowlist — validates `Origin` header against `['https://bantayogalert.web.app', 'https://bantayogalert.firebaseapp.com']`
- **Lesson**: Don't hardcode single origin when multiple deployment targets exist

### N-03 (LOW) — Upvote Removal Race Condition ✅
- **File**: `firestore.rules` (lines 225-228)
- **Fix**: Changed `||` to `&&` with exact `-1` decrement: `upvotes == old_upvotes - 1`

### N-04 (LOW) — SW URL Matching ✅
- **File**: `src/firebase-messaging-sw.js` (line 66)
- **Fix**: `includes()` → `endsWith()` to prevent false tab-matching

## Commit
- Last security commit: `be27781` ("security: fix N-01 through N-04 follow-up vulnerabilities (#100)")

## .env Project Config Bug (2026-03-26)
- `.env` (local dev only) had stale `bantayog-alert-demo-36b27` credentials — fixed to `bantayogalert`
- `.env.production` already had correct `bantayogalert` values — CI/CD was never affected
- Only affected `npm run dev` locally; deployed app always used correct project
- Added `.env.example` as a template for future devs
- SW cache v5→v6 bump (`42dd25a`) pushed to force cache refresh
