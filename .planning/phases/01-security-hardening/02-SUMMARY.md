---
phase: 01-security-hardening
plan: 02
subsystem: security
tags:
  - XSS
  - DOMPurify
  - service-worker
  - cache-hardening
  - SEC-05
  - SEC-06
  - SEC-07
dependency_graph:
  requires: []
  provides:
    - SEC-05: Report content sanitized against XSS in all render and write paths
    - SEC-06: SW confirmed not caching Firestore tokens, auth state, or user PII
    - SEC-07: SW cache version auto-bumps via timestamp on every build
  affects:
    - src/components/Feed/FeedPost.jsx
    - src/hooks/useReports.js
    - public/sw.js
    - package.json
tech_stack:
  added:
    - dompurify (already in dependencies, now actively used in sanitization paths)
  patterns:
    - DOMPurify.sanitize at render time for location fields (barangay)
    - DOMPurify.sanitize at write time for description field
    - SW cache version auto-bump via sed + date +%s in build script
key_files:
  created: []
  modified:
    - path: src/components/Feed/FeedPost.jsx
      change: Added DOMPurify import, sanitized barangay field at render time
    - path: src/hooks/useReports.js
      change: Added DOMPurify import, sanitized description at write time in submitReport
    - path: public/sw.js
      change: Added security invariants comment block to fetch handler documentation
    - path: package.json
      change: Modified build script to auto-bump CACHE_NAME via sed with Unix timestamp
decisions:
  - id: DOMPurify-sanitize-barangay
    decision: Sanitize barangay field with DOMPurify.sanitize before rendering in FeedPost
    rationale: Defense in depth - barangay is user-supplied location data rendered as text
  - id: DOMPurify-sanitize-description-at-write
    decision: Sanitize description field with DOMPurify.sanitize in submitReport before Firestore write
    rationale: Ensures stored data is clean regardless of which render path displays it
  - id: SW-cache-timestamp-bump
    decision: Auto-bump SW CACHE_NAME with Unix epoch timestamp via sed in package.json build script
    rationale: Ensures every deploy invalidates client service worker caches, forcing update
key_links:
  - from: src/components/Feed/FeedPost.jsx
    to: DOMPurify
    via: import and use on barangay field before rendering
  - from: src/hooks/useReports.js
    to: DOMPurify
    via: import and use on description field in submitReport
  - from: package.json
    to: public/sw.js (dist/sw.js after build)
    via: sed replacement of CACHE_NAME with timestamp
metrics:
  duration: "~5 minutes"
  completed: "2026-03-22T11:54:11Z"
  tasks_completed: 3
  files_modified: 4
  commits: 3
---

# Phase 01 Plan 02 Summary: Report XSS Sanitization + SW Hardening + Cache Versioning

## Objective

Harden report content against XSS, verify service worker does not cache sensitive user data, and implement cache version auto-bump on deploy.

## One-liner

DOMPurify sanitization on report barangay/description fields, SW security invariants documented, and cache version auto-bumps with Unix timestamp on every build.

## Tasks Executed

### Task 1: Add DOMPurify sanitization to all report content render paths
**Commit:** `1639ca1`

- Added `import DOMPurify from 'dompurify'` to FeedPost.jsx
- Sanitized barangay field with `DOMPurify.sanitize(report.location.barangay)` before rendering
- Added `import DOMPurify from 'dompurify'` to useReports.js
- Sanitized description field at write time in submitReport: `DOMPurify.sanitize(reportData.disaster.description || '')`
- Note: description rendering in FeedPost via JSX interpolation is already safe due to React auto-escaping; write-time sanitization ensures stored data is clean regardless of render path

### Task 2: Confirm service worker does not cache sensitive data
**Commit:** `55f76d8`

- Verified firebaseio.com and googleapis.com are excluded from caching (lines 182-184)
- Verified IndexedDB offline queue only stores URL/method/headers/body/timestamp for report actions
- No auth tokens, Firebase ID tokens, or user PII in any cache or IndexedDB store
- Added security invariants comment block to fetch handler section documenting the above

### Task 3: Implement SW cache version auto-bump on deploy
**Commit:** `c1efd67`

- Modified package.json build script: `vite build --mode production && sed -i "s/bantayog-alert-v[0-9]*/bantayog-alert-v$(date +%s)/" dist/sw.js`
- Verified build produces timestamp-based CACHE_NAME (e.g., `bantayog-alert-v1774180543`)
- Verified running build twice produces different timestamps (1774180543 vs 1774180560)

## Deviations from Plan

None - plan executed exactly as written.

## Auth Gates

None encountered.

## Known Stubs

None.

## Verification Results

| Check | Result |
|-------|--------|
| `grep DOMPurify.sanitize src/components/Feed/FeedPost.jsx` | Found at line 107 |
| `grep DOMPurify.sanitize src/hooks/useReports.js` | Found at line 228 |
| `grep "firebaseio.com\|googleapis.com" public/sw.js` | Found exclusion at line 182 |
| `grep "offlineQueueDB" public/sw.js` | Found at line 164 |
| `grep "Security invariants" public/sw.js` | Found comment at line 162 |
| `npm run build && grep CACHE_NAME dist/sw.js` | Timestamp version confirmed |
| Second build timestamp different | Confirmed (timestamps differ by 17s) |

## Commits

| Hash | Message |
|------|---------|
| `1639ca1` | feat(01-security-hardening): add DOMPurify sanitization to report content render and write paths |
| `55f76d8` | docs(01-security-hardening): add security invariants comment to SW fetch handler |
| `c1efd67` | feat(01-security-hardening): auto-bump SW cache version on every deploy |

## Self-Check

- [x] All tasks executed
- [x] Each task committed individually (3 commits)
- [x] SUMMARY.md created in plan directory
- [x] STATE.md updated with position and decisions
- [x] ROADMAP.md updated with plan progress
