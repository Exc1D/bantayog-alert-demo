# Review Fixes — Design Specification

**Date:** 2026-03-26
**Status:** Draft
**Branch:** `fix/responsive-width-consistency`

---

## Context

Three review agents (Krislo — aesthetic, Tinduk — UX, Exxeed — architecture) evaluated Bantayog Alert and identified 14 findings. These are organized into 8 actionable fix items across three priority tiers. All items are to be addressed in one PR before production deployment.

---

## Phase 1: Critical UX Blockers

### 1. Map Pin Click → Bottom Sheet

**Problem:** `MapTab` receives `onViewReport={noop}` — all map pin clicks are dead ends. Users expect to see report details.

**Solution:** Wire up a real handler that opens a `BottomSheet` with report details.

**New Component: `src/components/Common/BottomSheet.jsx`**

A reusable slide-up drawer component:

```jsx
// Props
{
  isOpen: boolean,
  onClose: () => void,
  children: React.node,
  title?: string,
}
```

**Behavior:**
- Opens with slide-up + fade animation (300ms ease-out)
- Drag handle at top — user can swipe down to dismiss
- Backdrop overlay — tap outside to close
- Escape key closes
- Body scroll lock while open
- Focus trapped inside while open
- Focus restored to trigger element on close

**Accessibility (ARIA):**
```jsx
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="bottomsheet-title"
  // ...
>
  {title && <h2 id="bottomsheet-title">{title}</h2>}
```

**Stacking / Z-Index:**
- Backdrop: `z-40`
- Sheet panel: `z-50`
- Ensures BottomSheet appears above standard content but below toasts/modals
- If used alongside `ToastProvider` (z-60), adjust as: backdrop=`z-40`, sheet=`z-50`, toast stays above

**Implementation approach:**
- CSS `transform: translateY()` + `opacity` for animation
- `pointer-events: none` + `opacity-0` on backdrop when closed
- `useEffect` for body scroll lock (save and restore `overflow` style)
- Drag-to-dismiss: track `touchstart`/`mousedown` Y position, compare with `touchmove`/`mousemove` delta. Dismiss when cumulative delta exceeds 80px threshold with sufficient velocity. If threshold not met on release, spring back to open position.

---

**App-level wiring in `src/App.jsx`:**

```jsx
// State (near top of App)
const [selectedPinReport, setSelectedPinReport] = useState(null);

// Pass to MapTab
<MapTab
  onViewReport={(report) => setSelectedPinReport(report)}
  selectedReport={selectedPinReport}
/>

// BottomSheet rendered conditionally
{selectedPinReport && (
  <BottomSheet
    isOpen={!!selectedPinReport}
    onClose={() => setSelectedPinReport(null)}
  >
    <ReportDetailCard report={selectedPinReport} />
  </BottomSheet>
)}
```

**`src/components/Map/LeafletMap.jsx` changes:**
- Accept `onSelectReport` and `selectedReport` props
- On marker click: call `onSelectReport(report)`
- Selected marker gets distinct styling (e.g., pulsing ring, scaled up)

**`ReportDetailCard`:** New inline component inside `App.jsx` (or extracted to `src/components/Common/ReportDetailCard.jsx`). Shows:
- Severity badge + status stripe
- Report title / disaster type
- Location (municipality + barangay)
- Timestamp (formatted via `timeUtils.js`)
- Reporter name/avatar
- Thumbnail photo if attached
- "View Full Report" button → navigates to FeedTab with report ID

**Privacy note:** If the reporter is anonymous (`user.isAnonymous === true`), the `ReportDetailCard` should NOT display the reporter name/avatar. Anonymous reporters expect their identity to be hidden. Check the report's `user.isAnonymous` flag and conditionally render the reporter section.

---

### 2. Enable `NEW_REPORT_FLOW`

**Problem:** Report submission is blocked by a `FeatureFlagDisabled` wrapper showing "currently unavailable." While `ENVIRONMENT_DEFAULTS` for all environments set this to `true`, if Firebase Remote Config is not initializing correctly, it falls back to `DEFAULT_FLAGS` where it is `false`.

**Solution:** Ensure the flag is reliably enabled. Two changes needed:

**(a) `src/config/featureFlags.js` line 15** — Remove the stale `false` fallback:
```js
// Remove NEW_REPORT_FLOW from DEFAULT_FLAGS since all environments override it anyway
// OR set it to true as a safe default:
[FEATURE_FLAGS.NEW_REPORT_FLOW]: true,
```

**(b) `src/components/Reports/ReportModal.jsx`** — Investigate why `FeatureFlagDisabled` renders. If Firebase Remote Config is not calling `initializeRemoteConfig()`, the flag will use `getDefaultForFlag()` which returns `ENVIRONMENT_DEFAULTS[env].NEW_REPORT_FLOW` = `true` for all envs. If Remote Config IS initialized with `false` from the Firebase console, that needs to be changed there.

**Verification:** After changes, load the app and confirm the report button opens the submission form (not the "unavailable" message). Check browser console for any `Unknown feature flag` warnings.

---

### 3. Fix `handleBack` in ReportModal

**Problem:** Navigating back from Step 2 → Step 1 destroys `reportType` and `evidenceFiles`, forcing the user to re-upload all evidence.

**Solution:** Remove the destructive state resets from the back handler.

**Change — `src/components/Reports/ReportModal.jsx`:**

```js
// BEFORE (lines 140–148)
const handleBack = () => {
  if (step === 2) {
    setStep(1);
    setReportType(null);    // ← destroys user work
    setEvidenceFiles([]);   // ← destroys user work
  } else if (step === 3) {
    setStep(2);
  }
};

// AFTER
const handleBack = () => {
  if (step === 2) {
    setStep(1);
    // reportType and evidenceFiles PRESERVED — user can go forward without re-entering
  } else if (step === 3) {
    setStep(2);
  }
};
```

The `reportType` and `evidenceFiles` state are preserved on step 2 → step 1 back navigation. They are only reset when the user explicitly cancels/closes the modal or starts a new report.

---

## Phase 2: UI Polish

### 4. AlertsTab max-width → `1200px`

**Problem:** `AlertsTab.jsx` uses `xl:max-w-[1280px]` while all other tabs use `xl:max-w-[1200px]`.

**Files:** `src/pages/AlertsTab.jsx` (lines 18 and 29)

**Change:**
```js
// Before
xl:w-[1280px] xl:max-w-[1280px]

// After
xl:max-w-[1200px]    // remove the xl:w-[1280px] line
```

Note: `AdminDashboardPage.jsx` also uses `xl:max-w-[1280px]` — apply the same fix there for consistency.

---

### 5. WeatherCard Emoji → Inline SVG Icons

**Problem:** `WeatherCard.jsx` uses unicode emoji (`\u2600\uFE0F` for sun, `\u2601\uFE0F` for cloud) which render inconsistently across platforms and clash with the app's SVG icon system.

**Solution:** Replace `WEATHER_ICONS` map with inline SVG icons using Lucide-style paths.

**File:** `src/components/Weather/WeatherCard.jsx`

**Before:**
```js
const WEATHER_ICONS = {
  '01d': '\u2600\uFE0F',   // sun
  '03d': '\u2601\uFE0F',   // cloud
  // ...
};
```

**After:** Replace with SVG map — same structure, values are SVG JSX:

```jsx
const WEATHER_ICONS = {
  '01d': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>,
  '03d': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>,
  // ... etc
};
```

- Use `stroke="currentColor"` so the icon inherits text color (works in both light/dark modes)
- Keep the same lookup key structure (`'01d'`, `'03d'`, etc.)

---

### 6. Dark Mode Scrollbar

**File:** `src/App.css`

**Add to end of file:**
```css
.dark ::-webkit-scrollbar-thumb {
  background: #2A3F55;
  border-radius: 4px;
}

.dark ::-webkit-scrollbar-track {
  background: transparent;
}
```

---

## Phase 3: Code Quality

### 7. Dead Code Removal

**`src/App.jsx` line 14:**
```js
// Before
const [_isPending, startTransition] = useTransition();

// After — remove _isPending
const [, startTransition] = useTransition();
```

**`src/hooks/useAuth.js`** — Remove or comment out all `console.log` debug statements (6+ instances prefixed with `[Auth]`). Sentry integration (`captureException`) is already imported and should be used for actual error logging instead.

### 8. Real-time Password Validation

**File:** `src/pages/ProfileTab.jsx` (around lines 181–192)

Add inline validation feedback as user types:

```jsx
const [passwordErrors, setPasswordErrors] = useState([]);

useEffect(() => {
  const errors = [];
  if (password.length > 0 && password.length < 6) {
    errors.push('At least 6 characters');
  }
  setPasswordErrors(errors);
}, [password]);

// Below the password input:
{passwordErrors.length > 0 && (
  <p className="text-xs text-red-500 mt-1">
    {passwordErrors.join(' • ')}
  </p>
)}
```

---

## Files Changed Summary

| File | Change Type |
|------|-------------|
| `src/App.jsx` | Modify — add pin selection state, BottomSheet render |
| `src/components/Common/BottomSheet.jsx` | **New** — reusable sheet component |
| `src/components/Map/LeafletMap.jsx` | Modify — wire onSelectReport to marker clicks |
| `src/components/Reports/ReportModal.jsx` | Modify — fix handleBack |
| `src/config/featureFlags.js` | Verify — confirm Remote Config or environment enables NEW_REPORT_FLOW |
| `src/pages/AlertsTab.jsx` | Modify — max-width 1280→1200 (×2 occurrences) |
| `src/pages/AdminDashboardPage.jsx` | Modify — max-width 1280→1200 |
| `src/pages/ProfileTab.jsx` | Modify — real-time password validation |
| `src/components/Weather/WeatherCard.jsx` | Modify — emoji → SVG icons |
| `src/hooks/useAuth.js` | Modify — remove console.log statements |
| `src/App.css` | Modify — add dark mode scrollbar |

---

## Dependency Order

1. `ReportModal.jsx` — fix handleBack (independent)
2. `BottomSheet.jsx` — new component (independent)
3. `App.jsx` — state + wiring (depends on BottomSheet)
4. `LeafletMap.jsx` — wire handlers (depends on App.jsx state shape)
5. `WeatherCard.jsx` — SVG icons (independent)
6. `AlertsTab.jsx` + `AdminDashboardPage.jsx` — width fixes (independent)
7. `ProfileTab.jsx` — password validation (independent)
8. `useAuth.js` — remove debug logs (independent)
9. `App.css` — dark mode scrollbar (independent)
10. `featureFlags.js` — verify Remote Config or environment enables NEW_REPORT_FLOW (last — is a check, not a code change)

---

## Verification

- Map pins clickable → bottom sheet opens with correct report data
- Bottom sheet dismisses on drag, tap outside, Escape
- Report submission flow accessible (no "unavailable" message)
- Back button in Step 2 → Step 1 preserves evidence and report type
- AlertsTab and AdminDashboardPage have same max-width as other tabs
- Weather icons render consistently across browsers
- Dark mode scrollbar visible in dark mode
- No `console.log` output in auth flows
- Password field shows inline validation errors as user types
