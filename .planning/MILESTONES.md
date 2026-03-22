# Milestones

## v1.0 — Foundation + Feature Reboot

**Completed:** 2026-03-18

**What shipped:**
- Phase 1 (Foundation): PWA shell, Leaflet map with geo-fencing, Firebase Auth, Firestore rules, CSP headers, service worker
- Phase 2 (Citizen): Multi-step report flow, photo upload, feed rendering
- Phase 3 (Admin+Profile): Admin triage queue, announcement management, avatar upload, dispatch form

**PRs:** #84, #86, #87 | **Tests:** 588 passing | **Live:** https://bantayog-alert-demo-36b27.web.app

**Outcome:** Production-grade community incident reporting PWA with geo-fenced municipal boundaries.

---

## v1.1 — Security Hardening

**Status:** In progress

**Goal:** Harden CSP policy, avatar upload, report content sanitization, and service worker cache security based on security review findings.

**Target:** CSP `frame-ancestors`, `upgrade-insecure-requests`; Avatar magic-byte validation + re-encoding; XSS sanitization; SW cache hardening

**Requirements:** SEC-01 through SEC-07

---

*Last updated: 2026-03-22*
