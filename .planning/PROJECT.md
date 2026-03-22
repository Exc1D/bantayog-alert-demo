# Bantayog Alert

## What This Is

Community incident reporting PWA for barangay-level disaster preparedness. Citizens submit geo-tagged incident reports with photos; admins triage and dispatch responses. Built on React, Firebase (Auth + Firestore), and Leaflet maps with Turf.js geo-fencing.

## Core Value

Citizens can report incidents in seconds; admins can respond with confidence.

## Requirements

### Validated

- ✓ Citizen report submission with photo upload — Phase 2, PR #86
- ✓ Multi-step report flow (type → details → photo) — Phase 2, PR #86
- ✓ Admin triage queue with verify/reject dispatch — Phase 3, PR #87
- ✓ Announcement management with TTL and hard delete — Phase 3, PR #87
- ✓ Avatar upload with Firebase Storage — Phase 3, PR #87
- ✓ Map tab with Leaflet + Turf.js municipality geo-fencing — Phase 1, PR #84
- ✓ Firebase Auth with email/password — Phase 1, PR #84
- ✓ Firestore security rules — Phase 1, PR #84
- ✓ PWA with service worker tile caching — Phase 1, PR #84
- ✓ CSP headers via firebase.json — Phase 1, PR #84

### Active

- [ ] **SEC-01**: CSP frame-ancestors 'none' prevents clickjacking
- [ ] **SEC-02**: CSP upgrade-insecure-requests auto-upgrades HTTP to HTTPS
- [ ] **SEC-03**: Avatar upload validates file type via magic bytes, not extension
- [ ] **SEC-04**: Avatar upload re-encodes images to strip embedded payloads
- [ ] **SEC-05**: Report content sanitized against XSS in all render paths
- [ ] **SEC-06**: Service worker cache does not persist sensitive data
- [ ] **SEC-07**: Service worker cache version bumps on deploy

### Out of Scope

- Real-time WebSocket notifications — High infrastructure complexity, defer to future
- SMS/phone alerts — Twilio dependency, not core to v1 value
- Advanced analytics dashboard — Data team request, not user-facing

## Context

Tech stack: React 18, Firebase 10 (Auth + Firestore + Storage), Leaflet + Turf.js, Vite, Vitest (588 tests). SPA with client-side routing, Firebase hosting with CSP headers, service worker for offline tile caching. Firebase API key is public by design.

## Constraints

- Tech stack: Firebase + React — security controls must be client-side or Firestore rule-based
- PWA offline: Service worker caching required — hardening must not break offline map tiles
- Performance: Image re-encoding for avatars must stay under 2s on Slow 3G

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Firebase API key public | Firebase designed keys to be public; security from Firestore rules | ✓ Good |
| React auto-escaping | No unsafe inner HTML patterns in codebase | ✓ Good |
| data: in CSP connect-src | Same-origin only, no data exfil path | ✓ Good |
| Avatar https/blob protocol filter | Prevents javascript: and data: URL uploads | ✓ Good |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via /gsd:transition):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via /gsd:complete-milestone):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-22 after v1.1 Security Hardening milestone started*
