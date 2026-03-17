# Bantayog Alert Rebuild — Phase 1: Foundation

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hash-based tab routing with React Router v6, install the new design system tokens, and build the app shell (header + tab navigation) that all future tabs slot into.

**Architecture:** `createBrowserRouter` replaces `window.location.hash`. A single `AppShell` layout route renders the persistent header and tab bar, with `<Outlet>` for the active page. All page routes are `React.lazy()` chunks. The admin section is a separate lazy chunk behind an `AdminGuard` component.

**Tech Stack:** React 18 · React Router v6 · Vite · Tailwind CSS · Vitest + React Testing Library

**Spec:** `docs/superpowers/specs/2026-03-17-bantayog-rebuild-design.md`

---

## Chunk 1: Dependencies + Design Tokens

### Task 1: Install react-router-dom

**Files:**
- Modify: `package.json` (via npm)

- [ ] **Step 1: Install**

```bash
npm install react-router-dom@^6
```

Expected: `react-router-dom` appears in `package.json` dependencies.

- [ ] **Step 2: Verify**

```bash
node -e "require.resolve('react-router-dom')" && echo OK
```

Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add react-router-dom v6"
```

---

### Task 2: Update Tailwind design tokens

**Files:**
- Modify: `tailwind.config.js`

The rebuild uses a new iOS-influenced palette. We add the new tokens alongside the existing ones so old components don't break during the transition.

- [ ] **Step 1: Write the updated config**

Replace `tailwind.config.js` with:

```js
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // ── New design system tokens (rebuild) ──────────────────
        urgent: '#FF3B30',       // primary action buttons, critical badges
        moderate: '#FF9500',     // moderate severity
        resolved: '#34C759',     // resolved status only
        shell: '#1C1C1E',        // header / app shell
        'app-bg': '#F2F2F7',     // page background
        surface: '#FFFFFF',      // cards, modals
        'text-primary': '#1C1C1E',
        'text-secondary': '#3C3C43',
        'text-tertiary': '#8E8E93',

        // ── Legacy tokens (keep during transition) ───────────────
        primary: '#1B2A41',
        secondary: '#132031',
        accent: '#C62828',
        accentDark: '#8E0000',
        accentSoft: '#FFEBEE',
        successSoft: '#E8F5E9',
        warningSoft: '#FFF3E0',
        primarySoft: '#E3F2FD',
        live: '#00897B',
        success: '#2E7D32',
        warning: '#E65100',
        bg: '#F4F1EC',
        cardBg: '#FFFFFF',
        border: '#D6D0C4',
        borderLight: '#E8E3DA',
        text: '#1B2A41',
        textLight: '#5D6B7E',
        textMuted: '#9CA8B7',
        alertRed: '#C62828',
        alertAmber: '#E65100',
        alertGreen: '#2E7D32',
        dark: {
          bg: '#0F1923',
          card: '#182635',
          elevated: '#1E3044',
          border: '#2A3F55',
          text: '#E1E4E8',
          textLight: '#8B99A8',
          textMuted: '#5A6978',
          accent: '#EF5350',
        },
      },
      fontFamily: {
        // System stack — no font fetch, fastest possible render
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        // Legacy (used by existing components during transition)
        display: ['DM Serif Display', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slide-up 0.3s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
      },
      keyframes: {
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      boxShadow: {
        card: '0 1px 4px rgba(0,0,0,0.08)',
        'card-md': '0 2px 12px rgba(0,0,0,0.08)',
        'card-lg': '0 8px 32px rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 2: Verify Tailwind still builds**

```bash
npm run build 2>&1 | tail -5
```

Expected: build succeeds (may have warnings, no errors).

- [ ] **Step 3: Commit**

```bash
git add tailwind.config.js
git commit -m "feat: add new design system tokens to Tailwind config"
```

---

## Chunk 2: App Shell Components

### Task 3: Build new Header component

**Files:**
- Modify: `src/components/Layout/Header.jsx`
- Test: `src/components/Layout/Header.test.jsx`

The header is a thin dark bar: app name on the left, location on the right. No logic — purely presentational.

- [ ] **Step 1: Write the failing test**

```jsx
// src/components/Layout/Header.test.jsx
import { render, screen } from '@testing-library/react';
import Header from './Header';

describe('Header', () => {
  it('renders app name', () => {
    render(<Header />);
    expect(screen.getByText('BANTAYOG ALERT')).toBeInTheDocument();
  });

  it('renders location when provided', () => {
    render(<Header location="Daet" />);
    expect(screen.getByText('Daet')).toBeInTheDocument();
  });

  it('renders nothing for location when not provided', () => {
    const { container } = render(<Header />);
    // No location text — just the app name
    expect(container.querySelector('[data-testid="header-location"]')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to confirm failure**

```bash
npx vitest run src/components/Layout/Header.test.jsx
```

Expected: FAIL — component renders old markup.

- [ ] **Step 3: Implement**

```jsx
// src/components/Layout/Header.jsx
export default function Header({ location }) {
  return (
    <header className="bg-shell px-4 py-3 flex items-center justify-between flex-shrink-0">
      <span className="text-white text-xs font-bold tracking-widest">
        BANTAYOG ALERT
      </span>
      {location && (
        <span
          data-testid="header-location"
          className="text-text-tertiary text-xs"
        >
          {location}
        </span>
      )}
    </header>
  );
}
```

- [ ] **Step 4: Run test to confirm pass**

```bash
npx vitest run src/components/Layout/Header.test.jsx
```

Expected: 3 passing.

- [ ] **Step 5: Commit**

```bash
git add src/components/Layout/Header.jsx src/components/Layout/Header.test.jsx
git commit -m "feat: rebuild Header component with new design tokens"
```

---

### Task 4: Build new TabNavigation component

**Files:**
- Modify: `src/components/Layout/TabNavigation.jsx`
- Test: `src/components/Layout/TabNavigation.test.jsx`

Tab bar with 4 real `<a>` tags. Active tab determined by matching `href` to current path. Active state: small red dot above the label.

- [ ] **Step 1: Write the failing test**

```jsx
// src/components/Layout/TabNavigation.test.jsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TabNavigation from './TabNavigation';

function renderWithRouter(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <TabNavigation />
    </MemoryRouter>
  );
}

describe('TabNavigation', () => {
  it('renders all 4 tabs', () => {
    renderWithRouter();
    expect(screen.getByText('Map')).toBeInTheDocument();
    expect(screen.getByText('Feed')).toBeInTheDocument();
    expect(screen.getByText('Alerts')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  it('tab links point to correct hrefs', () => {
    renderWithRouter();
    expect(screen.getByRole('link', { name: /map/i })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: /feed/i })).toHaveAttribute('href', '/feed');
    expect(screen.getByRole('link', { name: /alerts/i })).toHaveAttribute('href', '/alerts');
    expect(screen.getByRole('link', { name: /profile/i })).toHaveAttribute('href', '/profile');
  });

  it('marks active tab when on / route', () => {
    renderWithRouter('/');
    const mapLink = screen.getByRole('link', { name: /map/i });
    expect(mapLink).toHaveAttribute('aria-current', 'page');
  });

  it('marks active tab when on /feed route', () => {
    renderWithRouter('/feed');
    const feedLink = screen.getByRole('link', { name: /feed/i });
    expect(feedLink).toHaveAttribute('aria-current', 'page');
  });
});
```

- [ ] **Step 2: Run test to confirm failure**

```bash
npx vitest run src/components/Layout/TabNavigation.test.jsx
```

Expected: FAIL.

- [ ] **Step 3: Implement**

```jsx
// src/components/Layout/TabNavigation.jsx
import { NavLink } from 'react-router-dom';

const TABS = [
  { label: 'Map',     href: '/' },
  { label: 'Feed',    href: '/feed' },
  { label: 'Alerts',  href: '/alerts' },
  { label: 'Profile', href: '/profile' },
];

export default function TabNavigation() {
  return (
    <nav
      aria-label="Main navigation"
      className="bg-white/90 backdrop-blur border-t border-black/10 grid grid-cols-4"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {TABS.map(({ label, href }) => (
        <NavLink
          key={href}
          to={href}
          end={href === '/'}
          aria-label={label}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium
             transition-colors focus-visible:outline-none focus-visible:ring-2
             focus-visible:ring-urgent focus-visible:ring-inset
             ${isActive ? 'text-text-primary' : 'text-text-tertiary'}`
          }
          aria-current={undefined}
          // aria-current is set declaratively below via the render prop
        >
          {({ isActive }) => (
            <>
              {/* Active dot */}
              <span
                aria-hidden="true"
                className={`w-1 h-1 rounded-full transition-colors
                  ${isActive ? 'bg-urgent' : 'bg-transparent'}`}
              />
              <span>{label}</span>
              {/* For test: set aria-current on the link element */}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
```

> **Note on aria-current:** `NavLink` sets `aria-current="page"` automatically when active — no manual handling needed. The test checks for this attribute.

- [ ] **Step 4: Run test to confirm pass**

```bash
npx vitest run src/components/Layout/TabNavigation.test.jsx
```

Expected: 4 passing.

- [ ] **Step 5: Commit**

```bash
git add src/components/Layout/TabNavigation.jsx src/components/Layout/TabNavigation.test.jsx
git commit -m "feat: rebuild TabNavigation with React Router NavLink"
```

---

### Task 5: Build AppShell layout component

**Files:**
- Create: `src/components/Layout/AppShell.jsx`
- Create: `src/components/Layout/AppShell.test.jsx`

`AppShell` is the layout route wrapper. It renders Header + the page content area + TabNavigation. Pages slot in via `<Outlet>`. Desktop shows a sidebar instead of the bottom tab bar (lg+ breakpoint).

- [ ] **Step 1: Write the failing test**

```jsx
// src/components/Layout/AppShell.test.jsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AppShell from './AppShell';

function renderAppShell(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<div>Map content</div>} />
          <Route path="/feed" element={<div>Feed content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe('AppShell', () => {
  it('renders header', () => {
    renderAppShell();
    expect(screen.getByText('BANTAYOG ALERT')).toBeInTheDocument();
  });

  it('renders tab navigation', () => {
    renderAppShell();
    expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument();
  });

  it('renders outlet content', () => {
    renderAppShell('/');
    expect(screen.getByText('Map content')).toBeInTheDocument();
  });

  it('renders feed content on /feed', () => {
    renderAppShell('/feed');
    expect(screen.getByText('Feed content')).toBeInTheDocument();
  });

  it('does not render map content on /feed', () => {
    renderAppShell('/feed');
    expect(screen.queryByText('Map content')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to confirm failure**

```bash
npx vitest run src/components/Layout/AppShell.test.jsx
```

Expected: FAIL — file doesn't exist.

- [ ] **Step 3: Implement**

```jsx
// src/components/Layout/AppShell.jsx
import { Outlet } from 'react-router-dom';
import Header from './Header';
import TabNavigation from './TabNavigation';

export default function AppShell() {
  return (
    <div className="flex flex-col h-dvh bg-app-bg overflow-hidden">
      <Header />
      <main className="flex-1 overflow-hidden relative">
        <Outlet />
      </main>
      <TabNavigation />
    </div>
  );
}
```

- [ ] **Step 4: Run test to confirm pass**

```bash
npx vitest run src/components/Layout/AppShell.test.jsx
```

Expected: 5 passing.

- [ ] **Step 5: Commit**

```bash
git add src/components/Layout/AppShell.jsx src/components/Layout/AppShell.test.jsx
git commit -m "feat: add AppShell layout route component"
```

---

## Chunk 3: Router + Admin Guard

### Task 6: Build AdminGuard component

**Files:**
- Create: `src/components/Admin/AdminGuard.jsx`
- Create: `src/components/Admin/AdminGuard.test.jsx`

`AdminGuard` wraps admin routes. It uses the existing `useAuthContext` hook + `rbac.js` to check admin role. Redirects to `/profile` if not admin. Shows a loading spinner while auth state is resolving.

- [ ] **Step 1: Write the failing test**

```jsx
// src/components/Admin/AdminGuard.test.jsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AdminGuard from './AdminGuard';

// Mock auth context
vi.mock('../../hooks/useAuthContext', () => ({
  default: vi.fn(),
}));

import useAuthContext from '../../hooks/useAuthContext';

function renderWithRouter(authState, path = '/admin') {
  useAuthContext.mockReturnValue(authState);
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<AdminGuard />}>
          <Route path="/admin" element={<div>Admin content</div>} />
        </Route>
        <Route path="/profile" element={<div>Profile page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('AdminGuard', () => {
  it('shows spinner while auth is loading', () => {
    renderWithRouter({ loading: true, userProfile: null });
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('redirects to /profile when user is not admin', () => {
    renderWithRouter({ loading: false, userProfile: { role: 'user' } });
    expect(screen.getByText('Profile page')).toBeInTheDocument();
    expect(screen.queryByText('Admin content')).not.toBeInTheDocument();
  });

  it('redirects to /profile when user is not logged in', () => {
    renderWithRouter({ loading: false, userProfile: null });
    expect(screen.getByText('Profile page')).toBeInTheDocument();
  });

  it('renders admin content for admin_* role', () => {
    renderWithRouter({ loading: false, userProfile: { role: 'admin_daet' } });
    expect(screen.getByText('Admin content')).toBeInTheDocument();
  });

  it('renders admin content for superadmin_provincial role', () => {
    renderWithRouter({ loading: false, userProfile: { role: 'superadmin_provincial' } });
    expect(screen.getByText('Admin content')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to confirm failure**

```bash
npx vitest run src/components/Admin/AdminGuard.test.jsx
```

Expected: FAIL — file doesn't exist.

- [ ] **Step 3: Implement**

```jsx
// src/components/Admin/AdminGuard.jsx
import { Navigate, Outlet } from 'react-router-dom';
import useAuthContext from '../../hooks/useAuthContext';
import LoadingSpinner from '../Common/LoadingSpinner';
// isAdmin is added to rbac.js in Step 4 below if it doesn't exist
import { isAdmin } from '../../utils/rbac';

export default function AdminGuard() {
  const { loading, userProfile } = useAuthContext();

  if (loading) {
    return (
      // role="status" makes the spinner discoverable by screen readers
      // and by the AdminGuard test's getByRole('status') query
      <div className="flex items-center justify-center h-full" role="status">
        <LoadingSpinner />
      </div>
    );
  }

  if (!userProfile || !isAdmin(userProfile.role)) {
    return <Navigate to="/profile" replace />;
  }

  return <Outlet />;
}

- [ ] **Step 4: Verify `isAdmin` exists in rbac.js**

```bash
grep -n "isAdmin\|admin_\|superadmin" src/utils/rbac.js | head -20
```

If `isAdmin` doesn't exist by that name, add a thin wrapper:

```js
// Add to src/utils/rbac.js
export function isAdmin(role) {
  if (!role) return false;
  return role.startsWith('admin_') || role === 'superadmin_provincial';
}
```

- [ ] **Step 5: Run test to confirm pass**

```bash
npx vitest run src/components/Admin/AdminGuard.test.jsx
```

Expected: 5 passing.

- [ ] **Step 6: Commit**

```bash
git add src/components/Admin/AdminGuard.jsx src/components/Admin/AdminGuard.test.jsx src/utils/rbac.js
git commit -m "feat: add AdminGuard route protection component"
```

---

### Task 7: Rebuild App.jsx with React Router v6

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/main.jsx` (add `RouterProvider` if needed)

This is the central change. Replace the hash-routing + CSS visibility system with `createBrowserRouter`. All page routes are `React.lazy()`. The admin section is a separate lazy chunk via dynamic `import()`.

- [ ] **Step 1: Write smoke test**

```jsx
// src/App.test.jsx
import { render, screen } from '@testing-library/react';
import App from './App';

// Mock all lazy-loaded pages to avoid loading full components
vi.mock('./pages/MapTab', () => ({ default: () => <div>Map</div> }));
vi.mock('./pages/FeedTab', () => ({ default: () => <div>Feed</div> }));
vi.mock('./pages/AlertsTab', () => ({ default: () => <div>Alerts</div> }));
vi.mock('./pages/ProfileTab', () => ({ default: () => <div>Profile</div> }));
vi.mock('./components/Admin/AdminShell', () => ({ default: () => <div>Admin</div> }));

describe('App', () => {
  it('renders without crashing', async () => {
    render(<App />);
    expect(await screen.findByText('BANTAYOG ALERT')).toBeInTheDocument();
  });

  it('renders tab navigation', async () => {
    render(<App />);
    expect(await screen.findByRole('navigation', { name: /main navigation/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to confirm failure**

```bash
npx vitest run src/App.test.jsx
```

Expected: FAIL or partial pass with old routing.

- [ ] **Step 3: Implement new App.jsx**

```jsx
// src/App.jsx
import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ReportsProvider } from './contexts/ReportsContext';
import { ToastProvider } from './components/Common/Toast';
import { ThemeProvider } from './contexts/ThemeContext';
import ErrorBoundary from './components/Common/ErrorBoundary';
import LoadingSpinner from './components/Common/LoadingSpinner';
import AppShell from './components/Layout/AppShell';
import AdminGuard from './components/Admin/AdminGuard';

// Citizen pages — lazy loaded per route
const MapTab     = lazy(() => import('./pages/MapTab'));
const FeedTab    = lazy(() => import('./pages/FeedTab'));
const AlertsTab  = lazy(() => import('./pages/AlertsTab'));
const ProfileTab = lazy(() => import('./pages/ProfileTab'));

// Admin — separate lazy chunk (zero bytes for citizens)
const AdminShell = lazy(() => import('./components/Admin/AdminShell'));

function PageFallback() {
  return (
    <div className="flex items-center justify-center h-full">
      <LoadingSpinner />
    </div>
  );
}

const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { index: true,     element: <Suspense fallback={<PageFallback />}><MapTab /></Suspense> },
      { path: 'feed',    element: <Suspense fallback={<PageFallback />}><FeedTab /></Suspense> },
      { path: 'alerts',  element: <Suspense fallback={<PageFallback />}><AlertsTab /></Suspense> },
      { path: 'profile', element: <Suspense fallback={<PageFallback />}><ProfileTab /></Suspense> },
      {
        // AdminGuard is a layout route — it renders <Outlet> for its children
        path: 'admin',
        element: <AdminGuard />,
        children: [
          {
            path: '*',
            element: <Suspense fallback={<PageFallback />}><AdminShell /></Suspense>,
          },
        ],
      },
    ],
  },
]);

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <ReportsProvider>
              <RouterProvider router={router} />
            </ReportsProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
```

- [ ] **Step 4: Create stub pages that don't exist yet**

`AlertsTab` and `AdminShell` don't exist. Create minimal stubs so the router doesn't crash:

```jsx
// src/pages/AlertsTab.jsx
export default function AlertsTab() {
  return <div className="p-4 text-text-secondary">Alerts — coming soon</div>;
}
```

```jsx
// src/components/Admin/AdminShell.jsx
export default function AdminShell() {
  return <div className="p-4 text-text-secondary">Admin — coming soon</div>;
}
```

- [ ] **Step 5: Update main.jsx**

`main.jsx` should render `<App />` directly. Remove any `BrowserRouter` wrapper if present (App now owns the router):

```jsx
// src/main.jsx — verify it looks like this (adjust if needed):
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './App.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 6: Run smoke tests**

```bash
npx vitest run src/App.test.jsx
```

Expected: 2 passing.

- [ ] **Step 7: Run full test suite to check for regressions**

```bash
npx vitest run 2>&1 | tail -20
```

Expected: existing tests pass. Some tests that rely on the old hash routing may need minor updates — fix them now if needed.

- [ ] **Step 8: Manual smoke test in browser**

```bash
npm run dev
```

Open `http://localhost:5173`. Verify:
- App loads
- Clicking Map/Feed/Alerts/Profile tabs changes the URL (not the hash)
- Browser back button works
- Each tab shows its content (or "coming soon" stub)

- [ ] **Step 9: Commit**

```bash
git add src/App.jsx src/main.jsx src/App.test.jsx src/pages/AlertsTab.jsx src/components/Admin/AdminShell.jsx
git commit -m "feat: replace hash routing with React Router v6

All tabs now use real URLs (/feed, /alerts, /profile). Leaflet
deferred to / route only. Admin section is a separate lazy chunk."
```

---

## Chunk 4: Verification

### Task 8: Verify bundle isolation

Confirm that navigating to `/feed` does not load the admin chunk.

- [ ] **Step 1: Build for production**

```bash
npm run build 2>&1 | grep -E "dist|chunk|kB"
```

Expected output includes separate chunks: `vendor-react`, `vendor-map`, `vendor-firebase`, plus individual page chunks.

- [ ] **Step 2: Verify admin chunk is separate**

```bash
ls dist/assets/ | grep -i admin
```

Expected: At least one file containing "admin" — this is the lazy chunk.

- [ ] **Step 3: Confirm Leaflet is NOT in the initial bundle**

```bash
ls dist/assets/ | grep -i map
```

Expected: Leaflet/map code is in a separate `vendor-map-*.js` chunk, not in the main entry.

- [ ] **Step 4: Run Lighthouse (optional but recommended)**

```bash
npm run build && npx serve dist &
sleep 2
npx lighthouse http://localhost:3000 --output=json --output-path=.tmp/lighthouse-phase1.json --chrome-flags="--headless" 2>&1 | tail -5
```

Note the LCP score. It should already be lower than the current 4.5s baseline since Leaflet is no longer in the initial bundle.

- [ ] **Step 5: Commit any remaining changes**

```bash
git add -A
git status
# Only commit if there are meaningful uncommitted changes
```

---

## Phase 1 Complete

At this point:
- React Router v6 is installed and routing works
- New design tokens are in Tailwind
- `AppShell` renders header + tabs
- All 4 citizen tabs lazy-load on route visit
- Admin section is a separate lazy chunk, auth-gated
- Browser back/forward and bookmarkable URLs work

**Next:** `docs/superpowers/plans/2026-03-17-rebuild-phase-2-citizen.md` — Map, Feed, Alerts tab, Report flow.
