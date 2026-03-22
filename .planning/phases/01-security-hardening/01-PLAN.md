---
phase: 01-security-hardening
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - firebase.json
  - src/hooks/useAuth.js
  - src/utils/imageCompression.js
autonomous: false
requirements:
  - SEC-01
  - SEC-02
  - SEC-03
  - SEC-04

must_haves:
  truths:
    - "CSP frame-ancestors 'none' is present in firebase.json hosting headers"
    - "CSP upgrade-insecure-requests is present in firebase.json hosting headers"
    - "Avatar upload validates file type by checking magic bytes before upload"
    - "Avatar upload re-encodes images via canvas export to strip embedded payloads"
  artifacts:
    - path: "firebase.json"
      provides: "CSP hosting headers with frame-ancestors and upgrade-insecure-requests"
      contains: "frame-ancestors 'none'"
      contains_also: "upgrade-insecure-requests"
    - path: "src/utils/imageCompression.js"
      provides: "Magic byte validation and canvas re-encoding utility"
      exports: "validateMagicBytes, reencodeImageClean"
    - path: "src/hooks/useAuth.js"
      provides: "updateProfilePicture uses magic byte validation and re-encoding"
      uses: "validateMagicBytes, reencodeImageClean"
  key_links:
    - from: "src/hooks/useAuth.js"
      to: "src/utils/imageCompression.js"
      via: "import { validateMagicBytes, reencodeImageClean } from './imageCompression'"
      pattern: "validateMagicBytes\\(file\\)"
    - from: "firebase.json"
      to: " hosting headers"
      via: "Content-Security-Policy header value"
      pattern: "frame-ancestors.*none"
---

<objective>
Harden CSP headers and avatar upload pipeline. Verify CSP directives are present and functional, add magic-byte file validation to avatar uploads, and implement canvas-based image re-encoding to strip embedded JavaScript and polyglot payloads.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@firebase.json
@src/hooks/useAuth.js
@src/utils/imageCompression.js
@principles/security.md
</context>

<introductory_notes>
**CSP already present:** The firebase.json already contains `frame-ancestors 'none'` and `upgrade-insecure-requests` in the CSP header value (line 43). This plan verifies those directives are correctly present and documented. The security.md principles document (line 16-17) lists `frame-src 'self'` but does not yet document `frame-ancestors` or `upgrade-insecure-requests` - update principles/security.md to reflect actual state.

**Avatar upload flow:** Currently in useAuth.js `updateProfilePicture()` (line 174-215), the avatar is uploaded directly via `uploadBytes(avatarRef, file)` with only a MIME type check (`file.type.startsWith('image/')` in ProfileTab.jsx line 281). This needs magic-byte validation and canvas re-encoding.
</introductory_notes>

<tasks>

<task type="auto">
  <name>Task 1: Verify CSP headers in firebase.json</name>
  <files>firebase.json, principles/security.md</files>
  <read_first>
    - firebase.json (lines 39-44 for the CSP header value)
    - principles/security.md (lines 6-21 for CSP documentation)
  </read_first>
  <action>
    Verify that firebase.json hosting headers contain:
    1. `frame-ancestors 'none'` somewhere in the Content-Security-Policy value
    2. `upgrade-insecure-requests` somewhere in the Content-Security-Policy value

    Both directives already appear on line 43 of firebase.json in the CSP string.

    Also update principles/security.md line 16 to add `frame-ancestors 'none'` to the documented directives, and add `upgrade-insecure-requests` to the list.

    Verification command to confirm directives are present in firebase.json:
    grep -o "frame-ancestors 'none'" firebase.json && grep -o "upgrade-insecure-requests" firebase.json

    If either grep returns empty, the directive is missing and must be added.
  </action>
  <verify>
    <automated>grep -o "frame-ancestors 'none'" firebase.json && grep -o "upgrade-insecure-requests" firebase.json</automated>
  </verify>
  <acceptance_criteria>
    - firebase.json contains `frame-ancestors 'none'` in the CSP header value
    - firebase.json contains `upgrade-insecure-requests` in the CSP header value
    - principles/security.md documents both directives
  </acceptance_criteria>
  <done>CSP frame-ancestors 'none' and upgrade-insecure-requests verified present in firebase.json and documented in security.md</done>
</task>

<task type="auto">
  <name>Task 2: Add magic-byte validation to imageCompression.js</name>
  <files>src/utils/imageCompression.js</files>
  <read_first>
    - src/utils/imageCompression.js (existing functions: compressImage, createThumbnail, validateImage)
  </read_first>
  <action>
    Add two new exported functions to src/utils/imageCompression.js:

    1. `validateMagicBytes(file)` - Reads the first 8 bytes of a File object using FileReader, checks against known image magic byte signatures:
       - JPEG: FF D8 FF (first 3 bytes)
       - PNG: 89 50 4E 47 0D 0A 1A 0A (8 bytes)
       - GIF: 47 49 46 38 (4 bytes, "GIF8")
       - WebP: 52 49 46 46 (4 bytes) followed by WEBP signature at offset 8
       Returns { valid: true } if magic bytes match the declared MIME type, or { valid: false, error: string } if mismatch.

    2. `reencodeImageClean(file, options)` - Creates an HTMLCanvasElement, draws the image file onto it using createImageBitmap + canvas context drawImage, then exports via canvas.toBlob() as 'image/jpeg' (quality 0.85) or 'image/png'. This strips all EXIF metadata, embedded scripts, and polyglot payloads. Returns the re-encoded Blob. Uses createImageBitmap (not Image element) to avoid XSS vectors during decode.

    Add these to the exports of imageCompression.js.

    Magic byte validation table to implement:
    | MIME type | Expected magic bytes (hex) | Offset |
    |-----------|--------------------------|--------|
    | image/jpeg | FF D8 FF | 0 |
    | image/png | 89 50 4E 47 0D 0A 1A 0A | 0 |
    | image/gif | 47 49 46 38 | 0 |
    | image/webp | 52 49 46 46 ... 57 45 42 50 | 0, 8 |
  </action>
  <verify>
    <automated>grep -n "export function validateMagicBytes\|export function reencodeImageClean" src/utils/imageCompression.js</automated>
  </verify>
  <acceptance_criteria>
    - imageCompression.js exports validateMagicBytes(file) function
    - imageCompression.js exports reencodeImageClean(file, options) function
    - validateMagicBytes reads file header bytes and compares against declared MIME type
    - reencodeImageClean uses canvas.toBlob to produce clean JPEG/PNG output
  </acceptance_criteria>
  <done>validateMagicBytes and reencodeImageClean functions exist in imageCompression.js with correct signatures</done>
</task>

<task type="checkpoint:human-verify">
  <name>Task 3: Verify magic-byte validation and canvas re-encoding work</name>
  <files>src/utils/imageCompression.js</files>
  <read_first>
    - src/utils/imageCompression.js (new functions just added)
  </read_first>
  <action>
    Write a test to verify:
    1. A valid JPEG file passes validateMagicBytes with MIME image/jpeg
    2. A valid PNG file passes validateMagicBytes with MIME image/png
    3. A polyglot file (JPEG with script embedded after EOF marker) fails validation
    4. reencodeImageClean produces a blob that is smaller than the original and has no embedded scripts

    Run the test to confirm it passes.
  </action>
  <verify>
    <automated>npm test -- --filter=imageCompression --run 2>&1 | head -50</automated>
  </verify>
  <acceptance_criteria>
    - Test file exists: src/utils/imageCompression.test.js
    - validateMagicBytes correctly accepts valid images and rejects mismatched types
    - reencodeImageClean produces clean output blob
    - All tests pass
  </acceptance_criteria>
  <done>Magic-byte validation and canvas re-encoding are tested and working</done>
</task>

<task type="auto">
  <name>Task 4: Wire magic-byte validation and re-encoding into updateProfilePicture</name>
  <files>src/hooks/useAuth.js</files>
  <read_first>
    - src/hooks/useAuth.js (updateProfilePicture function at line 174-215)
    - src/utils/imageCompression.js (validateMagicBytes and reencodeImageClean just added)
  </read_first>
  <action>
    Modify the updateProfilePicture function in src/hooks/useAuth.js to:

    1. After receiving the file and before uploading, call validateMagicBytes(file) and check result.valid is true. If false, throw error: 'Invalid image file. The file content does not match its declared type.'

    2. After magic byte validation passes, call reencodeImageClean(file, { type: 'image/jpeg', quality: 0.85 }) to get a clean blob, then use that blob for upload instead of the original file.

    3. The uploadBytes call at line 207 should upload the re-encoded blob, not the original file.

    Import validateMagicBytes and reencodeImageClean from '../utils/imageCompression'.

    The updated flow should be:
    - file input -> validateMagicBytes -> reencodeImageClean -> uploadBytes(avatarRef, cleanBlob) -> getDownloadURL

    Keep the existing error handling and toast notifications. Add error message for magic byte mismatch.
  </action>
  <verify>
    <automated>grep -n "validateMagicBytes\|reencodeImageClean" src/hooks/useAuth.js</automated>
  </verify>
  <acceptance_criteria>
    - useAuth.js imports validateMagicBytes and reencodeImageClean from imageCompression
    - updateProfilePicture calls validateMagicBytes before upload
    - updateProfilePicture calls reencodeImageClean and uploads the result blob
    - Magic byte mismatch throws user-facing error
  </acceptance_criteria>
  <done>updateProfilePicture in useAuth.js validates magic bytes and re-encodes via canvas before uploading</done>
</task>

</tasks>

<verification>
- firebase.json CSP contains frame-ancestors and upgrade-insecure-requests (grep verified)
- imageCompression.js exports validateMagicBytes and reencodeImageClean
- useAuth.js updateProfilePicture uses both functions before upload
- Test suite passes for imageCompression
</verification>

<success_criteria>
1. CSP frame-ancestors 'none' present in firebase.json and verified via grep
2. CSP upgrade-insecure-requests present in firebase.json and verified via grep
3. Avatar upload rejects files where magic bytes do not match declared MIME type (validated by test)
4. Avatar upload re-encodes images via canvas.toBlob producing clean JPEG with no embedded scripts (validated by test)
5. All imageCompression tests pass
</success_criteria>

<output>
After completion, create `.planning/phases/01-security-hardening/01-SUMMARY.md`
</output>
