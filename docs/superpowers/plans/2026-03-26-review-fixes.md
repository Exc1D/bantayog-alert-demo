# Review Fixes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 8 actionable issues identified by Krislo (aesthetic), Tinduk (UX), and Exxeed (architecture) reviews — 3 critical UX blockers, 3 UI polish items, 2 code quality fixes.

**Architecture:** 10 independent file changes across 3 phases. BottomSheet is the only new component; everything else modifies existing files. Phase 1 (UX blockers) must be verified before Phase 2 (polish) to keep PR scope manageable.

**Tech Stack:** React 18, Tailwind CSS, Leaflet (react-leaflet), Firebase. No new dependencies.

---

## Phase 1: Critical UX Blockers

### Task 1: Fix `handleBack` in ReportModal — Preserve Evidence on Back Navigation

**Files:**
- Modify: `src/components/Reports/ReportModal.jsx:140-148`

**Reference:** `src/components/Reports/ReportModal.jsx` — read lines 130–160 to see full context of `handleBack` and the step/state variables.

- [ ] **Step 1: Read the current handleBack implementation**

Run: `grep -n "handleBack\|step === \|setReportType\|setEvidenceFiles" src/components/Reports/ReportModal.jsx | head -30`
Confirm: Lines 140–148 show the destructive `setReportType(null)` and `setEvidenceFiles([])` on step 2 back.

- [ ] **Step 2: Edit handleBack to remove destructive state resets**

File: `src/components/Reports/ReportModal.jsx`, lines 140–148.

```js
// BEFORE:
const handleBack = () => {
  if (step === 2) {
    setStep(1);
    setReportType(null);    // ← destroys user work
    setEvidenceFiles([]);   // ← destroys user work
  } else if (step === 3) {
    setStep(2);
  }
};

// AFTER:
const handleBack = () => {
  if (step === 2) {
    setStep(1);
    // reportType and evidenceFiles are preserved — user can go forward without re-entering
  } else if (step === 3) {
    setStep(2);
  }
};
```

- [ ] **Step 3: Verify the file still compiles**

Run: `cd /home/exxeed/dev/projects/bantayog-alert-demo && npm run build 2>&1 | tail -5`
Expected: No errors related to ReportModal.

- [ ] **Step 4: Commit**

```bash
git add src/components/Reports/ReportModal.jsx
git commit -m "fix(ReportModal): preserve reportType and evidenceFiles on back navigation

Fixes Tinduk finding #3 — going back from step 2 to step 1 was
destroying uploaded evidence and selected report type, forcing users
to re-upload everything on accidental back navigation.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 2: Create `BottomSheet` Component — Reusable Slide-Up Drawer

**Files:**
- Create: `src/components/Common/BottomSheet.jsx`

**Reference:** `src/components/Common/Modal.jsx` — read the full file to understand the existing overlay patterns (focus trap, body scroll lock, Escape key). Modal uses `z-[55]`.

- [ ] **Step 1: Create BottomSheet.jsx**

```jsx
import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * Reusable bottom sheet drawer component.
 *
 * Props:
 *   isOpen    — boolean, controls open/close
 *   onClose   — called when user dismisses (via backdrop, Escape, or drag)
 *   children  — content to render inside the sheet
 *   title     — optional header title
 */
export default function BottomSheet({ isOpen, onClose, children, title }) {
  const sheetRef = useRef(null);
  const previousFocusRef = useRef(null);
  const dragStartY = useRef(0);
  const dragCurrentDelta = useRef(0);
  const isDraggingRef = useRef(false);

  // Body scroll lock + focus management
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement;
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => {
        sheetRef.current?.focus();
      });
    } else {
      document.body.style.overflow = '';
      previousFocusRef.current?.focus();
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Escape key handler
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  // Drag-to-dismiss
  const handleDragStart = (clientY) => {
    dragStartY.current = clientY;
    dragCurrentDelta.current = 0;
    isDraggingRef.current = true;
  };

  const handleDragMove = (clientY) => {
    if (!isDraggingRef.current) return;
    const delta = clientY - dragStartY.current;
    if (delta > 0) {
      dragCurrentDelta.current = delta;
      if (sheetRef.current) {
        sheetRef.current.style.transform = `translateY(${delta}px)`;
        sheetRef.current.style.opacity = String(Math.max(0, 1 - delta / 200));
      }
    }
  };

  const handleDragEnd = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const delta = dragCurrentDelta.current;
    if (sheetRef.current) {
      sheetRef.current.style.transform = '';
      sheetRef.current.style.opacity = '';
    }
    // Dismiss if dragged down more than 80px
    if (delta > 80) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex flex-col items-end justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'bottomsheet-title' : undefined}
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet panel */}
      <div
        ref={sheetRef}
        tabIndex={-1}
        className={`
          relative w-full max-h-[85vh] bg-white dark:bg-dark-card
          rounded-t-2xl shadow-dark overflow-hidden
          flex flex-col
          animate-slide-up
        `}
        onMouseDown={(e) => handleDragStart(e.clientY)}
        onMouseMove={(e) => handleDragMove(e.clientY)}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchStart={(e) => handleDragStart(e.touches[0].clientY)}
        onTouchMove={(e) => handleDragMove(e.touches[0].clientY)}
        onTouchEnd={handleDragEnd}
      >
        {/* Drag handle */}
        <div className="flex justify-center py-2.5 shrink-0" aria-hidden="true">
          <div className="w-10 h-1 rounded-full bg-stone-300 dark:bg-stone-600" />
        </div>

        {/* Header */}
        {title && (
          <div className="px-5 pb-3 shrink-0">
            <h2
              id="bottomsheet-title"
              className="text-base font-display font-semibold text-text dark:text-dark-text"
            >
              {title}
            </h2>
          </div>
        )}

        {/* Scrollable content */}
        <div className="overflow-y-auto px-5 pb-6 flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
```

**Notes on implementation:**
- `z-40` for backdrop, `z-50` is not needed since the sheet is inside the same container — the stacking is implicit
- The `animate-slide-up` class is already defined in `App.css` for the Modal — no new CSS needed
- Body scroll lock saves/restores the previous overflow value (not hardcoded)
- `requestAnimationFrame` defers focus to after the open animation completes

- [ ] **Step 2: Verify the component file is valid JSX**

Run: `cd /home/exxeed/dev/projects/bantayog-alert-demo && npx eslint src/components/Common/BottomSheet.jsx --no-eslintrc --parser-options=ecmaVersion:2022,sourceType:module,ecmaFeatures:{jsx:true} 2>&1 | tail -10`
Expected: No parse errors. (If ESLint is not configured for standalone files, skip this step and rely on build step.)

- [ ] **Step 3: Commit**

```bash
git add src/components/Common/BottomSheet.jsx
git commit -m "feat(BottomSheet): add reusable slide-up drawer component

Adds src/components/Common/BottomSheet.jsx — a reusable bottom sheet
with drag-to-dismiss (80px threshold), backdrop tap-to-close,
Escape key handling, body scroll lock, and ARIA compliance
(role=dialog, aria-modal, aria-labelledby).

No new dependencies. Uses existing animate-slide-up CSS animation.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 3: Wire Map Pin Clicks to BottomSheet in App.jsx

**Files:**
- Modify: `src/App.jsx:46` (add state), `:105` (first noop), `:121` (second noop), `:201-206` (add BottomSheet)
- Create (inline component): `ReportDetailCard` — defined inside `AppContent` in `src/App.jsx`

**Reference:** Read `src/App.jsx` lines 1–25 for imports, 42–210 for `AppContent`.

Key context:
- `MapTab` accepts `onViewReport` prop (line 5 in MapTab: `export default function MapTab({ onViewReport })`)
- `MapTab` passes it to `LeafletMap` as `onReportClick={onViewReport}` (line 15 of MapTab.jsx)
- `LeafletMap` calls `onReportClick(report)` on marker click
- The existing `noop` on lines 105 and 121 is the dead-end that needs replacing

The `ReportDetailCard` shows: severity badge, status stripe, disaster type, location, timestamp, reporter (if not anonymous), thumbnail, and a "View Full Report" button. The button should call `changeTab('feed')` then close the sheet.

- [ ] **Step 1: Read App.jsx around lines 100–210**

```bash
sed -n '100,210p' src/App.jsx
```

- [ ] **Step 2: Add selectedPinReport state + wire BottomSheet in App.jsx**

After line 46 (`const [_isPending, startTransition] = useTransition();`), add:

```jsx
const [selectedPinReport, setSelectedPinReport] = useState(null);
```

Replace the two `MapTab onViewReport={noop}` calls (lines 105 and 121) with:

```jsx
<MapTab
  onViewReport={(report) => setSelectedPinReport(report)}
  selectedReport={selectedPinReport}
/>
```

After the closing `}` of `AppContent` return statement (before line 206 `);`), add the BottomSheet and ReportDetailCard:

```jsx
{selectedPinReport && (
  <BottomSheet
    isOpen={!!selectedPinReport}
    onClose={() => setSelectedPinReport(null)}
    title="Report Details"
  >
    <ReportDetailCard
      report={selectedPinReport}
      onViewFull={() => {
        setSelectedPinReport(null);
        changeTab('feed');
      }}
    />
  </BottomSheet>
)}
```

- [ ] **Step 3: Add ReportDetailCard as an inline component**

Define `ReportDetailCard` as a `function ReportDetailCard({ report, onViewFull })` inside `AppContent`, before the `renderTab` function. It uses:
- `formatTimeAgo` from `../utils/timeUtils`
- `DisasterIcon` from `../components/Common/DisasterIcon`
- Existing badge styles from `DisasterMarker.jsx` (copy the `sevStyles` and `statusStyles` objects)
- `Avatar` from `../components/Common/Avatar`
- `changeTab` is available in scope

**Minimal ReportDetailCard implementation:**

```jsx
function ReportDetailCard({ report, onViewFull }) {
  const sevStyles = {
    critical: 'bg-red-600 text-white',
    moderate: 'bg-amber-500 text-white',
    minor: 'bg-emerald-600 text-white',
  };
  const statusStyles = {
    pending: 'bg-stone-200 text-stone-700',
    verified: 'bg-blue-100 text-blue-700',
    rejected: 'bg-red-100 text-red-700',
    resolved: 'bg-emerald-100 text-emerald-700',
  };

  const disasterType = report.disaster?.type;
  const severity = report.disaster?.severity || 'minor';
  const status = report.verification?.status || 'pending';

  return (
    <div className="space-y-3">
      {/* Severity + Status row */}
      <div className="flex items-center gap-2">
        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide ${sevStyles[severity]}`}>
          {severity}
        </span>
        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide ${statusStyles[status]}`}>
          {status}
        </span>
      </div>

      {/* Disaster type */}
      <div>
        <h3 className="font-bold text-base text-text dark:text-dark-text">
          {disasterType ? disasterType.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Unknown Incident'}
        </h3>
        <p className="text-sm text-textLight dark:text-dark-textLight mt-0.5">
          {report.location.municipality}
          {report.location.barangay ? `, ${report.location.barangay}` : ''}
        </p>
      </div>

      {/* Description */}
      {report.disaster?.description && (
        <p className="text-sm text-text dark:text-dark-text line-clamp-3">
          {report.disaster.description}
        </p>
      )}

      {/* Reporter — hide if anonymous */}
      {!report.user?.isAnonymous && report.user?.name && (
        <div className="flex items-center gap-2 pt-2 border-t border-stone-100 dark:border-dark-border">
          <Avatar name={report.user.name} size="sm" />
          <span className="text-sm font-medium text-text dark:text-dark-text">{report.user.name}</span>
        </div>
      )}

      {/* Timestamp */}
      <p className="text-xs text-textMuted dark:text-dark-textMuted">
        {report.timestamp ? formatTimeAgo(report.timestamp) : ''}
      </p>

      {/* Photo thumbnail */}
      {report.media?.thumbnails?.[0] && (
        <img
          src={report.media.thumbnails[0]}
          alt="Report photo"
          className="w-full h-32 object-cover rounded-lg"
          loading="lazy"
        />
      )}

      {/* View Full Report button */}
      <button
        onClick={onViewFull}
        className="w-full py-2.5 bg-primary text-white rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors"
      >
        View Full Report
      </button>
    </div>
  );
}
```

Add needed imports at the top of App.jsx (if not already present):
```jsx
import Avatar from './components/Common/Avatar';
import BottomSheet from './components/Common/BottomSheet';
import { formatTimeAgo } from './utils/timeUtils';
```

Note: `DisasterIcon` is NOT needed in `ReportDetailCard` — the simplified card implementation uses text-based disaster type labels only (no icon). The existing `sevStyles` and `statusStyles` are inlined in the component for self-containment.

- [ ] **Step 4: Build and verify**

Run: `cd /home/exxeed/dev/projects/bantayog-alert-demo && npm run build 2>&1 | tail -10`
Expected: No build errors.

- [ ] **Step 5: Commit**

```bash
git add src/App.jsx
git commit -m "feat(App): wire map pin clicks to BottomSheet with report details

Replaces noop onViewReport handlers with setSelectedPinReport state.
Adds BottomSheet + ReportDetailCard inline component showing severity,
status, disaster type, location, description, reporter (if not
anonymous), timestamp, photo thumbnail, and 'View Full Report' CTA.

Fixes Tinduk finding #1 — map pin clicks are no longer dead ends.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 4: LeafletMap — Add Selected Marker Styling (Optional Polish)

**Files:**
- Modify: `src/components/Map/LeafletMap.jsx:129` — add `selectedReport` prop, pass `isSelected` to DisasterMarker
- Modify: `src/components/Map/DisasterMarker.jsx` — add `isSelected` prop, update `getMarkerIcon` signature and icon HTML

**Reference:** `src/components/Map/DisasterMarker.jsx` lines 13–64 — `getMarkerIcon` function. `src/components/Map/LeafletMap.jsx` lines 129, 244.

**IMPORTANT:** The current `getMarkerIcon` function signature is:
```js
function getMarkerIcon(type, severity, status, reportType)
```
It has NO `isSelected` parameter. The plan adds it. Similarly, the current `DisasterMarker` props do not include `isSelected`.

- [ ] **Step 1: Pass selectedReport prop to LeafletMap, wire to DisasterMarker**

In `LeafletMap.jsx`:
(a) Add `selectedReport` to the component props (line 129):
```jsx
export default function LeafletMap({ reports = [], onReportClick, selectedReport }) {
```

(b) Pass `isSelected` to each DisasterMarker (line 244-246):
```jsx
<DisasterMarker
  key={report.id}
  report={report}
  onClick={handleMarkerClick}
  isSelected={selectedReport?.id === report.id}
/>
```

- [ ] **Step 2: Update DisasterMarker props and getMarkerIcon**

In `DisasterMarker.jsx`:

(a) Add `isSelected` to props (line 79):
```jsx
export default memo(function DisasterMarker({ report, onClick, isSelected }) {
```

(b) Update `getMarkerIcon` signature and use `isSelected` in the icon HTML (lines 13–63).
**Before:**
```js
function getMarkerIcon(type, severity, status, reportType) {
  ...
  const size = severity === 'critical' ? 44 : 38;
  const divIcon = L.divIcon({
    html: `
      <div style="
        background: ${color};
        width: ${size}px;
        height: ${size}px;
        ...
      ">
        ${icon}
      </div>
    `,
```

**After (replace the entire `getMarkerIcon` function):**
```js
function getMarkerIcon(type, severity, status, reportType, isSelected = false) {
  const cacheKey = `${type}-${severity}-${status}-${reportType}-${isSelected}`;
  if (iconCache.has(cacheKey)) return iconCache.get(cacheKey);

  const size = severity === 'critical' ? 44 : 38;
  const scale = isSelected ? 1.2 : 1;
  const color = MARKER_COLORS[type] || MARKER_COLORS.other;
  const opacity = status === 'verified' || status === 'resolved' ? 1 : 0.7;
  const borderColor =
    status === 'resolved' ? '#16a34a' : severity === 'critical' ? '#dc2626' : '#ffffff';

  const divIcon = L.divIcon({
    html: `
      <div style="
        background: ${color};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: 3px solid ${borderColor};
        box-shadow: 0 2px 10px rgba(0,0,0,0.35);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${severity === 'critical' ? 22 : 18}px;
        opacity: ${opacity};
        transition: transform 0.2s;
        transform: scale(${scale});
      ">
        ${icon}
      </div>
    `,
    className: 'custom-marker',
    iconSize: [size * scale, size * scale],
    iconAnchor: [(size * scale) / 2, (size * scale) / 2],
    popupAnchor: [0, -(size * scale) / 2],
  });

  iconCache.set(cacheKey, divIcon);
  return divIcon;
}
```

(c) Update `useMemo` to include `isSelected` in dependencies (lines 81–95):
```jsx
const icon = useMemo(
  () =>
    getMarkerIcon(
      report.disaster?.type,
      report.disaster?.severity,
      report.verification?.status,
      report.reportType,
      isSelected
    ),
  [
    report.disaster?.type,
    report.disaster?.severity,
    report.verification?.status,
    report.reportType,
    isSelected
  ]
);
```

- [ ] **Step 3: Build and commit**

```bash
git add src/components/Map/LeafletMap.jsx src/components/Map/DisasterMarker.jsx
git commit -m "feat(Map): highlight selected marker with scale transform

When a user clicks a map pin, the selected marker scales up (1.25x)
to provide visual feedback that the bottom sheet corresponds to it.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Phase 2: UI Polish

### Task 5: WeatherCard — Replace Emoji with Inline SVG Icons

**Files:**
- Modify: `src/components/Weather/WeatherCard.jsx:1-20`

- [ ] **Step 1: Read the current WEATHER_ICONS map**

```bash
head -20 src/components/Weather/WeatherCard.jsx
```

- [ ] **Step 2: Replace the WEATHER_ICONS emoji map with SVG map**

Replace lines 1–20:

```jsx
const WEATHER_ICONS = {
  // Clear sky day — sun
  '01d': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  ),
  // Clear sky night — moon
  '01n': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  ),
  // Few/scattered clouds — partly cloudy
  '02d': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
      <path d="M22 10a3 3 0 0 0-3-3h-1.5a3 3 0 0 0 0 6h2a3 3 0 0 1 0 6h-1.5a3 3 0 0 1-3-3Z" transform="translate(-4,-4) scale(0.5)" />
    </svg>
  ),
  '02n': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  ),
  // Broken/overcast clouds
  '03d': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
    </svg>
  ),
  '03n': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
    </svg>
  ),
  '04d': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
    </svg>
  ),
  '04n': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
    </svg>
  ),
  // Shower rain
  '09d': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
      <path d="M8 19v1M8 14v1M16 19v1M16 14v1M12 21v1M12 16v1" />
    </svg>
  ),
  '09n': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
      <path d="M8 19v1M8 14v1M16 19v1M16 14v1M12 21v1M12 16v1" />
    </svg>
  ),
  // Rain / thunderstorm
  '10d': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
      <path d="M16 14v6M8 14v6M12 16v6" />
    </svg>
  ),
  '10n': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
      <path d="M16 14v6M8 14v6M12 16v6" />
    </svg>
  ),
  // Thunderstorm
  '11d': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <path d="M6 16.326A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 .5 8.973" />
      <path d="m13 12-3 5h4l-3 5" />
    </svg>
  ),
  '11n': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <path d="M6 16.326A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 .5 8.973" />
      <path d="m13 12-3 5h4l-3 5" />
    </svg>
  ),
  // Snow
  '13d': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
      <path d="M8 15h.01M8 19h.01M12 17h.01M12 21h.01M16 15h.01M16 19h.01" />
    </svg>
  ),
  '13n': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
      <path d="M8 15h.01M8 19h.01M12 17h.01M12 21h.01M16 15h.01M16 19h.01" />
    </svg>
  ),
  // Mist/fog
  '50d': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <path d="M3 8h14M3 12h16M3 16h10" />
    </svg>
  ),
  '50n': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <path d="M3 8h14M3 12h16M3 16h10" />
    </svg>
  ),
};
```

- [ ] **Step 3: Verify the weather icons render correctly**

Run: `npm run build 2>&1 | grep -i "error\|warning" | head -10`
Expected: No errors related to WeatherCard.

- [ ] **Step 4: Commit**

```bash
git add src/components/Weather/WeatherCard.jsx
git commit -m "fix(WeatherCard): replace emoji weather icons with inline SVG

Uses consistent stroke-based SVG icons (Lucide style) replacing
unicode emoji (\u2600\uFE0F, \u2601\uFE0F, etc.) for cross-platform
rendering consistency and visual cohesion with the rest of the app's
SVG icon system.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 6: AlertsTab + AdminDashboard — Fix max-width to 1200px

**Files:**
- Modify: `src/pages/AlertsTab.jsx:18,29`
- Modify: `src/pages/AdminDashboardPage.jsx:5`

- [ ] **Step 1: Find all 1280px occurrences**

```bash
grep -n "1280" src/pages/AlertsTab.jsx src/pages/AdminDashboardPage.jsx
```

- [ ] **Step 2: Fix AlertsTab — both occurrences**

Line 18: Change `xl:w-[1280px] xl:max-w-[1280px]` → `xl:max-w-[1200px]`
Line 29: Change `xl:w-[1280px] xl:max-w-[1280px]` → `xl:max-w-[1200px]`

Using `replace_all` on each file.

- [ ] **Step 3: Fix AdminDashboardPage**

Line 5: Change `xl:w-[1280px] xl:max-w-[1280px]` → `xl:max-w-[1200px]`

- [ ] **Step 4: Verify with grep**

```bash
grep -n "1280\|1200" src/pages/AlertsTab.jsx src/pages/AdminDashboardPage.jsx
```
All should show `1200`.

- [ ] **Step 5: Commit**

```bash
git add src/pages/AlertsTab.jsx src/pages/AdminDashboardPage.jsx
git commit -m "fix(responsive): standardize AlertsTab and AdminDashboard to xl:max-w-[1200px]

Matches the max-width used by FeedTab, ProfileTab, and WeatherTab,
fixing Krislo's finding of inconsistent layout widths on xl screens.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 7: App.css — Add Dark Mode Scrollbar

**Files:**
- Modify: `src/App.css` — append after line 335

- [ ] **Step 1: Read current scrollbar section**

```bash
sed -n '318,336p' src/App.css
```

- [ ] **Step 2: Add dark mode scrollbar after existing scrollbar rules**

After line 335 (after `::-webkit-scrollbar-thumb:hover`), add:

```css
.dark ::-webkit-scrollbar-thumb {
  background: #2A3F55;
  border-radius: 3px;
}

.dark ::-webkit-scrollbar-thumb:hover {
  background: #3A5070;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/App.css
git commit -m "fix(dark-mode): add dark scrollbar thumb color

Fixes Krislo's finding — the scrollbar thumb color was not adapting
for dark mode, making it nearly invisible or mismatched.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Phase 3: Code Quality

### Task 8: Dead Code Removal — App.jsx `_isPending` + useAuth.js console.log

**Files:**
- Modify: `src/App.jsx:46`
- Modify: `src/hooks/useAuth.js` — remove `[Auth]` prefixed console.log statements

- [ ] **Step 1: Fix App.jsx — remove _isPending**

Line 46:
```js
// BEFORE:
const [_isPending, startTransition] = useTransition();

// AFTER:
const [, startTransition] = useTransition();
```

- [ ] **Step 2: Find all [Auth] console.log statements in useAuth.js**

```bash
grep -n "console\.log.*\[Auth\]" src/hooks/useAuth.js
```

Expected: 8 occurrences at approximately lines 88, 91, 94, 122, 125, 137, 153, 155. Remove ALL of them (the grep finds them, the executor removes each one).

- [ ] **Step 3: Remove or comment out each [Auth] console.log**

For each `console.log('[Auth]', ...)` found, either delete the line or replace with a comment explaining why it was removed.

Example:
```js
// BEFORE:
console.log('[Auth] signUp: starting for', email);

// AFTER (remove):
// [Debug: removed — was used during auth flow development]
```

- [ ] **Step 4: Verify build**

```bash
npm run build 2>&1 | tail -5
```

- [ ] **Step 5: Commit**

```bash
git add src/App.jsx src/hooks/useAuth.js
git commit -m "chore: remove dead code and debug logging

- App.jsx: remove unused _isPending from useTransition destructuring
- useAuth.js: remove 5+ [Auth] prefixed console.log debug statements

These were development artifacts that should not appear in production
console output. Sentry captureException is already available for
actual error logging.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 9: ProfileTab — Real-time Password Validation

**Files:**
- Modify: `src/pages/ProfileTab.jsx` — inside the `AuthForm` function

**Reference:** `src/pages/ProfileTab.jsx` lines 181–217 — the password input area.

The `AuthForm` is an inline function inside `ProfileTab.jsx` (starts at line 14). The password state `const [password, setPassword] = useState('')` is at line 17. The password input is at lines 183–188.

- [ ] **Step 1: Read the AuthForm function context**

```bash
sed -n '14,50p' src/pages/ProfileTab.jsx
```

- [ ] **Step 2: Add passwordErrors state and useEffect near other state declarations**

After line 17 (`const [showPassword, setShowPassword] = useState(false);`), add:

```jsx
const [passwordErrors, setPasswordErrors] = useState([]);

useEffect(() => {
  const errors = [];
  if (password.length > 0 && password.length < 6) {
    errors.push('At least 6 characters required');
  }
  setPasswordErrors(errors);
}, [password]);
```

- [ ] **Step 3: Render passwordErrors below the password input**

After the password input closing tag (line 188), add:

```jsx
{passwordErrors.length > 0 && (
  <p className="text-xs text-red-500 mt-1" role="alert">
    {passwordErrors.join(' • ')}
  </p>
)}
```

Note: `role="alert"` ensures screen readers announce the error immediately when it appears.

- [ ] **Step 4: Verify build**

```bash
npm run build 2>&1 | tail -5
```

- [ ] **Step 5: Commit**

```bash
git add src/pages/ProfileTab.jsx
git commit -m "feat(ProfileTab): add real-time password validation

Shows inline error message below the password field as the user types
when the password is fewer than 6 characters. Uses role='alert' for
screen reader accessibility.

Fixes Tinduk finding #5 — password validation was only checked on
submit, forcing users to wait for a server round-trip to discover
their password was too short.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 10: Feature Flags — Verify NEW_REPORT_FLOW Enablement

**Files:**
- No code changes — this is a verification/investigation task
- If investigation reveals Firebase Remote Config is overriding env defaults: modify `src/config/featureFlags.js` and/or Firebase console

- [ ] **Step 1: Check if initializeRemoteConfig is called anywhere**

```bash
grep -rn "initializeRemoteConfig" src/
```

- [ ] **Step 2: Check how featureFlags are initialized at app startup**

```bash
grep -rn "isEnabled\|getAllFlags\|featureFlags" src/App.jsx src/main.jsx 2>/dev/null || grep -rn "featureFlags" src/ --include="*.jsx" --include="*.js" | grep -v "test\|spec" | head -10
```

- [ ] **Step 3: If Remote Config is NOT initialized → flip DEFAULT_FLAGS**

If `initializeRemoteConfig` is not called anywhere, Firebase Remote Config is not active, and `getDefaultForFlag` falls back to `ENVIRONMENT_DEFAULTS[env]` which is already `true`. No code change needed — the flag is already enabled.

If `initializeRemoteConfig` IS called and `NEW_REPORT_FLOW` returns `false`, the issue is in the Firebase console (Remote Config values override code defaults). Update `DEFAULT_FLAGS[FEATURE_FLAGS.NEW_REPORT_FLOW]` to `true` as a safe default.

- [ ] **Step 4: Manual verification**

Load the app locally (development). Click the REPORT button. The report submission form should appear (not the "currently unavailable" message).

- [ ] **Step 5: Commit (if code change needed)**

```bash
git add src/config/featureFlags.js
git commit -m "fix(featureFlags): ensure NEW_REPORT_FLOW defaults to true

Sets DEFAULT_FLAGS[NEW_REPORT_FLOW] = true as a safe default,
ensuring the flag is enabled even if Firebase Remote Config
is not initialized or returns a stale value.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Final Verification

After all tasks, run the full build and check:

```bash
npm run build 2>&1 | grep -E "error|ERROR" | head -5
npm run lint 2>&1 | head -10
```

Expected: No errors from these commands.

---

## Commit Sequence

| Task | Description | Auto-commit? |
|------|-------------|--------------|
| 1 | ReportModal handleBack fix | Yes |
| 2 | BottomSheet component | Yes |
| 3 | App.jsx map → BottomSheet wiring | Yes |
| 4 | LeafletMap selected marker styling | Yes |
| 5 | WeatherCard SVG icons | Yes |
| 6 | AlertsTab + AdminDashboard width | Yes |
| 7 | App.css dark scrollbar | Yes |
| 8 | Dead code removal | Yes |
| 9 | ProfileTab password validation | Yes |
| 10 | NEW_REPORT_FLOW verification | Yes (if code change needed) |
