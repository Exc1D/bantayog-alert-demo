# Session Handoff: Public Reports PII Stripping

## What Was Decided
Implement **Option 2**: Cloud Function sanitized public collection.
- Create `publicReports/{reportId}` collection
- Strip PII: remove `reporter.name`, `reporter.userId`, `reporter.isAnonymous`
- Generalize coordinates: replace exact lat/lng with municipality centroid
- Keep: disaster type, severity, description, timestamp, media URLs (thumbnails only), verification status
- Map UI reads from `publicReports` instead of `reports`

## Current State

### Existing Firestore Trigger (notifications.js:58-60)
```js
exports.sendReportNotification = functions.firestore
  .document('reports/{reportId}')
  .onCreate(async (snap, context) => {
```
This is where the Cloud Function will hook in — when a new report is created in `reports`, the same trigger sanitizes and writes to `publicReports`.

### Reports read rule (firestore.rules:148)
```
allow read: if true;  // ← publicly readable — needs to change
```

## Implementation Steps (Next Session)

### Step 1: Update firestore.rules
- [ ] Change `reports/{reportId} allow read: if true` → `allow read: if isSignedIn()`
- [ ] Add new `publicReports/{reportId}` match block with `allow read: if true` (public map)
- [ ] Restrict write to Cloud Functions only: `allow write: if false` (CF uses Admin SDK which bypasses rules)

### Step 2: Create Cloud Function `functions/createPublicReport.js`
Hook: same `functions.firestore.document('reports/{reportId}').onCreate(...)`

Reads `snap.data()` from `reports/{reportId}`, strips PII:
```js
{
  disaster: data.disaster,           // type, severity, description, tags
  location: {
    municipality: data.location.municipality,
    // lat/lng removed — replaced by no coordinates or municipality only
  },
  reportType: data.reportType,
  media: {
    photos: [],                      // strip photo URLs from public view
    thumbnails: data.media?.thumbnails || [],  // keep thumbnails only
    videos: []                       // strip videos
  },
  verification: {
    status: data.verification?.status || 'pending'
    // strip verifiedBy, verifiedAt, notes, resolution
  },
  engagement: {
    upvotes: data.engagement?.upvotes || 0,
    upvotedBy: []                    // strip who upvoted
  },
  weatherContext: data.weatherContext || {},
  timestamp: data.timestamp,
  // reporter.* stripped entirely
  createdAt: admin.firestore.FieldValue.serverTimestamp()
}
```

### Step 3: Register in functions/index.js
```js
require('./createPublicReport');
```

### Step 4: Update Map UI (FeedTab, MapTab)
- [ ] Change Firestore reads from `reports` → `publicReports`
- [ ] Update component interfaces that expect `reporter.name` etc.

### Step 5: Test
- [ ] New report → appears in `publicReports` within seconds
- [ ] Map displays report without reporter identity
- [ ] `reports` still requires auth to read (verify with Firestore emulator)

## Key Files to Modify
- `firestore.rules` — update read rule, add publicReports match block
- `functions/createPublicReport.js` — NEW
- `functions/index.js` — register new function
- `src/hooks/useReports.js` or wherever map/feed reads reports — switch to publicReports
- UI components reading reporter.* fields from publicReports

## ⚠️ ATTENTION — firestore.rules was linter-reverted
The linter (pre-commit hook?) RESET firestore.rules after my edits.
The deployed rules on Firebase are correct (moderator logic gap fixed, settings validated).
But the LOCAL SOURCE FILE was reverted to the original.

BEGIN NEXT SESSION BY RE-APPLYING these fixes to firestore.rules:
1. Add comment to canCreateReports() role=='' escape hatch (line ~50)
2. Fix moderator update rule logic gap — replace first `isModerator()` branch with field-restricted version (lines ~208-275)
3. Add field validation to user settings subcollection (lines ~314-323)
4. Clarify announcement notifications comment (lines ~400-403)
5. Then run: firebase deploy --only firestore:rules

## Notes
- `publicReports` is append-only (CF creates, client cannot write — rules set `allow write: if false`)
- Keep both collections in sync: `reports` = authoritative, `publicReports` = derived/public
- The Firestore trigger runs server-side so the API key stays safe
