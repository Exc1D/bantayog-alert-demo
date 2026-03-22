# Requirements: Bantayog Alert

**Defined:** 2026-03-22
**Core Value:** Citizens can report incidents in seconds; admins can respond with confidence.

## v1 Requirements

### Security

- [x] **SEC-01**: CSP `frame-ancestors 'none'` directive added to firebase.json hosting headers — prevents clickjacking via iframe embedding
- [x] **SEC-02**: CSP `upgrade-insecure-requests` directive added — auto-upgrades HTTP resources to HTTPS
- [x] **SEC-03**: Avatar upload validates file type by checking magic bytes (file signature), not just file extension — prevents polyglot file attacks
- [x] **SEC-04**: Avatar upload re-encodes images through a safe intermediate format (canvas export to JPEG/PNG) — strips embedded JavaScript, metadata, and polyglot payloads
- [ ] **SEC-05**: All user-generated report content is sanitized before rendering — prevents XSS in name, description, and location fields
- [ ] **SEC-06**: Service worker does not cache sensitive user data (auth state, Firestore tokens, user profiles) — only public map tiles and app shell
- [ ] **SEC-07**: Service worker cache version increments on every deploy — ensures users receive updated app assets, not stale SW code

## v2 Requirements

Deferred to future release.

### Notifications

- **NOTF-01**: Admin receives in-app notification on new report submission
- **NOTF-02**: Citizen receives notification when report status changes (verified/rejected)

### Analytics

- **ANLT-01**: Admin dashboard shows report volume by municipality over time
- **ANLT-02**: Admin dashboard shows average report resolution time

## Out of Scope

| Feature | Reason |
|---------|--------|
| Real-time WebSocket notifications | High infrastructure complexity, Firebase presence API insufficient |
| SMS/phone alerts | Twilio dependency, not core to v1 value, cost overhead |
| Advanced analytics | Data team request, not user-facing for initial launch |
| OAuth login (Google, Facebook) | Email/password sufficient for v1; adds identity complexity |
| Report comments/threading | Defer until basic flow is validated |
| Push notifications (web push) | Browser push API complexity, service worker revision required |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SEC-01 | Phase 1 | Pending |
| SEC-02 | Phase 1 | Pending |
| SEC-03 | Phase 1 | Pending |
| SEC-04 | Phase 1 | Pending |
| SEC-05 | Phase 1 | Pending |
| SEC-06 | Phase 1 | Pending |
| SEC-07 | Phase 1 | Pending |

**Coverage:**
- v1 requirements: 7 total
- Mapped to phases: 7
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-22*
*Last updated: 2026-03-22 after v1.1 Security Hardening milestone initialized*
