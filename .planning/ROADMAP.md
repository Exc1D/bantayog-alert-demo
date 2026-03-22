# Roadmap: v1.1 Security Hardening

**Milestone:** v1.1 Security Hardening
**Created:** 2026-03-22
**Requirements:** SEC-01 through SEC-07

---

## Phase 1: Security Hardening

**Goal:** Harden CSP policy, avatar upload pipeline, report content sanitization, and service worker cache security.

### Requirements Addressed

SEC-01, SEC-02, SEC-03, SEC-04, SEC-05, SEC-06, SEC-07

**Plans:** 2 plans

**Plan List:**
- [x] 01-PLAN.md -- CSP headers verification + Avatar upload security (magic bytes + canvas re-encoding)
- [ ] 02-PLAN.md -- Report XSS sanitization + SW hardening + cache versioning

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
| CSP frame-ancestors | firebase.json | Verify frame-ancestors 'none' in hosting headers (already present) |
| CSP upgrade-insecure-requests | firebase.json | Verify upgrade-insecure-requests in hosting headers (already present) |
| Avatar magic-byte validation | src/utils/imageCompression.js | validateMagicBytes function reads file header bytes |
| Avatar re-encoding | src/utils/imageCompression.js | reencodeImageClean uses canvas.toBlob to strip payloads |
| Avatar wiring | src/hooks/useAuth.js | updateProfilePicture calls both functions before upload |
| Report XSS sanitization | src/components/Feed/FeedPost.jsx, src/hooks/useReports.js | DOMPurify sanitization on location/description fields |
| SW sensitive data audit | public/sw.js | Confirm no Firestore tokens or user PII in caches |
| SW cache versioning | package.json | Build script auto-bumps CACHE_NAME via sed |

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SEC-01: CSP frame-ancestors | Phase 1 | Complete |
| SEC-02: CSP upgrade-insecure-requests | Phase 1 | Complete |
| SEC-03: Avatar magic-byte validation | Phase 1 | Complete |
| SEC-04: Avatar re-encoding | Phase 1 | Complete |
| SEC-05: Report XSS sanitization | Phase 1 | Pending |
| SEC-06: SW no sensitive data | Phase 1 | Pending |
| SEC-07: SW cache versioning | Phase 1 | Pending |

**Coverage:** 7/7 requirements mapped to Phase 1

---
*Roadmap created: 2026-03-22*
