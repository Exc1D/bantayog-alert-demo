# Bantayog Alert — UI Redesign Design Spec
**Date:** 2026-03-22
**Status:** Approved

---

## 1. Concept & Vision

Bantayog Alert is an emergency reporting application for the municipalities of Camarines Norte, Philippines. The redesign serves two distinct user contexts: **citizens in crisis** who need to report emergencies with zero friction, and **command center operators** who need dense situational awareness on large screens. The design language is urgent but not alarming — clean dark surfaces with sharp red accents, prioritizing clarity under stress.

---

## 2. Design Language

### Aesthetic Direction
Emergency command center — dark surfaces (not pure black), high-contrast red for urgency, green for safety/live status. Inspired by professional dispatch systems and military C2 interfaces, but simplified for non-technical citizens.

### Color Palette
| Role | Light Mode | Dark Mode |
|---|---|---|
| Primary | `#1B2A41` | `#E1E4E8` |
| Accent / Emergency | `#C62828` | `#EF5350` |
| Success / Live | `#2E7D32` | `#4CAF50` |
| Warning | `#E65100` | `#FF9800` |
| Background | `#F4F1EC` | `#0F1923` |
| Surface | `#EBE7E0` | `#182635` |
| Border | `#D6D0C4` | `#2A3F55` |
| Text | `#1B2A41` | `#E1E4E8` |
| Text Muted | `#5D6B7E` | `#8B99A8` |

### Typography
- **Display / Headlines:** DM Serif Display — authority and readability
- **Body / UI:** Atkinson Hyperlegible — optimized for readability under stress
- **Monospace (data):** JetBrains Mono — for timestamps, coordinates, metrics
- **No Inter, no sans-serif defaults**

### Spatial System
- Mobile: generous touch targets (min 44px), breathing room around action buttons
- Desktop: dense data layout, compact sidebar, minimal chrome
- Breakpoints: `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px)

### Motion Philosophy
- Emergency button: perpetual pulsing glow animation (CSS keyframe, not JS-driven)
- Panel transitions: 200ms ease-out slide/fade
- Skeleton loaders: shimmer animation for loading states
- Reduced motion: all animations respect `prefers-reduced-motion`

### Visual Assets
- Icons: Phosphor Icons (consistent stroke weight 1.5 or 2.0)
- No emojis — SVG icons only
- Map tiles: OpenStreetMap via Leaflet
- Disaster markers: custom SVG pins with severity color coding

---

## 3. Layout & Structure

### Mobile Layout
```
┌─────────────────────────┐
│       Header (logo + status)    │
├─────────────────────────┤
│                         │
│   Map / Full Urgency    │
│   Screen (contextual)   │
│                         │
│  [ Floating REPORT btn ] │
│                         │
├─────────────────────────┤
│   Bottom Tab Nav (4 tabs)       │
└─────────────────────────┘
```

**Home state:** Full-screen report-dominant urgency view (Option B). Large pulsing REPORT button centered over dimmed map background. "Maybe later" text link below button. Tapping "Maybe later" transitions to map-dominant view (Option A).

**Map-dominant view:** Map fills screen, report button floats over bottom-right corner. Bottom tab navigation for Map / Feed / Weather / Profile.

### Desktop Layout (lg+)
```
┌────┬───────────────────────────────┬────────────────────┐
│    │                               │   Right Panel      │
│ Icon│        Map Panel             │ (Resizable)        │
│ Side│   (Leaflet, full height)     │                    │
│ bar │                               │ [Feed][Alerts][Data]│
│ 44px│                               │                    │
│    │                               │  Tab content       │
│    │                               │  or incident      │
│    │                               │  detail view      │
│    │                               │                    │
└────┴───────────────────────────────┴────────────────────┘
```

**Desktop:** `h-dvh` grid. 44px icon sidebar + flex row of map + right panel. Resizable divider between map and right panel (CSS `grid-template-columns` with mouse drag). Right panel width: 35–60% of remaining space, default 40%.

**Incident detail mode:** Clicking a map pin replaces right panel tabs with that incident's full detail view. Clicking elsewhere / pressing Escape / clicking "back" returns to tabbed panel.

**Admin separation:** Admin features (AdminDashboard, verification panel) are NOT in the sidebar. Accessible via Profile tab → "Admin Panel" link, gated by `RequireAdmin` permission.

---

## 4. Features & Interactions

### Mobile: Report Flow (3 Steps)

**Step 1 — Disaster Type**
- Full-screen icon grid (2 columns) of disaster types: Flooding, Landslide, Fire, Accident, Crowding, Other
- Large touch targets (minimum 80px height)
- Single tap selects (highlighted border + filled background) and auto-advances to Step 2
- GPS coordinates captured silently in background during this step (no UI indication, no user action required)
- "Cancel" text link in header returns to home urgency view

**Step 2 — Photo/Video Capture**
- Full-screen camera view (native camera API via `<input type="file" capture="environment">`)
- Photo grid preview (captured photos shown as thumbnails)
- Video toggle visible
- "Next" button to proceed (auto-advance on first capture optional)
- Gallery access to add existing media
- Minimum 1 photo required to proceed

**Step 3 — Confirm & Send**
- Single summary card showing: disaster type, photo thumbnails, auto-detected location with green checkmark
- Optional short description textarea (can be skipped)
- One "SEND REPORT" button — large, red, full-width
- On send: optimistic UI update → Firestore write → success toast or error inline

### Mobile: Report Dismissal
- "Maybe later" link on urgency screen → transitions with 200ms fade to map-dominant view
- Report button remains accessible as floating action button in map-dominant view

### Desktop: Feed Tab
- Chronological list of all reports, newest first
- Each item shows: disaster type icon, municipality, time ago, verification badge, severity indicator
- Resolved reports: collapsed section "Show resolved (X)" below active reports
- Clicking resolved report: expands inline to reveal before/after timeline (initial photo → resolution photo + resolution note)
- Filter bar: All / Active / Pending (mobile only — desktop relies on Alerts tab for filtering)

### Desktop: Alerts Tab
- Unified alert feed: active incident alerts + weather alerts
- **Proximity sorting:** alerts nearest to user's detected/selected municipality appear first
- Visual distinction: incident alerts (red left border), weather alerts (amber left border)
- Each alert shows: type icon, headline, location, time, severity badge
- Tapping an alert: flies map to that location and selects the pin

### Desktop: Data Tab
- Compact dashboard grid:
  - **Incident stats:** total reports (all-time), active, resolved
  - **Municipality breakdown:** bar chart of reports per municipality
  - **Trend charts:** reports over time (toggle: 24h / 7d / 30d), bar chart
- No average response time metric
- All data derived from Firestore reports collection

### Desktop: Map Panel
- Leaflet map with OpenStreetMap tiles
- Custom disaster marker pins color-coded by severity: Critical (red), Urgent (amber), Low (blue)
- Marker clustering for zoom levels < 14
- Clicking a pin: selects it, shows mini-preview in right panel
- Clicking pin detail or "View full": expands incident detail in right panel
- Map controls: zoom, locate me, layer toggle (satellite/map)

### Navigation (Mobile)
- Bottom tab bar: Map / Feed / Weather / Profile
- Active tab indicated by filled icon + bold label + top border line
- Weather tab: shows weather data for user's municipality
- Profile tab: auth state, notification settings, admin link (if permitted)

### Navigation (Desktop)
- 44px icon sidebar with vertical icon-only tabs
- Active tab: highlighted background + accent left border
- Hover: tooltip with tab label
- No redundant elements — sidebar shows only what citizens need

### Emergency Report Button
- **Mobile:** Fixed floating button, bottom-right, 56px height, pulsing red glow, white icon + "REPORT" label
- **Desktop:** Hidden (report accessed via sidebar "+" icon or directly from Feed tab)
- `z-index: 50` to float above all content

---

## 5. Component Inventory

### Mobile Components

| Component | States |
|---|---|
| `UrgencyHome` | Default (pulsing), transitioning out |
| `ReportTypeGrid` | Default, type selected, loading |
| `CameraCapture` | Idle, capturing, has-media |
| `ReportConfirm` | Default, sending, success, error |
| `BottomTabNav` | Tab active/inactive |
| `FloatingReportButton` | Default, pressed |
| `MapDominantView` | Default, pin selected |

### Desktop Components

| Component | States |
|---|---|
| `IconSidebar` | Tab active/inactive, collapsed (icon only) |
| `MapPanel` | Default, pin selected, incident detail open |
| `ResizableDivider` | Idle, dragging |
| `RightPanel` | Feed tab, Alerts tab, Data tab, IncidentDetail |
| `FeedPanel` | Loading, empty, has-items, resolved-expanded |
| `AlertsPanel` | Loading, empty, has-alerts |
| `DataPanel` | Loading, has-data, period-toggle (24h/7d/30d) |
| `IncidentDetail` | Default, loading media |

### Shared Components (existing, to be redesigned)

| Component | Change |
|---|---|
| `Header` | Mobile only (desktop uses sidebar) |
| `Footer` | Mobile only |
| `ReportModal` | Replaced by 3-step mobile flow |
| `FeedList` / `FeedPost` | Integrated into FeedPanel, swipe-to-reveal resolved |
| `WeatherCard` | Redesigned for desktop Data tab integration |
| `NotificationCenter` | Desktop: integrated into AlertsPanel |

---

## 6. Technical Approach

### Framework & Libraries
- React 18 with Vite
- React Router v6 (for desktop route structure)
- Tailwind CSS v3
- Leaflet + React-Leaflet for maps
- Framer Motion (optional, for complex transitions — CSS fallback for reduced-motion)
- Phosphor Icons React

### Responsive Strategy
- Mobile-first CSS, desktop overrides at `lg:` breakpoint
- `useIsLg` hook to determine layout mode
- `MapPanelContext` (from existing large-screen-layout worktree) to manage map mode state: `'full'` | `'split'` | `'hidden'`

### State Management
- `ReportsContext` — existing, manages reports list
- `AuthContext` — existing, manages auth state
- `MapPanelContext` — existing worktree, manages desktop panel state
- Local component state for UI-only concerns (selected tab, expanded resolved, etc.)

### Routing (Desktop)
```
/              → Map tab (default)
/feed          → Feed tab
/weather       → Weather tab
/profile       → Profile tab
/report        → Full-screen report page
/report/:id    → Pre-filled report for editing
/admin/*       → AdminGuard + AdminShell (permission-gated)
```

### Data
- All report/alert/weather data from existing Firestore collections
- Municipality geo-boundaries from existing `geoFencing.js` (Turf.js point-in-polygon)
- No new backend — this is a frontend redesign

### Key Files Modified
- `src/App.jsx` — router-based layout, AppShell for desktop/mobile switching
- `src/components/Layout/AppShell.jsx` — desktop split-panel shell
- `src/components/Layout/IconSidebar.jsx` — new icon-only sidebar
- `src/components/Layout/TabNavigation.jsx` — mobile bottom nav (redesign)
- `src/components/Map/PersistentMapPanel.jsx` — desktop map panel with pin selection
- `src/components/RightPanel/` — new directory for Feed, Alerts, Data tabs
- `src/pages/UrgencyHome.jsx` — new mobile urgency home
- `src/pages/ReportPage.jsx` — streamlined 3-step report (desktop)
- `src/hooks/useIsLg.js` — existing breakpoint hook
- `tailwind.config.js` — potential color/token adjustments

### Performance
- Lazy load all tab content (React.lazy + Suspense)
- Virtualize long feed lists (react-window or similar if needed)
- Service worker: existing tile caching + app shell caching
- Map: marker clustering, viewport-based marker loading

---

## 7. Implementation Phases

### Phase 1: Foundation
- AppShell with responsive breakpoint detection
- Mobile: UrgencyHome + map-dominant transition
- Desktop: IconSidebar + AppShell grid layout
- Resizable divider between map and right panel

### Phase 2: Desktop Right Panel
- RightPanel shell with tab switcher
- FeedPanel with resolved report expansion
- AlertsPanel with proximity sorting
- DataPanel with stats + charts

### Phase 3: Incident Detail Mode
- Map pin selection → right panel switches to detail view
- Back/escape to return to tabbed panel
- Before/after timeline rendering

### Phase 4: Report Flow Redesign
- Mobile 3-step flow (type → camera → confirm)
- Desktop ReportPage (full-screen, same flow)
- GPS auto-capture integration

### Phase 5: Polish & Animation
- Urgency button pulse animation
- Panel transition animations
- Loading skeletons
- Reduced-motion fallbacks
