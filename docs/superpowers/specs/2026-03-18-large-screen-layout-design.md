# Large Screen Layout — Design Spec

**Date:** 2026-03-18
**Status:** Approved

---

## Overview

Add a responsive split-panel layout for `lg+` screens (≥1024px). On mobile the app is unchanged. On desktop, a persistent icon sidebar replaces the bottom tab nav, the map is always visible in a left panel, and active tab content renders in a right panel.

---

## Layout

### Mobile (< 1024px) — unchanged

```
┌─────────────────────────────┐
│ Header                      │
├─────────────────────────────┤
│ <Outlet /> (tab content)    │
├─────────────────────────────┤
│ TabNavigation (bottom nav)  │
└─────────────────────────────┘
```

### Desktop (≥ 1024px)

```
┌─────┬──────────────────┬──────────────────────┐
│44px │  LeftPanel       │  <Outlet />          │
│Icon │  (adapts)        │  (tab content)       │
│Nav  │                  │                      │
└─────┴──────────────────┴──────────────────────┘
```

- `Header` is hidden on `lg+` (app name moves into the sidebar)
- `TabNavigation` (bottom nav) is hidden on `lg+`
- `IconSidebar` (44px) is always visible on `lg+`

### Left panel modes (driven by `mapMode`)

| `mapMode` | Left panel | Right panel |
|-----------|-----------|-------------|
| `'pins'` (Feed tab) | ~45% width, map with report pins | flex-1, feed list |
| `'zones'` (Alerts tab) | ~45% width, map with zone overlays | flex-1, alerts list |
| `'full'` (Map tab) | takes all remaining width | hidden |
| `'hidden'` (Profile, Admin) | hidden | takes all remaining width |

Default context value is `'hidden'`, so any tab that doesn't call `setMapMode` gets full-width content — safe for admin routes without any changes.

---

## Architecture

### Approach

**CSS-driven layout + MapPanelContext message bus (A+B hybrid)**

- `AppShell` switches to a 3-column CSS grid at `lg+`. The map occupies a fixed slot in the grid and is never unmounted while on desktop — Leaflet initializes once.
- `MapPanelContext` acts as a message bus: tabs declare their `mapMode` on mount, and `PersistentMapPanel` reacts.
- `PersistentMapPanel` is not rendered at all on mobile (conditional on `useIsLg`) — Leaflet does not initialize twice.

---

## Components

### New

**`src/contexts/MapPanelContext.jsx`**

Context + provider + `useMapPanel` hook.

```ts
// Shape
{
  mapMode: 'pins' | 'zones' | 'full' | 'hidden',
  setMapMode: (mode: MapMode) => void,
  highlightedReportId: string | null,
  setHighlightedReportId: (id: string | null) => void,
}
```

Default: `mapMode = 'hidden'`, `highlightedReportId = null`.

**Important:** `setMapMode` and `setHighlightedReportId` MUST be wrapped in `useCallback` in the provider so they are referentially stable. Tabs use `[setMapMode]` in their `useEffect` dependency arrays.

**`src/components/Layout/IconSidebar.jsx`**

44px vertical navigation bar for `lg+`.

- App name/logo at top (replaces Header on desktop)
- 4 `NavLink` items: Feed, Alerts, Map, Profile — icon only, no labels
- Active state: `bg-urgent` dot indicator (same pattern as existing `TabNavigation` — single accent color, not per-tab)
- User avatar at bottom (tapping navigates to `/profile`)
- `aria-label` on nav, `aria-current="page"` via NavLink

**`src/components/Map/PersistentMapPanel.jsx`**

Wrapper around `LeafletMap` that reacts to context.

- Reads `mapMode` and `highlightedReportId` from `MapPanelContext`
- When `mapMode === 'full'`: panel takes full remaining width (no right content panel)
- When `mapMode === 'hidden'`: renders `null` (caller hides the slot)
- When `highlightedReportId` changes: calls `map.flyTo(pin coords)` — guards against null `mapRef`
- Pin rendering: `'pins'` mode shows report pins; `'zones'` mode shows alert zone overlays
- Data: reads from `useReports()` and `useAnnouncements()`. Both hooks open Firestore real-time listeners; calling them in `PersistentMapPanel` alongside a tab that also calls them opens duplicate listeners. To avoid this, `PersistentMapPanel` should NOT call these hooks directly — instead, the data (report locations, zone data) must be passed down via `MapPanelContext`. Tabs that set `mapMode('pins')` or `mapMode('zones')` also call `setReportLocations(reports)` / `setAlertZones(zones)` to push their already-fetched data into context.

Add to `MapPanelContext` shape:
```ts
reportLocations: Array<{ id: string, lat: number, lng: number, severity: string }>,
setReportLocations: (locs) => void,
alertZones: Array<{ id: string, bounds: LatLngBounds, severity: string }>,
setAlertZones: (zones) => void,
```

**`src/hooks/useIsLg.js`**

```js
// Returns true when window width >= 1024px
// Uses window.matchMedia with 'change' listener
// SSR-safe: defaults to false
```

### Modified

**`src/components/Layout/AppShell.jsx`**

- Wrap with `MapPanelContext.Provider`
- At `lg+`: render `<IconSidebar>` + left panel slot + `<Outlet />` in a CSS grid
- Left panel slot: renders `<PersistentMapPanel>` when `mapMode !== 'hidden'`, otherwise the slot collapses
- On mobile: existing layout unchanged
- Hide `<Header>` at `lg+` via `lg:hidden` (app name is in sidebar)
- Hide `<TabNavigation>` at `lg+` via `lg:hidden`

**`src/pages/FeedTab.jsx`**

```js
const { setMapMode, setHighlightedReportId, setReportLocations } = useMapPanel();
useEffect(() => {
  setMapMode('pins');
  setHighlightedReportId(null);
  // Push report location data into context for PersistentMapPanel
  setReportLocations(reports.map(r => ({ id: r.id, lat: r.location.lat, lng: r.location.lng, severity: r.severity })));
}, [setMapMode, setHighlightedReportId, setReportLocations, reports]);
// On report card tap: setHighlightedReportId(report.id)
```

**`src/pages/AlertsTab.jsx`**

```js
const { setMapMode, setHighlightedReportId, setAlertZones } = useMapPanel();
useEffect(() => {
  setMapMode('zones');
  setHighlightedReportId(null);
  setAlertZones(/* derived from announcements */);
}, [setMapMode, setHighlightedReportId, setAlertZones]);
```

**`src/pages/MapTab.jsx`**

```js
const { setMapMode, setHighlightedReportId } = useMapPanel();
const isLg = useIsLg();
useEffect(() => {
  setMapMode('full');
  setHighlightedReportId(null);
}, [setMapMode, setHighlightedReportId]);
// On lg+: render only the floating "REPORT EMERGENCY" button
//   Position: fixed bottom-4 right-4, z-50 (floats over PersistentMapPanel which is in the grid)
// On mobile: render existing LeafletMap (unchanged)
```

**`src/pages/ProfileTab.jsx`**

```js
const { setMapMode, setHighlightedReportId } = useMapPanel();
useEffect(() => {
  setMapMode('hidden');
  setHighlightedReportId(null);
}, [setMapMode, setHighlightedReportId]);
// No other changes
```

---

## Data flow

```
FeedTab mounts
  → setMapMode('pins')
  → AppShell renders PersistentMapPanel in left slot
  → PersistentMapPanel renders LeafletMap with report pins

User taps a FeedPost card
  → setHighlightedReportId(report.id)
  → PersistentMapPanel.flyTo(pin coords)

User navigates to Map tab
  → setMapMode('full')
  → AppShell: left slot expands to full width, right slot hidden
  → PersistentMapPanel fills full width
  → MapTab renders only the REPORT EMERGENCY button (overlay)

User navigates to Profile tab
  → setMapMode('hidden')
  → AppShell: left slot hidden, right slot full width
  → ProfileTab renders at full width
```

---

## Edge cases

- **Rapid tab switching**: `setMapMode` calls are last-write-wins setState — no debounce needed.
- **`highlightedReportId` fires before map init**: `PersistentMapPanel` guards with `if (!mapRef.current) return` before `flyTo`.
- **Live resize across lg breakpoint**: `useIsLg` uses a `matchMedia` change listener — layout switches live. Leaflet re-initializes once when crossing mobile→lg (acceptable). Map view state (zoom/center) is NOT preserved across breakpoint crossings — the map resets to the default view on each mount. This is acceptable for a field PWA where map state is ephemeral.
- **Admin routes** (`/admin/*`): context default is `'hidden'` — admin pages get full-width layout with no changes required.
- **Stale `highlightedReportId` on tab switch**: each tab's mount effect calls `setHighlightedReportId(null)` (shown in component snippets above).
- **REPORT EMERGENCY button positioning on desktop**: on `mapMode='full'`, the right panel slot is hidden. The button is rendered as `fixed bottom-4 right-4 z-50` so it floats over the full-width `PersistentMapPanel` regardless of grid layout.

---

## Testing

| What | How |
|------|-----|
| `MapPanelContext` | Unit: defaults correct; `setMapMode` updates state |
| `IconSidebar` | Unit: 4 NavLinks render; active link has `aria-current="page"` |
| `AppShell` at lg | Render at 1024px; assert `IconSidebar` visible, `TabNavigation` hidden |
| `PersistentMapPanel` | Mock LeafletMap; `mapMode='full'` → full-width class; `mapMode='hidden'` → null |
| `useIsLg` | Unit: returns true above 1024px, false below |
| `FeedTab` mount | Assert `mapMode` becomes `'pins'` via context |
| `AlertsTab` mount | Assert `mapMode` becomes `'zones'` |
| `MapTab` at lg | Assert Leaflet not rendered; REPORT EMERGENCY button present |
| `MapTab` at mobile | Assert existing LeafletMap renders |
| Feed → map highlight | Tap a FeedPost card; assert `highlightedReportId` updates in context; assert `PersistentMapPanel` calls `flyTo` with correct coordinates |

---

## Out of scope

- Sidebar labels (icon-only sidebar is sufficient; labels can be added later)
- Admin-specific map view (Admin live map is a separate feature)
- Push notification integration
- Profile sub-pages
