# Requirements: Bantayog Alert

**Defined:** 2026-03-20
**Core Value:** Citizens can report emergencies with minimal decisions; administrators verify and resolve incidents efficiently

## v1 Requirements

### Reporting (REP)

- [ ] **REP-01**: User can submit an emergency report with photo/video, brief description, and location (auto-detected via GPS + geofencing)
- [ ] **REP-02**: User can select hazard type and severity level
- [ ] **REP-03**: System compresses images before upload to ensure fast uploads and storage efficiency (max 1MB, max 1920px)
- [ ] **REP-04**: User receives confirmation after successful report submission
- [ ] **REP-05**: User can view a feed of verified reports on the Alerts tab
- [ ] **REP-06**: User can view their own submitted reports (My Reports) with status tracking

### Admin Operations (ADM)

- [ ] **ADM-01**: Admin can view a queue of pending reports sorted by time/urgency
- [ ] **ADM-02**: Admin can verify (approve) a report by setting hazard classification, severity, and adding action comments
- [ ] **ADM-03**: Admin can reject a report with a reason (audit logged)
- [ ] **ADM-04**: Admin can resolve a verified report by submitting a resolution form with photo/video evidence and action details
- [ ] **ADM-05**: Admin can delete any report (with audit log entry and cascade storage cleanup)
- [ ] **ADM-06**: Admin can create official announcements that appear in the Alerts tab
- [ ] **ADM-07**: Announcements can be sent as push notifications to citizens' devices (FCM)

### Profile & Settings (PRF)

- [ ] **PRF-01**: User can sign out from any page
- [ ] **PRF-02**: User can delete their account, which removes all their data from Firestore and Storage and revokes Firebase Auth tokens
- [ ] **PRF-03**: User can change their password via Firebase reset flow (email link)
- [ ] **PRF-04**: User can edit their profile: display name (max 50 chars), municipality selection, and optional avatar image upload
- [ ] **PRF-05**: User can enable or disable push notifications for announcements and report status updates
- [ ] **PRF-06**: User can toggle dark mode; preference persisted across sessions
- [ ] **PRF-07**: User can select preferred language; UI text switches accordingly (i18n)
- [ ] **PRF-08**: User can view privacy settings page explaining data collection and usage
- [ ] **PRF-09**: User can view "About Bantayog Alert" page with app version and mission
- [ ] **PRF-10**: User can access a "My Reports" page showing their submitted reports with status (pending/verified/resolved) and timestamps
- [ ] **PRF-11**: Admin users see a shortcut/link to Admin Dashboard from Profile tab

### System Quality (SYS)

- [ ] **SYS-01**: Content Security Policy header must allow loading of image compression library without using 'unsafe-eval' (CSP-compliant solution)
- [ ] **SYS-02**: Lighthouse performance scores ≥95 (Performance), ≥98 (Accessibility), ≥95 (Best Practices), ≥90 (PWA)
- [ ] **SYS-03**: Initial bundle size ≤150KB gzipped after dead code removal and optimizations
- [ ] **SYS-04**: All unused hooks, utilities, and tests identified by audit are removed without breaking existing functionality
- [ ] **SYS-05**: Service worker uses Workbox with proper caching strategies; offline functionality works
- [ ] **SYS-06**: Report submission flow works reliably on Slow 3G network (≤30 seconds from photo selection to successful upload)

## v2 Requirements

### Enhanced Reporting

- [ ] **REP-07**: User can submit reports while offline (queued in IndexedDB, auto-sync when online)
- [ ] **REP-08**: User receives real-time status updates on their reports (pending → verified → resolved)
- [ ] **REP-09**: Admin can categorize reports by additional metadata (ward/barangay, priority level)
- [ ] **REP-10**: System aggregates witness count when multiple users report similar incidents at same location

### Admin Enhancements

- [ ] **ADM-08**: Admin analytics dashboard with charts (reports over time, resolution rate, average time to verify)
- [ ] **ADM-09**: Bulk verification operations (approve/reject multiple reports at once)
- [ ] **ADM-10**: Export reports to CSV for external analysis
- [ ] **ADM-11**: Tracking of assigned response units (fire, police, medical) linked to resolved reports

### User Experience

- [ ] **PRF-12**: One-tap anonymous reporting (skip account creation, but limited features)
- [ ] **PRF-13**: User can customize notification preferences per incident type (hazard category)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Social features (likes, comments, sharing) | Emergency tool, not social network; may spread unverified info |
| Real-time chat/messaging | Scope creep; not needed for reporting workflow |
| User profiles with bios/following | Privacy concerns; unnecessary complexity |
| Complex role hierarchies | Simple admin/moderator/user roles sufficient |
| Advanced analytics (heatmaps, trends) | Defer to v2; nice-to-have not must-have |
| Offline report queuing (in v1) | Requires IndexedDB + sync conflict resolution; v2 |
| Gamification or reporting incentives | May encourage false reports |
| Live admin chat | Not needed; announcements provide broadcast |
| Performance metrics dashboard | Nice-to-have, not core value |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| REP-01 | 0 (Deployed) | Completed |
| REP-02 | 0 (Deployed) | Completed |
| REP-03 | 1 (Pending) | Pending |
| REP-04 | 1 (Pending) | Pending |
| REP-05 | 0 (Deployed) | Completed |
| REP-06 | 2 (Pending) | Pending |
| ADM-01 | 0 (Deployed) | Completed |
| ADM-02 | 0 (Deployed) | Completed |
| ADM-03 | 0 (Deployed) | Completed |
| ADM-04 | 0 (Deployed) | Completed |
| ADM-05 | 0 (Deployed) | Completed |
| ADM-06 | 0 (Deployed) | Completed |
| ADM-07 | 0 (Deployed) | Completed |
| PRF-01 | 2 (Pending) | Pending |
| PRF-02 | 2 (Pending) | Pending |
| PRF-03 | 2 (Pending) | Pending |
| PRF-04 | 2 (Pending) | Pending |
| PRF-05 | 2 (Pending) | Pending |
| PRF-06 | 2 (Pending) | Pending |
| PRF-07 | 2 (Pending) | Pending |
| PRF-08 | 2 (Pending) | Pending |
| PRF-09 | 2 (Pending) | Pending |
| PRF-10 | 2 (Pending) | Pending |
| PRF-11 | 2 (Pending) | Pending |
| SYS-01 | 1 (Pending) | Pending |
| SYS-02 | 4 (Pending) | Pending |
| SYS-03 | 4 (Pending) | Pending |
| SYS-04 | 3 (Pending) | Pending |
| SYS-05 | 4 (Pending) | Pending |
| SYS-06 | 4 (Pending) | Pending |

**Coverage:**
- v1 requirements: 30 total
- Mapped to phases: 30 (100%)
- Unmapped: 0

**Notes:**
- REP-06 (My Reports) is partially implemented as feed view; full status tracking in Phase 2
- REP-03/REP-04 depend on SYS-01 (CSP fix) to enable image compression
- Phase 0 = Already deployed from rebuild (PR #84, #86, #87)

---

*Requirements defined: 2026-03-20*
*Last updated: 2026-03-20 after initial definition*
