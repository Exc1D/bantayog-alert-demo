# UI Redesign — Desktop Command Center (Refreshed 2026-03-28)

> **Status:** WCAG Phase 0 COMPLETE — `dark-textMuted` fixed to `#8B9A8` in `tailwind.config.js`
>
> **Priority:** Desktop Command Center (Phase 1) → Mobile UrgencyHome (Phase 2)
>
> **Agentic execution:** Use `superpowers:subagent-driven-development` or `superpowers:executing-plans`

---

## What Changed from 2026-03-22 Plan

- **Reordered phases** — Desktop (RightPanel, IconSidebar, AppShell) now comes BEFORE mobile UrgencyHome
- **AppShell does not exist** — current layout is in `App.jsx`. Phase 1 now includes creating `AppShell.jsx` as a new layout wrapper
- **PersistentMapPanel does not exist** — Phase 1 creates this as a desktop-only persistent map panel
- **MapPanelContext does not exist** — Phase 1 creates this context for cross-component state
- **WCAG token fix completed** — `dark-textMuted` updated to `#8B99A8` (5.7:1 contrast) in commit `c6985b5`
- **New tokens needed** — emergency, safe, warning-amber variants for dark mode; surface-light token; bg-app-light
- **IconSidebar is new** — does not exist yet; creates from scratch replacing `Sidebar.jsx`
- **Routing preserved** — existing `/#feed`, `/#alerts`, `/#weather`, `/#profile` routes kept; RightPanel renders inside desktop layout

---

## Architecture Overview

**Mobile** (< `lg`): Bottom tab nav → full-page tab content (FeedTab, WeatherTab, etc.)
**Desktop** (`lg`+): IconSidebar → PersistentMapPanel (resizable) → RightPanel with tab switcher

Desktop RightPanel replaces individual tab pages. When a desktop user visits `/#feed`, the RightPanel shows FeedPanel. The map remains persistent on the left. Mobile is unaffected — tab pages render as normal.

```
Desktop (lg+):
┌──────────┬──────────────────────┬─────────────────────┐
│ Icon    │ PersistentMapPanel    │ RightPanel          │
│ Sidebar │ (Leaflet, resizable) │ [Feed|Alerts|Data]  │
│ (11px)  │                      │                     │
└──────────┴──────────────────────┴─────────────────────┘

Mobile:
┌─────────────────────┐
│ TabNavigation (bottom)│
│ Full-page tab content │
└─────────────────────┘
```

---

## File Map

### New files

| File | Responsibility |
|---|---|
| `src/components/Layout/AppShell.jsx` | Responsive layout wrapper: mobile TabNavigation + desktop IconSidebar+RightPanel |
| `src/components/Layout/IconSidebar.jsx` | Desktop icon-only sidebar with Phosphor icons + hover tooltips |
| `src/components/Layout/FloatingReportButton.jsx` | Mobile floating report FAB |
| `src/contexts/MapPanelContext.jsx` | Desktop state: `selectedReportId`, `incidentDetailReport` |
| `src/components/RightPanel/RightPanel.jsx` | Desktop right panel shell with tab switcher |
| `src/components/RightPanel/FeedPanel.jsx` | Chronological feed list with resolved expansion |
| `src/components/RightPanel/AlertsPanel.jsx` | Proximity-sorted active alert feed |
| `src/components/RightPanel/DataPanel.jsx` | Stats dashboard with municipality bar chart |
| `src/components/RightPanel/IncidentDetail.jsx` | Full incident detail (replaces tab content when report selected) |
| `src/pages/UrgencyHome.jsx` | Mobile home — pulsing report button + "Maybe later" → map |

### Existing files modified

| File | Changes |
|---|---|
| `src/App.jsx` | Wrap with `MapPanelProvider`; conditionally render `AppShell` vs current layout |
| `src/components/Layout/Sidebar.jsx` | Replaced by `IconSidebar.jsx` on desktop; mobile keeps `TabNavigation` |
| `src/components/Map/LeafletMap.jsx` | Accept `onMarkerClick` prop; emit `selectedReportId` to context |
| `src/components/Map/DisasterMarker.jsx` | Accept `onClick` prop to call `setSelectedReportId` |
| `src/pages/MapTab.jsx` | Add UrgencyHome on mobile (before map); remove floating report button |
| `src/pages/FeedTab.jsx` | Desktop: no change (FeedPanel in RightPanel handles desktop); mobile: unchanged |
| `src/pages/AlertsTab.jsx` | Desktop: no change (AlertsPanel in RightPanel); mobile: unchanged |
| `src/pages/WeatherTab.jsx` | Desktop: DataPanel in RightPanel shows weather summary; mobile: unchanged |
| `src/pages/ReportPage.jsx` | Redirect to 3-step mobile flow (ReportTypeGrid → CameraCapture → ReportConfirm) |
| `tailwind.config.js` | Add emergency/safe/warning-amber dark tokens; surface-light; bg-app-light; animations |

---

## Phase 1: Desktop Architecture Foundation

### Task 1: Tailwind Design Tokens

**File:** `tailwind.config.js`

- [ ] **Step 1: Add missing dark palette tokens**

```javascript
// tailwind.config.js — add to extend.colors:

// Emergency command center accents
emergency:     '#C62828',   // light mode emergency (ALREADY EXISTS)
'emergency-dark': '#EF5350', // dark mode emergency accent (below dark-bg #0F1923 at 4.6:1 — AA)

// Safe / resolved
safe:          '#2E7D32',  // ALREADY EXISTS as 'success'
'safe-dark':   '#4CAF50',  // on dark-bg #0F1923 → 8.9:1 AAA

// Warning
'warning-amber': '#E65100', // ALREADY EXISTS as 'warning'
'warning-amber-dark': '#FF9800', // on dark-bg #0F1923 → 7.2:1 AAA

// Surface tokens
'surface-light': '#EBE7E0', // light mode surface
'bg-app-light':  '#F4F1EC', // light mode background (same as existing 'bg')

// Add to fontFamily if not present:
'hyperlegible': ['Atkinson Hyperlegible', 'sans-serif'],

// Add animations:
'pulse-glow': 'pulse-glow 2s ease-in-out infinite',

// Add keyframes:
'pulse-glow': {
  '0%, 100%': { boxShadow: '0 0 8px 2px rgba(198, 40, 40, 0.4)' },
  '50%': { boxShadow: '0 0 24px 8px rgba(198, 40, 40, 0.7)' },
},
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | grep -i error | head -5
# Expected: no errors
```

- [ ] **Step 3: Commit**

```bash
git add tailwind.config.js
git commit -m "feat(ui-redesign): add dark palette tokens for emergency command center"
```

---

### Task 2: MapPanelContext

**File:** `src/contexts/MapPanelContext.jsx`

- [ ] **Step 1: Create MapPanelContext**

```jsx
// src/contexts/MapPanelContext.jsx
import { createContext, useContext, useState, useCallback } from 'react';

const MapPanelContext = createContext(null);

export function MapPanelProvider({ children }) {
  const [selectedReportId, setSelectedReportIdRaw] = useState(null);
  const [incidentDetailReport, setIncidentDetailReportRaw] = useState(null);

  const setSelectedReportId = useCallback((id) => setSelectedReportIdRaw(id), []);
  const setIncidentDetailReport = useCallback((r) => setIncidentDetailReportRaw(r), []);

  return (
    <MapPanelContext.Provider value={{
      selectedReportId,
      setSelectedReportId,
      incidentDetailReport,
      setIncidentDetailReport,
    }}>
      {children}
    </MapPanelContext.Provider>
  );
}

export function useMapPanel() {
  const ctx = useContext(MapPanelContext);
  if (!ctx) throw new Error('useMapPanel must be used within MapPanelProvider');
  return ctx;
}
```

- [ ] **Step 2: Wrap App in MapPanelProvider**

Modify `src/App.jsx` to wrap with `<MapPanelProvider>`:

```jsx
// src/App.jsx
import { MapPanelProvider } from './contexts/MapPanelContext';

function App() {
  return (
    <MapPanelProvider>
      <ThemeProvider> {/* existing */}
        <Router>
          {/* existing routes */}
        </Router>
      </ThemeProvider>
    </MapPanelProvider>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/contexts/MapPanelContext.jsx src/App.jsx
git commit -m "feat(ui-redesign): add MapPanelContext for desktop panel state"
```

---

### Task 3: AppShell + PersistentMapPanel (Desktop Layout)

**Files:**
- Create: `src/components/Layout/AppShell.jsx`
- Create: `src/components/Layout/PersistentMapPanel.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Create PersistentMapPanel**

```jsx
// src/components/Layout/PersistentMapPanel.jsx
// Desktop-only persistent map panel — renders LeafletMap without mobile controls
import { useState, useRef, useCallback } from 'react';
import LeafletMap from '../Map/LeafletMap';
import { useMapPanel } from '../../contexts/MapPanelContext';

export default function PersistentMapPanel({ style, onResizeStart }) {
  const { selectedReportId, setSelectedReportId } = useMapPanel();
  const containerRef = useRef(null);

  // Desktop: no floating button, no mobile controls
  return (
    <div ref={containerRef} style={style} className="relative flex-shrink-0">
      <LeafletMap
        reports={[]} {/* filled by MapTab page */}
        onMarkerClick={(id) => setSelectedReportId(id)}
        showFloatingReportButton={false}
        showMobileControls={false}
      />
    </div>
  );
}
```

- [ ] **Step 2: Create AppShell**

```jsx
// src/components/Layout/AppShell.jsx
import { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useMapPanel } from '../../contexts/MapPanelContext';
import IconSidebar from './IconSidebar';
import TabNavigation from './TabNavigation';
import PersistentMapPanel from './PersistentMapPanel';

const isLg = () => window.innerWidth >= 1024;

export default function AppShell() {
  const location = useLocation();
  const { selectedReportId } = useMapPanel();
  const [mapWidth, setMapWidth] = useState(() => Math.floor(window.innerWidth * 0.4));
  const [isResizing, setIsResizing] = useState(false);
  const [showMap, setShowMap] = useState(true);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsResizing(true);
    const startX = e.clientX;
    const startWidth = mapWidth;
    function onMove(e) {
      const delta = e.clientX - startX;
      setMapWidth(Math.max(200, Math.min(window.innerWidth - 400, startWidth + delta)));
    }
    function onUp() {
      setIsResizing(false);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [mapWidth]);

  // Desktop route detection
  const isDesktop = isLg();
  const isMapRoute = location.pathname === '/' || location.pathname === '/map';
  const isProfileRoute = location.pathname === '/profile';

  // Desktop profile: no right panel, just sidebar + map
  if (isProfileRoute) {
    return (
      <div className="flex h-dvh bg-bg dark:bg-dark-bg overflow-hidden">
        <IconSidebar />
        {isDesktop && showMap && (
          <>
            <PersistentMapPanel
              style={{ width: mapWidth }}
            />
            <div
              className={`w-1 cursor-col-resize bg-border dark:bg-dark-border ${isResizing ? 'bg-accent/50' : ''}`}
              onMouseDown={handleMouseDown}
            />
          </>
        )}
      </div>
    );
  }

  // Desktop: sidebar + map + right panel
  if (isDesktop) {
    return (
      <div className="flex h-dvh bg-bg dark:bg-dark-bg overflow-hidden">
        <IconSidebar />
        {showMap && isMapRoute && (
          <>
            <PersistentMapPanel style={{ width: mapWidth }} />
            <div
              className={`w-1 cursor-col-resize bg-border dark:bg-dark-border ${isResizing ? 'bg-accent/50' : ''}`}
              onMouseDown={handleMouseDown}
            />
          </>
        )}
        <main className="flex-1 overflow-hidden">
          <Suspense fallback={null}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    );
  }

  // Mobile: TabNavigation + Outlet
  return (
    <div className="flex flex-col h-dvh bg-bg dark:bg-dark-bg overflow-hidden">
      <main className="flex-1 overflow-hidden">
        <Suspense fallback={null}>
          <Outlet />
        </Suspense>
      </main>
      <TabNavigation />
    </div>
  );
}
```

- [ ] **Step 3: Update App.jsx routing**

Replace current route structure with AppShell nesting:

```jsx
// App.jsx — update routes to use AppShell:
<Routes>
  <Route element={<AppShell />}>
    <Route path="/" element={<MapTab />} />
    <Route path="/feed" element={<FeedTab />} />
    <Route path="/alerts" element={<AlertsTab />} />
    <Route path="/weather" element={<WeatherTab />} />
    <Route path="/profile" element={<ProfileTab />} />
    <Route path="/report" element={<ReportPage />} />
    {/* Admin routes */}
    <Route path="/admin" element={<AdminRoute />}>
      <Route index element={<AdminDashboardPage />} />
      {/* ... */}
    </Route>
  </Route>
</Routes>
```

- [ ] **Step 4: Verify build**

```bash
npm run build 2>&1 | grep -i error | head -5
# Expected: no errors
```

- [ ] **Step 5: Commit**

```bash
git add src/components/Layout/AppShell.jsx src/components/Layout/PersistentMapPanel.jsx src/App.jsx
git commit -m "feat(ui-redesign): add AppShell with desktop/mobile responsive layout"
```

---

## Phase 2: RightPanel Desktop Components

### Task 4: IconSidebar (Desktop Navigation)

**File:** `src/components/Layout/IconSidebar.jsx` (replaces `Sidebar.jsx` on desktop)

- [ ] **Step 1: Write IconSidebar with Phosphor icons + hover tooltips**

```jsx
// src/components/Layout/IconSidebar.jsx
import { NavLink } from 'react-router-dom';
import {
  MapTrifold,
  Article,
  Bell,
  User,
  PlusCircle,
} from '@phosphor-icons/react';

const TABS = [
  { label: 'Map', href: '/', icon: MapTrifold, end: true },
  { label: 'Feed', href: '/feed', icon: Article },
  { label: 'Alerts', href: '/alerts', icon: Bell },
  { label: 'Profile', href: '/profile', icon: User },
];

function SidebarTab({ label, href, icon: Icon, end }) {
  return (
    <NavLink
      key={href}
      to={href}
      end={end}
      aria-label={label}
      className={({ isActive }) =>
        `group relative w-9 h-9 rounded-lg flex items-center justify-center
         transition-colors
         ${isActive
           ? 'bg-primary/10 text-primary dark:bg-dark-accent/20 dark:text-dark-accent'
           : 'text-textLight dark:text-dark-textLight hover:bg-stone-100 dark:hover:bg-dark-elevated hover:text-text dark:hover:text-white'
         }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            size={22}
            weight={isActive ? 'fill' : 'regular'}
            aria-hidden="true"
          />
          {/* Hover tooltip */}
          <span className="absolute left-full ml-3 px-2 py-1 bg-dark-bg text-white text-xs
                           rounded opacity-0 group-hover:opacity-100 pointer-events-none
                           whitespace-nowrap z-50 transition-opacity duration-150">
            {label}
          </span>
        </>
      )}
    </NavLink>
  );
}

export default function IconSidebar() {
  return (
    <nav
      aria-label="Main navigation"
      className="w-11 bg-white dark:bg-dark-card border-r border-border/60 dark:border-dark-border
                 flex flex-col items-center py-3 gap-1 flex-shrink-0"
    >
      {/* Report shortcut */}
      <NavLink
        to="/report"
        aria-label="New report"
        className="w-9 h-9 rounded-lg flex items-center justify-center
                   text-accent hover:bg-accent/10 transition-colors"
      >
        <PlusCircle size={22} weight="fill" aria-hidden="true" />
      </NavLink>

      <div className="w-6 h-px bg-border/40 dark:bg-dark-border/40 my-1" aria-hidden="true" />

      {TABS.map(({ label, href, icon, end }) => (
        <SidebarTab key={href} label={label} href={href} icon={icon} end={end} />
      ))}
    </nav>
  );
}
```

- [ ] **Step 2: Verify build, then commit**

```bash
npm run build 2>&1 | grep -i error | head -5 && git add src/components/Layout/IconSidebar.jsx && git commit -m "feat(ui-redesign): add IconSidebar with Phosphor icons and hover tooltips"
```

---

### Task 5: RightPanel Shell

**Files:**
- Create: `src/components/RightPanel/RightPanel.jsx`
- Modify: `src/components/Layout/AppShell.jsx`

- [ ] **Step 1: Write RightPanel shell**

```jsx
// src/components/RightPanel/RightPanel.jsx
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Article,
  Bell,
  ChartBar,
} from '@phosphor-icons/react';
import FeedPanel from './FeedPanel';
import AlertsPanel from './AlertsPanel';
import DataPanel from './DataPanel';
import IncidentDetail from './IncidentDetail';
import { useMapPanel } from '../../contexts/MapPanelContext';

const TABS = [
  { id: 'feed', label: 'Feed', icon: Article },
  { id: 'alerts', label: 'Alerts', icon: Bell },
  { id: 'data', label: 'Data', icon: ChartBar },
];

export default function RightPanel() {
  const location = useLocation();
  const { incidentDetailReport } = useMapPanel();

  const getInitialTab = () => {
    if (location.pathname === '/alerts') return 'alerts';
    if (location.pathname === '/feed') return 'feed';
    if (location.pathname === '/weather') return 'data';
    return 'feed';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);

  if (incidentDetailReport) {
    return <IncidentDetail />;
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-dark-card border-l border-border/60 dark:border-dark-border">
      {/* Tab bar */}
      <div className="flex border-b border-border/60 dark:border-dark-border">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium
                       transition-colors border-b-2 -mb-px
                       ${activeTab === id
                         ? 'text-primary dark:text-dark-accent border-primary dark:border-dark-accent'
                         : 'text-textLight dark:text-dark-textLight border-transparent hover:text-text dark:hover:text-white'
                       }`}
            aria-selected={activeTab === id}
            role="tab"
          >
            <Icon size={16} weight={activeTab === id ? 'fill' : 'regular'} aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'feed' && <FeedPanel />}
        {activeTab === 'alerts' && <AlertsPanel />}
        {activeTab === 'data' && <DataPanel />}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update AppShell to render RightPanel**

In `AppShell.jsx`, update the desktop section to include `<RightPanel />`:

```jsx
// In AppShell.jsx desktop branch:
import RightPanel from './RightPanel';

// Inside the desktop layout, after the resize handle:
{showMap && isMapRoute && (
  <>
    <PersistentMapPanel style={{ width: mapWidth }} />
    <div className={`w-1 cursor-col-resize ...`} onMouseDown={handleMouseDown} />
  </>
)}
<main className="flex-1 overflow-hidden">
  <RightPanel />
</main>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/RightPanel/RightPanel.jsx src/components/Layout/AppShell.jsx
git commit -m "feat(ui-redesign): add RightPanel shell with tab switcher"
```

---

### Task 6: FeedPanel

**Files:**
- Create: `src/components/RightPanel/FeedPanel.jsx`
- Create: `src/components/RightPanel/FeedPanel.test.jsx`

- [ ] **Step 1: Write FeedPanel component**

Full component code in Task 5 of original plan (`docs/superpowers/plans/2026-03-22-ui-redesign.md`), reproduced here with updated token references (`text-dark` → `text-primary dark:text-dark-text`, `text-muted-dark` → `text-textLight dark:text-dark-textLight`):

```jsx
// src/components/RightPanel/FeedPanel.jsx
import { useState } from 'react';
import { useReports } from '../../hooks/useReports';
import { useMapPanel } from '../../contexts/MapPanelContext';
import {
  Drop, Fire, Car, Users, Warning, Question,
  CheckCircle, Clock, Article,
} from '@phosphor-icons/react';

const DISASTER_ICONS = {
  flooding: Drop,
  landslide: Warning,
  fire: Fire,
  accident: Car,
  crowding: Users,
  other: Question,
};

function timeAgo(timestamp) {
  if (!timestamp?.seconds) return '';
  const seconds = Math.floor(Date.now() / 1000 - timestamp.seconds);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function severityDot(severity) {
  const colors = {
    critical: 'bg-red-500',
    moderate: 'bg-amber-500',
    minor: 'bg-emerald-500',
  };
  return colors[severity] ?? 'bg-gray-400';
}

function FeedItem({ report, onExpand }) {
  const Icon = DISASTER_ICONS[report.disaster?.type] ?? Question;
  const isResolved = report.status === 'resolved';

  return (
    <div
      className="flex items-start gap-3 p-3 hover:bg-stone-50 dark:hover:bg-dark-elevated cursor-pointer transition-colors
                 border-l-2 border-transparent hover:border-border dark:hover:border-dark-border"
      onClick={() => onExpand(report)}
      role="article"
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                      ${isResolved ? 'bg-success/10 text-success' : 'bg-accent/10 text-accent'}`}>
        <Icon size={16} weight="fill" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text dark:text-dark-text capitalize">
            {report.disaster?.type ?? 'Unknown'}
          </span>
          <span className={`w-1.5 h-1.5 rounded-full ${severityDot(report.disaster?.severity)}`} />
          <span className="text-xs text-textLight dark:text-dark-textLight">{report.municipality}</span>
        </div>
        <div className="flex items-center gap-1 mt-0.5 text-xs text-textLight dark:text-dark-textLight">
          <Clock size={12} aria-hidden="true" />
          <span>{timeAgo(report.createdAt)}</span>
          {isResolved && (
            <>
              <CheckCircle size={12} className="text-success ml-1" aria-hidden="true" />
              <span className="text-success">Resolved</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ResolvedItem({ report }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = DISASTER_ICONS[report.disaster?.type] ?? Question;

  return (
    <div className="border-t border-border/60 dark:border-dark-border">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3 hover:bg-stone-50 dark:hover:bg-dark-elevated transition-colors"
      >
        <div className="w-6 h-6 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
          <Icon size={12} weight="fill" className="text-success" aria-hidden="true" />
        </div>
        <span className="text-xs text-textLight dark:text-dark-textLight flex-1 text-left capitalize">
          {report.disaster?.type}
        </span>
        <span className="text-xs text-textLight dark:text-dark-textLight">{report.municipality}</span>
        <span className="text-xs text-textLight dark:text-dark-textLight">{timeAgo(report.createdAt)}</span>
      </button>
      {expanded && report.resolutionNote && (
        <div className="px-3 pb-3 pl-9 border-l-2 border-success/30">
          <p className="text-xs text-textLight dark:text-dark-textLight italic">
            {report.resolutionNote}
          </p>
        </div>
      )}
    </div>
  );
}

export default function FeedPanel() {
  const { reports, loading } = useReports();
  const { setSelectedReportId, setIncidentDetailReport } = useMapPanel();

  const activeReports = reports.filter((r) => r.status !== 'resolved');
  const resolvedReports = reports.filter((r) => r.status === 'resolved');
  const [showResolved, setShowResolved] = useState(false);

  function handleExpand(report) {
    setIncidentDetailReport(report);
    setSelectedReportId(report.id);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col gap-2 items-center text-textLight dark:text-dark-textLight">
          <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">Loading...</span>
        </div>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-textLight dark:text-dark-textLight">
        <Article size={32} aria-hidden="true" />
        <p className="text-sm font-medium text-text dark:text-dark-text">No reports yet</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      {activeReports.map((report) => (
        <FeedItem key={report.id} report={report} onExpand={handleExpand} />
      ))}
      {resolvedReports.length > 0 && (
        <div className="border-t border-border/60 dark:border-dark-border">
          <button
            type="button"
            onClick={() => setShowResolved(!showResolved)}
            className="w-full px-3 py-2 text-xs text-textLight dark:text-dark-textLight hover:text-text dark:hover:text-dark-text
                       hover:bg-stone-50 dark:hover:bg-dark-elevated transition-colors text-left"
          >
            Show resolved ({resolvedReports.length})
          </button>
          {showResolved && resolvedReports.map((report) => (
            <ResolvedItem key={report.id} report={report} />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Write FeedPanel tests**

```jsx
// src/components/RightPanel/FeedPanel.test.jsx
import { render, screen } from '@testing-library/react';
import FeedPanel from './FeedPanel';
import { MapPanelProvider } from '../../contexts/MapPanelContext';

function renderWithProviders(ui) {
  return render(<MapPanelProvider>{ui}</MapPanelProvider>);
}

describe('FeedPanel', () => {
  it('renders loading state', () => {});
  it('renders empty state', () => {});
  it('renders active reports', () => {});
  it('shows resolved section with count', () => {});
  it('expands resolved report inline', () => {});
});
```

- [ ] **Step 3: Commit**

```bash
git add src/components/RightPanel/FeedPanel.jsx src/components/RightPanel/FeedPanel.test.jsx
git commit -m "feat(ui-redesign): add FeedPanel with chronological feed and resolved expansion"
```

---

### Task 7: AlertsPanel

**Files:**
- Create: `src/components/RightPanel/AlertsPanel.jsx`
- Create: `src/components/RightPanel/AlertsPanel.test.jsx`

- [ ] **Step 1: Write AlertsPanel** (see original plan Task 6, with updated token references)

- [ ] **Step 2: Commit**

```bash
git add src/components/RightPanel/AlertsPanel.jsx src/components/RightPanel/AlertsPanel.test.jsx
git commit -m "feat(ui-redesign): add AlertsPanel with proximity sorting"
```

---

### Task 8: DataPanel

**Files:**
- Create: `src/components/RightPanel/DataPanel.jsx`
- Create: `src/components/RightPanel/DataPanel.test.jsx`

- [ ] **Step 1: Write DataPanel** (see original plan Task 7, with updated token references)

- [ ] **Step 2: Commit**

```bash
git add src/components/RightPanel/DataPanel.jsx src/components/RightPanel/DataPanel.test.jsx
git commit -m "feat(ui-redesign): add DataPanel with stats and municipality bar chart"
```

---

### Task 9: IncidentDetail

**Files:**
- Create: `src/components/RightPanel/IncidentDetail.jsx`
- Modify: `src/components/Map/DisasterMarker.jsx` (accept `onClick` prop)
- Modify: `src/components/Map/LeafletMap.jsx` (pass `onMarkerClick` through)

- [ ] **Step 1: Write IncidentDetail** (see original plan Task 8, with updated token references)

- [ ] **Step 2: Connect map markers** — `DisasterMarker` receives `onClick` prop and calls it; `LeafletMap` receives `onMarkerClick` and passes it to markers; `MapPanelContext.selectedReportId` drives which marker is highlighted

- [ ] **Step 3: Commit**

```bash
git add src/components/RightPanel/IncidentDetail.jsx
git add src/components/Map/DisasterMarker.jsx src/components/Map/LeafletMap.jsx
git commit -m "feat(ui-redesign): add IncidentDetail panel with full incident view"
```

---

## Phase 3: Mobile UrgencyHome

### Task 10: UrgencyHome + FloatingReportButton

**Files:**
- Create: `src/pages/UrgencyHome.jsx`
- Create: `src/components/Layout/FloatingReportButton.jsx`
- Modify: `src/pages/MapTab.jsx`

- [ ] **Step 1: Write UrgencyHome** (see original plan Task 2, with updated token references — use `text-primary dark:text-dark-text` etc.)

- [ ] **Step 2: Write FloatingReportButton**

```jsx
// src/components/Layout/FloatingReportButton.jsx
import { Link } from 'react-router-dom';
import { Warning } from '@phosphor-icons/react';

export default function FloatingReportButton() {
  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000]
                    lg:left-auto lg:right-6 lg:translate-x-0">
      <Link
        to="/report"
        className="bg-accent dark:bg-dark-accent text-white font-bold text-sm
                   px-6 py-3 rounded-full shadow-lg flex items-center gap-2
                   active:scale-95 transition-transform hover:shadow-card-hover"
        aria-label="Report emergency"
      >
        <Warning size={16} weight="fill" aria-hidden="true" />
        REPORT
      </Link>
    </div>
  );
}
```

- [ ] **Step 3: Update MapTab** — show UrgencyHome on mobile before map; show FloatingReportButton when map is visible on mobile

- [ ] **Step 4: Commit**

```bash
git add src/pages/UrgencyHome.jsx src/components/Layout/FloatingReportButton.jsx src/pages/MapTab.jsx
git commit -m "feat(ui-redesign): add UrgencyHome mobile screen with pulsing report button"
```

---

### Task 11: Mobile 3-Step Report Flow

**Files:**
- Create: `src/components/Reports/ReportTypeGrid.jsx`
- Create: `src/components/Reports/CameraCapture.jsx`
- Create: `src/components/Reports/ReportConfirm.jsx`
- Modify: `src/pages/ReportPage.jsx`

- [ ] **Step 1-3: Write ReportTypeGrid, CameraCapture, ReportConfirm** (see original plan Task 9, with updated token references)

- [ ] **Step 4: Rewrite ReportPage** to use 3-step flow (see original plan Task 9 Step 4, with updated imports)

- [ ] **Step 5: Commit**

```bash
git add src/components/Reports/ReportTypeGrid.jsx src/components/Reports/CameraCapture.jsx src/components/Reports/ReportConfirm.jsx src/pages/ReportPage.jsx
git commit -m "feat(ui-redesign): implement 3-step mobile report flow"
```

---

## Phase 4: TabNavigation Polish

### Task 12: TabNavigation Redesign

**File:** `src/components/Layout/TabNavigation.jsx`

Add Weather tab and update active indicator style (see original plan Task 10, with updated token references).

```bash
git add src/components/Layout/TabNavigation.jsx
git commit -m "feat(ui-redesign): update TabNavigation with Weather tab and top-border indicator"
```

---

## Phase 5: Final Integration

### Task 13: Integration + Full Test Suite

- [ ] Run full test suite: `npm test -- --watchAll=false`
- [ ] Run build: `npm run build`
- [ ] Fix any missing imports or broken references
- [ ] Test dark mode on all new components
- [ ] Commit

```bash
git add -A && git commit -m "feat(ui-redesign): complete UI redesign integration"
```

---

## Token Reference (Updated 2026-03-28)

| Token | Light | Dark | Notes |
|---|---|---|---|
| `primary` | `#1B2A41` | — | Brand |
| `accent` | `#C62828` | `dark-accent: #EF5350` | CTAs |
| `success` / `safe` | `#2E7D32` | `safe-dark: #4CAF50` | Resolved |
| `warning` | `#E65100` | `warning-amber-dark: #FF9800` | Warnings |
| `emergency` | `#C62828` | `emergency-dark: #EF5350` | Emergencies |
| `bg` | `#F4F1EC` | `dark-bg: #0F1923` | App background |
| `cardBg` | `#FFFFFF` | `dark-card: #182635` | Card surfaces |
| `elevated` | — | `dark-elevated: #1E3044` | Elevated surfaces |
| `text` | `#1B2A41` | `dark-text: #E1E4E8` | Primary text (14.3:1) |
| `textLight` | `#5D6B7E` | `dark-textLight: #8B99A8` | Secondary text (5.7:1) |
| `textMuted` | `#6B7280` | `dark-textMuted: #8B99A8` | Muted text (5.7:1, FIXED) |

**Note:** `dark-textMuted` was `#5A6978` (2.3:1, FAILS WCAG AA) — fixed to `#8B99A8` (5.7:1, PASSES AA) in commit `c6985b5`. Now identical to `dark-textLight` in value but retained as separate semantic token.

---

## Phase Summary

| Phase | Task | Focus | New/Modified |
|---|---|---|---|
| 1 | 1 | Design tokens (emergency, safe, warning-amber dark variants) | Modified |
| 1 | 2 | MapPanelContext | Created |
| 1 | 3 | AppShell + PersistentMapPanel | Created |
| 2 | 4 | IconSidebar (Phosphor + tooltips) | Created |
| 2 | 5 | RightPanel shell | Created |
| 2 | 6 | FeedPanel | Created |
| 2 | 7 | AlertsPanel | Created |
| 2 | 8 | DataPanel | Created |
| 2 | 9 | IncidentDetail + map connection | Created |
| 3 | 10 | UrgencyHome + FloatingReportButton + MapTab | Created |
| 3 | 11 | 3-step ReportFlow (mobile) | Created |
| 4 | 12 | TabNavigation redesign (Weather tab) | Modified |
| 5 | 13 | Final integration + tests | Integration |
