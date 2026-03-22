# Roadmap: v1.1 Security Hardening

**Milestone:** v1.1 Security Hardening
**Created:** 2026-03-22
**Requirements:** SEC-01 through SEC-07

---

## Phase 1: Security Hardening

**Goal:** Harden CSP policy, avatar upload pipeline, report content sanitization, and service worker cache security.

### Requirements Addressed

SEC-01, SEC-02, SEC-03, SEC-04, SEC-05, SEC-06, SEC-07

### Success Criteria

1. CSP frame-ancestors 'none' present in firebase.json and takes effect on deployed site
2. CSP upgrade-insecure-requests present in firebase.json and takes effect on deployed site
3. Avatar upload rejects files where magic bytes do not match declared MIME type
4. Avatar upload re-encodes images via canvas, producing clean JPEG or PNG with no embedded scripts
5. Report content (name, description) renders safely with no XSS vectors detected
6. Service worker cache contains no Firestore tokens, auth state, or user PII
7. Service worker cache version increments on deploy

### What Gets Built

| Item | File | Description |
|------|------|-------------|
| CSP frame-ancestors | firebase.json | Add frame-ancestors 'none' to hosting headers |
| CSP upgrade-insecure-requests | firebase.json | Add upgrade-insecure-requests to hosting headers |
| Avatar magic-byte validation | AvatarUpload.jsx | Read file header bytes, validate against declared MIME type |
| Avatar re-encoding | AvatarUpload.jsx | Draw image to canvas, export as clean JPEG or PNG |
| Report XSS audit | useReports.js, FeedPost.jsx | Verify no unsafe rendering paths; add sanitization if found |
| SW sensitive data audit | public/sw.js | Confirm no sensitive data in caches |
| SW cache versioning | public/sw.js | Increment cache version constant |

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SEC-01: CSP frame-ancestors | Phase 1 | Pending |
| SEC-02: CSP upgrade-insecure-requests | Phase 1 | Pending |
| SEC-03: Avatar magic-byte validation | Phase 1 | Pending |
| SEC-04: Avatar re-encoding | Phase 1 | Pending |
| SEC-05: Report XSS sanitization | Phase 1 | Pending |
| SEC-06: SW no sensitive data | Phase 1 | Pending |
| SEC-07: SW cache versioning | Phase 1 | Pending |

**Coverage:** 7/7 requirements mapped to Phase 1

---
*Roadmap created: 2026-03-22*
