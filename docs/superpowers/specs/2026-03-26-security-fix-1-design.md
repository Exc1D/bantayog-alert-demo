# Security Fix 1 — Design Spec

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix two security findings from the audit: admin route server-side protection and XSS regex bypass. Defense-in-depth HTML escaping (Tasks 3 & 4) was dropped as YAGNI — React JSX auto-escapes `{value}` and `dangerouslySetInnerHTML` is not used anywhere in the rendering pipeline.

**Architecture:** Strengthen Firestore security rules with admin role claims check and improved XSS regex patterns covering dangerous HTML tags.

**Tech Stack:** Firestore security rules

---

## Task 1: Strengthen XSS Regex in Firestore Rules

**Files:**
- Modify: `firestore.rules:92-100`

- [ ] **Step 1: Read current isValidString function**

```javascript
function isValidString(value, maxLength, minLength) {
  return value is string
    && value.size() <= maxLength
    && (minLength == null || value.size() >= minLength)
    && !value.matches('.*<script.*')      // BYPASS: <SCRIPT >, <script%20>
    && !value.matches('.*javascript:.*')   // BYPASS: JavaScript:
    && !value.matches('.*on\\w+\\s*=.*')   // BYPASS: onerror%20=
    && !value.matches('.*data:\\s*text/html.*')
    && !value.matches('.*vbscript:.*');
}
```

- [ ] **Step 2: Replace with strengthened regex**

```javascript
function isValidString(value, maxLength, minLength) {
  return value is string
    && value.size() <= maxLength
    && (minLength == null || value.size() >= minLength)
    && !value.matches('.*<(script|iframe|object|embed|form|svg|math|style)[\\s/>].*', 'i')
    && !value.matches('.*javascript:', 'i')
    && !value.matches('.*data:\\s*text/html', 'i')
    && !value.matches('.*vbscript:', 'i')
    && !value.matches('.*expression\\s*\\(.*', 'i');
}
```

Key improvements:
- `<script|iframe|...>` with `[\s/>]` instead of `.*` prevents space-padded bypass (`<script >`)
- `javascript:` and `vbscript:` with `i` (case-insensitive) flag prevents uppercase bypass
- Added `svg`, `math`, `style` tags to block SVG-based attacks and IE CSS expressions
- Dropped event handler regex (`on\w+`) — DOMPurify at write-time sanitization handles this

- [ ] **Step 3: Commit**

```bash
git add firestore.rules
git commit -m "security(firestore): strengthen XSS regex with case-insensitive tag matching"
```

---

## Task 2: Add Server-Side Admin Route Protection

**Files:**
- Modify: `firestore.rules`

- [ ] **Step 1: Find existing helper functions and adminMetrics/adminReports collections**

Run: `grep -n "function is\|match /admin" firestore.rules`

Check if an `isAdmin()` helper already exists. Also find the actual collection paths used for admin data (e.g., `adminMetrics`, `adminReports`).

- [ ] **Step 2: Add isAdmin() helper using Firebase Auth custom claims**

Add near the top of the rules file with other helper functions. Uses Firebase Auth ID token claims (`request.auth.token.role`) for server-side enforcement:

```javascript
function isAdmin() {
  return request.auth != null && (
    request.auth.token.role == 'admin_camarines_norte'
    || request.auth.token.role == 'admin_basud'
    || request.auth.token.role == 'admin_capalonga'
    || request.auth.token.role == 'admin_daet'
    || request.auth.token.role == 'admin_jose_panganiban'
    || request.auth.token.role == 'admin_labo'
    || request.auth.token.role == 'admin_mercedes'
    || request.auth.token.role == 'admin_paracale'
    || request.auth.token.role == 'admin_san_lorenzo_ruiz'
    || request.auth.token.role == 'admin_san_vicente'
    || request.auth.token.role == 'admin_santa_elena'
    || request.auth.token.role == 'admin_talisay'
    || request.auth.token.role == 'admin_vinzons'
    || request.auth.token.role == 'superadmin_provincial'
  );
}
```

- [ ] **Step 3: Apply isAdmin() to admin collections**

Apply `isAdmin()` to all admin-scoped collections found in Step 1 (e.g., `adminMetrics`, `adminReports`, etc.). For each:

```javascript
match /adminMetrics/{uid} {
  allow read: if request.auth != null && request.auth.uid == uid && isAdmin();
  allow write: if false;
}
```

- [ ] **Step 4: Commit**

```bash
git add firestore.rules
git commit -m "security(firestore): protect admin collections with isAdmin() server-side check"
```

---

## Verification

After all commits:
1. Run `npm run lint` — must pass with 0 errors
2. Run `npm test` — all tests must pass
3. Deploy rules to staging and verify:
   - Report submission with XSS payload `<SCRIPT >alert(1)</SCRIPT>` is rejected by Firestore rules
   - Admin collections return 403 when accessed by non-admin authenticated user
