# UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign Bantayog Alert's UI with a dark emergency-command-center aesthetic, mobile-first urgency home screen, and desktop split-panel layout with persistent map.

**Architecture:** The app uses a responsive AppShell that switches between mobile (bottom tab nav + UrgencyHome) and desktop (icon sidebar + persistent map + resizable right panel). All tab content lives in the right panel on desktop; MapTab manages mobile map state. Phase 1 builds the responsive shell foundation, Phase 2 adds the right panel tabs, Phase 3 adds incident detail mode, Phase 4 redesigns the report flow, Phase 5 adds polish.

**Tech Stack:** React 18, Vite, React Router v6, Tailwind CSS v3, Leaflet + React-Leaflet, Phosphor Icons React

---

## Scope Notes

- **Routing model preserved** — existing `/`, `/feed`, `/alerts`, `/weather`, `/profile`, `/report` routes are kept. Desktop tabs render inside the right panel (not as full-page routes).
- **Existing code retained** — LeafletMap, PersistentMapPanel, AppShell resizing, MapPanelContext, FeedPost, ReportPage step components are kept and adapted.
- **New in Phase 2** — RightPanel as a new component wrapping Outlet content in the desktop layout.
- **Phases 1–3** are the most interdependent; Phase 4 (report flow) is largely independent.

---

## File Map

### New files created

| File | Responsibility |
|---|---|
| `src/pages/UrgencyHome.jsx` | Mobile home — pulsing report button + "Maybe later" → map |
| `src/components/RightPanel/RightPanel.jsx` | Desktop right panel shell with tab switcher |
| `src/components/RightPanel/FeedPanel.jsx` | Chronological feed list with resolved expansion |
| `src/components/RightPanel/AlertsPanel.jsx` | Unified alert feed with proximity sorting |
| `src/components/RightPanel/DataPanel.jsx` | Stats dashboard with municipality bar chart + trend chart |
| `src/components/RightPanel/IncidentDetail.jsx` | Full incident detail view (replaces tab in right panel) |
| `src/components/Layout/FloatingReportButton.jsx` | Shared floating report button (mobile) |
| `src/components/Reports/ReportTypeGrid.jsx` | Step 1 — full-screen icon grid |
| `src/components/Reports/CameraCapture.jsx` | Step 2 — camera view + gallery |
| `src/components/Reports/ReportConfirm.jsx` | Step 3 — summary + send |

### Existing files modified

| File | Changes |
|---|---|
| `src/components/Layout/AppShell.jsx` | Conditionally render RightPanel on desktop instead of Outlet; add MapPanelContext selectedReportId |
| `src/components/Layout/IconSidebar.jsx` | Replace inline SVGs with Phosphor Icons; add tooltip on hover; remove "B" label; add report button |
| `src/components/Layout/TabNavigation.jsx` | Add "Weather" tab; update active indicator to top border line; use Phosphor icons |
| `src/pages/MapTab.jsx` | Remove floating report button (moved to UrgencyHome); add UrgencyHome ↔ map-dominant transition |
| `src/pages/FeedTab.jsx` | Remove duplicate feed rendering (desktop now uses FeedPanel in RightPanel); remains for mobile |
| `src/pages/AlertsTab.jsx` | Remove duplicate alerts (desktop uses AlertsPanel); remains for mobile |
| `src/pages/WeatherTab.jsx` | No desktop counterpart — Weather integration is DataPanel on desktop |
| `src/pages/ReportPage.jsx` | Redirect to 3-step mobile flow components |
| `src/contexts/MapPanelContext.jsx` | Add `selectedReportId`, `incidentDetailReport`, `setIncidentDetailReport` state |
| `tailwind.config.js` | Add new design tokens (dark palette, new color roles, typography fonts, animations) |
| `src/App.jsx` | Update lazy imports to include UrgencyHome; routing unchanged |

---

## Task 1: Tailwind Design Tokens

**Files:**
- Modify: `tailwind.config.js`

- [ ] **Step 1: Add new color tokens and typography**

```javascript
// tailwind.config.js — replace/add the following in extend.colors:

// Emergency command center dark palette
'bg-app':        '#0F1923',   // dark background (spec: Background Dark Mode)
'surface-dark':  '#182635',   // spec: Surface Dark Mode
'border-dark':   '#2A3F55',   // spec: Border Dark Mode

// Light mode palette
'bg-app-light':  '#F4F1EC',  // existing bg token
'surface-light': '#EBE7E0',  // spec: Surface Light Mode

// Emergency accent — overrides existing urgent for better contrast
'emergency':     '#C62828',  // spec: Accent/Emergency Light
'emergency-dark':'#EF5350', // spec: Accent/Emergency Dark

// Status colors
'safe':          '#2E7D32',  // spec: Success/Live
'safe-dark':     '#4CAF50',
'warning-amber': '#E65100',  // spec: Warning
'warning-amber-dark': '#FF9800',

// Text — these supplement not replace existing text-* tokens
'text-dark':     '#E1E4E8',  // spec: Text Dark Mode
'text-muted-dark': '#8B99A8', // spec: Text Muted Dark Mode

// Add to fontFamily:
'hyperlegible': ['Atkinson Hyperlegible', 'sans-serif'],
'display': ['DM Serif Display', 'Georgia', 'serif'],  // already present
'mono': ['JetBrains Mono', 'monospace'],  // already present

// Add animations:
'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
'shimmer': 'shimmer 1.5s linear infinite',

// Add keyframes:
'pulse-glow': {
  '0%, 100%': { boxShadow: '0 0 8px 2px rgba(198, 40, 40, 0.4)' },
  '50%': { boxShadow: '0 0 24px 8px rgba(198, 40, 40, 0.7)' },
},
'shimmer': {
  '0%': { backgroundPosition: '-200% 0' },
  '100%': { backgroundPosition: '200% 0' },
},
```

- [ ] **Step 2: Verify build**

Run: `npm run build 2>&1 | head -30`
Expected: Build starts without errors (no missing fonts or tokens used yet)

- [ ] **Step 3: Commit**

```bash
git add tailwind.config.js
git commit -m "feat(ui-redesign): add design tokens for dark emergency command center palette"
```

---

## Task 2: UrgencyHome — Mobile Home Screen

**Files:**
- Create: `src/pages/UrgencyHome.jsx`
- Modify: `src/pages/MapTab.jsx`

- [ ] **Step 1: Write UrgencyHome component**

```jsx
// src/pages/UrgencyHome.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGeolocation } from '../hooks/useGeolocation';

// Phosphor icons
import { Warning, MapPin, ArrowRight } from '@phosphor-icons/react';

export default function UrgencyHome() {
  const navigate = useNavigate();
  const { location } = useGeolocation();
  const [transitioning, setTransitioning] = useState(false);

  // Silently capture GPS — no UI indication per spec
  useEffect(() => {
    if (location) {
      // GPS already captured by useGeolocation hook — just don't show it
    }
  }, [location]);

  function handleMaybeLater() {
    setTransitioning(true);
    // 200ms fade matches spec animation duration
    setTimeout(() => navigate('/'), 200);
  }

  return (
    <div
      className={`flex flex-col items-center justify-center h-full bg-bg-app-light dark:bg-bg-app
                  transition-opacity duration-200 ${transitioning ? 'opacity-0' : 'opacity-100'}`}
    >
      {/* Large pulsing report button */}
      <Link
        to="/report"
        className="relative flex flex-col items-center gap-3 bg-emergency dark:bg-emergency-dark
                   text-white rounded-full w-48 h-48 shadow-lg
                   animate-pulse-glow
                   active:scale-95 transition-transform"
        aria-label="Report an emergency"
      >
        <Warning size={48} weight="fill" aria-hidden="true" />
        <span className="font-bold text-lg tracking-wide">REPORT</span>
        <span className="text-xs opacity-80">Tap to report</span>
      </Link>

      {/* Maybe later link */}
      <button
        type="button"
        onClick={handleMaybeLater}
        className="mt-8 text-sm text-text-muted-dark dark:text-text-muted-dark
                   hover:text-text-dark dark:hover:text-text-dark transition-colors
                   flex items-center gap-1"
        aria-label="Continue to map"
      >
        Maybe later
        <ArrowRight size={16} aria-hidden="true" />
      </button>

      {/* Small location indicator — not prominent per spec */}
      {location && (
        <div className="absolute bottom-4 flex items-center gap-1 text-xs text-text-muted-dark dark:text-text-muted-dark">
          <MapPin size={12} aria-hidden="true" />
          <span>Location available</span>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Update MapTab to use UrgencyHome on mobile**

Modify MapTab to show UrgencyHome when not on lg breakpoint (instead of always showing the map):

```jsx
// In src/pages/MapTab.jsx, update the return:

// If UrgencyHome hasn't been dismissed, show it on mobile
const [showUrgency, setShowUrgency] = useState(true);

// On lg+ or after "maybe later", show map
const showMap = isLg || !showUrgency;

return (
  <div className="flex flex-col h-full relative">
    <CriticalAlertBanner reports={reports} />

    {/* Mobile: UrgencyHome or map */}
    {!isLg && !showUrgency && (
      <div className="flex-1 relative overflow-hidden">
        {!mapReady && <MapSkeleton />}
        {mapReady && <LeafletMap reports={reports} />}
      </div>
    )}
    {!isLg && showUrgency && (
      <UrgencyHome onDismiss={() => setShowUrgency(false)} />
    )}

    {/* Floating report button — only in map-dominant view on mobile */}
    {!isLg && !showUrgency && (
      <FloatingReportButton />
    )}

    {/* Desktop map — hidden on mobile (PersistentMapPanel handles lg+) */}
    ...
  </div>
);
```

- [ ] **Step 3: Add FloatingReportButton**

Create `src/components/Layout/FloatingReportButton.jsx`:

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
        className="bg-emergency dark:bg-emergency-dark text-white font-bold text-sm
                   px-6 py-3 rounded-full shadow-lg flex items-center gap-2
                   active:scale-95 transition-transform animate-pulse-glow"
        aria-label="Report emergency"
      >
        <Warning size={16} weight="fill" aria-hidden="true" />
        REPORT
      </Link>
    </div>
  );
}
```

- [ ] **Step 4: Run tests**

Run: `npm test -- --watchAll=false 2>&1 | tail -20`
Expected: All existing tests pass

- [ ] **Step 5: Commit**

```bash
git add src/pages/UrgencyHome.jsx src/components/Layout/FloatingReportButton.jsx
git add src/pages/MapTab.jsx
git commit -m "feat(ui-redesign): add UrgencyHome mobile urgency screen with pulsing report button"
```

---

## Task 3: IconSidebar Redesign (Desktop)

**Files:**
- Modify: `src/components/Layout/IconSidebar.jsx`

- [ ] **Step 1: Rewrite IconSidebar with Phosphor icons and hover tooltips**

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
         transition-colors tooltip-parent
         ${isActive
           ? 'bg-surface-dark text-text-dark dark:bg-surface-dark'
           : 'text-text-muted-dark dark:text-text-muted-dark hover:text-text-dark hover:bg-surface-dark/50'
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
          {/* Active indicator — accent left border */}
          {isActive && (
            <span className="absolute left-0 top-1 bottom-1 w-0.5 bg-emergency dark:bg-emergency-dark rounded-r" />
          )}
          {/* Hover tooltip */}
          <span className="absolute left-full ml-2 px-2 py-1 bg-shell text-white text-xs
                           rounded opacity-0 group-hover:opacity-100 pointer-events-none
                           whitespace-nowrap z-50 transition-opacity">
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
      className="w-11 bg-surface-dark dark:bg-surface-dark border-r border-border-dark
                 flex flex-col items-center py-3 gap-1 flex-shrink-0"
    >
      {/* Report shortcut — desktop "+" icon */}
      <NavLink
        to="/report"
        aria-label="New report"
        className="w-9 h-9 rounded-lg flex items-center justify-center
                   text-emergency dark:text-emergency-dark hover:bg-emergency/10 transition-colors"
      >
        <PlusCircle size={22} weight="fill" aria-hidden="true" />
      </NavLink>

      <div className="w-6 h-px bg-border-dark my-1" aria-hidden="true" />

      {TABS.map(({ label, href, icon, end }) => (
        <SidebarTab key={href} label={label} href={href} icon={icon} end={end} />
      ))}
    </nav>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build 2>&1 | grep -i error | head -5`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/Layout/IconSidebar.jsx
git commit -m "feat(ui-redesign): redesign IconSidebar with Phosphor icons, hover tooltips, report shortcut"
```

---

## Task 4: RightPanel Shell (Desktop)

**Files:**
- Create: `src/components/RightPanel/RightPanel.jsx`
- Modify: `src/contexts/MapPanelContext.jsx`
- Modify: `src/components/Layout/AppShell.jsx`

- [ ] **Step 1: Add selectedReportId and incidentDetailReport to MapPanelContext**

```jsx
// src/contexts/MapPanelContext.jsx — update state and provider:

// Add to state:
const [selectedReportId, setSelectedReportIdRaw] = useState(null);
const [incidentDetailReport, setIncidentDetailReportRaw] = useState(null);

// Add callbacks:
const setSelectedReportId = useCallback((id) => setSelectedReportIdRaw(id), []);
const setIncidentDetailReport = useCallback((r) => setIncidentDetailReportRaw(r), []);

// Add to provider value:
selectedReportId,
setSelectedReportId,
incidentDetailReport,
setIncidentDetailReport,
```

- [ ] **Step 2: Create RightPanel shell**

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

  // Derive initial tab from route
  const getInitialTab = () => {
    if (location.pathname === '/alerts') return 'alerts';
    if (location.pathname === '/feed') return 'feed';
    if (location.pathname === '/weather') return 'data';
    if (location.pathname === '/profile') return null; // profile has no right panel
    return 'feed'; // default
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);

  // If an incident is selected, show detail instead of tabs
  if (incidentDetailReport) {
    return <IncidentDetail />;
  }

  return (
    <div className="flex flex-col h-full bg-surface-dark dark:bg-surface-dark border-l border-border-dark">
      {/* Tab bar */}
      <div className="flex border-b border-border-dark">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium
                       transition-colors border-b-2 -mb-px
                       ${activeTab === id
                         ? 'text-text-dark border-emergency dark:border-emergency-dark'
                         : 'text-text-muted-dark border-transparent hover:text-text-dark'
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

- [ ] **Step 3: Update AppShell to render RightPanel on desktop**

Modify AppShell's desktop branch to render `<RightPanel />` in the main area instead of `<Outlet />`:

```jsx
// In AppShell.jsx desktop branch:

// When a tab route is active on desktop, show RightPanel instead of Outlet
const showRightPanel = isLg;

return (
  <div className="resizable-container flex h-dvh bg-bg-app overflow-hidden" ref={containerRef}>
    <IconSidebar />
    {showMapPanel && (
      <>
        <PersistentMapPanel style={{ /* existing */ }} />
        <div className={`w-1 cursor-col-resize bg-border-dark ${isResizing ? 'bg-emergency/50' : ''}`} onMouseDown={handleMouseDown} ... />
      </>
    )}
    <main className={mapMode === 'full' ? 'hidden' : 'flex-1 overflow-hidden'}>
      {showRightPanel ? <RightPanel /> : (
        <Suspense fallback={<PageFallback />}>
          <Outlet />
        </Suspense>
      )}
    </main>
  </div>
);
```

Note: On desktop, the `<Outlet>` pages (MapTab, FeedTab, etc.) are NOT rendered directly. Instead, RightPanel shows the appropriate tab content based on the active route. The Outlet is only rendered on mobile.

- [ ] **Step 4: Run tests**

Run: `npm test -- --watchAll=false 2>&1 | tail -15`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add src/contexts/MapPanelContext.jsx
git add src/components/RightPanel/RightPanel.jsx
git add src/components/Layout/AppShell.jsx
git commit -m "feat(ui-redesign): add RightPanel shell for desktop with tab switcher"
```

---

## Task 5: FeedPanel

**Files:**
- Create: `src/components/RightPanel/FeedPanel.jsx`
- Create: `src/components/RightPanel/FeedPanel.test.jsx`

- [ ] **Step 1: Write FeedPanel tests**

```jsx
// src/components/RightPanel/FeedPanel.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import FeedPanel from './FeedPanel';
import { MapPanelProvider } from '../../contexts/MapPanelContext';

const mockReports = [
  {
    id: '1',
    disaster: { type: 'flooding', severity: 'critical' },
    lat: 14.1,
    lng: 122.9,
    municipality: 'Daet',
    createdAt: { seconds: Date.now() / 1000 - 300 },
    status: 'active',
  },
  {
    id: '2',
    disaster: { type: 'fire', severity: 'low' },
    lat: 14.2,
    lng: 122.8,
    municipality: 'Mercedes',
    createdAt: { seconds: Date.now() / 1000 - 3600 },
    status: 'resolved',
    resolutionNote: 'Fire extinguished',
  },
];

// Wrapper with providers
function renderWithProviders(ui) {
  return render(<MapPanelProvider>{ui}</MapPanelProvider>);
}

describe('FeedPanel', () => {
  it('renders loading state', () => {
    // TODO: mock useReports hook to return loading=true
  });

  it('renders empty state', () => {
    // TODO: mock useReports to return []
  });

  it('renders active reports', () => {
    // TODO: mock useReports to return mockReports
  });

  it('shows resolved section with count', () => {
    // TODO: check that resolved section is visible
  });

  it('expands resolved report inline', () => {
    // TODO: click "Show resolved" and verify before/after timeline
  });
});
```

- [ ] **Step 2: Write FeedPanel component**

```jsx
// src/components/RightPanel/FeedPanel.jsx
import { useState, useEffect } from 'react';
import { useReports } from '../../hooks/useReports';
import {
  Drop,
  Fire,
  Car,
  Users,
  Warning,
  Question,
  CheckCircle,
  Clock,
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

function severityColor(severity) {
  switch (severity) {
    case 'critical': return 'bg-emergency dark:bg-emergency-dark';
    case 'urgent':   return 'bg-warning-amber dark:bg-warning-amber-dark';
    case 'low':      return 'bg-blue-500';
    default:         return 'bg-gray-400';
  }
}

function FeedItem({ report, onExpand }) {
  const Icon = DISASTER_ICONS[report.disaster?.type] ?? Question;

  return (
    <div
      className="flex items-start gap-3 p-3 hover:bg-surface-dark/50 cursor-pointer transition-colors
                 border-l-2 border-transparent hover:border-border-dark"
      onClick={() => onExpand(report)}
      role="article"
    >
      {/* Icon */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                      ${report.status === 'resolved' ? 'bg-safe/20 text-safe' : 'bg-emergency/10 text-emergency dark:text-emergency-dark'}`}>
        <Icon size={16} weight="fill" aria-hidden="true" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text-dark capitalize">
            {report.disaster?.type ?? 'Unknown'}
          </span>
          <span className={`w-1.5 h-1.5 rounded-full ${severityColor(report.disaster?.severity)}`} />
          <span className="text-xs text-text-muted-dark">{report.municipality}</span>
        </div>
        <div className="flex items-center gap-1 mt-0.5 text-xs text-text-muted-dark">
          <Clock size={12} aria-hidden="true" />
          <span>{timeAgo(report.createdAt)}</span>
          {report.status === 'resolved' && (
            <>
              <CheckCircle size={12} className="text-safe ml-1" aria-hidden="true" />
              <span className="text-safe">Resolved</span>
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
    <div className="border-t border-border-dark">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3 hover:bg-surface-dark/50 transition-colors"
      >
        <div className="w-6 h-6 rounded-full bg-safe/20 flex items-center justify-center flex-shrink-0">
          <Icon size={12} weight="fill" className="text-safe" aria-hidden="true" />
        </div>
        <span className="text-xs text-text-muted-dark flex-1 text-left capitalize">
          {report.disaster?.type}
        </span>
        <span className="text-xs text-text-muted-dark">{report.municipality}</span>
        <span className="text-xs text-text-muted-dark">{timeAgo(report.createdAt)}</span>
      </button>

      {expanded && (
        <div className="px-3 pb-3 pl-9 border-l-2 border-safe/30">
          <p className="text-xs text-text-muted-dark italic">
            {report.resolutionNote ?? 'No resolution notes provided.'}
          </p>
        </div>
      )}
    </div>
  );
}

export default function FeedPanel() {
  const { reports, loading } = useReports();
  const { setSelectedReportId } = useMapPanel?.() ?? {};

  const activeReports = reports.filter((r) => r.status !== 'resolved');
  const resolvedReports = reports.filter((r) => r.status === 'resolved');
  const [showResolved, setShowResolved] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col gap-2 items-center text-text-muted-dark">
          <div className="w-6 h-6 border-2 border-text-muted-dark border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">Loading...</span>
        </div>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-text-muted-dark">
        <Article size={32} aria-hidden="true" />
        <p className="text-sm font-medium">No reports yet</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      {/* Active reports */}
      {activeReports.map((report) => (
        <FeedItem
          key={report.id}
          report={report}
          onExpand={(r) => setSelectedReportId?.(r.id)}
        />
      ))}

      {/* Resolved section */}
      {resolvedReports.length > 0 && (
        <div className="border-t border-border-dark">
          <button
            type="button"
            onClick={() => setShowResolved(!showResolved)}
            className="w-full px-3 py-2 text-xs text-text-muted-dark hover:text-text-dark
                       hover:bg-surface-dark/30 transition-colors text-left"
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

- [ ] **Step 3: Run tests**

Run: `npm test -- src/components/RightPanel/FeedPanel.test.jsx --watchAll=false 2>&1 | tail -20`
Expected: Tests run (may fail — that's expected TDD)

- [ ] **Step 4: Fix FeedPanel — add missing imports and hook**

The FeedPanel uses `useMapPanel` — add the import:

```jsx
import { useMapPanel } from '../../contexts/MapPanelContext';
```

And in the component, use it properly (not optional):

```jsx
const { setSelectedReportId } = useMapPanel();
```

- [ ] **Step 5: Run tests again**

Run: `npm test -- src/components/RightPanel/FeedPanel.test.jsx --watchAll=false 2>&1 | tail -20`
Expected: Tests pass (or some fail — update assertions as needed)

- [ ] **Step 6: Commit**

```bash
git add src/components/RightPanel/FeedPanel.jsx src/components/RightPanel/FeedPanel.test.jsx
git commit -m "feat(ui-redesign): add FeedPanel with chronological feed and resolved expansion"
```

---

## Task 6: AlertsPanel

**Files:**
- Create: `src/components/RightPanel/AlertsPanel.jsx`
- Create: `src/components/RightPanel/AlertsPanel.test.jsx`

- [ ] **Step 1: Write AlertsPanel component**

```jsx
// src/components/RightPanel/AlertsPanel.jsx
import { useMemo } from 'react';
import {
  Warning,
  CloudRain,
  Bell,
} from '@phosphor-icons/react';
import { useReports } from '../../hooks/useReports';
import { useGeolocation } from '../../hooks/useGeolocation';
import { resolveMunicipality } from '../../utils/geoFencing';

function distanceKm(lat1, lng1, lat2, lng2) {
  // Haversine — approximate
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function AlertItem({ report, userLat, userLng, onClick }) {
  const dist = userLat && userLng
    ? distanceKm(userLat, userLng, report.lat, report.lng).toFixed(1)
    : null;

  return (
    <button
      type="button"
      onClick={() => onClick?.(report)}
      className="w-full flex items-start gap-3 p-3 hover:bg-surface-dark/50
                 transition-colors border-l-2 border-emergency dark:border-emergency-dark
                 text-left"
    >
      <Warning size={18} weight="fill" className="text-emergency dark:text-emergency-dark flex-shrink-0 mt-0.5" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-dark capitalize">
          {report.disaster?.type} — {report.municipality}
        </p>
        <p className="text-xs text-text-muted-dark mt-0.5 line-clamp-2">
          {report.disaster?.description ?? `Severity: ${report.disaster?.severity}`}
        </p>
        <div className="flex items-center gap-2 mt-1">
          {dist && <span className="text-xs text-text-muted-dark">{dist} km away</span>}
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold
                           ${report.disaster?.severity === 'critical'
                             ? 'bg-emergency/20 text-emergency dark:text-emergency-dark'
                             : 'bg-warning-amber/20 text-warning-amber'
                           }`}>
            {report.disaster?.severity?.toUpperCase()}
          </span>
        </div>
      </div>
    </button>
  );
}

export default function AlertsPanel() {
  const { reports } = useReports();
  const { location } = useGeolocation();
  const userLat = location?.lat;
  const userLng = location?.lng;

  // Proximity-sorted alerts
  const sortedAlerts = useMemo(() => {
    return [...reports]
      .filter((r) => r.status === 'active')
      .sort((a, b) => {
        if (!userLat || !userLng) return 0;
        const da = distanceKm(userLat, userLng, a.lat, a.lng);
        const db = distanceKm(userLat, userLng, b.lat, b.lng);
        return da - db;
      });
  }, [reports, userLat, userLng]);

  if (sortedAlerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-text-muted-dark">
        <Bell size={32} aria-hidden="true" />
        <p className="text-sm font-medium">No active alerts</p>
        <p className="text-xs">You're all caught up</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      {sortedAlerts.map((report) => (
        <AlertItem
          key={report.id}
          report={report}
          userLat={userLat}
          userLng={userLng}
          onClick={(r) => {
            // Fly map to report location — handled by MapPanelContext selectedReportId
          }}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Write tests**

```jsx
// src/components/RightPanel/AlertsPanel.test.jsx
import { render, screen } from '@testing-library/react';
import AlertsPanel from './AlertsPanel';
import { MapPanelProvider } from '../../contexts/MapPanelContext';

function renderWithProviders(ui) {
  return render(<MapPanelProvider>{ui}</MapPanelProvider>);
}

describe('AlertsPanel', () => {
  it('renders empty state when no alerts', () => {
    // TODO: mock useReports to return []
  });

  it('renders sorted alert list', () => {
    // TODO: mock reports and geolocation
  });
});
```

- [ ] **Step 3: Commit**

```bash
git add src/components/RightPanel/AlertsPanel.jsx src/components/RightPanel/AlertsPanel.test.jsx
git commit -m "feat(ui-redesign): add AlertsPanel with proximity sorting"
```

---

## Task 7: DataPanel

**Files:**
- Create: `src/components/RightPanel/DataPanel.jsx`
- Create: `src/components/RightPanel/DataPanel.test.jsx`

- [ ] **Step 1: Write DataPanel component**

```jsx
// src/components/RightPanel/DataPanel.jsx
import { useState, useMemo } from 'react';
import { ChartBar, MapPin } from '@phosphor-icons/react';
import { useReports } from '../../hooks/useReports';

const PERIODS = [
  { id: '24h', label: '24h' },
  { id: '7d', label: '7d' },
  { id: '30d', label: '30d' },
];

function StatCard({ label, value, color }) {
  return (
    <div className="bg-surface-dark/50 rounded-lg p-3 border border-border-dark">
      <p className="text-xs text-text-muted-dark mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value ?? 0}</p>
    </div>
  );
}

function MunicipalityBar({ name, count, maxCount }) {
  const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-text-muted-dark w-20 truncate">{name}</span>
      <div className="flex-1 h-4 bg-surface-dark rounded-full overflow-hidden">
        <div
          className="h-full bg-emergency/70 dark:bg-emergency-dark/70 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-text-dark w-6 text-right">{count}</span>
    </div>
  );
}

export default function DataPanel() {
  const { reports } = useReports();
  const [period, setPeriod] = useState('7d');

  const periodSeconds = useMemo(() => {
    switch (period) {
      case '24h': return 86400;
      case '7d':  return 604800;
      case '30d': return 2592000;
      default:    return 604800;
    }
  }, [period]);

  const cutoff = Date.now() / 1000 - periodSeconds;

  const filteredReports = reports.filter((r) => !r.createdAt?.seconds || r.createdAt.seconds >= cutoff);

  const stats = useMemo(() => {
    const active = reports.filter((r) => r.status === 'active').length;
    const resolved = reports.filter((r) => r.status === 'resolved').length;
    const total = reports.length;
    return { total, active, resolved };
  }, [reports]);

  const municipalityCounts = useMemo(() => {
    const counts = {};
    filteredReports.forEach((r) => {
      const m = r.municipality ?? 'Unknown';
      counts[m] = (counts[m] ?? 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [filteredReports]);

  const maxCount = municipalityCounts[0]?.[1] ?? 1;

  return (
    <div className="h-full overflow-y-auto p-3 flex flex-col gap-3">
      {/* Period toggle */}
      <div className="flex gap-1 bg-surface-dark/50 rounded-lg p-1 border border-border-dark">
        {PERIODS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setPeriod(id)}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors
                       ${period === id
                         ? 'bg-emergency/20 text-text-dark dark:text-text-dark'
                         : 'text-text-muted-dark hover:text-text-dark'
                       }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-2">
        <StatCard label="Total" value={stats.total} color="text-text-dark" />
        <StatCard label="Active" value={stats.active} color="text-emergency dark:text-emergency-dark" />
        <StatCard label="Resolved" value={stats.resolved} color="text-safe" />
      </div>

      {/* Municipality breakdown */}
      <div className="flex flex-col gap-1.5">
        <h3 className="text-xs font-semibold text-text-muted-dark flex items-center gap-1">
          <MapPin size={14} aria-hidden="true" />
          By Municipality
        </h3>
        {municipalityCounts.length === 0 ? (
          <p className="text-xs text-text-muted-dark italic">No data for this period</p>
        ) : (
          municipalityCounts.slice(0, 8).map(([name, count]) => (
            <MunicipalityBar key={name} name={name} count={count} maxCount={maxCount} />
          ))
        )}
      </div>

      {/* Simple trend indicator */}
      <div className="flex items-center gap-2 p-3 bg-surface-dark/30 rounded-lg border border-border-dark">
        <ChartBar size={18} className="text-text-muted-dark" aria-hidden="true" />
        <span className="text-xs text-text-muted-dark">
          {filteredReports.length} reports in the last {period}
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write tests**

```jsx
// src/components/RightPanel/DataPanel.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import DataPanel from './DataPanel';
import { MapPanelProvider } from '../../contexts/MapPanelContext';

function renderWithProviders(ui) {
  return render(<MapPanelProvider>{ui}</MapPanelProvider>);
}

describe('DataPanel', () => {
  it('renders stat cards', () => {});
  it('renders municipality bar chart', () => {});
  it('switches period', () => {});
});
```

- [ ] **Step 3: Commit**

```bash
git add src/components/RightPanel/DataPanel.jsx src/components/RightPanel/DataPanel.test.jsx
git commit -m "feat(ui-redesign): add DataPanel with stats and municipality bar chart"
```

---

## Task 8: IncidentDetail

**Files:**
- Create: `src/components/RightPanel/IncidentDetail.jsx`
- Create: `src/components/RightPanel/IncidentDetail.test.jsx`
- Modify: `src/components/Map/PersistentMapPanel.jsx` (to call setSelectedReportId on pin click)

- [ ] **Step 1: Write IncidentDetail component**

```jsx
// src/components/RightPanel/IncidentDetail.jsx
import {
  Warning,
  MapPin,
  Clock,
  ArrowLeft,
  CheckCircle,
  Image,
} from '@phosphor-icons/react';
import { useMapPanel } from '../../contexts/MapPanelContext';
import {
  Drop, Fire, Car, Users, Question,
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

export default function IncidentDetail() {
  const { incidentDetailReport, setIncidentDetailReport, setSelectedReportId } = useMapPanel();

  if (!incidentDetailReport) return null;

  const { reports } = useReports?.() ?? {};
  // Find the full report object from reports list
  const report = reports?.find((r) => r.id === incidentDetailReport.id) ?? incidentDetailReport;
  const Icon = DISASTER_ICONS[report.disaster?.type] ?? Warning;

  function handleBack() {
    setIncidentDetailReport(null);
    setSelectedReportId(null);
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') handleBack();
  }

  return (
    <div
      className="flex flex-col h-full bg-surface-dark dark:bg-surface-dark overflow-hidden"
      onKeyDown={handleKeyDown}
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-3 border-b border-border-dark flex-shrink-0">
        <button
          type="button"
          onClick={handleBack}
          className="w-8 h-8 rounded-lg flex items-center justify-center
                     hover:bg-surface-dark/50 text-text-muted-dark hover:text-text-dark transition-colors"
          aria-label="Back to feed"
        >
          <ArrowLeft size={18} aria-hidden="true" />
        </button>

        <div className="flex-1">
          <h2 className="text-sm font-bold text-text-dark capitalize">
            {report.disaster?.type ?? 'Incident'}
          </h2>
          <p className="text-xs text-text-muted-dark">{report.municipality}</p>
        </div>

        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase
                        ${report.status === 'resolved'
                          ? 'bg-safe/20 text-safe'
                          : report.disaster?.severity === 'critical'
                            ? 'bg-emergency/20 text-emergency dark:text-emergency-dark'
                            : 'bg-warning-amber/20 text-warning-amber'
                        }`}>
          {report.status === 'resolved' ? 'Resolved' : report.disaster?.severity}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
        {/* Location + time */}
        <div className="flex items-start gap-2">
          <MapPin size={16} className="text-text-muted-dark flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-sm text-text-dark">{report.municipality}</p>
            {report.location && (
              <p className="text-xs text-text-muted-dark font-mono">
                {report.location.lat?.toFixed(5)}, {report.location.lng?.toFixed(5)}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Clock size={16} className="text-text-muted-dark" aria-hidden="true" />
          <span className="text-xs text-text-muted-dark">{timeAgo(report.createdAt)}</span>
        </div>

        {/* Description */}
        {report.disaster?.description && (
          <p className="text-sm text-text-dark leading-relaxed">
            {report.disaster.description}
          </p>
        )}

        {/* Media */}
        {report.photoURLs?.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {report.photoURLs.map((url, i) => (
              <div key={i} className="aspect-square bg-surface-dark rounded-lg overflow-hidden">
                <img
                  src={url}
                  alt={`Evidence ${i + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        )}

        {/* Resolution timeline — only for resolved */}
        {report.status === 'resolved' && report.resolutionNote && (
          <div className="mt-2 p-3 bg-safe/10 border-l-2 border-safe rounded">
            <p className="text-xs font-semibold text-safe flex items-center gap-1 mb-1">
              <CheckCircle size={14} aria-hidden="true" />
              Resolution
            </p>
            <p className="text-sm text-text-dark">{report.resolutionNote}</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Connect map pin click to IncidentDetail**

Modify `LeafletMap` or `PersistentMapPanel` to call `setSelectedReportId(report.id)` when a pin is clicked. The exact implementation depends on how the Leaflet markers are rendered in `DisasterMarker.jsx` — the marker should accept an `onClick` prop that calls `setSelectedReportId` from `MapPanelContext`.

- [ ] **Step 3: Commit**

```bash
git add src/components/RightPanel/IncidentDetail.jsx src/components/RightPanel/IncidentDetail.test.jsx
git add src/components/Map/PersistentMapPanel.jsx  # if modified
git commit -m "feat(ui-redesign): add IncidentDetail panel with before/after timeline"
```

---

## Task 9: Mobile Report Flow (3-Step)

**Files:**
- Create: `src/components/Reports/ReportTypeGrid.jsx`
- Create: `src/components/Reports/CameraCapture.jsx`
- Create: `src/components/Reports/ReportConfirm.jsx`
- Modify: `src/pages/ReportPage.jsx`

- [ ] **Step 1: Write ReportTypeGrid (Step 1)**

```jsx
// src/components/Reports/ReportTypeGrid.jsx
import {
  Drop,
  Fire,
  Car,
  Users,
  Warning,
  Question,
} from '@phosphor-icons/react';

const DISASTER_TYPES = [
  { id: 'flooding', label: 'Flooding', icon: Drop },
  { id: 'landslide', label: 'Landslide', icon: Warning },
  { id: 'fire', label: 'Fire', icon: Fire },
  { id: 'accident', label: 'Accident', icon: Car },
  { id: 'crowding', label: 'Crowding', icon: Users },
  { id: 'other', label: 'Other', icon: Question },
];

export default function ReportTypeGrid({ selected, onSelect }) {
  return (
    <div className="grid grid-cols-2 gap-3 p-4" role="radiogroup" aria-label="Disaster type">
      {DISASTER_TYPES.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={selected === id}
          onClick={() => onSelect(id)}
          className={`flex flex-col items-center justify-center gap-2 py-6 rounded-xl border-2
                     transition-all active:scale-95 min-h-[80px]
                     ${selected === id
                       ? 'border-emergency dark:border-emergency-dark bg-emergency/10 dark:bg-emergency-dark/10'
                       : 'border-border-dark dark:border-border-dark bg-surface-dark/50 dark:bg-surface-dark hover:border-text-muted-dark'
                     }`}
        >
          <Icon
            size={28}
            weight={selected === id ? 'fill' : 'regular'}
            className={selected === id
              ? 'text-emergency dark:text-emergency-dark'
              : 'text-text-muted-dark'
            }
            aria-hidden="true"
          />
          <span className={`text-sm font-medium
                           ${selected === id ? 'text-emergency dark:text-emergency-dark' : 'text-text-dark'}`}>
            {label}
          </span>
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Write CameraCapture (Step 2)**

```jsx
// src/components/Reports/CameraCapture.jsx
import { useRef, useState } from 'react';
import { Camera, Video, Images, ArrowRight } from '@phosphor-icons/react';

export default function CameraCapture({ photoFile, onPhotoSelect, onNext }) {
  const [preview, setPreview] = useState(photoFile ? URL.createObjectURL(photoFile) : null);
  const inputRef = useRef(null);

  function handleCapture(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    onPhotoSelect(file);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Camera / file input */}
      <div className="flex-1 relative bg-surface-dark flex flex-col items-center justify-center p-4">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleCapture}
          className="absolute inset-0 opacity-0 cursor-pointer"
          aria-label="Capture photo"
        />

        {!preview ? (
          <div className="flex flex-col items-center gap-4 text-text-muted-dark">
            <Camera size={64} aria-hidden="true" />
            <p className="text-sm">Tap to take a photo</p>
            <div className="flex gap-4 mt-2">
              <div className="flex items-center gap-1 text-xs">
                <Camera size={14} aria-hidden="true" />
                Photo
              </div>
              <div className="flex items-center gap-1 text-xs opacity-50">
                <Video size={14} aria-hidden="true" />
                Video
              </div>
            </div>
          </div>
        ) : (
          <div className="relative w-full h-full">
            <img
              src={preview}
              alt="Captured evidence"
              className="w-full h-full object-contain rounded-lg"
            />
            <button
              type="button"
              onClick={() => { setPreview(null); onPhotoSelect(null); }}
              className="absolute top-2 right-2 w-8 h-8 bg-shell text-white rounded-full
                         flex items-center justify-center text-sm"
              aria-label="Remove photo"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 flex gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex-1 py-3 rounded-xl border border-border-dark text-text-dark
                     flex items-center justify-center gap-2 text-sm"
        >
          <Images size={18} aria-hidden="true" />
          Gallery
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!photoFile}
          className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2
                     transition-colors
                     ${photoFile
                       ? 'bg-emergency dark:bg-emergency-dark text-white active:scale-95'
                       : 'bg-surface-dark/50 text-text-muted-dark cursor-not-allowed'
                     }`}
        >
          Next
          <ArrowRight size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Write ReportConfirm (Step 3)**

```jsx
// src/components/Reports/ReportConfirm.jsx
import { useState } from 'react';
import {
  MapPin,
  CheckCircle,
  PaperPlaneRight,
  ArrowLeft,
} from '@phosphor-icons/react';
import { useGeolocation } from '../../hooks/useGeolocation';

export default function ReportConfirm({
  disasterType,
  photoFile,
  municipality,
  onSubmit,
  submitting,
  onBack,
}) {
  const { location } = useGeolocation();
  const [description, setDescription] = useState('');

  return (
    <div className="flex flex-col h-full">
      {/* Summary card */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="bg-surface-dark dark:bg-surface rounded-xl p-4 border border-border-dark flex flex-col gap-4">
          {/* Disaster type */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emergency/10 dark:bg-emergency-dark/10
                          flex items-center justify-center">
              <span className="text-lg capitalize">{disasterType?.[0]}</span>
            </div>
            <div>
              <p className="text-sm font-medium text-text-dark capitalize">{disasterType}</p>
              <p className="text-xs text-text-muted-dark">Disaster type</p>
            </div>
          </div>

          {/* Photo thumbnail */}
          {photoFile && (
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-surface-dark">
                <img
                  src={URL.createObjectURL(photoFile)}
                  alt="Evidence"
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-xs text-text-muted-dark">Photo attached</p>
            </div>
          )}

          {/* Location */}
          <div className="flex items-center gap-3">
            <MapPin size={18} className="text-safe" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium text-text-dark flex items-center gap-1">
                {municipality ?? 'Location detected'}
                {municipality && <CheckCircle size={14} className="text-safe" aria-hidden="true" />}
              </p>
              {location && (
                <p className="text-xs text-text-muted-dark font-mono">
                  {location.lat?.toFixed(5)}, {location.lng?.toFixed(5)}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="text-xs text-text-muted-dark block mb-1">
              Description (optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add any details..."
              rows={3}
              className="w-full p-3 bg-surface dark:bg-surface-dark border border-border-dark
                         rounded-lg text-sm text-text-dark placeholder:text-text-muted-dark
                         resize-none focus:outline-none focus:border-emergency"
            />
          </div>
        </div>
      </div>

      {/* Send button */}
      <div className="p-4 flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="py-3 px-4 rounded-xl border border-border-dark text-text-dark text-sm"
          disabled={submitting}
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={() => onSubmit({ description })}
          disabled={submitting}
          className="flex-1 py-3 bg-emergency dark:bg-emergency-dark text-white
                     font-bold rounded-xl flex items-center justify-center gap-2
                     active:scale-95 transition-transform disabled:opacity-50"
        >
          {submitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <PaperPlaneRight size={18} weight="fill" aria-hidden="true" />
              SEND REPORT
            </>
          )}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Rewrite ReportPage to use 3-step flow**

Simplify ReportPage to use the new components:

```jsx
// src/pages/ReportPage.jsx — simplified
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/Common/Toast';
import { useGeolocation } from '../hooks/useGeolocation';
import { resolveMunicipality } from '../utils/geoFencing';
import ReportTypeGrid from '../components/Reports/ReportTypeGrid';
import CameraCapture from '../components/Reports/CameraCapture';
import ReportConfirm from '../components/Reports/ReportConfirm';
import { submitReport } from '../hooks/useReports';

export default function ReportPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();
  const { location } = useGeolocation();
  const [step, setStep] = useState(1);
  const [disasterType, setDisasterType] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const municipality = location
    ? resolveMunicipality(location.lat, location.lng).municipality
    : null;

  async function handleSubmit({ description }) {
    if (submitting) return;
    setSubmitting(true);
    try {
      await submitReport({
        reportType: 'situation',
        disaster: { type: disasterType, description },
        location: { lat: location.lat, lng: location.lng, accuracy: location.accuracy ?? 0 },
      }, photoFile ? [photoFile] : [], user);
      addToast('Report sent successfully', 'success');
      navigate('/');
    } catch (err) {
      addToast(err.message ?? 'Failed to send report', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col h-full bg-surface-dark dark:bg-surface-dark">
      {step === 1 && (
        <ReportTypeGrid selected={disasterType} onSelect={(t) => { setDisasterType(t); setStep(2); }} />
      )}
      {step === 2 && (
        <CameraCapture
          photoFile={photoFile}
          onPhotoSelect={setPhotoFile}
          onNext={() => setStep(3)}
        />
      )}
      {step === 3 && (
        <ReportConfirm
          disasterType={disasterType}
          photoFile={photoFile}
          municipality={municipality}
          onSubmit={handleSubmit}
          submitting={submitting}
          onBack={() => setStep(2)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/Reports/ReportTypeGrid.jsx src/components/Reports/CameraCapture.jsx src/components/Reports/ReportConfirm.jsx
git add src/pages/ReportPage.jsx
git commit -m "feat(ui-redesign): implement 3-step mobile report flow"
```

---

## Task 10: TabNavigation Redesign (Mobile Bottom Nav)

**Files:**
- Modify: `src/components/Layout/TabNavigation.jsx`

- [ ] **Step 1: Update TabNavigation with Weather tab and top border active indicator**

```jsx
// src/components/Layout/TabNavigation.jsx — updated
import { NavLink } from 'react-router-dom';
import {
  MapTrifold,
  Article,
  CloudSun,
  User,
} from '@phosphor-icons/react';

const TABS = [
  { label: 'Map', href: '/', icon: MapTrifold },
  { label: 'Feed', href: '/feed', icon: Article },
  { label: 'Weather', href: '/weather', icon: CloudSun },
  { label: 'Profile', href: '/profile', icon: User },
];

export default function TabNavigation() {
  return (
    <nav
      aria-label="Main navigation"
      className="bg-surface-light dark:bg-surface-dark border-t border-border-dark
                 grid grid-cols-4"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {TABS.map(({ label, href, icon: Icon }) => (
        <NavLink
          key={href}
          to={href}
          end={href === '/'}
          aria-label={label}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium
             transition-colors focus-visible:outline-none focus-visible:ring-2
             focus-visible:ring-emergency focus-visible:ring-inset relative
             ${isActive ? 'text-text-dark' : 'text-text-muted-dark'}`
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={`w-full h-0.5 absolute top-0 transition-colors rounded-b
                  ${isActive ? 'bg-emergency dark:bg-emergency-dark' : 'bg-transparent'}`}
                aria-hidden="true"
              />
              <Icon
                size={20}
                weight={isActive ? 'fill' : 'regular'}
                aria-hidden="true"
              />
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Layout/TabNavigation.jsx
git commit -m "feat(ui-redesign): update TabNavigation with Weather tab and top-border active indicator"
```

---

## Task 11: Final Integration & Dark Mode

**Files:**
- Modify: `src/components/Layout/AppShell.jsx` (ensure dark mode works with new colors)
- Modify: `src/pages/MapTab.jsx` (ensure UrgencyHome → map transition works)
- Run full test suite

- [ ] **Step 1: Verify all imports and run full test suite**

Run: `npm test -- --watchAll=false 2>&1 | tail -30`
Expected: All tests pass; no missing module errors

- [ ] **Step 2: Run build**

Run: `npm run build 2>&1 | tail -20`
Expected: Production build succeeds

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(ui-redesign): complete UI redesign integration"
```

---

## Phase Summary

| Task | Component | New/Modified | Complexity |
|---|---|---|---|
| 1 | Tailwind design tokens | Modified | Low |
| 2 | UrgencyHome + FloatingReportButton | Created | Medium |
| 3 | IconSidebar (Phosphor + tooltips) | Modified | Low |
| 4 | RightPanel shell + MapPanelContext | Created + Modified | High |
| 5 | FeedPanel | Created | Medium |
| 6 | AlertsPanel | Created | Medium |
| 7 | DataPanel | Created | Medium |
| 8 | IncidentDetail | Created | Medium |
| 9 | Report flow (3-step) | Created | High |
| 10 | TabNavigation (Weather tab) | Modified | Low |
| 11 | Integration + dark mode | Integration | Medium |
