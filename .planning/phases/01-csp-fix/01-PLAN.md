# Phase 1 Plan: CSP Fix — Critical Blocker

**Objective:** Unblock core report submission by fixing CSP violations that prevent the image compression library from loading, allowing users to submit reports with photos.

**Requirements Addressed:**
- SYS-01: Content Security Policy header must allow loading of image compression library without using 'unsafe-eval'

**Success Criteria (from ROADMAP):**
1. User can select/take a photo in the report submission flow without console errors
2. Image compression library loads successfully and compresses images to ≤1MB
3. Report submission completes successfully with photo attachment on Slow 3G (≤30 seconds)
4. No CSP violations appear in browser console during photo upload

**Risk Level:** Low — configuration change with well-understood CSP patterns

---

## Plan Overview

| Wave | Plan ID | Title | Effort | Dependencies |
|------|---------|-------|--------|--------------|
| 1 | PLAN-01 | Diagnose CSP violation | 30 min | None |
| 2 | PLAN-02 | Implement CSP fix | 1 hour | PLAN-01 |
| 3 | PLAN-03 | Test report flow with photos | 30 min | PLAN-02 |

**Total Estimated Time:** 2 hours

---

## Wave 1: Diagnosis

### PLAN-01: Diagnose CSP Violation

**Objective:** Identify exactly which CSP directive is blocking the image compression library and understand the failure mode.

**Tasks:**

1. **Reproduce the issue on staging/live app**
   - Deploy current code to staging (if not already)
   - Open Chrome DevTools → Console tab
   - Navigate to report submission page (/report)
   - Select a photo file
   - Capture all CSP violation errors (screenshot or copy console text)

2. **Identify blocked resource and directive**
   - Examine CSP error: which directive triggered? (`script-src`, `connect-src`, `img-src`, etc.)
   - Identify which URL(s) are being blocked (e.g., CDN URL for browser-image-compression)
   - Determine if library uses `eval()` or constructs that trigger CSP (common with browser-image-compression)

3. **Check current CSP configuration**
   - Read `firebase.json` hosting.headers section
   - Document current `Content-Security-Policy` value
   - Note which directives are present and their sources

4. **Decide fix approach**
   - If CDN script is the issue: consider hosting library locally in `public/` or replacing with CSP-compliant alternative
   - If `eval()` is used: cannot simply add 'unsafe-eval' (security risk); must replace library or use WASM
   - Document chosen approach with rationale

**Acceptance Criteria:**
- CSP violation error message captured and saved to `.planning/phases/01-csp-fix/DIAGNOSIS.md`
- Current CSP header from `firebase.json` documented
- Fix approach decided: either "host locally" or "replace with Squoosh"
- Decision recorded with security implications noted

---

## Wave 2: Implementation

### PLAN-02: Update CSP Configuration or Replace Library

**Objective:** Implement the chosen fix to allow image compression without weakening security.

**Dependencies:** PLAN-01 completion

**If Approach A (Host Locally):**

1. Download browser-image-compression library
   ```bash
   npm install browser-image-compression
   # Copy dist file to public/vendor/
   cp node_modules/browser-image-compression/dist/browser-image-compression.js public/vendor/
   ```

2. Update firebase.json CSP
   - Add `'self'` for script-src (already there)
   - Ensure `script-src` allows local scripts (it should)
   - No CDN needed if hosted locally

3. Update import in code
   - Find where `browser-image-compression` is imported (likely `src/utils/imageCompression.js` or similar)
   - Change import from CDN URL to local path: `/vendor/browser-image-compression.js`

**If Approach B (Replace with Squoosh):**

1. Install Squoosh library
   ```bash
   npm uninstall browser-image-compression
   npm install @squoosh/lib
   ```

2. Update image compression utility
   - Modify `src/utils/imageCompression.js` (or create if missing) to use `@squoosh/lib`
   - Use `imageCompress` function with WebP output, quality 0.82, max width 1920
   - Return File object compatible with existing upload code

3. Configure Vite to handle WASM
   - In `vite.config.js`, ensure `assetsInclude` includes `**/*.wasm` OR copy WASM to public/
   - If using public/: place WASM files in `public/wasm/`

4. Update firebase.json CSP if needed
   - If Squoosh loads WASM from `'self'`, no CSP changes needed
   - Verify `worker-src 'self'` already present (it is: `worker-src 'self' blob:`)
   - Ensure no `eval()` used by Squoosh (it uses WASM, safe)

**Read First:**
- `firebase.json` (current CSP header)
- `src/utils/imageCompression.js` or wherever compression logic lives
- `vite.config.js` (build config for WASM handling)

**Acceptance Criteria:**
- Code updated with chosen approach (local hosting OR Squoosh replacement)
- CSP header modified IF needed (prefer no changes if hosting locally)
- No `unsafe-eval` added to CSP
- Compression function produces File ≤1MB from test image (can verify manually in code)

---

### PLAN-03: Test Report Flow End-to-End

**Objective:** Verify that photo upload works correctly and report submission succeeds with compressed images.

**Dependencies:** PLAN-02 complete

**Tasks:**

1. **Run production build and deploy to staging**
   ```bash
   npm run build
   firebase deploy --only hosting -P staging
   ```

2. **Test on Chrome DevTools with mobile emulation**
   - Open staging URL
   - Open DevTools → Network tab → throttling: Slow 3G
   - Open DevTools → Console (clear first)
   - Navigate to /report
   - Fill report form: hazard type, severity, description
   - Select a large photo (>2MB)
   - Submit
   - Verify:
     - No CSP errors in console
     - Photo uploads and compresses successfully
     - Report appears in feed after submission
     - Total time from selection to submission ≤30 seconds on Slow 3G

3. **Test on real mobile device (if available)**
   - Open staging URL on phone
   - Repeat submission with photo
   - Confirm success

4. **Update tests (if applicable)**
   - Check if there are existing tests for report submission (`test/createReport.test.jsx` or similar)
   - Update mocks if compression implementation changed
   - Run test suite: `npm test`
   - Ensure all tests pass (588 baseline)

5. **Document results**
   - Write summary to `.planning/phases/01-csp-fix/TESTING.md`
   - Note any issues encountered and fixes

**Acceptance Criteria:**
- Report submission with photo completes without console errors
- Image compression produces ≤1MB file (check Stored report in Firestore: storage URL exists)
- Network timing ≤30 seconds on Slow 3G emulation
- Full test suite passes (npm test exits 0)
- Success criteria from ROADMAP all met

---

## Verification Gates

Before marking Phase 1 complete, verify:

- [ ] All PLAN tasks completed with acceptance criteria met
- [ ] No CSP violations in browser console during photo upload
- [ ] Report with photo appears in feed
- [ ] `npm test` passes (588 tests baseline)
- [ ] Lighthouse audit run on staging (optional; full audit in Phase 4)

---

## Rollback Plan

If issues arise after deployment:

1. Revert last commit if code change
2. Redeploy previous version from Firebase Hosting history
3. Firestore data unaffected (reports stored separately)

---

*Plan created: 2026-03-20 (auto-generated from roadmap)*
*Phase: 1 — CSP Fix*
*Mode: YOLO (auto-advance)*
