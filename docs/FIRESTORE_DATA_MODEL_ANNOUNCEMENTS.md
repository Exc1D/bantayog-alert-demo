# Firestore Data Model: Announcements

**For: Frontend Dev (Bantayog Alert Sprint 1)**
**Date: 2026-03-24**
**Status: READY FOR UI DEVELOPMENT**

---

## Collection Structure

### `announcements/{announcementId}`

The main announcements collection. Public read, admin write only.

### `announcements/{announcementId}/notifications/{notificationId}`

Subcollection that logs all push notification sends. Admin read, system write only.

---

## Announcement Document Fields

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `type` | string | YES | Enum values (see below) | Announcement category |
| `title` | string | YES | Max 100 chars | Short title for the announcement |
| `body` | string | YES | Max 2000 chars | Full announcement text |
| `severity` | string | YES | `critical`, `warning`, `info` | Alert severity level |
| `scope` | string | YES | `Provincial` OR municipality name | Geographic scope |
| `createdBy` | string | YES | UID | Admin UID who created |
| `createdByRole` | string | YES | Role string | Role of creator (e.g., `admin_daet`) |
| `active` | boolean | YES | Must be `true` on create | Soft-delete flag |
| `createdAt` | timestamp | YES | Server timestamp | Creation time |
| `deactivatedAt` | timestamp | YES | Null on create | Set when deactivated |
| `deleteAt` | timestamp | YES | Future timestamp | TTL for auto-purge |

### Announcement Types (enum)

```javascript
const ANNOUNCEMENT_TYPES = [
  { id: 'class-suspension', label: 'Class Suspension' },
  { id: 'work-suspension', label: 'Work Suspension' },
  { id: 'flood-advisory', label: 'Flood Advisory' },
  { id: 'road-closure', label: 'Road Closure' },
  { id: 'evacuation-order', label: 'Evacuation Order' },
  { id: 'storm-surge', label: 'Storm Surge' },
  { id: 'health-advisory', label: 'Health Advisory' },
  { id: 'emergency-notice', label: 'Emergency Notice' },
];
```

### Severity Levels

| Severity | Use Case | UI Style |
|----------|----------|----------|
| `critical` | Immediate danger, evacuation orders | Red badge |
| `warning` | Advisories, potential hazards | Orange badge |
| `info` | General announcements, class suspensions | Gray/Stable badge |

### Scope Values

| Scope | Who Can Create | Example |
|-------|----------------|---------|
| `Provincial` | `superadmin_provincial` only | Province-wide alerts |
| `Daet`, `Labo`, etc. | Municipal admin (`admin_<municipality>`) | Localized to that municipality |

---

## Notification Subcollection Fields

Written by Cloud Function `sendPushNotification` after FCM send.

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Notification title |
| `body` | string | Notification body |
| `topic` | string | FCM topic (e.g., `all-citizens`, `municipality_daet`) |
| `url` | string | Deep link URL (default: `/#feed`) |
| `sentAt` | timestamp | When notification was sent |
| `sentBy` | string | UID who triggered the send |
| `sentByRole` | string | Role of sender |
| `status` | string | `sent` or `failed` |
| `fcmMessageId` | string | FCM message ID (null if failed) |
| `error` | string | Error message (only if failed) |

---

## Firestore Security Rules Summary

### Announcements (`/announcements/{id}`)
- **Read**: Public (anyone can read)
- **Create**: Admins only, with scope validation
- **Update**: Admins can deactivate (set `active=false`, `deactivatedAt=now`)
- **Delete**: Forbidden (TTL policy handles purging)

### Notifications (`/announcements/{id}/notifications/{id}`)
- **Read**: Admins only (for audit trail)
- **Create**: Admins only (Cloud Function writes)
- **Update/Delete**: Forbidden (immutable)

---

## Example Document

```json
{
  "type": "flood-advisory",
  "title": "Flood Advisory for Daet",
  "body": "Heavy rainfall expected. Residents near riverbanks should remain vigilant.",
  "severity": "warning",
  "scope": "Daet",
  "createdBy": "admin_user_uid_123",
  "createdByRole": "admin_daet",
  "active": true,
  "createdAt": "2026-03-24T10:00:00.000Z",
  "deactivatedAt": null,
  "deleteAt": "2026-09-24T10:00:00.000Z"
}
```

---

## Backend Implementation

The `sendPushNotification` Cloud Function handles FCM sending:

```javascript
// Function signature (HTTPS callable)
sendPushNotification({ title, body, topic, url, announcementId })

// Default topic: 'all-citizens'
// After sending, writes to announcements/{id}/notifications/
```

Topics follow the pattern:
- `all-citizens` - All users
- `municipality_daet` - Users in Daet
- `municipality_labo` - Users in Labo
- etc.

---

## Notes for Frontend

1. **Announcement Creation**: Admin-only via `CreateAnnouncementForm.jsx`
2. **Announcement List**: Public read, shown in `AdminAlertsTab.jsx` for admins
3. **Deactivation**: Soft delete only (set `active=false`)
4. **Notification Logs**: Read-only for audit purposes
5. **Scope Validation**: Frontend should validate municipality names match the 12 Camarines Norte municipalities

---

## Valid Municipalities (for scope validation)

```
Basud, Capalonga, Daet, Jose Panganiban, Labo,
Mercedes, Paracale, San Lorenzo Ruiz, San Vicente,
Santa Elena, Talisay, Vinzons
```

---

**Questions?** Reach out to Backend Dev (backend-dev agent)