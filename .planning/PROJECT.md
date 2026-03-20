# Bantayog Alert

## What This Is

Bantayog Alert is an emergency reporting and response system for the Province of Camarines Norte. It enables citizens to quickly report disasters or urgent situations by capturing photos or videos, adding a brief description, and submitting the report. Administrators then verify reports, classify hazards and severity levels, dispatch responders, and track resolution. The app prioritizes speed and simplicity during emergencies while maintaining security, reliability, and performance.

## Core Value

**Citizens can report emergencies with minimal decisions, and authorities can verify and resolve incidents efficiently.**

If the report submission flow fails, the app fails its mission. Everything else—profile customization, dark mode, language options—is secondary to the core reporting capability.

## Requirements

### Validated

The following capabilities are implemented and deployed (from the recent rebuild):

- Emergency report submission with photo/video capture
- Automatic location detection via GPS + geofencing
- Disaster type selection and severity indication
- Real-time feed of verified reports (Alerts tab)
- Interactive map with Leaflet showing report markers
- Admin triage queue for pending reports
- Admin verification workflow (approve/reject with audit log)
- Admin resolution workflow (submit evidence and action details)
- Announcement publishing (appears in Alerts + push notifications)
- User authentication (email/password sign up, sign in, session management)
- Admin dashboard access (RBAC protected)

### Active

New work to be done in this milestone:

- Fix CSP violation that blocks image compression library → unblock report photo uploads
- Implement all 11 Profile features:
  - Edit Profile (name, municipality, avatar)
  - Change Password
  - My Reports (history and status tracking)
  - Notifications preferences (FCM integration)
  - Dark mode toggle (persisted)
  - Language selection (i18n)
  - Privacy settings
  - About Bantayog Alert page
  - Sign out (anywhere)
  - Admin Dashboard shortcut
  - Delete Account (with data cascade)
- Clean up dead code: remove unused hooks, utilities, and tests (~1,550 lines)
- Optimize performance to achieve Lighthouse scores ≥95 across all categories
- Upgrade service worker to Workbox for reliable PWA caching

### Out of Scope

Features explicitly excluded from this milestone:

| Feature | Reason |
|---------|--------|
| Social features (likes, comments, sharing) | Emergency tool, not social network |
| Real-time chat/messaging | Scope creep; not core to reporting |
| User profiles with bios/following | Privacy concerns, unnecessary |
| Complex role hierarchies | Simple admin/moderator/user sufficient |
| Advanced analytics (heatmaps, trends) | Defer to v2+ |
| Offline report queuing | Requires IndexedDB + sync; v2 |
| One-tap anonymous reporting | Need account for audit trail |
| Bulk verification operations | Medium complexity; v2 |
| Export to CSV | Nice-to-have, low priority |

## Context

The app recently underwent a major rebuild (Phases 1-3 complete, 588 tests passing). The codebase is well-structured with React 18, Vite 5, Firebase 10, and proper layer separation (Context providers, custom hooks, route-based lazy loading). However, stabilization work is needed to reach production readiness.

Key facts:
- Current Lighthouse score: Performance 56%, Accessibility 98%, Best Practices 92%, PWA incomplete
- CSP header blocks `browser-image-compression` from CDN, preventing report submissions with photos
- Profile tab exists but most features are non-functional placeholders
- Approximately 30 hook files and utility modules are potentially unused
- Admin routing is correct (do not modify)

Technical stack remains React + Firebase + Leaflet + Turf.js; no major upgrades required. Focus on targeted optimizations.

## Constraints

- **Security**: Must maintain strict CSP; avoid 'unsafe-eval'; emergency app handles sensitive data
- **Performance**: Must work on slow networks (3G); target LCP ≤ 1.5s; image compression essential
- **Usability**: Report flow usable under stress; minimal user decisions; clear CTAs
- **Compatibility**: Modern mobile browsers (iOS Safari 13+, Chrome Android)
- **Reliability**: Real-time updates, audit logging, error monitoring (Sentry)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use Firebase BaaS (Auth, Firestore, Storage) | Fast development, real-time capabilities, managed infrastructure | ✓ Good (proven) |
| React Router v6 with lazy loading | Code splitting, performance, modern API | ✓ Good (implemented) |
| Leaflet + React-Leaflet for maps | Open-source, lightweight, extensible | ✓ Good |
| Client-side image compression | Reduce upload size, improve UX | ⚠️ Revisit (CSP issue) → will replace with Squoosh |
| Admin nested routes | Clean separation, lazy-loaded admin bundle | ✓ Good (already correct) |
| Tailwind CSS | Rapid UI, consistent design system | ✓ Good |
| YOLO workflow mode | Fast execution, minimal interruptions | ✓ Good (chosen) |
| Full Profile feature rebuild | Complete user account management | — Pending (active work) |
| Replace browser-image-compression with Squoosh (WASM) | CSP-safe, better compression, no eval | — Pending (phase 1) |
| Workbox service worker | Deterministic PWA caching, offline support | — Pending (phase 3) |

---

*Last updated: 2026-03-20 after initial scoping and research*
