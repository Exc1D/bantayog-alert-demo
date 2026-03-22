# Phase 1: CSP Fix — Context

**Gathered:** 2026-03-20 (interactive planning)
**Status:** Ready for execution
**Source:** Direct from roadmap and research (skipped discuss-phase)

---

## Phase Boundary

This phase unblocks the core emergency reporting flow by fixing the Content Security Policy violation that prevents the image compression library from loading. Users cannot submit reports with photos due to CSP blocking. The fix must maintain security posture (no `unsafe-eval`) and be deployable to Firebase Hosting.

---

## Implementation Decisions

### Technical Approach

- **CSP Compliance:** Do NOT add `unsafe-eval` to script-src. Emergency app requires maximum security.
- **Library Replacement:** Replace `browser-image-compression` with `@squoosh/lib` (WebAssembly-based, no eval).
  - Rationale: Squoosh is CSP-safe, provides better compression quality, and aligns with modern WASM patterns.
  - Alternative considered: host browser-image-compression locally. Rejected because library still uses eval internally even when local; hosting locally would not solve CSP violation.
- **WASM Handling:** Copy Squoosh WASM files to `public/wasm/` or configure Vite `assetsInclude` to serve them from `'self'`.
- **Testing Standard:** Report submission must work on Slow 3G (≤30 seconds) with photo upload; full test suite must pass (588 tests baseline).

### Security Constraints

- CSP header must remain strict; no relaxation that weakens XSS protection.
- `script-src` stays `'self'` (no CDNs).
- `worker-src` already includes `blob:` (for service worker); that stays.
- `connect-src` already includes Firebase endpoints; verify Storage uploads work.

### Rollback Readiness

- Keep previous deployment artifacts; be prepared to roll back via Firebase Hosting version history if needed.
- Firestore data is separate; no data migration needed.

---

## Claude's Discretion

- **Where to place compression code:** If `src/utils/imageCompression.js` exists, modify it. If not, create it with the same path convention.
- **UI adjustments:** None anticipated; compression happens transparently.
- **Test updates:** Update existing report submission tests if they mock compression; keep test count ≥588.

---

## Canonical References

**Mandatory reading before execution:**

- `.planning/ROADMAP.md` — Phase 1 section, success criteria, tasks
- `.planning/REQUIREMENTS.md` — SYS-01 requirement details
- `.planning/research/SUMMARY.md` — Research findings on CSP and Squoosh
- `firebase.json` — Current CSP configuration
- `src/utils/imageCompression.js` (or wherever compression logic lives)
- `vite.config.js` — Build config, need to ensure WASM handling

---

## Specific Ideas

- Squoosh usage pattern:
  ```javascript
  import { imageCompress } from '@squoosh/lib';
  const compressed = await imageCompress(file, { encodeOptions: { webp: { quality: 0.82 } }, maxWidth: 1920 });
  ```
- Target compressed size: ≤1MB (as per existing spec)
- No changes to report form UI; compression is transparent to user

---

## Deferred Ideas

- None — Phase 1 scope is narrowly focused on unblocking photo upload.
- Performance optimization (bundle size, Lighthouse) is Phase 4.
- Dead code removal is Phase 3.
- Profile features are Phase 2.

---

## Notes

- Phase dependencies: None (can start immediately)
- Estimated effort: 2 hours
- Verification: Manual CSP check, functional test, full test suite

---

*Phase: 1 — CSP Fix*
*Context prepared: 2026-03-20 (auto-generated)*
