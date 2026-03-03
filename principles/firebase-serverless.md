# Firebase / Serverless Principles

## Firestore Data Model

**Collections:**

| Collection | Purpose | Access |
|---|---|---|
| `reports` | Citizen hazard/disaster reports | Public read, authenticated create |
| `users` | User profiles and roles | Own read/write, admin read all |
| `system` | App configuration | Admin only |
| `audit` | Security/admin audit logs | Admin read, system write |

**Key design decisions:**
- Denormalize for read performance — store `reporter.name` on each report so feed renders without a join
- Use `municipalityDetectionMethod` on location to track boundary detection quality
- `verification.status` enum: `pending | verified | rejected | resolved`

See `docs/security-rules.md` for the full document schema.

## Security Rules

Rules are the *only* server-side enforcement layer. The client must never be trusted for permission checks.

**File:** `firestore.rules`, `storage.rules`

**Principles:**
- Least privilege — grant minimum access per role
- Validate all fields on write (types, lengths, enums, XSS patterns)
- Lock `role` field — users cannot self-promote
- Coordinate bounds constrained to Camarines Norte: lat 12.5–15.5, lng 122.0–124.0

**Deploy:**
```bash
firebase deploy --only firestore:rules,storage:rules
```

**Test with emulator:**
```bash
firebase emulators:start
```

## Authentication Strategy

- Anonymous auth for initial report submission (no friction barrier)
- Email/password for account creation
- Role stored in `users/{uid}.role` — never trust client-supplied role claims
- Admin accounts should use MFA (configured in Firebase Console)

## Storage Rules

| Path | Size Limit | Types |
|---|---|---|
| `reports/*` images | 10 MB | jpeg, png, gif, webp |
| `reports/videos/*` | 50 MB | mp4, quicktime, webm |
| `avatars/{userId}/*` | 5 MB | jpeg, png, gif, webp |

Path isolation enforced: `avatars/{userId}/*` requires `auth.uid == userId`.

## Cloud Functions

Current status: not yet deployed. Planned:
- Proxy OpenWeather API requests (keep key server-side)
- Server-side rate limiting for report creation
- Admin notifications on critical severity reports
- Abuse detection (duplicate/spam patterns)

**File:** `functions/` directory

## Cost Awareness

Firestore billing is per read/write/delete. Avoid:
- Unbounded queries (always limit or paginate)
- Polling — use real-time listeners (`onSnapshot`) instead
- Re-fetching entire collections on filter change — use Firestore composite indexes

**Indexes:** `firestore.indexes.json` — compound indexes on `(location.municipality, timestamp)`, `(verification.status, timestamp)`, `(disaster.severity, timestamp)`, `(disaster.type, timestamp)`.
