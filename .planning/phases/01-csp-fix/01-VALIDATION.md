# Phase 1: Critical Blocker — CSP Fix

## Validation Architecture

**Phase Goal:** Unblock core report submission by resolving CSP violations preventing image compression library from loading.

**Requirements:** SYS-01

**Validation Strategy:** Acceptance testing via browser DevTools and functional test suite.

---

## Validations

### VAL-01: CSP Violation Resolved
- **How to verify:** Open Chrome DevTools → Console on staging app; attempt photo upload; confirm no CSP errors
- **Expected result:** No messages containing "violates the following Content Security Policy directive"
- **Command to check:** Manual; capture console screenshot
- **Pass condition:** Zero CSP violation errors during photo selection and upload

### VAL-02: Image Compression Works
- **How to verify:** Submit report with large photo (>2MB); check Firestore report document for `mediaUrls` field
- **Expected result:** Uploaded image compressed to ≤1MB (check file size in Storage)
- **Command to check:** Firebase Console → Storage → inspect uploaded image file size
- **Pass condition:** Compressed file exists and size ≤ 1,048,576 bytes

### VAL-03: Report Submission Completes on Slow 3G
- **How to verify:** Chrome DevTools → Network throttling: Slow 3G; time photo upload from selection to confirmation
- **Expected result:** Total time ≤30 seconds
- **Pass condition:** Network timing measurement ≤ 30s

### VAL-04: Test Suite Passes
- **How to verify:** Run `npm test` locally or in CI
- **Expected result:** All tests pass (≥588 tests)
- **Command to check:** `npm test --silent` exits with code 0
- **Pass condition:** Exit code 0, no test failures

---

## Validation Flow

1. After PLAN execution, validator performs manual checks (VAL-01 through VAL-03)
2. Automated test suite run (VAL-04)
3. All validations must pass to mark phase complete
4. If any fail: return to PLAN for revision

---

*Validation created: 2026-03-20*
*Phase: 1 — CSP Fix*
