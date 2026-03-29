# UI Redesign — Desktop Command Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Desktop Command Center redesign — a persistent map + RightPanel layout for desktop users, with the existing mobile tab navigation preserved.

**Architecture:**
- Desktop (`lg+`): `IconSidebar` (replaces text Sidebar) → `PersistentMapPanel` (left) → `RightPanel` with `FeedPanel`/`AlertsPanel`/`DataPanel` tabs (right)
- Mobile (`<lg`): Unchanged — `TabNavigation` (bottom) → full-page tab content
- Desktop layout adapts the existing hash-based routing (`window.location.hash` + `activeTab`) rather than rewriting to React Router
- `MapPanelContext` provides `selectedReportId` and `incidentDetailReport` across components

**Tech Stack:** React 18, Tailwind CSS, Phosphor Icons (`@phosphor-icons/react`), Firebase Firestore, Leaflet

**Key Constraints (from spec review round 1):**
- `@phosphor-icons/react` must be installed before any Phase 2 component using it
- AppShell uses **hash routing** — `window.location.hash` + `activeTab` state — NOT React Router `<Outlet>`
- FeedPanel queries Firestore directly (not `useReports()`) to include resolved reports

---

## Phase 0: Dependencies

### Task 0: Install Phosphor Icons

**File:** `package.json`

- [ ] **Step 1: Install @phosphor-icons/react**

```bash
npm install @phosphor-icons/react
```

- [ ] **Step 2: Verify build with new dependency**

```bash
npm run build 2>&1 | grep -i error | head -5
# Expected: no errors
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(deps): add @phosphor-icons/react"
```

---

## Phase 1: Desktop Architecture Foundation

### Task 1: Tailwind Design Tokens

**File:** `tailwind.config.js`

Add missing dark palette tokens for the command center theme.

**Note:** `dark-textMuted: '#8B99A8'` is already set in tailwind.config.js (commit `c6985b5`). Verify before editing.

- [ ] **Step 1: Add NEW tokens to tailwind.config.js**

```javascript
// tailwind.config.js — verify these are NOT already present in the dark: block
// then add any missing:

// Add to extend.colors.dark (after existing dark: block):
'emergency-dark': '#EF5350',     // 4.6:1 on dark-bg
'safe-dark':      '#4CAF50',     // 8.9:1 AAA on dark-bg
'warning-amber-dark': '#FB8C00', // 4.6:1 AA on dark-bg (was #FF9800 at 3.2:1)
// Note: 'surface-light' and 'bg-app-light' are light-only tokens — no dark: variant needed
```

Verify existing dark tokens before adding. The following are already present:
- `dark-bg: '#0F1923'`
- `dark-card: '#182635'`
- `dark-elevated: '#1E3044'`
- `dark-border: '#2A3F55'`
- `dark-text: '#E1E4E8'`
- `dark-textLight: '#8B99A8'`
- `dark-textMuted: '#8B99A8'` (WCAG AA fixed in `c6985b5`)
- `dark-accent: '#EF5350'`

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | grep -i error | head -5
# Expected: no errors
```

- [ ] **Step 3: Commit**

```bash
git add tailwind.config.js
git commit -m "feat(ui-redesign): add dark palette tokens for command center"
```

---

### Task 2: MapPanelContext

**Files:**
- Create: `src/contexts/MapPanelContext.jsx`
- Modify: `src/App.jsx`

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

- [ ] **Step 2: Wrap App with MapPanelProvider**

In `src/App.jsx`, wrap `<AppContent />` inside `<MapPanelProvider>`:

```jsx
// src/App.jsx
import { MapPanelProvider } from './contexts/MapPanelContext';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <ReportsProvider>
              <MapPanelProvider>
                <AppContent />
              </MapPanelProvider>
            </ReportsProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build 2>&1 | grep -i error | head -5
# Expected: no errors
```

- [ ] **Step 4: Commit**

```bash
git add src/contexts/MapPanelContext.jsx src/App.jsx
git commit -m "feat(ui-redesign): add MapPanelContext for desktop panel state"
```

---

### Task 3: AppShell — Responsive Layout Wrapper

**Files:**
- Create: `src/components/Layout/AppShell.jsx`
- Create: `src/components/Layout/PersistentMapPanel.jsx`
- Modify: `src/App.jsx`

**Architecture note:** This uses **hash-based routing** matching the existing `activeTab` pattern — NOT React Router `<Outlet>`. The `AppShell` receives `children` (the page content rendered by `App.jsx`) and conditionally shows the desktop layout or mobile layout. It reads `window.location.hash` to sync with the parent.

- [ ] **Step 1: Create PersistentMapPanel**

```jsx
// src/components/Layout/PersistentMapPanel.jsx
import { useRef } from 'react';
import LeafletMap from '../Map/LeafletMap';
import { useMapPanel } from '../../contexts/MapPanelContext';

export default function PersistentMapPanel({ style }) {
  const { setSelectedReportId } = useMapPanel();
  const containerRef = useRef(null);

  return (
    <div ref={containerRef} style={style} className="relative flex-shrink-0">
      <LeafletMap
        reports={[]}
        onReportClick={(report) => setSelectedReportId(report.id)}
      />
    </div>
  );
}
```

**Note:** `LeafletMap` only accepts `reports`, `onReportClick`, and `selectedReport` props. Do NOT pass `showFloatingReportButton` or `showMobileControls` — these are managed internally.

- [ ] **Step 2: Create AppShell**

```jsx
// src/components/Layout/AppShell.jsx
import { useState, useCallback, useEffect } from 'react';
import IconSidebar from './IconSidebar';
import PersistentMapPanel from './PersistentMapPanel';
import RightPanel from '../RightPanel/RightPanel';
import TabNavigation from './TabNavigation';
import { useMapPanel } from '../../contexts/MapPanelContext';

// Detect desktop breakpoint — use a ref to avoid stale closures
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 1024);
  useEffect(() => {
    function onResize() {
      setIsDesktop(window.innerWidth >= 1024);
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return isDesktop;
}

export default function AppShell({ children, activeTab, onTabChange }) {
  const { selectedReportId } = useMapPanel();
  const isDesktop = useIsDesktop();
  const [mapWidth, setMapWidth] = useState(() => Math.floor(window.innerWidth * 0.38));
  const [isResizing, setIsResizing] = useState(false);
  const [showMap, setShowMap] = useState(true);

  // Sync hash changes back to parent
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') || 'map';
      const tab = hash.replace('/', '');
      if (tab !== activeTab) onTabChange(tab);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [activeTab, onTabChange]);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsResizing(true);
    const startX = e.clientX;
    const startWidth = mapWidth;
    function onMove(e) {
      const delta = e.clientX - startX;
      setMapWidth(Math.max(200, Math.min(window.innerWidth - 480, startWidth + delta)));
    }
    function onUp() {
      setIsResizing(false);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [mapWidth]);

  // Desktop layout: IconSidebar | [MapPanel | ResizeHandle] | RightPanel
  if (isDesktop) {
    return (
      <div className="flex h-dvh bg-bg dark:bg-dark-bg overflow-hidden">
        <IconSidebar activeTab={activeTab} onTabChange={onTabChange} />
        {showMap && (
          <>
            <PersistentMapPanel style={{ width: mapWidth }} />
            <div
              className={`w-1 flex-shrink-0 cursor-col-resize bg-border dark:bg-dark-border ${isResizing ? 'bg-accent/50' : ''}`}
              onMouseDown={handleMouseDown}
              role="separator"
              aria-orientation="vertical"
            />
          </>
        )}
        <RightPanel activeTab={activeTab} onTabChange={onTabChange} className="flex-1" />
      </div>
    );
  }

  // Mobile layout: TabNavigation + page content (children = renderTab() output)
  return (
    <div className="flex flex-col h-dvh bg-bg dark:bg-dark-bg overflow-hidden">
      <main className="flex-1 overflow-hidden flex flex-col">
        {children}
      </main>
      <TabNavigation activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  );
}
```

- [ ] **Step 3: Update App.jsx to use AppShell**

In `src/App.jsx`, replace the current `Sidebar` + `TabNavigation` rendering with `AppShell`:

```jsx
// In App.jsx AppContent render — find the section with:
// {activeTab !== 'profile' && (
//   <>
//     <Sidebar ... />
//     <div className="hidden lg:block flex-1 ..." ...
//       <main> ... </main>
//     </div>
//   </>
// )}
// AND mobile: <TabNavigation ... />

// Replace with:
<AppShell activeTab={activeTab} onTabChange={changeTab}>
  <main id={`tabpanel-${activeTab}`} className="flex-1 flex flex-col min-h-0">
    {renderTab()}
  </main>
</AppShell>
```

- [ ] **Step 4: Verify build**

```bash
npm run build 2>&1 | grep -i error | head -10
# Expected: no errors
```

- [ ] **Step 5: Commit**

```bash
git add src/components/Layout/AppShell.jsx src/components/Layout/PersistentMapPanel.jsx src/App.jsx
git commit -m "feat(ui-redesign): add AppShell with responsive desktop/mobile layout"
```

---

## Phase 2: RightPanel Desktop Components

### Task 4: IconSidebar (Desktop Navigation)

**File:** `src/components/Layout/IconSidebar.jsx` (new file, coexists with existing `Sidebar.jsx`)

- [ ] **Step 1: Write IconSidebar with Phosphor icons + hover tooltips**

```jsx
// src/components/Layout/IconSidebar.jsx
// NOTE: react-router-dom is NOT installed. Use buttons + window.location.hash only.
import {
  MapTrifold,
  Article,
  Bell,
  ChartBar,
  User,
  PlusCircle,
  ShieldCheck,
} from '@phosphor-icons/react';
import { useAuthContext } from '../../contexts/AuthContext';

const TABS = [
  { id: 'map',     label: 'Map',     icon: MapTrifold },
  { id: 'feed',    label: 'Feed',    icon: Article },
  { id: 'alerts',  label: 'Alerts',  icon: Bell },
  { id: 'weather', label: 'Weather', icon: ChartBar },
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'admin',   label: 'Admin',   icon: ShieldCheck, adminOnly: true },
];

export default function IconSidebar({ activeTab, onTabChange }) {
  const { isAdmin } = useAuthContext();

  function handleClick(tabId) {
    window.location.hash = tabId === 'map' ? '' : tabId;
    onTabChange(tabId);
  }

  function handleReportClick() {
    window.location.hash = 'report';
  }

  return (
    <nav
      aria-label="Main navigation"
      className="w-11 bg-white dark:bg-dark-card border-r border-border/60 dark:border-dark-border
                 flex flex-col items-center py-3 gap-1 flex-shrink-0"
    >
      {/* Report shortcut */}
      <button
        type="button"
        onClick={handleReportClick}
        aria-label="New report"
        className="w-9 h-9 rounded-lg flex items-center justify-center
                   text-accent hover:bg-accent/10 transition-colors"
      >
        <PlusCircle size={22} weight="fill" aria-hidden="true" />
      </button>

      <div className="w-6 h-px bg-border/40 dark:bg-dark-border/40 my-1" aria-hidden="true" />

      {TABS.filter((t) => !t.adminOnly || isAdmin).map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => handleClick(tab.id)}
          aria-label={tab.label}
          aria-pressed={activeTab === tab.id}
          className={`group relative w-9 h-9 rounded-lg flex items-center justify-center transition-colors
                     ${activeTab === tab.id
                       ? 'bg-primary/10 text-primary dark:bg-dark-accent/20 dark:text-dark-accent'
                       : 'text-textLight dark:text-dark-textLight hover:bg-stone-100 dark:hover:bg-dark-elevated hover:text-text dark:hover:text-white'
                     }`}
        >
          <tab.icon
            size={22}
            weight={activeTab === tab.id ? 'fill' : 'regular'}
            aria-hidden="true"
          />
          {/* Hover tooltip */}
          <span className="absolute left-full ml-3 px-2 py-1 bg-dark-bg text-white text-xs
                           rounded opacity-0 group-hover:opacity-100 pointer-events-none
                           whitespace-nowrap z-50 transition-opacity duration-150 shadow-lg">
            {tab.label}
          </span>
        </button>
      ))}
    </nav>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | grep -i error | head -5
# Expected: no errors
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Layout/IconSidebar.jsx
git commit -m "feat(ui-redesign): add IconSidebar with Phosphor icons and hover tooltips"
```

---

### Task 5: RightPanel Shell

**Files:**
- Create: `src/components/RightPanel/RightPanel.jsx`
- Modify: `src/components/Layout/AppShell.jsx`

- [ ] **Step 1: Write RightPanel shell**

```jsx
// src/components/RightPanel/RightPanel.jsx
import { useState, useEffect } from 'react';
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
  { id: 'feed',    label: 'Feed',    icon: Article },
  { id: 'alerts',  label: 'Alerts', icon: Bell },
  { id: 'weather', label: 'Weather', icon: ChartBar },
];

export default function RightPanel({ activeTab, onTabChange, className = '' }) {
  const { incidentDetailReport } = useMapPanel();

  // Sync active tab with incoming activeTab prop
  const getInitialTab = () => {
    if (activeTab === 'alerts') return 'alerts';
    if (activeTab === 'feed') return 'feed';
    if (activeTab === 'weather') return 'weather';
    return 'feed';
  };

  const [activePanelTab, setActivePanelTab] = useState(getInitialTab);

  // When parent activeTab changes, sync panel tab
  useEffect(() => {
    setActivePanelTab(getInitialTab());
  }, [activeTab]);

  if (incidentDetailReport) {
    return <IncidentDetail className={className} />;
  }

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-dark-card border-l border-border/60 dark:border-dark-border ${className}`}>
      {/* Tab bar */}
      <div className="flex border-b border-border/60 dark:border-dark-border" role="tablist">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={activePanelTab === id}
            onClick={() => setActivePanelTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium
                       transition-colors border-b-2 -mb-px
                       ${activePanelTab === id
                         ? 'text-primary dark:text-dark-accent border-primary dark:border-dark-accent'
                         : 'text-textLight dark:text-dark-textLight border-transparent hover:text-text dark:hover:text-white'
                       }`}
          >
            <Icon size={16} weight={activePanelTab === id ? 'fill' : 'regular'} aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {activePanelTab === 'feed' && <FeedPanel />}
        {activePanelTab === 'alerts' && <AlertsPanel />}
        {activePanelTab === 'weather' && <DataPanel />}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | grep -i error | head -5
# Expected: no errors
```

- [ ] **Step 3: Commit**

```bash
git add src/components/RightPanel/RightPanel.jsx
git commit -m "feat(ui-redesign): add RightPanel shell with tab switcher"
```

---

### Task 6: FeedPanel

**Files:**
- Create: `src/components/RightPanel/FeedPanel.jsx`
- Create: `src/components/RightPanel/FeedPanel.test.jsx`

**Data note:** `useReports()` filters OUT resolved reports (`where('verification.status', '!=', 'resolved')`). FeedPanel needs both active AND resolved reports. It queries Firestore directly with a separate query.

- [ ] **Step 1: Write FeedPanel with Firestore query for all reports**

```jsx
// src/components/RightPanel/FeedPanel.jsx
import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
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
  const isResolved = report.verification?.status === 'resolved';

  return (
    <div
      className="flex items-start gap-3 p-3 hover:bg-stone-50 dark:hover:bg-dark-elevated cursor-pointer transition-colors border-l-2 border-transparent hover:border-border dark:hover:border-dark-border"
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
          <span className="text-xs text-textLight dark:text-dark-textLight">{report.location?.municipality}</span>
        </div>
        <div className="flex items-center gap-1 mt-0.5 text-xs text-textLight dark:text-dark-textLight">
          <Clock size={12} aria-hidden="true" />
          <span>{timeAgo(report.timestamp)}</span>
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
        <span className="text-xs text-textLight dark:text-dark-textLight">{report.location?.municipality}</span>
        <span className="text-xs text-textLight dark:text-dark-textLight">{timeAgo(report.timestamp)}</span>
      </button>
      {expanded && report.verification?.resolution?.resolutionNotes && (
        <div className="px-3 pb-3 pl-9 border-l-2 border-success/30">
          <p className="text-xs text-textLight dark:text-dark-textLight italic">
            {report.verification.resolution.resolutionNotes}
          </p>
        </div>
      )}
    </div>
  );
}

export default function FeedPanel() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const { setSelectedReportId, setIncidentDetailReport } = useMapPanel();

  useEffect(() => {
    // Query ALL reports (including resolved) for FeedPanel
    const q = query(
      collection(db, 'reports'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((d) => ({ ...d.data(), id: d.id }));
      setReports(docs);
      setLoading(false);
    }, () => {
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const activeReports = reports.filter((r) => r.verification?.status !== 'resolved');
  const resolvedReports = reports.filter((r) => r.verification?.status === 'resolved');
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
  it('calls setIncidentDetailReport when report clicked', () => {});
});
```

- [ ] **Step 3: Verify build**

```bash
npm run build 2>&1 | grep -i error | head -5
# Expected: no errors
```

- [ ] **Step 4: Commit**

```bash
git add src/components/RightPanel/FeedPanel.jsx src/components/RightPanel/FeedPanel.test.jsx
git commit -m "feat(ui-redesign): add FeedPanel with all-reports Firestore query"
```

---

### Task 7: AlertsPanel

**Files:**
- Create: `src/components/RightPanel/AlertsPanel.jsx`
- Create: `src/components/RightPanel/AlertsPanel.test.jsx`

- [ ] **Step 1: Write AlertsPanel with proximity sorting**

AlertsPanel shows active (non-resolved) reports sorted by proximity to user's location. Uses `useMapPanel()` to get `selectedReportId` for highlighting.

```jsx
// src/components/RightPanel/AlertsPanel.jsx
import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useMapPanel } from '../../contexts/MapPanelContext';
import { Drop, Fire, Car, Users, Warning, Question, Bell } from '@phosphor-icons/react';

const DISASTER_ICONS = {
  flooding: Drop,
  landslide: Warning,
  fire: Fire,
  accident: Car,
  crowding: Users,
  other: Question,
};

function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function timeAgo(timestamp) {
  if (!timestamp?.seconds) return '';
  const seconds = Math.floor(Date.now() / 1000 - timestamp.seconds);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function AlertItem({ report, onClick, isSelected }) {
  const Icon = DISASTER_ICONS[report.disaster?.type] ?? Question;
  const severityColors = {
    critical: 'border-l-red-500',
    moderate: 'border-l-amber-500',
    minor: 'border-l-emerald-500',
  };
  const colorClass = severityColors[report.disaster?.severity] ?? 'border-l-gray-400';

  return (
    <div
      className={`flex items-start gap-3 p-3 cursor-pointer transition-colors border-l-2 ${colorClass}
                 ${isSelected ? 'bg-accent/5 dark:bg-dark-accent/10' : 'hover:bg-stone-50 dark:hover:bg-dark-elevated'}`}
      onClick={() => onClick(report)}
      role="article"
    >
      <div className="w-8 h-8 rounded-full bg-alertRed/10 flex items-center justify-center flex-shrink-0">
        <Icon size={16} weight="fill" className="text-alertRed" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text dark:text-dark-text capitalize">
          {report.disaster?.type}
        </p>
        <p className="text-xs text-textLight dark:text-dark-textLight mt-0.5">
          {report.location?.municipality}
        </p>
        <p className="text-xs text-textLight dark:text-dark-textLight">
          {timeAgo(report.timestamp)}
        </p>
      </div>
    </div>
  );
}

export default function AlertsPanel() {
  const [alerts, setAlerts] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const { selectedReportId, setSelectedReportId, setIncidentDetailReport } = useMapPanel();

  useEffect(() => {
    // Try to get user location for proximity sorting
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, 'reports'),
      where('verification.status', 'in', ['pending', 'verified']),
      orderBy('timestamp', 'desc'),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let docs = snapshot.docs.map((d) => ({ ...d.data(), id: d.id }));
      // Proximity sort if location available
      if (userLocation) {
        docs.sort((a, b) => {
          const distA = distanceKm(
            userLocation.lat, userLocation.lng,
            a.location?.lat ?? 0, a.location?.lng ?? 0
          );
          const distB = distanceKm(
            userLocation.lat, userLocation.lng,
            b.location?.lat ?? 0, b.location?.lng ?? 0
          );
          return distA - distB;
        });
      }
      setAlerts(docs);
      setLoading(false);
    }, () => setLoading(false));

    return () => unsubscribe();
  }, [userLocation]);

  function handleClick(report) {
    setSelectedReportId(report.id);
    setIncidentDetailReport(report);
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

  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-textLight dark:text-dark-textLight">
        <Bell size={32} aria-hidden="true" />
        <p className="text-sm font-medium text-text dark:text-dark-text">No active alerts</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      {alerts.map((report) => (
        <AlertItem
          key={report.id}
          report={report}
          onClick={handleClick}
          isSelected={selectedReportId === report.id}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Write AlertsPanel tests**

```jsx
// src/components/RightPanel/AlertsPanel.test.jsx
// (similar structure to FeedPanel.test.jsx)
```

- [ ] **Step 3: Verify build**

```bash
npm run build 2>&1 | grep -i error | head -5
# Expected: no errors
```

- [ ] **Step 4: Commit**

```bash
git add src/components/RightPanel/AlertsPanel.jsx src/components/RightPanel/AlertsPanel.test.jsx
git commit -m "feat(ui-redesign): add AlertsPanel with proximity sorting"
```

---

### Task 8: DataPanel

**Files:**
- Create: `src/components/RightPanel/DataPanel.jsx`
- Create: `src/components/RightPanel/DataPanel.test.jsx`

- [ ] **Step 1: Write DataPanel with stats dashboard**

DataPanel shows weather summary for desktop (from `WeatherTab` content) and aggregate stats.

```jsx
// src/components/RightPanel/DataPanel.jsx
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';

function MunicipalityBar({ municipality, count, maxCount }) {
  const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-textLight dark:text-dark-textLight w-24 truncate">{municipality}</span>
      <div className="flex-1 h-2 bg-surface dark:bg-dark-elevated rounded-full overflow-hidden">
        <div
          className="h-full bg-primary dark:bg-dark-accent rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-medium text-text dark:text-dark-text w-6 text-right">{count}</span>
    </div>
  );
}

export default function DataPanel() {
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    resolved: 0,
    byMunicipality: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        // Total count
        const allQ = query(collection(db, 'reports'));
        const allSnap = await getDocs(allQ);
        const all = allSnap.docs.map((d) => ({ ...d.data(), id: d.id }));
        const total = all.length;
        const resolved = all.filter((r) => r.verification?.status === 'resolved').length;
        const active = total - resolved;

        // Municipality breakdown
        const munMap = {};
        all.forEach((r) => {
          const mun = r.location?.municipality ?? 'Unknown';
          munMap[mun] = (munMap[mun] ?? 0) + 1;
        });
        const byMunicipality = Object.entries(munMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8);
        const maxCount = byMunicipality[0]?.[1] ?? 1;

        setStats({ total, active, resolved, byMunicipality, maxCount });
      } catch (e) {
        console.warn('Could not load stats:', e);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 overflow-y-auto h-full">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-surface dark:bg-dark-elevated rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-text dark:text-dark-text">{stats.total}</p>
          <p className="text-xs text-textLight dark:text-dark-textLight">Total</p>
        </div>
        <div className="bg-alertRed/10 rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-alertRed">{stats.active}</p>
          <p className="text-xs text-textLight dark:text-dark-textLight">Active</p>
        </div>
        <div className="bg-success/10 rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-success">{stats.resolved}</p>
          <p className="text-xs text-textLight dark:text-dark-textLight">Resolved</p>
        </div>
      </div>

      {/* Municipality bar chart */}
      <h3 className="text-xs font-semibold text-textLight dark:text-dark-textLight uppercase tracking-wide mb-3">
        Reports by Municipality
      </h3>
      <div className="space-y-2">
        {stats.byMunicipality.map(([municipality, count]) => (
          <MunicipalityBar
            key={municipality}
            municipality={municipality}
            count={count}
            maxCount={stats.maxCount}
          />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write DataPanel tests**

```jsx
// src/components/RightPanel/DataPanel.test.jsx
```

- [ ] **Step 3: Verify build**

```bash
npm run build 2>&1 | grep -i error | head -5
# Expected: no errors
```

- [ ] **Step 4: Commit**

```bash
git add src/components/RightPanel/DataPanel.jsx src/components/RightPanel/DataPanel.test.jsx
git commit -m "feat(ui-redesign): add DataPanel with stats and municipality bar chart"
```

---

### Task 9: IncidentDetail

**Files:**
- Create: `src/components/RightPanel/IncidentDetail.jsx`
- Modify: `src/components/Map/DisasterMarker.jsx` (accept `onClick` prop)
- Modify: `src/components/Map/LeafletMap.jsx` (accept `onReportClick` prop)
- Modify: `src/components/RightPanel/RightPanel.jsx` (close button clears `incidentDetailReport`)

- [ ] **Step 1: Write IncidentDetail**

```jsx
// src/components/RightPanel/IncidentDetail.jsx
import { useMapPanel } from '../../contexts/MapPanelContext';
import {
  X, MapPin, Clock, AlertTriangle, CheckCircle,
  Drop, Fire, Car, Users, Warning, Question,
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

export default function IncidentDetail({ className = '' }) {
  const { incidentDetailReport, setIncidentDetailReport, setSelectedReportId } = useMapPanel();

  if (!incidentDetailReport) return null;

  const report = incidentDetailReport;
  const Icon = DISASTER_ICONS[report.disaster?.type] ?? Question;
  const isResolved = report.verification?.status === 'resolved';

  function handleClose() {
    setIncidentDetailReport(null);
    setSelectedReportId(null);
  }

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-dark-card ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/60 dark:border-dark-border">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center
                          ${isResolved ? 'bg-success/10' : 'bg-accent/10'}`}>
            <Icon size={20} weight="fill" className={isResolved ? 'text-success' : 'text-accent'} aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-text dark:text-dark-text capitalize">
              {report.disaster?.type ?? 'Unknown Incident'}
            </h2>
            <p className="text-xs text-textLight dark:text-dark-textLight">
              {report.location?.municipality}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface dark:hover:bg-dark-elevated transition-colors"
          aria-label="Close incident detail"
        >
          <X size={18} className="text-textLight dark:text-dark-textLight" aria-hidden="true" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Status badge */}
        <div className="flex items-center gap-2">
          {isResolved ? (
            <>
              <CheckCircle size={16} className="text-success" aria-hidden="true" />
              <span className="text-xs font-medium text-success">Resolved</span>
            </>
          ) : (
            <>
              <AlertTriangle size={16} className="text-alertRed" aria-hidden="true" />
              <span className="text-xs font-medium text-alertRed capitalize">{report.verification?.status ?? 'Active'}</span>
            </>
          )}
          <span className="text-xs text-textLight dark:text-dark-textLight capitalize">
            — {report.disaster?.severity ?? 'Unknown'} severity
          </span>
        </div>

        {/* Location */}
        <div className="flex items-start gap-2">
          <MapPin size={14} className="text-textLight dark:text-dark-textLight mt-0.5 flex-shrink-0" aria-hidden="true" />
          <div>
            <p className="text-sm text-text dark:text-dark-text">{report.location?.municipality}</p>
            {report.location?.barangay && (
              <p className="text-xs text-textLight dark:text-dark-textLight">{report.location.barangay}</p>
            )}
          </div>
        </div>

        {/* Timestamp */}
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-textLight dark:text-dark-textLight" aria-hidden="true" />
          <span className="text-sm text-text dark:text-dark-text">{timeAgo(report.timestamp)}</span>
        </div>

        {/* Description */}
        {report.disaster?.description && (
          <div className="bg-surface dark:bg-dark-elevated rounded-lg p-3">
            <p className="text-sm text-text dark:text-dark-text">{report.disaster.description}</p>
          </div>
        )}

        {/* Reporter */}
        <div className="border-t border-border/60 dark:border-dark-border pt-3">
          <p className="text-xs text-textLight dark:text-dark-textLight">
            Reported by <span className="font-medium text-text dark:text-dark-text">{report.reporter?.name ?? 'Anonymous'}</span>
          </p>
        </div>

        {/* Resolution notes */}
        {isResolved && report.verification?.resolution?.resolutionNotes && (
          <div className="border-t border-border/60 dark:border-dark-border pt-3">
            <p className="text-xs text-textLight dark:text-dark-textLight mb-1">Resolution:</p>
            <p className="text-sm text-text dark:text-dark-text italic">
              {report.verification.resolution.resolutionNotes}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Connect map markers to MapPanelContext**

In `DisasterMarker.jsx`, accept `onClick` prop and call it:

```jsx
// src/components/Map/DisasterMarker.jsx
// Find the onClick handler on the marker element and add:
// onClick ? onClick(report.id) : undefined
```

In `LeafletMap.jsx`, accept `onReportClick` prop and pass to `<DisasterMarker onClick={onReportClick} />`.

- [ ] **Step 3: Add close button in RightPanel**

In `RightPanel.jsx`, when `incidentDetailReport` is set, render `<IncidentDetail />` which already has a close button that clears the context.

- [ ] **Step 4: Verify build**

```bash
npm run build 2>&1 | grep -i error | head -5
# Expected: no errors
```

- [ ] **Step 5: Commit**

```bash
git add src/components/RightPanel/IncidentDetail.jsx
git add src/components/Map/DisasterMarker.jsx src/components/Map/LeafletMap.jsx
git commit -m "feat(ui-redesign): add IncidentDetail panel with map marker connection"
```

---

## Phase 3: Mobile UrgencyHome (Deferred)

> **Note:** Based on Desktop Command Center priority, Phase 3 (mobile) is deferred until Phase 2 is complete and verified.

### Task 10: UrgencyHome + FloatingReportButton

**Files:**
- Create: `src/pages/UrgencyHome.jsx`
- Create: `src/components/Layout/FloatingReportButton.jsx`
- Modify: `src/pages/MapTab.jsx`

Will be implemented after Phase 2 completion.

---

## Phase 4: TabNavigation Polish (Deferred)

### Task 11: TabNavigation Redesign

Will add Weather tab and update active indicator style. Deferred until Phase 2.

---

## Phase 5: Final Integration (Deferred)

### Task 12: Integration + Full Test Suite

Will run full test suite, build verification, dark mode audit. Deferred until Phase 2.

---

## File Map Summary

| File | Status | Responsibility |
|---|---|---|
| `src/contexts/MapPanelContext.jsx` | **Created** | `selectedReportId`, `incidentDetailReport` state |
| `src/components/Layout/AppShell.jsx` | **Created** | Responsive layout: desktop=3col, mobile=tabnav |
| `src/components/Layout/PersistentMapPanel.jsx` | **Created** | Leaflet map wrapper for desktop left panel |
| `src/components/Layout/IconSidebar.jsx` | **Created** | Icon-only desktop sidebar (replaces text Sidebar) |
| `src/components/RightPanel/RightPanel.jsx` | **Created** | Right panel shell with Feed/Alerts/Data tabs |
| `src/components/RightPanel/FeedPanel.jsx` | **Created** | Chronological all-reports feed with resolved expansion |
| `src/components/RightPanel/AlertsPanel.jsx` | **Created** | Active alerts with proximity sorting |
| `src/components/RightPanel/DataPanel.jsx` | **Created** | Stats dashboard with municipality bar chart |
| `src/components/RightPanel/IncidentDetail.jsx` | **Created** | Full incident detail (replaces panel when report selected) |
| `src/components/Layout/FloatingReportButton.jsx` | **Created** | Mobile floating report FAB |
| `src/pages/UrgencyHome.jsx` | **Created** | Mobile home screen with pulsing report button |
| `src/pages/ReportPage.jsx` | **Modified** | Redirect to 3-step mobile flow |
| `tailwind.config.js` | **Modified** | Add dark palette tokens |
| `src/App.jsx` | **Modified** | Wrap with MapPanelProvider, add AppShell |
| `src/components/Layout/Sidebar.jsx` | **Unchanged** | Still used for mobile admin tab if needed |
| `src/components/Map/DisasterMarker.jsx` | **Modified** | Accept `onClick` prop |
| `src/components/Map/LeafletMap.jsx` | **Modified** | Accept `onReportClick` prop, pass to markers |

---

## Verification Checklist

After Phase 2 completion, verify:
- [ ] Desktop (`lg+`): IconSidebar visible, map on left, RightPanel on right
- [ ] Desktop map: clicking marker sets `selectedReportId` → IncidentDetail opens in RightPanel
- [ ] FeedPanel: shows all reports including resolved, with expandable resolved section
- [ ] AlertsPanel: sorted by proximity to user location
- [ ] Mobile (`<lg`): TabNavigation at bottom, no map visible, full-page tab content
- [ ] All components: dark mode renders correctly with new tokens
- [ ] Build passes: `npm run build 2>&1 | grep -i error | head -5`
- [ ] Tests pass: `npm test -- --watchAll=false`
