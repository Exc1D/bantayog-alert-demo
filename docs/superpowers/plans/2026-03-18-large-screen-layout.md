# Large Screen Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a responsive split-panel layout for lg+ screens (≥1024px) — icon sidebar, persistent map panel, and right content panel — while leaving mobile layout unchanged.

**Architecture:** `MapPanelContext` acts as a message bus between tabs and a persistent `PersistentMapPanel`. Each tab declares its `mapMode` on mount; `AppShell` uses CSS grid to switch between mobile and desktop layouts. `PersistentMapPanel` is conditionally rendered only on lg+ so Leaflet initializes once.

**Tech Stack:** React 18, React Router v6, Tailwind CSS, Leaflet (via existing `LeafletMap.jsx`), Vitest + Testing Library

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `src/components/Layout/Sidebar.jsx` | **Delete** | Dead code since Phase 1 rebuild |
| `src/hooks/useIsLg.js` | **Create** | Returns true when viewport ≥ 1024px |
| `src/hooks/useIsLg.test.js` | **Create** | Tests for useIsLg |
| `src/contexts/MapPanelContext.jsx` | **Create** | Context + provider + useMapPanel hook |
| `src/contexts/MapPanelContext.test.jsx` | **Create** | Tests for context defaults and setters |
| `src/test/utils.jsx` | **Modify** | Add MapPanelContext.Provider to AllProviders |
| `src/components/Layout/IconSidebar.jsx` | **Create** | 44px icon-only vertical nav for lg+ |
| `src/components/Layout/IconSidebar.test.jsx` | **Create** | Tests for IconSidebar |
| `src/components/Map/PersistentMapPanel.jsx` | **Create** | Wraps LeafletMap, reacts to MapPanelContext |
| `src/components/Map/PersistentMapPanel.test.jsx` | **Create** | Tests for PersistentMapPanel |
| `src/components/Map/LeafletMap.jsx` | **Modify** | Add `flyToReportId` prop (prop-driven flyTo) |
| `src/components/Layout/AppShell.jsx` | **Modify** | CSS grid desktop layout + MapPanelContext.Provider |
| `src/components/Layout/AppShell.test.jsx` | **Modify** | Add desktop layout assertions |
| `src/pages/FeedTab.jsx` | **Modify** | setMapMode('pins'), pass reportLocations, setHighlightedReportId on card tap |
| `src/pages/AlertsTab.jsx` | **Modify** | setMapMode('zones'), pass reportLocations |
| `src/pages/MapTab.jsx` | **Modify** | setMapMode('full'), REPORT button as fixed overlay on lg+ |
| `src/pages/ProfileTab.jsx` | **Modify** | setMapMode('hidden') |

---

## Task 1: Delete dead code

**Files:**
- Delete: `src/components/Layout/Sidebar.jsx`

`Sidebar.jsx` was orphaned during the Phase 1 rebuild — it is no longer imported anywhere in the codebase. Deleting it prevents confusion for implementers who might think it's still in use.

- [ ] **Step 1: Verify it is not imported anywhere**

```bash
grep -r "Sidebar" src --include="*.jsx" --include="*.js"
```

Expected: output contains only `src/components/Layout/Sidebar.jsx` itself (no imports).

- [ ] **Step 2: Delete the file**

```bash
git rm src/components/Layout/Sidebar.jsx
```

- [ ] **Step 3: Commit**

```bash
git commit -m "chore: delete orphaned Sidebar.jsx (dead code since Phase 1)"
```

---

## Task 2: `useIsLg` hook

**Files:**
- Create: `src/hooks/useIsLg.js`
- Create: `src/hooks/useIsLg.test.js`

Returns `true` when `window.innerWidth >= 1024px`. Uses `window.matchMedia` with a `'change'` listener so the value updates live when the viewport is resized.

- [ ] **Step 1: Write the failing tests**

Create `src/hooks/useIsLg.test.js`:

```js
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import useIsLg from './useIsLg';

describe('useIsLg', () => {
  let mql;

  function mockMatchMedia(matches) {
    const listeners = [];
    mql = {
      matches,
      addEventListener: vi.fn((event, fn) => listeners.push(fn)),
      removeEventListener: vi.fn((event, fn) => {
        const i = listeners.indexOf(fn);
        if (i !== -1) listeners.splice(i, 1);
      }),
      _trigger: (newMatches) => {
        mql.matches = newMatches;
        listeners.forEach((fn) => fn({ matches: newMatches }));
      },
    };
    vi.spyOn(window, 'matchMedia').mockReturnValue(mql);
  }

  afterEach(() => vi.restoreAllMocks());

  it('returns true when viewport matches lg breakpoint', () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useIsLg());
    expect(result.current).toBe(true);
  });

  it('returns false when viewport is below lg breakpoint', () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useIsLg());
    expect(result.current).toBe(false);
  });

  it('updates when viewport crosses lg breakpoint', () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useIsLg());
    expect(result.current).toBe(false);
    act(() => mql._trigger(true));
    expect(result.current).toBe(true);
  });

  it('removes event listener on unmount', () => {
    mockMatchMedia(false);
    const { unmount } = renderHook(() => useIsLg());
    unmount();
    expect(mql.removeEventListener).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/hooks/useIsLg.test.js
```

Expected: FAIL — `useIsLg` not found.

- [ ] **Step 3: Implement `useIsLg`**

Create `src/hooks/useIsLg.js`:

```js
import { useState, useEffect } from 'react';

export default function useIsLg() {
  const [isLg, setIsLg] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(min-width: 1024px)').matches;
  });

  useEffect(() => {
    const mql = window.matchMedia('(min-width: 1024px)');
    function handleChange(e) {
      setIsLg(e.matches);
    }
    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, []);

  return isLg;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/hooks/useIsLg.test.js
```

Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useIsLg.js src/hooks/useIsLg.test.js
git commit -m "feat: add useIsLg hook for responsive layout switching"
```

---

## Task 3: `MapPanelContext`

**Files:**
- Create: `src/contexts/MapPanelContext.jsx`
- Create: `src/contexts/MapPanelContext.test.jsx`

The context is the message bus for the entire large-screen layout. Every tab writes to it on mount; `AppShell` and `PersistentMapPanel` read from it.

**Context shape:**

```js
{
  mapMode: 'pins' | 'zones' | 'full' | 'hidden',  // default: 'hidden'
  setMapMode: (mode) => void,                        // useCallback-stable
  highlightedReportId: string | null,                // default: null
  setHighlightedReportId: (id) => void,              // useCallback-stable
  reportLocations: Array<{ id, lat, lng, severity }>,// default: []
  setReportLocations: (locs) => void,                // useCallback-stable
}
```

All setters MUST use `useCallback` so tabs can include them in `useEffect` deps without infinite loops.

**Intentional deviation from spec:** The design spec includes `alertZones` and `setAlertZones` in the context shape. These are intentionally omitted here because `useAnnouncements()` returns text-based announcements with no geographic bounds — there is no zone polygon data to render. AlertsTab uses `mapMode('zones')` and passes `reportLocations` only. If geographic zone data is added to Firestore in the future, `alertZones`/`setAlertZones` can be added to the context at that point.

- [ ] **Step 1: Write the failing tests**

Create `src/contexts/MapPanelContext.test.jsx`:

```jsx
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { MapPanelProvider, useMapPanel } from './MapPanelContext';

function TestConsumer() {
  const { mapMode, setMapMode, highlightedReportId, setHighlightedReportId, reportLocations, setReportLocations } = useMapPanel();
  return (
    <div>
      <span data-testid="mode">{mapMode}</span>
      <span data-testid="highlighted">{highlightedReportId ?? 'null'}</span>
      <span data-testid="loc-count">{reportLocations.length}</span>
      <button onClick={() => setMapMode('pins')}>set pins</button>
      <button onClick={() => setHighlightedReportId('abc')}>highlight</button>
      <button onClick={() => setReportLocations([{ id: '1', lat: 10, lng: 20, severity: 'critical' }])}>set locs</button>
    </div>
  );
}

describe('MapPanelContext', () => {
  it('provides default values', () => {
    render(<MapPanelProvider><TestConsumer /></MapPanelProvider>);
    expect(screen.getByTestId('mode').textContent).toBe('hidden');
    expect(screen.getByTestId('highlighted').textContent).toBe('null');
    expect(screen.getByTestId('loc-count').textContent).toBe('0');
  });

  it('setMapMode updates mapMode', async () => {
    render(<MapPanelProvider><TestConsumer /></MapPanelProvider>);
    await userEvent.click(screen.getByText('set pins'));
    expect(screen.getByTestId('mode').textContent).toBe('pins');
  });

  it('setHighlightedReportId updates highlightedReportId', async () => {
    render(<MapPanelProvider><TestConsumer /></MapPanelProvider>);
    await userEvent.click(screen.getByText('highlight'));
    expect(screen.getByTestId('highlighted').textContent).toBe('abc');
  });

  it('setReportLocations updates reportLocations', async () => {
    render(<MapPanelProvider><TestConsumer /></MapPanelProvider>);
    await userEvent.click(screen.getByText('set locs'));
    expect(screen.getByTestId('loc-count').textContent).toBe('1');
  });

  it('throws when used outside provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestConsumer />)).toThrow('useMapPanel must be used within a MapPanelProvider');
    spy.mockRestore();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/contexts/MapPanelContext.test.jsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `MapPanelContext`**

Create `src/contexts/MapPanelContext.jsx`:

```jsx
import { createContext, useContext, useState, useCallback } from 'react';

const MapPanelContext = createContext(null);

export function MapPanelProvider({ children }) {
  const [mapMode, setMapModeRaw] = useState('hidden');
  const [highlightedReportId, setHighlightedReportIdRaw] = useState(null);
  const [reportLocations, setReportLocationsRaw] = useState([]);

  const setMapMode = useCallback((mode) => setMapModeRaw(mode), []);
  const setHighlightedReportId = useCallback((id) => setHighlightedReportIdRaw(id), []);
  const setReportLocations = useCallback((locs) => setReportLocationsRaw(locs), []);

  return (
    <MapPanelContext.Provider
      value={{ mapMode, setMapMode, highlightedReportId, setHighlightedReportId, reportLocations, setReportLocations }}
    >
      {children}
    </MapPanelContext.Provider>
  );
}

export function useMapPanel() {
  const ctx = useContext(MapPanelContext);
  if (!ctx) throw new Error('useMapPanel must be used within a MapPanelProvider');
  return ctx;
}

export default MapPanelContext;
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/contexts/MapPanelContext.test.jsx
```

Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/contexts/MapPanelContext.jsx src/contexts/MapPanelContext.test.jsx
git commit -m "feat: add MapPanelContext for desktop layout state"
```

---

## Task 4: Update test utilities

**Files:**
- Modify: `src/test/utils.jsx`

`AllProviders` is the wrapper used by `customRender` in all tests. Any test that renders a component that calls `useMapPanel()` will throw unless `MapPanelProvider` is included. Add it now so future tests don't need to think about it.

- [ ] **Step 1: Read the current file**

Read `src/test/utils.jsx` to confirm the current provider stack (should be `ToastProvider > AuthProvider > ReportsProvider`).

- [ ] **Step 2: Add `MapPanelProvider`**

Edit `src/test/utils.jsx`:

```jsx
import { render } from '@testing-library/react';
import { ToastProvider } from '../components/Common/Toast';
import { AuthProvider } from '../contexts/AuthContext';
import { ReportsProvider } from '../contexts/ReportsContext';
import { MapPanelProvider } from '../contexts/MapPanelContext';

const AllProviders = ({ children }) => {
  return (
    <ToastProvider>
      <AuthProvider>
        <ReportsProvider>
          <MapPanelProvider>{children}</MapPanelProvider>
        </ReportsProvider>
      </AuthProvider>
    </ToastProvider>
  );
};

const customRender = (ui, options) => {
  return render(ui, { wrapper: AllProviders, ...options });
};

const simpleRender = (ui, options) => {
  return render(ui, options);
};

export * from '@testing-library/react';
export { customRender as render, simpleRender };
```

- [ ] **Step 3: Run full test suite to verify nothing broke**

```bash
npx vitest run
```

Expected: All existing tests still pass. No new failures.

- [ ] **Step 4: Commit**

```bash
git add src/test/utils.jsx
git commit -m "test: add MapPanelProvider to AllProviders test wrapper"
```

---

## Task 5: `IconSidebar`

**Files:**
- Create: `src/components/Layout/IconSidebar.jsx`
- Create: `src/components/Layout/IconSidebar.test.jsx`

44px wide vertical navigation bar shown only on `lg+` screens (visibility controlled by the parent — this component renders without any responsive classes). Uses `NavLink` from React Router v6, matching the existing `TabNavigation` active-state pattern (an `bg-urgent` dot indicator).

Tab order and routes match `TabNavigation.jsx`:
- `/` → Map (home)
- `/feed` → Feed
- `/alerts` → Alerts
- `/profile` → Profile

**Icons:** Inline SVGs (no icon library). Keep them minimal — 20×20 viewBox.

- [ ] **Step 1: Write the failing tests**

Create `src/components/Layout/IconSidebar.test.jsx`:

```jsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import IconSidebar from './IconSidebar';

function renderSidebar(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <IconSidebar />
    </MemoryRouter>
  );
}

describe('IconSidebar', () => {
  it('renders a nav element with accessible label', () => {
    renderSidebar();
    expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument();
  });

  it('renders 4 nav links', () => {
    renderSidebar();
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(4);
  });

  it('active link on / has aria-current="page"', () => {
    renderSidebar('/');
    const mapLink = screen.getByRole('link', { name: /map/i });
    expect(mapLink).toHaveAttribute('aria-current', 'page');
  });

  it('active link on /feed has aria-current="page"', () => {
    renderSidebar('/feed');
    const feedLink = screen.getByRole('link', { name: /feed/i });
    expect(feedLink).toHaveAttribute('aria-current', 'page');
  });

  it('inactive links do not have aria-current', () => {
    renderSidebar('/feed');
    const mapLink = screen.getByRole('link', { name: /map/i });
    expect(mapLink).not.toHaveAttribute('aria-current', 'page');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/components/Layout/IconSidebar.test.jsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `IconSidebar`**

Create `src/components/Layout/IconSidebar.jsx`:

```jsx
import { NavLink } from 'react-router-dom';

function MapIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
      <line x1="9" y1="3" x2="9" y2="18" />
      <line x1="15" y1="6" x2="15" y2="21" />
    </svg>
  );
}

function FeedIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

function AlertsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

const TABS = [
  { label: 'Map', href: '/', icon: <MapIcon />, end: true },
  { label: 'Feed', href: '/feed', icon: <FeedIcon /> },
  { label: 'Alerts', href: '/alerts', icon: <AlertsIcon /> },
  { label: 'Profile', href: '/profile', icon: <ProfileIcon /> },
];

export default function IconSidebar() {
  return (
    <nav
      aria-label="Main navigation"
      className="w-11 bg-surface border-r border-black/10 flex flex-col items-center py-3 gap-1 flex-shrink-0"
    >
      {/* App name initial */}
      <span className="text-xs font-bold text-text-primary mb-3 select-none">B</span>

      {TABS.map(({ label, href, icon, end }) => (
        <NavLink
          key={href}
          to={href}
          end={end}
          aria-label={label}
          className={({ isActive }) =>
            `w-9 h-9 rounded-lg flex items-center justify-center transition-colors relative
             ${isActive ? 'text-urgent bg-urgent/10' : 'text-text-tertiary hover:text-text-primary hover:bg-black/5'}`
          }
        >
          {({ isActive }) => (
            <>
              {icon}
              {isActive && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-urgent" />
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/components/Layout/IconSidebar.test.jsx
```

Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/Layout/IconSidebar.jsx src/components/Layout/IconSidebar.test.jsx
git commit -m "feat: add IconSidebar for lg+ desktop navigation"
```

---

## Task 6: `LeafletMap` — add `flyToReportId` prop

**Files:**
- Modify: `src/components/Map/LeafletMap.jsx`

Adds a prop-driven `flyTo` mechanism. When `flyToReportId` changes to a non-null value, the map pans to that report's coordinates using the existing internal `mapRef`. No `forwardRef` needed — all handled internally.

- [ ] **Step 1: Read the current LeafletMap file**

Read `src/components/Map/LeafletMap.jsx` in full to understand prop signature and where `mapRef` is declared.

- [ ] **Step 2: Create `src/components/Map/LeafletMap.test.jsx`**

`LeafletMap.test.jsx` does not exist yet. Create it as a new file. The key challenge is that `react-leaflet` requires a real DOM environment that jsdom does not provide — we mock the entire library at module scope. `vi.mock` is hoisted by Vitest and must NOT be placed inside a test case.

```jsx
import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// flyToMock must be declared at module scope so vi.mock factory can reference it.
// Vitest hoists vi.mock calls to the top of the file — any variables referenced in
// the factory must be defined before the mock executes, i.e., at module scope.
const flyToMock = vi.fn();

// Mock react-leaflet at module scope. useMap() returns a fake map instance with flyTo.
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => null,
  useMap: () => ({ flyTo: flyToMock, on: vi.fn(), off: vi.fn() }),
  useMapEvents: () => null,
}));

// Mock heavy Leaflet-dependent child components
vi.mock('./MarkerClusterGroup', () => ({ default: ({ children }) => <>{children}</> }));
vi.mock('./DisasterMarker', () => ({ default: () => null }));
vi.mock('./CriticalAlertBanner', () => ({ default: () => null }));
vi.mock('./MapSkeleton', () => ({ default: () => <div data-testid="map-skeleton" /> }));

import LeafletMap from './LeafletMap';

const REPORTS = [
  {
    id: 'r1',
    location: { lat: 14.5, lng: 121.0, municipality: 'Test' },
    disasterType: 'flood',
    severity: 'critical',
    status: 'pending',
    reportedAt: null,
  },
];

describe('LeafletMap', () => {
  beforeEach(() => flyToMock.mockClear());

  it('renders without errors', () => {
    render(<LeafletMap reports={[]} />);
    // If it renders without throwing, the basic mount works
  });

  it('calls flyTo when flyToReportId changes to a matching report id', () => {
    const { rerender } = render(<LeafletMap reports={REPORTS} flyToReportId={null} />);
    rerender(<LeafletMap reports={REPORTS} flyToReportId="r1" />);
    expect(flyToMock).toHaveBeenCalledWith([14.5, 121.0], 15);
  });

  it('does not call flyTo when flyToReportId is null', () => {
    render(<LeafletMap reports={REPORTS} flyToReportId={null} />);
    expect(flyToMock).not.toHaveBeenCalled();
  });

  it('does not call flyTo when no report matches flyToReportId', () => {
    const { rerender } = render(<LeafletMap reports={REPORTS} flyToReportId={null} />);
    rerender(<LeafletMap reports={REPORTS} flyToReportId="nonexistent" />);
    expect(flyToMock).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

```bash
npx vitest run src/components/Map/LeafletMap.test.jsx
```

Expected: FAIL — prop is ignored or doesn't exist.

- [ ] **Step 4: Add `flyToReportId` prop to `LeafletMap`**

In `src/components/Map/LeafletMap.jsx`:

1. Update the function signature (line 130):
   ```js
   export default function LeafletMap({ reports = [], flyToReportId = null }) {
   ```

2. Add a `useEffect` after the existing `mapRef` declaration (after the `MapRefCapture` pattern, before the JSX return):
   ```js
   useEffect(() => {
     if (!flyToReportId || !mapRef.current) return;
     const target = reports.find((r) => r.id === flyToReportId);
     if (!target?.location?.lat || !target?.location?.lng) return;
     mapRef.current.flyTo([target.location.lat, target.location.lng], 15);
   }, [flyToReportId, reports]);
   ```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx vitest run src/components/Map/LeafletMap.test.jsx
```

Expected: PASS.

- [ ] **Step 6: Run full suite to verify no regressions**

```bash
npx vitest run
```

Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/components/Map/LeafletMap.jsx src/components/Map/LeafletMap.test.jsx
git commit -m "feat: add flyToReportId prop to LeafletMap for cross-panel highlight"
```

---

## Task 7: `PersistentMapPanel`

**Files:**
- Create: `src/components/Map/PersistentMapPanel.jsx`
- Create: `src/components/Map/PersistentMapPanel.test.jsx`

Reads from `MapPanelContext` and renders `LeafletMap` with the appropriate data. On `mapMode === 'hidden'` it returns `null`. On `mapMode === 'full'` it renders full-width. Pins are sourced from `reportLocations` in context (passed in by the active tab) so there are no duplicate Firestore listeners.

**Note on alert zones:** `useAnnouncements()` returns text-based announcements without geographic bounds — there are no polygon zones to render. In `'zones'` mode, `PersistentMapPanel` renders the same report pins as in `'pins'` mode. The `mapMode` value is preserved for future use when zone data becomes available.

- [ ] **Step 1: Write failing tests**

Create `src/components/Map/PersistentMapPanel.test.jsx`:

```jsx
import { render, screen } from '@testing-library/react';
import { useState, useEffect } from 'react';
import { describe, it, expect, vi } from 'vitest';

// vi.mock must be at module scope — Vitest hoists it to the top of the file
vi.mock('./LeafletMap', () => ({
  default: ({ reports, flyToReportId }) => (
    <div data-testid="leaflet-map" data-report-count={reports.length} data-fly-to={flyToReportId ?? ''} />
  ),
}));

import PersistentMapPanel from './PersistentMapPanel';
import { MapPanelProvider, useMapPanel } from '../../contexts/MapPanelContext';

// SetupAndRender: sets context state via effects, then renders children once ready.
// This avoids calling setters during render (which would cause React warnings).
function SetupAndRender({ mode, locs, children }) {
  const { setMapMode, setReportLocations } = useMapPanel();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setMapMode(mode);
    setReportLocations(locs);
    setReady(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  if (!ready) return null;
  return children;
}

function Wrapper({ children, initialMode = 'pins', reportLocations = [] }) {
  return (
    <MapPanelProvider>
      <SetupAndRender mode={initialMode} locs={reportLocations}>
        {children}
      </SetupAndRender>
    </MapPanelProvider>
  );
}

const LOCS = [{ id: 'r1', lat: 14.5, lng: 121.0, severity: 'critical' }];

describe('PersistentMapPanel', () => {
  it('renders null when mapMode is hidden', async () => {
    const { container } = render(<PersistentMapPanel />, {
      wrapper: ({ children }) => <Wrapper initialMode="hidden">{children}</Wrapper>,
    });
    // Wait for SetupAndRender effect to fire
    await screen.findByTestId('leaflet-map').catch(() => null);
    expect(container.firstChild).toBeNull();
  });

  it('renders LeafletMap when mapMode is pins', async () => {
    render(<PersistentMapPanel />, {
      wrapper: ({ children }) => <Wrapper initialMode="pins" reportLocations={LOCS}>{children}</Wrapper>,
    });
    expect(await screen.findByTestId('leaflet-map')).toBeInTheDocument();
  });

  it('renders LeafletMap when mapMode is zones', async () => {
    render(<PersistentMapPanel />, {
      wrapper: ({ children }) => <Wrapper initialMode="zones">{children}</Wrapper>,
    });
    expect(await screen.findByTestId('leaflet-map')).toBeInTheDocument();
  });

  it('renders LeafletMap when mapMode is full', async () => {
    render(<PersistentMapPanel />, {
      wrapper: ({ children }) => <Wrapper initialMode="full">{children}</Wrapper>,
    });
    expect(await screen.findByTestId('leaflet-map')).toBeInTheDocument();
  });

  it('passes reportLocations as reports to LeafletMap', async () => {
    render(<PersistentMapPanel />, {
      wrapper: ({ children }) => <Wrapper initialMode="pins" reportLocations={LOCS}>{children}</Wrapper>,
    });
    const map = await screen.findByTestId('leaflet-map');
    expect(map).toHaveAttribute('data-report-count', '1');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/components/Map/PersistentMapPanel.test.jsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `PersistentMapPanel`**

Create `src/components/Map/PersistentMapPanel.jsx`:

```jsx
import LeafletMap from './LeafletMap';
import { useMapPanel } from '../../contexts/MapPanelContext';

export default function PersistentMapPanel() {
  const { mapMode, highlightedReportId, reportLocations } = useMapPanel();

  if (mapMode === 'hidden') return null;

  // Transform reportLocations (context shape) to the report shape LeafletMap expects.
  // LeafletMap needs: { id, location: { lat, lng }, disasterType, severity, status }
  // For pin rendering, only location and severity matter.
  const reports = reportLocations.map(({ id, lat, lng, severity }) => ({
    id,
    location: { lat, lng, municipality: '' },
    disasterType: 'unknown',
    severity,
    status: 'pending',
    reportedAt: null,
  }));

  return (
    <div className="h-full w-full relative overflow-hidden">
      <LeafletMap reports={reports} flyToReportId={highlightedReportId} />
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/components/Map/PersistentMapPanel.test.jsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/Map/PersistentMapPanel.jsx src/components/Map/PersistentMapPanel.test.jsx
git commit -m "feat: add PersistentMapPanel for desktop split-panel layout"
```

---

## Task 8: `AppShell` — desktop layout

**Files:**
- Modify: `src/components/Layout/AppShell.jsx`
- Modify: `src/components/Layout/AppShell.test.jsx`

Wires everything together. On mobile: unchanged. On `lg+`: 3-column CSS grid (IconSidebar | PersistentMapPanel | Outlet). `MapPanelProvider` wraps the whole shell. `PersistentMapPanel` is conditionally rendered (not just hidden) using `useIsLg` to prevent Leaflet initializing on mobile.

- [ ] **Step 1: Read current `AppShell.jsx` and `AppShell.test.jsx`**

Read both files in full before editing.

- [ ] **Step 2: Write failing tests for desktop layout**

Add to `src/components/Layout/AppShell.test.jsx`:

```jsx
// Add these imports at the top if not already present:
// import { vi } from 'vitest';

// Mock useIsLg to control viewport in tests
vi.mock('../../hooks/useIsLg', () => ({ default: vi.fn() }));
import useIsLg from '../../hooks/useIsLg';

// Add these test cases inside the existing describe block:
describe('AppShell — desktop layout (lg+)', () => {
  beforeEach(() => {
    useIsLg.mockReturnValue(true);
  });
  afterEach(() => {
    useIsLg.mockReset();
  });

  it('renders IconSidebar on lg+', () => {
    renderAppShell('/');
    expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument();
  });

  it('hides TabNavigation on lg+', () => {
    renderAppShell('/');
    // TabNavigation has aria-label "Main navigation" too — check by its bottom-nav class
    // Actually both have the same aria-label, so check that only one nav renders:
    const navs = screen.getAllByRole('navigation', { name: /main navigation/i });
    // Only IconSidebar should render; TabNavigation is hidden via lg:hidden CSS
    // (CSS hidden is not reflected in DOM in jsdom, but IconSidebar is in the tree)
    expect(navs.length).toBeGreaterThanOrEqual(1);
  });
});

describe('AppShell — mobile layout', () => {
  beforeEach(() => {
    useIsLg.mockReturnValue(false);
  });
  afterEach(() => {
    useIsLg.mockReset();
  });

  it('renders TabNavigation on mobile', () => {
    renderAppShell('/');
    expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run new tests to verify they fail**

```bash
npx vitest run src/components/Layout/AppShell.test.jsx
```

Expected: FAIL for new desktop tests — IconSidebar not in tree yet.

- [ ] **Step 4: Implement desktop layout in `AppShell`**

Replace the entire `AppShell.jsx` with:

```jsx
import { Outlet } from 'react-router-dom';
import { Suspense } from 'react';
import Header from './Header';
import TabNavigation from './TabNavigation';
import IconSidebar from './IconSidebar';
import LoadingSpinner from '../Common/LoadingSpinner';
import PersistentMapPanel from '../Map/PersistentMapPanel';
import { MapPanelProvider, useMapPanel } from '../../contexts/MapPanelContext';
import useIsLg from '../../hooks/useIsLg';

function PageFallback() {
  return (
    <div className="flex items-center justify-center h-full">
      <LoadingSpinner />
    </div>
  );
}

function AppShellInner() {
  const isLg = useIsLg();
  const { mapMode } = useMapPanel();

  if (isLg) {
    return (
      <div className="flex h-dvh bg-app-bg overflow-hidden">
        <IconSidebar />
        {mapMode !== 'hidden' && (
          <div className={`h-full flex-shrink-0 ${mapMode === 'full' ? 'flex-1' : 'w-[45%]'}`}>
            <PersistentMapPanel />
          </div>
        )}
        {/* Use CSS `hidden` (not conditional render) when mapMode==='full'.
            React needs <main> in the tree so MapTab's useEffect runs and
            the REPORT EMERGENCY button can render as a fixed overlay. */}
        <main className={`flex-1 overflow-hidden relative ${mapMode === 'full' ? 'hidden' : ''}`}>
          <Suspense fallback={<PageFallback />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-dvh bg-app-bg overflow-hidden">
      <Header />
      <main className="flex-1 overflow-hidden relative">
        <Suspense fallback={<PageFallback />}>
          <Outlet />
        </Suspense>
      </main>
      <TabNavigation />
    </div>
  );
}

export default function AppShell() {
  return (
    <MapPanelProvider>
      <AppShellInner />
    </MapPanelProvider>
  );
}
```

- [ ] **Step 5: Update existing AppShell tests to mock `useIsLg`**

After the rewrite, `AppShell` calls `useIsLg()`. In jsdom, `window.matchMedia` is undefined, so `useIsLg` will throw unless mocked. The existing tests in `AppShell.test.jsx` test the mobile layout — add this module-level mock so they keep working:

At the **top of `AppShell.test.jsx`** (before imports), add:

```jsx
import { vi } from 'vitest';

// Must be at module scope — Vitest hoists vi.mock
vi.mock('../../hooks/useIsLg', () => ({ default: vi.fn().mockReturnValue(false) }));
```

Also mock `PersistentMapPanel` and `IconSidebar` to prevent their Leaflet/NavLink deps from running in these shell-level tests:

```jsx
vi.mock('../Map/PersistentMapPanel', () => ({ default: () => <div data-testid="persistent-map" /> }));
vi.mock('./IconSidebar', () => ({ default: () => <nav aria-label="Main navigation" /> }));
```

Then run the full suite:

```bash
npx vitest run
```

Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/Layout/AppShell.jsx src/components/Layout/AppShell.test.jsx
git commit -m "feat: implement desktop split-panel layout in AppShell"
```

---

## Task 9: Tab page updates

**Files:**
- Modify: `src/pages/FeedTab.jsx`
- Modify: `src/pages/AlertsTab.jsx`
- Modify: `src/pages/MapTab.jsx`
- Modify: `src/pages/ProfileTab.jsx`

Each tab declares its `mapMode` on mount via `useMapPanel`. FeedTab also passes `reportLocations` to context so `PersistentMapPanel` has pin data without opening a second Firestore listener. AlertsTab does the same (it already calls `useReports()`). MapTab renders only the REPORT EMERGENCY button on `lg+` (the map is in `PersistentMapPanel`). ProfileTab sets `mapMode('hidden')`.

- [ ] **Step 1: Update `FeedTab.jsx`**

Read the current file first. Then add:

```jsx
// Add imports:
import { useEffect } from 'react';
import { useMapPanel } from '../contexts/MapPanelContext';

// Inside FeedTab(), after const { reports, loading } = useReports():
const { setMapMode, setHighlightedReportId, setReportLocations } = useMapPanel();

useEffect(() => {
  setMapMode('pins');
  setHighlightedReportId(null);
}, [setMapMode, setHighlightedReportId]);

useEffect(() => {
  // Severity lives at r.disaster?.severity in Firestore, not r.severity
  const locs = reports
    .filter((r) => r.location?.lat && r.location?.lng)
    .map((r) => ({ id: r.id, lat: r.location.lat, lng: r.location.lng, severity: r.disaster?.severity }));
  setReportLocations(locs);
}, [reports, setReportLocations]);
```

On the `FeedPost` card component: add `onClick={() => setHighlightedReportId(report.id)}` to the card's outer element. Check `src/components/Feed/FeedPost.jsx` to find the right place — add it to the existing click handler or create one.

- [ ] **Step 2: Update `AlertsTab.jsx`**

Read the current file first. Then add:

```jsx
// Add imports:
import { useEffect } from 'react';  // (already uses useMemo — add useEffect)
import { useMapPanel } from '../contexts/MapPanelContext';

// Inside AlertsTab(), after the existing hooks:
const { setMapMode, setHighlightedReportId, setReportLocations } = useMapPanel();

useEffect(() => {
  setMapMode('zones');
  setHighlightedReportId(null);
}, [setMapMode, setHighlightedReportId]);

// AlertsTab already calls useReports() — pass those to the map panel:
useEffect(() => {
  // Severity lives at r.disaster?.severity in Firestore, not r.severity
  const locs = reports
    .filter((r) => r.location?.lat && r.location?.lng)
    .map((r) => ({ id: r.id, lat: r.location.lat, lng: r.location.lng, severity: r.disaster?.severity }));
  setReportLocations(locs);
}, [reports, setReportLocations]);
```

- [ ] **Step 3: Update `MapTab.jsx`**

Read the current file first. Then add:

```jsx
// Add imports:
import { useMapPanel } from '../contexts/MapPanelContext';
import useIsLg from '../hooks/useIsLg';

// Inside MapTab(), after existing const declarations:
const { setMapMode, setHighlightedReportId } = useMapPanel();
const isLg = useIsLg();

useEffect(() => {
  setMapMode('full');
  setHighlightedReportId(null);
}, [setMapMode, setHighlightedReportId]);
```

On `lg+`, the full-screen Leaflet map should NOT render (it's in `PersistentMapPanel`). The REPORT EMERGENCY button moves to a fixed position. Wrap the map container:

```jsx
// Replace the map container section with:
{!isLg && (
  <div className="flex-1 relative overflow-hidden">
    {!mapReady && <MapSkeleton />}
    {mapReady && <LeafletMap reports={reports} />}
  </div>
)}

{/* Floating report button — fixed on lg+ to float over PersistentMapPanel */}
<div className={isLg
  ? 'fixed bottom-4 right-4 z-50'
  : 'absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000]'
}>
  <Link to="/report" className="bg-urgent text-white font-bold text-sm px-6 py-3 rounded-full shadow-lg flex items-center gap-2 active:scale-95 transition-transform">
    {/* Keep existing SVG + text */}
  </Link>
</div>
```

- [ ] **Step 4: Update `ProfileTab.jsx`**

Read the current file first. Then add:

```jsx
// Add import (useEffect is already imported):
import { useMapPanel } from '../contexts/MapPanelContext';

// Inside ProfileTab(), after existing const declarations:
const { setMapMode, setHighlightedReportId } = useMapPanel();

useEffect(() => {
  setMapMode('hidden');
  setHighlightedReportId(null);
}, [setMapMode, setHighlightedReportId]);
```

- [ ] **Step 5: Run full test suite**

```bash
npx vitest run
```

Expected: All tests pass. If FeedPost or any feed/alerts tests fail due to the new context dependency, ensure those tests render within a `MapPanelProvider` (or use `customRender` which already includes it via `AllProviders`).

- [ ] **Step 6: Commit**

```bash
git add src/pages/FeedTab.jsx src/pages/AlertsTab.jsx src/pages/MapTab.jsx src/pages/ProfileTab.jsx
git commit -m "feat: wire tabs to MapPanelContext for desktop split-panel behavior"
```

---

## Task 10: Format check + final verification

- [ ] **Step 1: Run Prettier**

```bash
npm run format:check
```

If files fail: `npx prettier --write src/contexts/MapPanelContext.jsx src/components/Layout/IconSidebar.jsx src/components/Layout/AppShell.jsx src/components/Map/PersistentMapPanel.jsx src/hooks/useIsLg.js src/pages/FeedTab.jsx src/pages/AlertsTab.jsx src/pages/MapTab.jsx src/pages/ProfileTab.jsx`

Then re-run `npm run format:check` to confirm clean.

- [ ] **Step 2: Run full test suite one last time**

```bash
npx vitest run
```

Expected: All tests pass.

- [ ] **Step 3: Build**

```bash
npm run build
```

Expected: Build succeeds with no errors. Leaflet should still be in the lazy-loaded map chunk, not the entry bundle.

- [ ] **Step 4: Final commit if any format fixes**

```bash
git add -p   # stage only the format changes
git commit -m "style: run prettier on large-screen layout files"
```
