---
phase: 01-security-hardening
plan: 02
type: execute
wave: 2
depends_on: []
files_modified:
  - src/components/Feed/FeedPost.jsx
  - src/hooks/useReports.js
  - public/sw.js
  - package.json
autonomous: false
requirements:
  - SEC-05
  - SEC-06
  - SEC-07

must_haves:
  truths:
    - "Report content (name, description, barangay, street) is sanitized against XSS in all render paths"
    - "Service worker does not cache Firestore tokens, auth state, or user PII"
    - "Service worker cache version increments on every deploy"
  artifacts:
    - path: "src/components/Feed/FeedPost.jsx"
      provides: "Report description and location fields rendered via DOMPurify sanitization"
      uses: "DOMPurify.sanitize on barangay and street fields"
    - path: "src/hooks/useReports.js"
      provides: "SubmitReport sanitizes disaster.description before storing to Firestore"
      uses: "DOMPurify.sanitize on description at write time"
    - path: "public/sw.js"
      provides: "SW cache versioning with deploy-triggered increment"
      contains: "CACHE_NAME.*bantayog-alert-v"
  key_links:
    - from: "src/components/Feed/FeedPost.jsx"
      to: "DOMPurify"
      via: "import and use on location fields before rendering"
      pattern: "DOMPurify.*sanitize"
    - from: "public/sw.js"
      to: "firebaseio.com|googleapis.com"
      via: "fetch handler exclusion list"
      pattern: "firebaseio\\.com|googleapis\\.com"
---

<objective>
Harden report content against XSS, verify service worker does not cache sensitive user data, and implement cache version auto-bump on deploy.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@src/components/Feed/FeedPost.jsx
@src/hooks/useReports.js
@public/sw.js
@src/components/Common/SanitizedHTML.jsx
@principles/security.md
</context>

<introductory_notes>
**XSS audit findings:**
- FeedPost.jsx line 156 renders description via JSX expression interpolation - React auto-escapes this, so it is safe as-is
- FeedPost.jsx lines 104-107 render barangay and street without sanitization - these need DOMPurify sanitization
- FeedPost.jsx line 186 renders tags as hash strings - safe
- useReports.js submitReport stores description directly to Firestore - should sanitize before storage (defense in depth)
- SanitizedHTML.jsx component exists with DOMPurify but is NOT currently used for report content

**SW audit findings:**
- sw.js lines 176-182 exclude Firebase/Google APIs from caching - correct
- CACHE_NAME = 'bantayog-alert-v3' is hardcoded - version must increment on deploy
- No IndexedDB or cache stores user auth tokens, Firestore data, or user PII - correct
- SEC-07 requires cache version to auto-bump on deploy

**Service worker versioning:** The SW is served from dist/sw.js after build. To auto-bump on deploy, the build process must modify the version constant using a sed replacement.
</introductory_notes>

<tasks>

<task type="auto">
  <name>Task 1: Add DOMPurify sanitization to all report content render paths</name>
  <files>src/components/Feed/FeedPost.jsx, src/hooks/useReports.js</files>
  <read_first>
    - src/components/Feed/FeedPost.jsx (lines 100-120 for location rendering, line 156 for description)
    - src/hooks/useReports.js (submitReport function, description field handling at line 227)
    - src/components/Common/SanitizedHTML.jsx (DOMPurify sanitization implementation for reference)
  </read_first>
  <action>
    For each user-generated text field in report rendering:

    1. In FeedPost.jsx, add DOMPurify import at top: `import DOMPurify from 'dompurify';`

    2. Sanitize location fields before rendering:
       - Line 105 (barangay): Change `{report.location?.barangay}` to `{DOMPurify.sanitize(report.location?.barangay || '')}`
       - Line 106 (street if rendered): Apply same sanitization pattern

    3. In useReports.js submitReport function, sanitize description at write time for defense in depth:
       - Import DOMPurify at top of file: `import DOMPurify from 'dompurify';`
       - At line 227, change: `description: reportData.disaster.description,`
         To: `description: DOMPurify.sanitize(reportData.disaster.description || ''),`

    This ensures XSS payloads stored in report data are neutralized at render time and at write time.

    The description rendering at FeedPost.jsx line 156 via JSX interpolation is already safe due to React auto-escaping, but sanitizing at write time ensures stored data is clean regardless of which render path displays it.
  </action>
  <verify>
    <automated>grep -n "DOMPurify.sanitize" src/components/Feed/FeedPost.jsx && grep -n "DOMPurify.sanitize" src/hooks/useReports.js</automated>
  </verify>
  <acceptance_criteria>
    - FeedPost.jsx imports DOMPurify from 'dompurify'
    - FeedPost.jsx sanitizes report.location?.barangay before rendering
    - FeedPost.jsx sanitizes report.location?.street before rendering (if rendered)
    - useReports.js imports DOMPurify from 'dompurify'
    - useReports.js sanitizes description at write time in submitReport
  </acceptance_criteria>
  <done>All user-generated text fields in report rendering and storage paths use DOMPurify sanitization</done>
</task>

<task type="auto">
  <name>Task 2: Confirm service worker does not cache sensitive data</name>
  <files>public/sw.js</files>
  <read_first>
    - public/sw.js (lines 1-7 for cache names, lines 158-224 for fetch handler, lines 24-36 for IndexedDB, lines 226-233 for isSyncableRequest)
  </read_first>
  <action>
    Review the service worker and confirm no sensitive data is cached:

    1. Lines 176-182 already exclude firebaseio.com and googleapis.com from caching - Firestore auth tokens are never cached. This is correct.

    2. The CACHE_NAME cache (lines 204-212) only caches GET responses from the app itself (navigations, JS, CSS, images) and tiles. This is correct.

    3. The IndexedDB offline queue (lines 24-36) only stores pending POST/PUT requests to /reports, /verify, /resolve endpoints with method/headers/body/timestamp. No auth tokens or user PII stored. Check isSyncableRequest at lines 226-233 - it only checks URL path, not headers.

    Add explicit security documentation comment at the top of the fetch handler section:
    ```
    // Security invariants:
    // - Firestore tokens and auth state are never cached (firebaseio.com/googleapis.com excluded at line 176-182)
    // - IndexedDB offline queue (offlineQueueDB) only stores pending report action URLs/methods/headers/body, no auth tokens or user PII
    // - App shell and map tiles are the only cached content
    ```

    This is primarily a documentation/hardening task - the current implementation is already correct.
  </action>
  <verify>
    <automated>grep -n "firebaseio.com\|googleapis.com" public/sw.js && grep -n "offlineQueueDB" public/sw.js</automated>
  </verify>
  <acceptance_criteria>
    - sw.js explicitly excludes firebaseio.com and googleapis.com from caching (line 176-182)
    - sw.js offline queue only stores URL/method/headers/body/timestamp for report actions
    - No auth tokens, Firebase ID tokens, or user PII in any cache or IndexedDB store
    - Security comment added to fetch handler section
  </acceptance_criteria>
  <done>SW security audit confirms no sensitive data cached; documentation comment added</done>
</task>

<task type="auto">
  <name>Task 3: Implement SW cache version auto-bump on deploy</name>
  <files>package.json, public/sw.js</files>
  <read_first>
    - package.json (build script)
    - public/sw.js (line 1 for CACHE_NAME constant)
  </read_first>
  <action>
    Implement automatic cache version bump so users receive the updated service worker after every deploy.

    The build process copies public/sw.js to dist/sw.js. We need the version constant to change on each build using a timestamp.

    Modify package.json build script to add a sed command that replaces the cache version after Vite build:

    Change from:
    `"build": "vite build"`

    To:
    `"build": "vite build && sed -i \"s/bantayog-alert-v[0-9]*/bantayog-alert-v$(date +%s)/\" dist/sw.js"`

    This appends the Unix epoch timestamp to the cache name on each build, ensuring every production deploy gets a unique SW version that forces all clients to download the new service worker.

    After implementing, verify by running:
    1. npm run build - check dist/sw.js CACHE_NAME contains a timestamp
    2. Run build again - verify the timestamp is different
  </action>
  <verify>
    <automated>npm run build 2>&1 | tail -5 && grep "CACHE_NAME" dist/sw.js | head -1</automated>
  </verify>
  <acceptance_criteria>
    - package.json build script includes sed command to bump CACHE_NAME
    - dist/sw.js CACHE_NAME contains epoch timestamp after build
    - Running build twice produces different version strings in dist/sw.js
  </acceptance_criteria>
  <done>SW cache version auto-bumps on every deploy via package.json build script modification</done>
</task>

</tasks>

<verification>
- DOMPurify sanitization added to FeedPost.jsx and useReports.js for all user-generated text
- SW excludes Firebase APIs and does not store auth tokens in IndexedDB
- package.json build script modifies CACHE_NAME to timestamp on each build
</verification>

<success_criteria>
1. Report content (barangay, street) is sanitized via DOMPurify in render paths
2. Report description is sanitized via DOMPurify at write time in submitReport
3. Service worker does not cache Firestore tokens, auth state, or user PII (verified by code inspection)
4. Service worker cache version increments on every deploy (verified by timestamp change between builds)
</success_criteria>

<output>
After completion, create `.planning/phases/01-security-hardening/02-SUMMARY.md`
</output>
