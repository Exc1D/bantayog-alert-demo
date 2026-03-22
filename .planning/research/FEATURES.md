# Feature Landscape: Emergency Reporting Apps

**Domain:** Emergency/disaster reporting and response system
**Researched:** 2026-03-20
**Confidence:** MEDIUM (codebase analysis: HIGH, external patterns: tool-limited)

---

## Executive Summary

Emergency reporting apps have a starkly different feature profile than social or community apps. The priority is **speed, clarity, and trust** during high-stress situations. Table stakes are minimal but critical: quick photo + brief description + location + submit. Anything that adds friction during report creation is anti-pattern. Admin workflows are **operational tools** (verification, dispatch, resolution tracking, mass notifications). Profile features are almost entirely non-essential except for account management and notification preferences.

---

## Citizen-Facing Features

### Table Stakes (Must Have)

| Feature | Why Essential | Complexity | Current Status |
|---------|---------------|------------|----------------|
| **Quick photo/video capture** | Visual evidence is primary signal in emergencies. Must be first or second step. | Medium (camera permissions, compression) | ✅ Implemented (broken by CSP) |
| **Brief description text** | Context that can't be captured in photo alone (what's happening, who needs help). | Low (textarea with character limit) | ✅ Implemented |
| **Automatic location detection** | Users often cannot provide accurate addresses during emergencies. GPS + geofencing to municipality is vital. | High (turf.js, polygon data, offline capability) | ✅ Implemented |
| **Disaster type selection** | Classification for routing to appropriate responders. Limited set (flood, fire, landslide, etc.). | Low (preset buttons) | ✅ Implemented |
| **Severity indicator** | Citizen assessment helps with triage (critical/moderate/minor). | Low (3-button toggle) | ✅ Implemented |
| **Submit confirmation** | Users need reassurance report was received, with reference/tracking number. | Low (toast + redirect) | ✅ Implemented |
| **Feed of verified reports** | Citizens need situational awareness of what's confirmed happening around them. | Medium (filtering by location, freshness) | ✅ Implemented |

**Note:** The current 3-step wizard (Type → Photo → Details) is a good pattern. Step 2 (photo) being optional is **correct** - don't block submission if user can't take photo.

### Differentiators (Nice to Have, Can Defer to v2)

| Feature | Value Proposition | Complexity | Defer Reason |
|---------|-------------------|------------|--------------|
| **Offline report queuing** | Users can submit when connectivity returns (critical in disasters). | High (IndexedDB, sync logic, conflict resolution) | Phase 2+ |
| **Report status tracking** | "Your report is pending verification / verified / resolved" builds trust. | Medium (notifications + UI) | Phase 2+ |
| **Witness count** | "5 people reported this location" validates urgency. | Medium (aggregation, debouncing) | Phase 2+ |
| **Media beyond photo** | Video, audio recordings add context. | Medium (capture, storage, compression) | Phase 2+ |
| **One-tap anonymous reporting** | Some users fear retribution; anonymity encourages reporting. | High (auth integration, audit trail balance) | Phase 2+ |
| **Live camera overlay with GPS coordinates** | Advanced: show coordinates in camera view for precise location context. | High (AR, permissions) | Future |
| **Voice-to-text description** | Hands-free input during emergencies. | Medium (speech recognition API) | Future |
| **Report history search** | "What did I report last week?" Useful for follow-up. | Low (simple query) | Can wait |

### Anti-Features (Deliberately Do NOT Build)

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Rich text editing** | Users waste time formatting; need plain text only. | Simple textarea with character counter (max 500 chars). |
| **Complex multi-photo galleries** | Slows submission; first photo is enough. | Single photo + optional second (max 2). |
| **Social interactions (likes, comments, shares)** | This is a tool, not social media. Distracts from urgency. | No social features on citizen reports. |
| **User profiles on feed** | Anonymity preferred; show location + time only. | Use "Resident" or "Verified Reporter" labels, not names. |
| **Report editing after submission** | Encourages perfectionism; submit and move on. | Allow admin to request more info if needed. |
| **Gamification (points, badges)** | Trivializes serious situations. | No gamification whatsoever. |
| **Incentives for reporting** | Could encourage false reports. | Verify, don't incentivize. |

---

## Admin/Responder Features

### Table Stakes (Must Have)

| Feature | Why Essential | Complexity | Current Status |
|---------|---------------|------------|----------------|
| **Real-time triage queue** | Admins need to see all pending reports, sorted by severity + time. | Medium (Firestore listeners, sorting) | ✅ Implemented |
| **Verification workflow** | Not all reports are true; mark as verified with evidence review. | Medium (modal, status update) | ✅ Implemented |
| **Dispatch/assignment** | Assign verified reports to response units (DPWH, fire, medical). | Low (unit selector in modal) | ✅ Implemented |
| **Resolution with evidence** | Must prove resolution with photo + description of actions taken. | Medium (evidence upload, validation) | ✅ Implemented |
| **Rejection with reason** | Transparent when rejecting false reports. | Low (prompt for reason) | ✅ Implemented |
| **Municipality-scoped access** | Admin only sees reports in their jurisdiction. | Medium (Firestore queries, RBAC) | ✅ Implemented |
| **Mass announcement publishing** | Push alerts to citizens about class suspensions, road closures, etc. | Medium (form with scoping, push integration) | ✅ Implemented |
| **Announcement lifecycle** | Create → publish → deactivate with audit trail. | Medium (CRUD + timestamps) | ✅ Implemented |

The admin workflow is **substantially complete**. The core is: **Triage → Verify → Dispatch → Resolve**. Announcements fill the outbound communication need.

### Differentiators (Polish and Efficiency)

| Feature | Value Proposition | Complexity | Recommendation |
|---------|-------------------|------------|----------------|
| **Admin analytics dashboard** | Charts of reports by type, resolution time, hot spots. | High (aggregations, charts) | Phase 3 (v2) |
| **Bulk verification** | Select multiple reports and verify/reject together. | Medium (checkbox list, batch updates) | Defer |
| **Export reports to CSV** | For external reporting, budgeting, analysis. | Low (CSV generation) | Simple to add later |
| **Map view for admins** | Visual triage across municipality geography. | Medium (Leaflet integration) | Defer; feed is sufficient first |
| **Notifications on new reports** | Push/email when high-priority reports arrive. | Medium (FCM, throttling) | Medium priority |
| **Response unit tracking** | Track which units are deployed, available, busy. | High (status system, roster) | Phase 2+ |
| **Collaborative notes** | Multiple admins can add notes to same report. | Low (subcollection) | Low priority |
| **Template responses** | Quick-select common verification/resolution notes. | Low (preset list) | Phase 3 polish |

### Anti-Features (Avoid Over-Engineering)

| Anti-Feature | Why Avoid |
|--------------|-----------|
| **Complex role hierarchies** | Current "admin / superadmin" is sufficient. Don't build RBAC beyond 2-3 roles. |
| **Workflow automation rules** | "Auto-verify if 5 witnesses" etc. - invites gaming and errors. Human judgment first. |
| **Live admin chat** | Use external comms (radio, WhatsApp). Don't build in-app chat. |
| **Admin performance metrics** | "Reports resolved per hour" creates perverse incentives. Quality over speed. |
| **Advanced reporting (BI tools)** | Use simple CSV export; connect to external BI if needed. |

---

## Profile/Account Features

**Critical distinction:** Emergency apps are **task-driven tools**, not **identity-driven social platforms**. Users open the app to report or view alerts, not to manage a profile. Therefore, profile features are **interruptions**, not destinations.

### Essential (v1 Must-Have)

| Feature | Emergency-App Rationale | Implementation Notes |
|---------|------------------------|----------------------|
| **Sign out** | Shared devices common in community settings (DRRMO offices, evacuation centers). | Simple signOut() call, redirect to login. ✅ Already works |
| **Delete account** | GDPR/privacy compliance; user may want to erase data. | Must cascade delete user's reports. Complex but necessary. ⚠️ Not implemented (placeholder only) |
| **Change password** | Security hygiene; users may need to update credentials. | Standard Firebase updatePassword(). Low complexity. ⚠️ Link broken (route not implemented) |

**Why these three and only these?**

- **Sign out**: Immediate need for shared device scenarios.
- **Delete account**: Legal/ethical requirement; citizens must control data.
- **Change password**: Basic account hygiene; accounts are essential to prevent spam.

### Nice-to-Have but Deferrable

| Feature | Emergency-App Relevance | Complexity | Defer Reason |
|---------|------------------------|------------|--------------|
| **Edit profile (name/photo)** | Minor value for personalization; not essential for task. | Low (Firebase update) | Cosmetic; can wait |
| **My reports history** | Citizens may want to track their submissions. | Medium (query by userId, display) | Useful but not blocking |
| **Avatar upload** | Personalization; visual verification for admins. | Medium (image compression, storage) | Low priority |
| **Dark mode preference** | Important for accessibility & battery; but not emergency-specific. | Low (ThemeContext toggle) | Already implemented globally ✅ |
| **Notification preferences** | **Potentially table stakes** - users need to control alert types. | Medium (settings + FCM topics) | See deep dive below ⚠️ |
| **Language selection** | Multilingual support valuable for inclusive access. | Medium (i18n, switching) | Phase 2+; English is v1 acceptable |
| **About / Privacy policy** | Legal compliance (GDPR, data usage transparency). | Low (static pages) | Simple, can add quickly |
| **Privacy settings** | Control data sharing, location precision. | Medium (profile fields, toggles) | Phase 2+ |

### Not Profile Features (Wrong Place)

| Feature | Where It Should Be Instead |
|---------|---------------------------|
| **Notifications toggle** | Should be in **system settings** or **Alerts tab header**, not buried in profile. |
| **Language switcher** | Global settings icon in header (top-right of app shell). |
| **Dark mode** | Already in top-right header; remove from profile entirely. |

### Deep Dive: Notifications — Is This Table Stakes?

**YES.** Push notifications are critical for emergency apps because:
- Users may not have app open when disaster strikes.
- Class suspensions, evacuation orders, road closures must reach people immediately.
- **However**, implementation belongs in **global app settings**, not Profile tab.

**Recommended pattern:**
- When user first opens app, prompt: "Enable notifications to receive emergency alerts?"
- In app shell header, settings gear that includes: Notifications (on/off), Dark Mode, Language (if multilingual).
- Use FCM or APNs with topic subscriptions (municipality + severity level).
- Allow admins to target "Critical" notifications that bypass user mute settings.

**Complexity:** High (requires backend push integration, rate limiting, spam prevention). Can be deferred to Phase 2 but marked as high priority.

---

## Feature Dependencies

```
Core Report Submission Flow
├─ Disaster type selection (no dependencies)
├─ Photo capture (camera permission)
├─ Location detection (GPS permission, turf.js geofencing) → municipality
└─ Submission → Firestore 'reports' collection (requires authenticated user)

Admin Verification Flow
├─ Pending queue (query: verification.status == 'pending')
├─ Verification modal → updateReport(status='verified') + metadata
└─ Resolution modal (only on verified reports)
   ├─ Evidence upload (storage upload)
   └─ Mark resolved → updateReport(status='resolved') + resolution data

Announcements Flow
├─ Create form (admin only, scope auto-set to userProfile.municipality)
├─ Save to 'announcements' collection with active=true, deleteAt=90days
└─ Citizen Alerts tab → query(active==true, scope in [userMunicipality, 'Provincial'])
```

---

## MVP Recommendation (What to Build First)

### Phase 1 (Foundation - Already Complete)
- Citizen report submission (3-step)
- Feed of verified reports
- Map with geofencing
- Weather/tides display
- Admin verification → resolution workflow
- Announcements system
- Authentication & RBAC

### Phase 2 (Citizen Experience Polish)
1. **Fix CSP** to make photo upload work (blocking issue)
2. **My Reports history** (profile → list of user's submissions with status badges)
3. **Report status tracking** (push/email when report moves pending→verified→resolved)
4. **Notification preferences** in settings (opt-in for announcements, severity thresholds)
5. **Offline queuing** (IndexedDB buffer if submit fails)

### Phase 3 (Admin Polish)
1. **Push notification integration** (FCM, send to municipality when new verified report)
2. **Admin analytics** (charts, daily/weekly summaries)
3. **Bulk operations** (select multiple, verify/reject)
4. **Export CSV** (reports, announcements)

### Defer to v2+
- Advanced profile editing (profile picture, display name)
- Language localization (i18n)
- Witness count aggregation
- Report search/filtering beyond simple location
- Admin map view (visual triage)

---

## Complexity Legend

| Level | Meaning |
|-------|---------|
| **Low** | Single Firebase write, simple React component, no new dependencies |
| **Medium** | Multiple Firestore interactions, file uploads, state management, permissions |
| **High** | New infrastructure (FCM, offline DB), geospatial calculations, third-party API integrations |

---

## Sources

**Codebase verification (HIGH confidence):**
- Report submission flow: `/home/exxeed/dev/projects/bantayog-alert-demo/src/pages/ReportPage.jsx`
- Admin workflows: `src/components/Admin/AdminDashboard.jsx`, `ReportDetail.jsx`, `ResolutionModal.jsx`
- Announcements: `src/components/Admin/CreateAnnouncementForm.jsx`, `AdminAlertsTab.jsx`
- Profile tab: `src/pages/ProfileTab.jsx`

**External best practices research:**
- **LIMITATION**: Web searches for "emergency reporting app features" and related queries via WebSearch tool returned model errors.
- **LIMITATION**: Context7 documentation lookup unavailable in this environment.
- **REQUIRES VALIDATION**: Emergency-app-specific UX patterns (minimizing cognitive load during stress) should be verified against Ushahidi, CrisisMapper, or similar civic emergency platforms in a follow-up research phase with functioning search tools.

**Assumptions marked LOW confidence (need Phase validation):**
1. Push notifications are table stakes (based on domain knowledge of emergency alerting systems).
2. "My Reports" feature complexity (likely simple Firestore query by userId, but need to verify data model).
3. Offline queuing feasibility (existing PWA service worker may help; requires investigation).
4. Admin admin view utility (may be differentiator, but could also be essential; needs testing with actual admin users).

---

## Quality Gate Check ✅

- [x] **Citizen vs admin features clearly separated** - two distinct sections above.
- [x] **Profile features classified by emergency-app relevance** - explicit reasoning why only 3 are v1 essential.
- [x] **Complexity noted** - Low/Medium/High ratings with implementation notes.
- [x] **Dependencies mapped** - directed graph shows what relies on what.
- [ ] **External pattern verification** - **BLOCKED by tool issues**; needs follow-up when WebSearch/Context7 functional.

---

## Next Research Steps (For Phase Teams)

When preparing to build:

1. **Validate "My Reports" data model** - Check if reports already store `reportedBy` user ID. If not, this requires schema migration.
2. **Investigate CSP violation** - Review `firebase.json` headers and identify which directive blocks camera uploads.
3. **Push notification infrastructure audit** - Is FCM already configured? Check `public/manifest.json` and Firebase project settings.
4. **Offline strategy assessment** - Review existing service worker (`public/sw.js`) for cache strategies; determine IndexedDB wrapper library if needed.
5. **User testing with non-technical citizens** - Present the 3-step report flow to actual target users; measure time-to-submit and frustration points.
