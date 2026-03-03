# Firebase Security Rules Documentation

## Overview

This document describes the security model for the Bantayog Alert Firebase project, including Firestore database and Cloud Storage security rules.

## Collection Structure

### Firestore Collections

#### `reports` Collection

Contains disaster/emergency reports submitted by users.

**Document Structure:**

```json
{
  "timestamp": "timestamp",
  "reportType": "situation | alert | info",
  "location": {
    "lat": "number",
    "lng": "number",
    "municipality": "string",
    "barangay": "string (optional)",
    "street": "string (optional)",
    "accuracy": "number",
    "municipalityDetectionMethod": "string"
  },
  "disaster": {
    "type": "flood | landslide | fire | earthquake | typhoon | health | road_incident | infrastructure | environmental | security | other | pending",
    "severity": "critical | moderate | minor",
    "description": "string (10-2000 chars)",
    "tags": ["string array (max 10)"]
  },
  "media": {
    "photos": ["url array (max 5)"],
    "videos": ["url array (max 2)"],
    "thumbnails": ["url array (max 5)"]
  },
  "reporter": {
    "userId": "string",
    "name": "string",
    "isAnonymous": "boolean",
    "isVerifiedUser": "boolean"
  },
  "verification": {
    "status": "pending | verified | rejected | resolved",
    "verifiedBy": "string (UID)",
    "verifiedAt": "timestamp",
    "verifierRole": "string",
    "notes": "string",
    "resolution": {
      "resolvedBy": "string (UID)",
      "resolvedAt": "timestamp",
      "evidencePhotos": ["url array"],
      "resolutionNotes": "string",
      "actionsTaken": "string",
      "resourcesUsed": "string"
    }
  },
  "engagement": {
    "views": "number",
    "upvotes": "number",
    "upvotedBy": ["userId array"],
    "commentCount": "number",
    "shares": "number"
  },
  "weatherContext": "map"
}
```

#### `users` Collection

Contains user profile data.

**Document Structure:**

```json
{
  "userId": "string (UID)",
  "displayName": "string",
  "municipality": "string | null",
  "role": "user | moderator | superadmin_provincial | admin_<municipality>",
  "isVerified": "boolean",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

#### `system` Collection

System configuration and settings (admin only).

#### `audit` Collection

Audit logs for security monitoring (admin read, system write only).

### Storage Buckets

| Path                 | Description                      | Access                           |
| -------------------- | -------------------------------- | -------------------------------- |
| `reports/*`          | Report evidence (photos, videos) | Public read, authenticated write |
| `reports/thumbs/*`   | Report thumbnails                | Public read, authenticated write |
| `reports/videos/*`   | Report videos                    | Public read, authenticated write |
| `evidence/*`         | Resolution evidence photos       | Public read, authenticated write |
| `avatars/{userId}/*` | User profile pictures            | Public read, owner write         |
| `admin/*`            | Admin-only uploads               | Admin only                       |

## Security Model

### Authentication

All authenticated operations require a valid Firebase Authentication token:

- Email/password authentication
- Anonymous authentication (for initial report submission)
- OAuth providers (Google, Facebook, etc.)

### Role Definitions

| Role                    | Description         | Permissions                                        |
| ----------------------- | ------------------- | -------------------------------------------------- |
| `user`                  | Regular citizen     | Create reports, upvote, update own profile         |
| `moderator`             | Community moderator | All user permissions + verify/reject reports       |
| `admin_<municipality>`  | Municipal admin     | All moderator permissions + full report management |
| `superadmin_provincial` | Provincial admin    | Full system access                                 |

### Permission Matrix

| Operation           | Public | User | Moderator | Admin |
| ------------------- | ------ | ---- | --------- | ----- |
| Read reports        | ✓      | ✓    | ✓         | ✓     |
| Create report       | -      | ✓    | ✓         | ✓     |
| Upvote report       | -      | ✓    | ✓         | ✓     |
| Verify report       | -      | -    | ✓         | ✓     |
| Reject report       | -      | -    | ✓         | ✓     |
| Resolve report      | -      | -    | ✓         | ✓     |
| Delete report       | -      | -    | -         | ✓     |
| Read users          | Own    | Own  | Own + all | All   |
| Update user profile | Own    | Own  | Own       | Own   |
| Update user role    | -      | -    | -         | ✓     |

## Input Validation

### String Validation

- Maximum length limits per field
- Minimum length for required text (e.g., descriptions)
- HTML/script injection prevention
- XSS prevention (blocks `<script>`, `javascript:`, `on*` handlers)

### Numeric Validation

- Coordinate bounds for Camarines Norte province
- Severity levels: `critical`, `moderate`, `minor`
- Upvote count minimum: 0
- Array size limits

### Array Validation

- Maximum number of photos: 5
- Maximum number of videos: 2
- Maximum tags: 10
- URL length limit: 2048 characters

### Location Validation

- Latitude: 12.5 to 15.5
- Longitude: 122.0 to 124.0
- Municipality must be valid (12 municipalities in Camarines Norte)

## Rate Limiting

Rate limiting is implemented at the application level using client-side checks:

- Maximum 10 reports per hour per user
- Rate limit status returned in API responses

Server-side rate limiting can be implemented via Cloud Functions if needed.

## Testing Rules

### Using Firebase Emulator

1. Start the Firebase emulator:

   ```bash
   firebase emulators:start
   ```

2. Run tests against the emulator:
   ```bash
   firebase emulators:exec --only firestore "npm test"
   ```

### Using firestore.rules.debug

The rules support Firebase's debug mode for testing:

```javascript
// In firestore.rules (for testing only - never deploy)
allow read: if request.debug == true;
```

### Manual Testing with Firebase CLI

```bash
# Deploy rules to emulator
firebase emulators:exec --only firestore,storage "your-test-command"

# Test specific rule
firebase firestore:rules:preview
```

### Test Scenarios

1. **Create Report (Authenticated)**
   - Valid report with all required fields → Success
   - Missing required fields → Failure
   - Invalid municipality → Failure
   - Invalid disaster type → Failure
   - Description too short → Failure
   - Script injection attempt → Failure

2. **Update Report**
   - User upvoting own report → Success
   - User removing upvote → Success
   - User modifying report content → Failure
   - Moderator verifying report → Success
   - Non-moderator verifying report → Failure

3. **Storage Upload**
   - Valid image upload (5MB max) → Success
   - Image exceeding 5MB → Failure
   - Non-image file → Failure
   - Path traversal attempt → Failure
   - Upload to another user's avatar → Failure

## Deployment Instructions

### Deploy Rules

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Storage rules
firebase deploy --only storage:rules

# Deploy both
firebase deploy --only firestore:rules,storage:rules
```

### Deploy with Indexes

```bash
firebase deploy --only firestore:indexes
```

### Pre-deployment Checklist

- [ ] Run all unit tests
- [ ] Test with Firebase Emulator
- [ ] Verify all validation rules
- [ ] Check for security vulnerabilities
- [ ] Review role-based access
- [ ] Test edge cases

### CI/CD Integration

Add to your CI pipeline:

```yaml
# In .github/workflows/ci.yml
- name: Deploy Firebase Rules
  run: |
    firebase deploy --only firestore:rules,storage:rules --project ${{ vars.FIREBASE_PROJECT_ID }}
  if: github.ref == 'refs/heads/main'
```

## Required Indexes

Create the following indexes in `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "reports",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "location.municipality", "order": "ASC" },
        { "fieldPath": "timestamp", "order": "DESC" }
      ]
    },
    {
      "collectionGroup": "reports",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "verification.status", "order": "ASC" },
        { "fieldPath": "timestamp", "order": "DESC" }
      ]
    },
    {
      "collectionGroup": "reports",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "disaster.severity", "order": "ASC" },
        { "fieldPath": "timestamp", "order": "DESC" }
      ]
    },
    {
      "collectionGroup": "reports",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "disaster.type", "order": "ASC" },
        { "fieldPath": "timestamp", "order": "DESC" }
      ]
    }
  ]
}
```

## Security Best Practices

1. **Least Privilege**: Each role has minimum necessary permissions
2. **Defense in Depth**: Multiple validation layers (client + server)
3. **Input Validation**: All user inputs validated and sanitized
4. **Audit Trail**: Admin actions logged for review
5. **Rate Limiting**: Prevents abuse at application level
6. **File Restrictions**: Type and size limits prevent malicious uploads
7. **Path Isolation**: Users can only access their own data paths

## Troubleshooting

### Common Issues

1. **Permission Denied**
   - Check authentication state
   - Verify user role has required permission

2. **Missing Index**
   - Deploy required indexes
   - Check Firebase console for missing index errors

3. **Validation Failed**
   - Check field types match expected types
   - Verify string lengths within limits
   - Ensure required fields present

## Security Headers

The application also implements security headers in `firebase.json`:

- Content-Security-Policy
- X-Content-Type-Options
- X-Frame-Options
- Strict-Transport-Security
- Cross-Origin-Opener-Policy

See `firebase.json` for the complete security header configuration.
