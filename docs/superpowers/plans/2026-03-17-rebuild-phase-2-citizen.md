# Bantayog Alert Rebuild — Phase 2: Citizen Features

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the four citizen-facing tabs — Map (Leaflet async), Feed (Facebook-inspired cards), Alerts, and the 3-step Report flow — using the new design system tokens from Phase 1.

**Architecture:** Each tab is a `React.lazy()` chunk mounted only when its route is active. Leaflet loads asynchronously via `import()` inside a `useEffect`, so the map skeleton renders immediately without blocking the initial paint. The Feed uses a flat `FeedPost` card component with a `PhotoGrid` sub-component handling 0/1/2/3+ photo layouts. The Report flow is 3 full-screen steps managed by local state — no modals, no nested routes.

**Tech Stack:** React 18 · React Router v6 · Vite · Tailwind CSS · Leaflet/react-leaflet · Vitest + React Testing Library

**Spec:** `docs/superpowers/specs/2026-03-17-bantayog-rebuild-design.md`

**Prerequisites:** Phase 1 complete (React Router v6 installed, design tokens in Tailwind, AppShell live).

---

## Chunk 1: Map Tab

### Task 1: Rebuild MapTab with async Leaflet loading

**Files:**
- Modify: `src/pages/MapTab.jsx`
- Modify: `src/components/Map/LeafletMap.jsx` (minimal — wrap in async init)
- Create: `src/components/Map/MapSkeleton.jsx`
- Create: `src/components/Map/CriticalAlertBanner.jsx`
- Create: `src/components/Map/CriticalAlertBanner.test.jsx`

The map tab renders in two phases:
1. Immediate: header, `CriticalAlertBanner`, map skeleton, floating "REPORT EMERGENCY" button
2. ~300ms later: Leaflet map replaces skeleton

The existing `LeafletMap.jsx` imports Leaflet at the top of the file — that's why it contributes to initial parse. The fix: wrap the page so `LeafletMap` is rendered only after a dynamic import confirms Leaflet is available. Because the route itself is lazy-loaded, Leaflet only parses when `/` is visited.

- [ ] **Step 1: Write the failing test for CriticalAlertBanner**

```jsx
// src/components/Map/CriticalAlertBanner.test.jsx
import { render, screen } from '@testing-library/react';
import CriticalAlertBanner from './CriticalAlertBanner';

describe('CriticalAlertBanner', () => {
  it('renders nothing when no critical reports', () => {
    const { container } = render(<CriticalAlertBanner reports={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when only resolved critical reports', () => {
    const reports = [{
      id: '1',
      disaster: { type: 'Flood', severity: 'critical' },
      location: { municipality: 'Daet' },
      verification: { status: 'resolved' },
    }];
    const { container } = render(<CriticalAlertBanner reports={reports} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders banner for unresolved critical report', () => {
    const reports = [{
      id: '1',
      disaster: { type: 'Flood', severity: 'critical' },
      location: { municipality: 'Daet' },
      verification: { status: 'verified' },
    }];
    render(<CriticalAlertBanner reports={reports} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Flood/i)).toBeInTheDocument();
    expect(screen.getByText(/Daet/i)).toBeInTheDocument();
  });

  it('shows the most recent critical report', () => {
    const reports = [
      {
        id: '1',
        disaster: { type: 'Flood', severity: 'critical' },
        location: { municipality: 'Daet' },
        verification: { status: 'verified' },
        timestamp: { seconds: 1000 },
      },
      {
        id: '2',
        disaster: { type: 'Landslide', severity: 'critical' },
        location: { municipality: 'Labo' },
        verification: { status: 'pending' },
        timestamp: { seconds: 2000 },
      },
    ];
    render(<CriticalAlertBanner reports={reports} />);
    expect(screen.getByText(/Landslide/i)).toBeInTheDocument();
    expect(screen.getByText(/Labo/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to confirm failure**

```bash
npx vitest run src/components/Map/CriticalAlertBanner.test.jsx
```

Expected: FAIL — file doesn't exist.

- [ ] **Step 3: Implement CriticalAlertBanner**

```jsx
// src/components/Map/CriticalAlertBanner.jsx
export default function CriticalAlertBanner({ reports = [] }) {
  const criticalActive = reports
    .filter(
      (r) =>
        r.disaster?.severity === 'critical' &&
        r.verification?.status !== 'resolved'
    )
    .sort((a, b) => (b.timestamp?.seconds ?? 0) - (a.timestamp?.seconds ?? 0));

  if (criticalActive.length === 0) return null;

  const top = criticalActive[0];
  const type = top.disaster?.type ?? 'Emergency';
  const municipality = top.location?.municipality ?? 'Unknown location';

  return (
    <div
      role="alert"
      className="bg-urgent text-white text-xs font-semibold px-4 py-2.5 flex items-center gap-2 flex-shrink-0"
    >
      {/* Pulse dot */}
      <span className="relative flex h-2 w-2 flex-shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
      </span>
      <span>
        Critical alert: {type} — {municipality}
      </span>
    </div>
  );
}
```

- [ ] **Step 4: Run test to confirm pass**

```bash
npx vitest run src/components/Map/CriticalAlertBanner.test.jsx
```

Expected: 4 passing.

- [ ] **Step 5: Implement MapSkeleton**

```jsx
// src/components/Map/MapSkeleton.jsx
export default function MapSkeleton() {
  return (
    <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
      <span className="text-xs text-text-tertiary">Loading map…</span>
    </div>
  );
}
```

No test needed — this is pure visual.

- [ ] **Step 6: Rebuild MapTab page**

```jsx
// src/pages/MapTab.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useReports } from '../hooks/useReports';
import { useGeolocation } from '../hooks/useGeolocation';
import CriticalAlertBanner from '../components/Map/CriticalAlertBanner';
import MapSkeleton from '../components/Map/MapSkeleton';

// LeafletMap is only imported once the page chunk is active.
// Vite splits it into vendor-map chunk automatically because react-leaflet
// imports leaflet, which is a large dependency.
import LeafletMap from '../components/Map/LeafletMap';

export default function MapTab() {
  const [mapReady, setMapReady] = useState(false);
  const { reports } = useReports();
  const { municipality } = useGeolocation();

  useEffect(() => {
    // Small delay to let the skeleton paint before the heavier map render begins
    const id = setTimeout(() => setMapReady(true), 50);
    return () => clearTimeout(id);
  }, []);

  return (
    <div className="flex flex-col h-full relative">
      <CriticalAlertBanner reports={reports} />

      {/* Map container */}
      <div className="flex-1 relative overflow-hidden">
        {!mapReady && <MapSkeleton />}
        {mapReady && <LeafletMap reports={reports} municipality={municipality} />}
      </div>

      {/* Floating report button */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000]">
        <Link
          to="/report"
          className="bg-urgent text-white font-bold text-sm px-6 py-3 rounded-full shadow-lg
                     flex items-center gap-2 active:scale-95 transition-transform"
        >
          {/* Exclamation triangle SVG */}
          <svg
            width="16" height="16" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          REPORT EMERGENCY
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add src/pages/MapTab.jsx src/components/Map/MapSkeleton.jsx \
        src/components/Map/CriticalAlertBanner.jsx \
        src/components/Map/CriticalAlertBanner.test.jsx
git commit -m "feat: rebuild MapTab with async Leaflet loading and critical alert banner"
```

---

## Chunk 2: Feed Tab

### Task 2: Build PhotoGrid component

**Files:**
- Create: `src/components/Feed/PhotoGrid.jsx`
- Create: `src/components/Feed/PhotoGrid.test.jsx`

`PhotoGrid` renders photos in 4 different layouts depending on count. This is the most testable unit in the Feed — test it in isolation.

- [ ] **Step 1: Write the failing test**

```jsx
// src/components/Feed/PhotoGrid.test.jsx
import { render, screen } from '@testing-library/react';
import PhotoGrid from './PhotoGrid';

const PHOTOS = [
  'https://example.com/1.jpg',
  'https://example.com/2.jpg',
  'https://example.com/3.jpg',
  'https://example.com/4.jpg',
];

describe('PhotoGrid', () => {
  it('renders nothing when no photos', () => {
    const { container } = render(<PhotoGrid photos={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders single photo at full width', () => {
    render(<PhotoGrid photos={[PHOTOS[0]]} />);
    const imgs = screen.getAllByRole('img');
    expect(imgs).toHaveLength(1);
    expect(imgs[0]).toHaveAttribute('src', PHOTOS[0]);
  });

  it('renders 2 photos side by side', () => {
    render(<PhotoGrid photos={PHOTOS.slice(0, 2)} />);
    const imgs = screen.getAllByRole('img');
    expect(imgs).toHaveLength(2);
  });

  it('renders 3 photos in 2+1 grid', () => {
    render(<PhotoGrid photos={PHOTOS.slice(0, 3)} />);
    const imgs = screen.getAllByRole('img');
    expect(imgs).toHaveLength(3);
  });

  it('renders 4 photos: first 3 visible + "+N" overlay on last visible', () => {
    render(<PhotoGrid photos={PHOTOS} />);
    // Only 3 img elements rendered (the 4th is covered by the +N overlay)
    const imgs = screen.getAllByRole('img');
    expect(imgs).toHaveLength(3);
    expect(screen.getByText('+1')).toBeInTheDocument();
  });

  it('calls onPhotoPress with index when a photo is tapped', async () => {
    const onPhotoPress = vi.fn();
    render(<PhotoGrid photos={PHOTOS.slice(0, 2)} onPhotoPress={onPhotoPress} />);
    const imgs = screen.getAllByRole('img');
    imgs[0].click();
    expect(onPhotoPress).toHaveBeenCalledWith(0);
  });
});
```

- [ ] **Step 2: Run test to confirm failure**

```bash
npx vitest run src/components/Feed/PhotoGrid.test.jsx
```

Expected: FAIL — file doesn't exist.

- [ ] **Step 3: Implement**

```jsx
// src/components/Feed/PhotoGrid.jsx
const MAX_VISIBLE = 3;

export default function PhotoGrid({ photos = [], onPhotoPress }) {
  if (photos.length === 0) return null;

  const visible = photos.slice(0, MAX_VISIBLE);
  const overflow = photos.length - MAX_VISIBLE;
  const count = photos.length;

  function handleClick(index) {
    onPhotoPress?.(index);
  }

  // 1 photo — full width
  if (count === 1) {
    return (
      <button
        type="button"
        className="w-full block"
        onClick={() => handleClick(0)}
        aria-label="View photo"
      >
        <img
          src={photos[0]}
          alt="Report photo"
          className="w-full h-40 object-cover"
        />
      </button>
    );
  }

  // 2 photos — side by side
  if (count === 2) {
    return (
      <div className="grid grid-cols-2 gap-0.5">
        {photos.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => handleClick(i)}
            aria-label={`View photo ${i + 1}`}
          >
            <img src={src} alt={`Report photo ${i + 1}`} className="w-full h-28 object-cover" />
          </button>
        ))}
      </div>
    );
  }

  // 3+ photos — 2+1 grid: first photo full width, then 2 side-by-side
  // with optional +N overlay on the last visible cell
  return (
    <div className="flex flex-col gap-0.5">
      {/* Top: first photo full width */}
      <button type="button" onClick={() => handleClick(0)} aria-label="View photo 1">
        <img src={visible[0]} alt="Report photo 1" className="w-full h-40 object-cover" />
      </button>
      {/* Bottom: remaining visible photos */}
      <div className="grid grid-cols-2 gap-0.5">
        {visible.slice(1).map((src, i) => {
          const idx = i + 1; // index in visible array
          const isLast = idx === visible.length - 1 && overflow > 0;
          return (
            <button
              key={src}
              type="button"
              className="relative"
              onClick={() => handleClick(idx)}
              aria-label={`View photo ${idx + 1}`}
            >
              <img src={src} alt={`Report photo ${idx + 1}`} className="w-full h-28 object-cover" />
              {isLast && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">+{overflow}</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to confirm pass**

```bash
npx vitest run src/components/Feed/PhotoGrid.test.jsx
```

Expected: 6 passing.

- [ ] **Step 5: Commit**

```bash
git add src/components/Feed/PhotoGrid.jsx src/components/Feed/PhotoGrid.test.jsx
git commit -m "feat: add PhotoGrid component (0/1/2/3+ photo layouts)"
```

---

### Task 3: Build FeedPost card component

**Files:**
- Create: `src/components/Feed/FeedPost.jsx`
- Create: `src/components/Feed/FeedPost.test.jsx`

The card anatomy: 3px severity strip · header row · description · PhotoGrid · engagement bar. Resolved cards show a green strip + "Resolved" badge and a "View resolution →" link.

- [ ] **Step 1: Write the failing test**

```jsx
// src/components/Feed/FeedPost.test.jsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import FeedPost from './FeedPost';

const baseReport = {
  id: 'r1',
  disaster: {
    type: 'Flood',
    severity: 'critical',
    description: 'Water rising near the bridge.',
  },
  location: { barangay: 'Brgy. Camambugan', municipality: 'Daet' },
  verification: { status: 'verified' },
  timestamp: { seconds: Math.floor(Date.now() / 1000) - 60 },
  photoUrls: [],
  upvotes: [],
  reporter: { name: 'Juan dela Cruz' },
};

function renderPost(report = baseReport) {
  return render(
    <MemoryRouter>
      <FeedPost report={report} />
    </MemoryRouter>
  );
}

describe('FeedPost', () => {
  it('renders disaster type', () => {
    renderPost();
    expect(screen.getByText('Flood')).toBeInTheDocument();
  });

  it('renders location', () => {
    renderPost();
    expect(screen.getByText(/Brgy. Camambugan/i)).toBeInTheDocument();
  });

  it('renders description', () => {
    renderPost();
    expect(screen.getByText(/Water rising/i)).toBeInTheDocument();
  });

  it('renders "View full report" link', () => {
    renderPost();
    const link = screen.getByRole('link', { name: /view full report/i });
    expect(link).toHaveAttribute('href', '/report/r1');
  });

  it('shows resolved badge when status is resolved', () => {
    const resolved = {
      ...baseReport,
      verification: {
        status: 'resolved',
        resolution: {
          resolvedAt: { seconds: Date.now() / 1000 },
          resolvedBy: 'MDRRMO',
        },
      },
    };
    renderPost(resolved);
    expect(screen.getByText('Resolved')).toBeInTheDocument();
  });

  it('shows "View resolution" link when resolved', () => {
    const resolved = {
      ...baseReport,
      verification: {
        status: 'resolved',
        resolution: { resolvedAt: { seconds: Date.now() / 1000 } },
      },
    };
    renderPost(resolved);
    expect(screen.getByRole('button', { name: /view resolution/i })).toBeInTheDocument();
  });

  it('does not show resolved content for unresolved report', () => {
    renderPost();
    expect(screen.queryByText('Resolved')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to confirm failure**

```bash
npx vitest run src/components/Feed/FeedPost.test.jsx
```

Expected: FAIL — file doesn't exist.

- [ ] **Step 3: Implement**

```jsx
// src/components/Feed/FeedPost.jsx
import { Link } from 'react-router-dom';
import PhotoGrid from './PhotoGrid';

const SEVERITY_STRIP = {
  critical: 'bg-urgent',
  moderate: 'bg-moderate',
  minor: 'bg-moderate',
  resolved: 'bg-resolved',
  default: 'bg-text-tertiary',
};

const SEVERITY_BADGE = {
  critical: 'bg-urgent/10 text-urgent',
  moderate: 'bg-moderate/10 text-moderate',
  minor: 'bg-moderate/10 text-moderate',
};

const STATUS_BADGE = {
  verified: 'bg-shell/10 text-text-secondary',
  pending: 'bg-text-tertiary/10 text-text-tertiary',
  resolved: 'bg-resolved/10 text-resolved',
};

function formatTimeAgo(seconds) {
  if (!seconds) return '';
  const diff = Math.floor(Date.now() / 1000) - seconds;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function FeedPost({ report, onViewResolution }) {
  const {
    id,
    disaster = {},
    location = {},
    verification = {},
    timestamp,
    photoUrls = [],
    upvotes = [],
    reporter = {},
  } = report;

  const isResolved = verification.status === 'resolved';
  const severity = isResolved ? 'resolved' : disaster.severity ?? 'default';
  const stripColor = SEVERITY_STRIP[severity] ?? SEVERITY_STRIP.default;
  const timeAgo = formatTimeAgo(timestamp?.seconds);

  return (
    <article className="bg-surface shadow-card overflow-hidden">
      {/* 3px severity strip */}
      <div className={`h-1 ${stripColor}`} aria-hidden="true" />

      <div className="px-4 pt-3 pb-2">
        {/* Header row */}
        <div className="flex items-start gap-3 mb-2">
          {/* Type icon circle */}
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0
              ${SEVERITY_BADGE[disaster.severity ?? 'minor'] ?? 'bg-text-tertiary/10 text-text-tertiary'}`}
          >
            {/* Alert triangle */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
              <span className="font-bold text-sm text-text-primary">{disaster.type}</span>
              {disaster.severity && !isResolved && (
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded capitalize
                  ${SEVERITY_BADGE[disaster.severity] ?? ''}`}>
                  {disaster.severity}
                </span>
              )}
              {isResolved && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-resolved/10 text-resolved">
                  Resolved
                </span>
              )}
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded capitalize
                ${STATUS_BADGE[verification.status] ?? ''}`}>
                {verification.status}
              </span>
            </div>
            <p className="text-xs text-text-tertiary">
              {[location.barangay, location.municipality].filter(Boolean).join(', ')} · {timeAgo}
            </p>
          </div>
        </div>

        {/* Description */}
        {disaster.description && (
          <p className="text-sm text-text-secondary leading-relaxed mb-3 line-clamp-3">
            {disaster.description}
          </p>
        )}
      </div>

      {/* Photo grid — full bleed */}
      {photoUrls.length > 0 && <PhotoGrid photos={photoUrls} />}

      {/* Engagement bar */}
      <div className="px-4 py-2.5 flex items-center gap-4 border-t border-black/5">
        {/* Upvote */}
        <div className="flex items-center gap-1.5 text-text-tertiary">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z"/>
            <path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/>
          </svg>
          <span className="text-xs">{upvotes.length}</span>
        </div>

        {/* Share */}
        <div className="flex items-center gap-1.5 text-text-tertiary">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/>
            <circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
          <span className="text-xs">Share</span>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Resolved: view resolution */}
        {isResolved && (
          <button
            type="button"
            onClick={() => onViewResolution?.(report)}
            className="text-xs text-resolved font-semibold"
            aria-label="View resolution"
          >
            View resolution →
          </button>
        )}

        {/* View full report */}
        <Link
          to={`/report/${id}`}
          className="text-xs text-text-tertiary font-medium"
          aria-label="View full report"
        >
          View full report →
        </Link>
      </div>
    </article>
  );
}
```

- [ ] **Step 4: Run test to confirm pass**

```bash
npx vitest run src/components/Feed/FeedPost.test.jsx
```

Expected: 7 passing.

- [ ] **Step 5: Commit**

```bash
git add src/components/Feed/FeedPost.jsx src/components/Feed/FeedPost.test.jsx
git commit -m "feat: add FeedPost card with severity strip, photo grid, engagement bar"
```

---

### Task 4: Build FeedTab page

**Files:**
- Modify: `src/pages/FeedTab.jsx`

`FeedTab` is a scrollable list of `FeedPost` cards. It uses the existing `useReports` hook (already handles pagination and real-time updates).

- [ ] **Step 1: Implement**

No TDD needed for the page wrapper — the logic lives in `FeedPost` and `useReports` which are already tested. This is glue code.

```jsx
// src/pages/FeedTab.jsx
import { useState } from 'react';
import { useReports } from '../hooks/useReports';
import FeedPost from '../components/Feed/FeedPost';
import ResolutionModal from '../components/Feed/ResolutionModal';

export default function FeedTab() {
  const { reports, loading } = useReports();
  const [resolutionReport, setResolutionReport] = useState(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-text-tertiary text-sm">
        Loading…
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-text-tertiary">
        <p className="text-sm font-medium">No reports yet</p>
        <p className="text-xs">Be the first to report an emergency.</p>
      </div>
    );
  }

  return (
    <>
      <div className="h-full overflow-y-auto bg-app-bg">
        <div className="flex flex-col gap-2 py-2">
          {reports.map((report) => (
            <FeedPost
              key={report.id}
              report={report}
              onViewResolution={setResolutionReport}
            />
          ))}
        </div>
      </div>

      {resolutionReport && (
        <ResolutionModal
          report={resolutionReport}
          onClose={() => setResolutionReport(null)}
        />
      )}
    </>
  );
}
```

- [ ] **Step 2: Create ResolutionModal stub**

```jsx
// src/components/Feed/ResolutionModal.jsx
export default function ResolutionModal({ report, onClose }) {
  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Resolution details"
    >
      <div className="bg-surface w-full max-w-lg rounded-t-2xl p-6 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-base text-text-primary">Resolution details</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-text-tertiary text-sm"
            aria-label="Close"
          >
            Close
          </button>
        </div>
        <p className="text-sm text-text-secondary">
          {report.verification?.resolution?.notes ?? 'No resolution notes provided.'}
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/FeedTab.jsx src/components/Feed/ResolutionModal.jsx
git commit -m "feat: rebuild FeedTab with FeedPost cards and ResolutionModal"
```

---

## Chunk 3: Alerts Tab

### Task 5: Build Alerts tab components

**Files:**
- Modify: `src/pages/AlertsTab.jsx` (replace stub from Phase 1)
- Create: `src/components/Alerts/SuspensionCard.jsx`
- Create: `src/components/Alerts/SuspensionCard.test.jsx`
- Create: `src/components/Alerts/WeatherCard.jsx`
- Create: `src/components/Alerts/NearestReportCard.jsx`
- Create: `src/components/Alerts/NearestReportCard.test.jsx`

- [ ] **Step 1: Write the failing test for SuspensionCard**

```jsx
// src/components/Alerts/SuspensionCard.test.jsx
import { render, screen } from '@testing-library/react';
import SuspensionCard from './SuspensionCard';

const activeSuspension = {
  active: true,
  type: 'Class Suspension',
  issuedBy: 'DepEd · Camarines Norte',
  scope: 'All levels',
  issuedAt: { seconds: Math.floor(Date.now() / 1000) - 3600 },
};

const inactiveSuspension = { ...activeSuspension, active: false };

describe('SuspensionCard', () => {
  it('renders nothing when no suspensions', () => {
    const { container } = render(<SuspensionCard suspensions={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when all suspensions are inactive', () => {
    const { container } = render(<SuspensionCard suspensions={[inactiveSuspension]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders active suspension', () => {
    render(<SuspensionCard suspensions={[activeSuspension]} />);
    expect(screen.getByText('Class Suspension')).toBeInTheDocument();
    expect(screen.getByText(/DepEd/i)).toBeInTheDocument();
    expect(screen.getByText(/All levels/i)).toBeInTheDocument();
  });

  it('renders multiple active suspensions as separate cards', () => {
    const second = {
      ...activeSuspension,
      type: 'Work Suspension',
      issuedBy: 'DILG · Camarines Norte',
    };
    render(<SuspensionCard suspensions={[activeSuspension, second]} />);
    expect(screen.getByText('Class Suspension')).toBeInTheDocument();
    expect(screen.getByText('Work Suspension')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to confirm failure**

```bash
npx vitest run src/components/Alerts/SuspensionCard.test.jsx
```

Expected: FAIL — file doesn't exist.

- [ ] **Step 3: Implement SuspensionCard**

```jsx
// src/components/Alerts/SuspensionCard.jsx
function formatTimeAgo(seconds) {
  if (!seconds) return '';
  const diff = Math.floor(Date.now() / 1000) - seconds;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function SuspensionCard({ suspensions = [] }) {
  const active = suspensions.filter((s) => s.active);
  if (active.length === 0) return null;

  return (
    <>
      {active.map((s, i) => (
        <div
          key={i}
          className="bg-surface shadow-card overflow-hidden"
          role="region"
          aria-label={s.type}
        >
          <div className="bg-urgent px-4 py-2 flex items-center justify-between">
            <span className="text-white text-xs font-bold tracking-wide">{s.type}</span>
            <span className="text-white/70 text-xs">{formatTimeAgo(s.issuedAt?.seconds)}</span>
          </div>
          <div className="px-4 py-3">
            <p className="text-sm font-semibold text-text-primary">{s.issuedBy}</p>
            {s.scope && (
              <p className="text-xs text-text-secondary mt-0.5">{s.scope}</p>
            )}
          </div>
        </div>
      ))}
    </>
  );
}
```

- [ ] **Step 4: Run SuspensionCard test to confirm pass**

```bash
npx vitest run src/components/Alerts/SuspensionCard.test.jsx
```

Expected: 4 passing.

- [ ] **Step 5: Write the failing test for NearestReportCard**

```jsx
// src/components/Alerts/NearestReportCard.test.jsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NearestReportCard from './NearestReportCard';

const nearReport = {
  id: 'r1',
  disaster: { type: 'Flood', severity: 'critical' },
  location: { barangay: 'Brgy. Lag-on', municipality: 'Daet' },
  verification: { status: 'verified' },
  timestamp: { seconds: Math.floor(Date.now() / 1000) - 600 },
  distanceKm: 1.4,
};

describe('NearestReportCard', () => {
  it('renders nothing when no report', () => {
    const { container } = render(
      <MemoryRouter><NearestReportCard report={null} /></MemoryRouter>
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders report type and location', () => {
    render(
      <MemoryRouter><NearestReportCard report={nearReport} /></MemoryRouter>
    );
    expect(screen.getByText('Flood')).toBeInTheDocument();
    expect(screen.getByText(/Daet/i)).toBeInTheDocument();
  });

  it('renders distance', () => {
    render(
      <MemoryRouter><NearestReportCard report={nearReport} /></MemoryRouter>
    );
    expect(screen.getByText(/1\.4/)).toBeInTheDocument();
  });

  it('links to report detail', () => {
    render(
      <MemoryRouter><NearestReportCard report={nearReport} /></MemoryRouter>
    );
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/report/r1');
  });
});
```

- [ ] **Step 6: Run test to confirm failure**

```bash
npx vitest run src/components/Alerts/NearestReportCard.test.jsx
```

Expected: FAIL — file doesn't exist.

- [ ] **Step 7: Implement NearestReportCard**

```jsx
// src/components/Alerts/NearestReportCard.jsx
import { Link } from 'react-router-dom';

const STRIP = {
  critical: 'bg-urgent',
  moderate: 'bg-moderate',
  minor: 'bg-moderate',
};

export default function NearestReportCard({ report }) {
  if (!report) return null;

  const { id, disaster = {}, location = {}, verification = {}, distanceKm } = report;
  const strip = STRIP[disaster.severity] ?? 'bg-text-tertiary';

  return (
    <Link to={`/report/${id}`} className="block bg-surface shadow-card overflow-hidden">
      <div className="flex">
        {/* Left border strip by severity */}
        <div className={`w-1 flex-shrink-0 ${strip}`} aria-hidden="true" />
        <div className="flex-1 px-4 py-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-bold text-text-primary">{disaster.type}</p>
              <p className="text-xs text-text-tertiary mt-0.5">
                {[location.barangay, location.municipality].filter(Boolean).join(', ')}
              </p>
            </div>
            {distanceKm != null && (
              <span className="text-xs font-semibold text-text-secondary whitespace-nowrap flex-shrink-0">
                {distanceKm.toFixed(1)} km
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] text-text-tertiary capitalize">{verification.status}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
```

- [ ] **Step 8: Run NearestReportCard test to confirm pass**

```bash
npx vitest run src/components/Alerts/NearestReportCard.test.jsx
```

Expected: 4 passing.

- [ ] **Step 9: Implement WeatherCard**

```jsx
// src/components/Alerts/WeatherCard.jsx
export default function WeatherCard({ weather, loading }) {
  if (loading) {
    return (
      <div className="bg-surface shadow-card px-4 py-5 animate-pulse">
        <div className="h-3 bg-gray-200 rounded w-1/3 mb-2" />
        <div className="h-6 bg-gray-200 rounded w-1/2" />
      </div>
    );
  }

  if (!weather) return null;

  const { temperature, description, humidity, windSpeed, signal } = weather;

  return (
    <div className="bg-surface shadow-card px-4 py-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-text-tertiary font-medium uppercase tracking-wide mb-1">
            Current weather
          </p>
          <p className="text-2xl font-bold text-text-primary">
            {temperature != null ? `${Math.round(temperature)}°C` : '—'}
          </p>
          <p className="text-sm text-text-secondary capitalize mt-0.5">{description}</p>
        </div>
        {signal > 0 && (
          <span className="bg-moderate/10 text-moderate text-xs font-bold px-2 py-1 rounded">
            Signal {signal}
          </span>
        )}
      </div>
      {(humidity != null || windSpeed != null) && (
        <div className="flex gap-4 mt-3 text-xs text-text-tertiary">
          {humidity != null && <span>Humidity {humidity}%</span>}
          {windSpeed != null && <span>Wind {windSpeed} km/h</span>}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 10: Implement AlertsTab page**

```jsx
// src/pages/AlertsTab.jsx
import { useAuth } from '../hooks/useAuth';
import { useWeather } from '../hooks/useWeather';
import { useGeolocation } from '../hooks/useGeolocation';
import { useReports } from '../hooks/useReports';
import { useNearestReport } from '../hooks/useNearestReport';
import SuspensionCard from '../components/Alerts/SuspensionCard';
import WeatherCard from '../components/Alerts/WeatherCard';
import NearestReportCard from '../components/Alerts/NearestReportCard';
import { useAnnouncements } from '../hooks/useAnnouncements';

export default function AlertsTab() {
  const { municipality } = useGeolocation();
  const { weather, loading: weatherLoading } = useWeather(municipality);
  const { suspensions } = useAnnouncements();
  const { reports } = useReports();
  const nearestReport = useNearestReport(reports);

  return (
    <div className="h-full overflow-y-auto bg-app-bg">
      <div className="flex flex-col gap-3 p-4">
        <SuspensionCard suspensions={suspensions} />
        <WeatherCard weather={weather} loading={weatherLoading} />
        <NearestReportCard report={nearestReport} />
      </div>
    </div>
  );
}
```

- [ ] **Step 11: Create useAnnouncements and useNearestReport hooks**

`useAnnouncements` reads the `system/announcements` Firestore doc:

```js
// src/hooks/useAnnouncements.js
import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../utils/firebaseConfig';

export function useAnnouncements() {
  const [suspensions, setSuspensions] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'system', 'announcements'), (snap) => {
      if (snap.exists()) {
        setSuspensions(snap.data().suspensions ?? []);
      }
    });
    return unsub;
  }, []);

  return { suspensions };
}
```

`useNearestReport` finds the closest unresolved report using existing `geoFencing.js` distance utilities:

```js
// src/hooks/useNearestReport.js
import { useMemo } from 'react';
import { useGeolocation } from './useGeolocation';
import { getDistanceKm } from '../utils/geoFencing';

export function useNearestReport(reports = []) {
  const { lat, lng } = useGeolocation();

  return useMemo(() => {
    if (!lat || !lng) return null;

    const unresolved = reports.filter(
      (r) => r.verification?.status !== 'resolved'
    );

    if (unresolved.length === 0) return null;

    let nearest = null;
    let minDist = Infinity;

    for (const r of unresolved) {
      const rLat = r.location?.coordinates?.lat;
      const rLng = r.location?.coordinates?.lng;
      if (rLat == null || rLng == null) continue;
      const dist = getDistanceKm(lat, lng, rLat, rLng);
      if (dist < minDist) {
        minDist = dist;
        nearest = r;
      }
    }

    return nearest ? { ...nearest, distanceKm: minDist } : null;
  }, [reports, lat, lng]);
}
```

> **Note:** Check `src/utils/geoFencing.js` for the exact exported function name for distance calculation. It may be `getDistanceKm`, `calculateDistance`, or similar. Adjust the import accordingly.

- [ ] **Step 12: Commit**

```bash
git add src/components/Alerts/ src/pages/AlertsTab.jsx \
        src/hooks/useAnnouncements.js src/hooks/useNearestReport.js
git commit -m "feat: build Alerts tab — SuspensionCard, WeatherCard, NearestReportCard"
```

---

## Chunk 4: Report Flow

### Task 6: Build the 3-step Report flow

**Files:**
- Create: `src/pages/ReportPage.jsx`
- Create: `src/components/Reports/ReportTypeStep.jsx`
- Create: `src/components/Reports/ReportTypeStep.test.jsx`
- Create: `src/components/Reports/PhotoStep.jsx`
- Create: `src/components/Reports/DetailsStep.jsx`
- Create: `src/components/Reports/DetailsStep.test.jsx`

The flow uses local state to track which step is active. No URL changes between steps — just component swaps. Location capture starts silently on step 1 render.

- [ ] **Step 1: Write the failing test for ReportTypeStep**

```jsx
// src/components/Reports/ReportTypeStep.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import ReportTypeStep from './ReportTypeStep';

const TYPES = ['Flood', 'Landslide', 'Fire', 'Earthquake'];

describe('ReportTypeStep', () => {
  it('renders all disaster types', () => {
    render(<ReportTypeStep types={TYPES} selected={null} onSelect={vi.fn()} />);
    TYPES.forEach((t) => expect(screen.getByText(t)).toBeInTheDocument());
  });

  it('calls onSelect when a type is tapped', () => {
    const onSelect = vi.fn();
    render(<ReportTypeStep types={TYPES} selected={null} onSelect={onSelect} />);
    fireEvent.click(screen.getByText('Flood'));
    expect(onSelect).toHaveBeenCalledWith('Flood');
  });

  it('highlights selected type', () => {
    render(<ReportTypeStep types={TYPES} selected="Flood" onSelect={vi.fn()} />);
    const floodBtn = screen.getByText('Flood').closest('button');
    expect(floodBtn).toHaveClass('border-urgent');
  });
});
```

- [ ] **Step 2: Run test to confirm failure**

```bash
npx vitest run src/components/Reports/ReportTypeStep.test.jsx
```

Expected: FAIL — file doesn't exist.

- [ ] **Step 3: Implement ReportTypeStep**

```jsx
// src/components/Reports/ReportTypeStep.jsx
const DISASTER_TYPES = [
  'Flood',
  'Landslide',
  'Fire',
  'Earthquake',
  'Storm surge',
  'Typhoon',
  'Road accident',
  'Other',
];

export default function ReportTypeStep({
  types = DISASTER_TYPES,
  selected,
  onSelect,
}) {
  return (
    <div className="h-full overflow-y-auto bg-app-bg p-4">
      <p className="text-xs text-text-tertiary font-medium uppercase tracking-wide mb-4">
        What happened?
      </p>
      <ul className="flex flex-col gap-2">
        {types.map((type) => {
          const isSelected = type === selected;
          return (
            <li key={type}>
              <button
                type="button"
                onClick={() => onSelect(type)}
                className={`w-full text-left px-4 py-4 rounded-xl text-sm font-medium
                  bg-surface shadow-card border-2 transition-colors
                  ${isSelected
                    ? 'border-urgent bg-urgent/5 text-urgent'
                    : 'border-transparent text-text-primary'}`}
              >
                {type}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
```

- [ ] **Step 4: Run test to confirm pass**

```bash
npx vitest run src/components/Reports/ReportTypeStep.test.jsx
```

Expected: 3 passing.

- [ ] **Step 5: Write the failing test for DetailsStep**

```jsx
// src/components/Reports/DetailsStep.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import DetailsStep from './DetailsStep';

describe('DetailsStep', () => {
  const defaultProps = {
    description: '',
    severity: null,
    municipality: 'Daet',
    onDescriptionChange: vi.fn(),
    onSeverityChange: vi.fn(),
    onSubmit: vi.fn(),
    submitting: false,
  };

  it('renders severity chips', () => {
    render(<DetailsStep {...defaultProps} />);
    expect(screen.getByText('Critical')).toBeInTheDocument();
    expect(screen.getByText('Moderate')).toBeInTheDocument();
    expect(screen.getByText('Minor')).toBeInTheDocument();
  });

  it('disables submit when description is too short', () => {
    render(<DetailsStep {...defaultProps} description="Hi" severity="critical" />);
    const btn = screen.getByRole('button', { name: /submit/i });
    expect(btn).toBeDisabled();
  });

  it('disables submit when no severity selected', () => {
    render(<DetailsStep {...defaultProps} description="Long enough description text" severity={null} />);
    const btn = screen.getByRole('button', { name: /submit/i });
    expect(btn).toBeDisabled();
  });

  it('enables submit when description is long enough and severity is set', () => {
    render(
      <DetailsStep
        {...defaultProps}
        description="Long enough description text"
        severity="critical"
      />
    );
    const btn = screen.getByRole('button', { name: /submit/i });
    expect(btn).not.toBeDisabled();
  });

  it('calls onSeverityChange when a chip is clicked', () => {
    const onSeverityChange = vi.fn();
    render(<DetailsStep {...defaultProps} onSeverityChange={onSeverityChange} />);
    fireEvent.click(screen.getByText('Critical'));
    expect(onSeverityChange).toHaveBeenCalledWith('critical');
  });
});
```

- [ ] **Step 6: Run test to confirm failure**

```bash
npx vitest run src/components/Reports/DetailsStep.test.jsx
```

Expected: FAIL — file doesn't exist.

- [ ] **Step 7: Implement DetailsStep**

```jsx
// src/components/Reports/DetailsStep.jsx
const SEVERITIES = [
  { label: 'Critical', value: 'critical' },
  { label: 'Moderate', value: 'moderate' },
  { label: 'Minor', value: 'minor' },
];

const MIN_DESC_LENGTH = 10;

export default function DetailsStep({
  description,
  severity,
  municipality,
  onDescriptionChange,
  onSeverityChange,
  onSubmit,
  submitting,
}) {
  const canSubmit = description.trim().length >= MIN_DESC_LENGTH && severity != null;

  return (
    <div className="h-full overflow-y-auto bg-app-bg p-4 flex flex-col gap-4">
      {/* Severity chips */}
      <div>
        <p className="text-xs text-text-tertiary font-medium uppercase tracking-wide mb-2">
          How severe?
        </p>
        <div className="flex gap-2">
          {SEVERITIES.map(({ label, value }) => {
            const isActive = severity === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => onSeverityChange(value)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-colors
                  ${isActive
                    ? 'border-urgent bg-urgent/5 text-urgent'
                    : 'border-black/10 text-text-secondary'}`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Description */}
      <div>
        <p className="text-xs text-text-tertiary font-medium uppercase tracking-wide mb-2">
          Describe it
        </p>
        <textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="What did you see? Any details that would help responders…"
          className="w-full bg-surface border border-black/10 rounded-xl px-4 py-3 text-sm
                     text-text-primary placeholder:text-text-tertiary resize-none h-32
                     focus:outline-none focus:ring-2 focus:ring-urgent/30"
          aria-label="Description"
        />
      </div>

      {/* Detected location */}
      {municipality && (
        <p className="text-xs text-text-tertiary">
          Location detected: <span className="font-medium text-text-secondary">{municipality}</span>
        </p>
      )}

      {/* Submit */}
      <button
        type="button"
        onClick={onSubmit}
        disabled={!canSubmit || submitting}
        className="bg-urgent text-white font-bold text-sm py-4 rounded-xl w-full
                   disabled:opacity-40 active:scale-95 transition-transform"
        aria-label="Submit report"
      >
        {submitting ? 'Submitting…' : 'Submit report'}
      </button>
    </div>
  );
}
```

- [ ] **Step 8: Run DetailsStep test to confirm pass**

```bash
npx vitest run src/components/Reports/DetailsStep.test.jsx
```

Expected: 5 passing.

- [ ] **Step 9: Implement PhotoStep**

No TDD — this wraps a native file input and `imageCompression.js`, which are already tested.

```jsx
// src/components/Reports/PhotoStep.jsx
import { useRef } from 'react';

export default function PhotoStep({ photoFile, onPhotoSelect, onNext }) {
  const inputRef = useRef(null);
  const preview = photoFile ? URL.createObjectURL(photoFile) : null;

  return (
    <div className="h-full overflow-y-auto bg-app-bg p-4 flex flex-col gap-4">
      <p className="text-xs text-text-tertiary font-medium uppercase tracking-wide">
        Add a photo
      </p>

      {/* Upload zone */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full border-2 border-dashed border-black/20 rounded-xl overflow-hidden
                   flex items-center justify-center bg-surface"
        style={{ minHeight: 180 }}
        aria-label="Select photo"
      >
        {preview ? (
          <img src={preview} alt="Selected photo" className="w-full object-cover" style={{ maxHeight: 240 }} />
        ) : (
          <div className="py-10 flex flex-col items-center gap-2 text-text-tertiary">
            {/* Camera icon */}
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            <span className="text-sm">Tap to add a photo</span>
          </div>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => onPhotoSelect(e.target.files?.[0] ?? null)}
        aria-hidden="true"
      />

      {/* Next button */}
      <button
        type="button"
        onClick={onNext}
        className="bg-urgent text-white font-bold text-sm py-4 rounded-xl w-full
                   active:scale-95 transition-transform"
      >
        {photoFile ? 'Next' : 'Skip'}
      </button>
    </div>
  );
}
```

- [ ] **Step 10: Implement ReportPage**

```jsx
// src/pages/ReportPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReports } from '../hooks/useReports';
import { useGeolocation } from '../hooks/useGeolocation';
import ReportTypeStep from '../components/Reports/ReportTypeStep';
import PhotoStep from '../components/Reports/PhotoStep';
import DetailsStep from '../components/Reports/DetailsStep';

const TOTAL_STEPS = 3;

export default function ReportPage() {
  const navigate = useNavigate();
  const { submitReport } = useReports();
  const { lat, lng, municipality } = useGeolocation();

  const [step, setStep] = useState(1);
  const [disasterType, setDisasterType] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (submitting) return;
    setSubmitting(true);
    try {
      await submitReport({
        disasterType,
        photoFile,
        description,
        severity,
        location: { lat, lng, municipality },
      });
      navigate('/feed');
    } catch (err) {
      console.error('Report submission failed:', err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col h-full bg-app-bg">
      {/* Step header */}
      <div className="bg-shell px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <button
          type="button"
          onClick={() => (step > 1 ? setStep(step - 1) : navigate(-1))}
          className="text-white/60 text-sm"
          aria-label="Go back"
        >
          ←
        </button>
        <span className="text-white text-xs font-semibold flex-1 text-center">
          Step {step} of {TOTAL_STEPS}
        </span>
        {step === 2 && (
          <button
            type="button"
            onClick={() => { setPhotoFile(null); setStep(3); }}
            className="text-white/60 text-sm"
            aria-label="Skip photo"
          >
            Skip
          </button>
        )}
        {step !== 2 && <span className="w-8" aria-hidden="true" />}
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-hidden">
        {step === 1 && (
          <ReportTypeStep
            selected={disasterType}
            onSelect={(type) => { setDisasterType(type); setStep(2); }}
          />
        )}
        {step === 2 && (
          <PhotoStep
            photoFile={photoFile}
            onPhotoSelect={setPhotoFile}
            onNext={() => setStep(3)}
          />
        )}
        {step === 3 && (
          <DetailsStep
            description={description}
            severity={severity}
            municipality={municipality}
            onDescriptionChange={setDescription}
            onSeverityChange={setSeverity}
            onSubmit={handleSubmit}
            submitting={submitting}
          />
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 11: Register `/report` route in App.jsx**

In `src/App.jsx`, add the report route inside the `AppShell` children. It renders within the app shell (header + tab bar visible), which is the correct UX:

```jsx
const ReportPage = lazy(() => import('./pages/ReportPage'));
```

And in the router children array:

```jsx
{ path: 'report',    element: <Suspense fallback={<PageFallback />}><ReportPage /></Suspense> },
{ path: 'report/:id', element: <Suspense fallback={<PageFallback />}><ReportPage /></Suspense> },
```

- [ ] **Step 12: Run all new tests**

```bash
npx vitest run src/components/Reports/
```

Expected: all passing.

- [ ] **Step 13: Commit**

```bash
git add src/pages/ReportPage.jsx \
        src/components/Reports/ReportTypeStep.jsx \
        src/components/Reports/ReportTypeStep.test.jsx \
        src/components/Reports/PhotoStep.jsx \
        src/components/Reports/DetailsStep.jsx \
        src/components/Reports/DetailsStep.test.jsx \
        src/App.jsx
git commit -m "feat: add 3-step report flow (type → photo → details)"
```

---

## Chunk 5: Phase 2 Verification

### Task 7: Run full test suite and manual smoke test

- [ ] **Step 1: Run full test suite**

```bash
npx vitest run 2>&1 | tail -20
```

Expected: All Phase 1 and Phase 2 tests pass. Zero regressions from existing tests.

- [ ] **Step 2: Build and check bundle**

```bash
npm run build 2>&1 | grep -E "kB|chunk|dist"
```

Confirm Leaflet is in a separate chunk. MapTab chunk should be clearly separate from the main entry.

- [ ] **Step 3: Manual smoke test**

```bash
npm run dev
```

Verify in browser:
- Map tab: skeleton appears → Leaflet loads → markers visible
- Feed tab: report cards render with severity strips and photos
- Alerts tab: weather loads; suspension cards appear only if `system/announcements` has active suspensions
- Report flow: step 1 → select type → step 2 → photo/skip → step 3 → submit → redirect to feed
- Back button works at each step
- Browser URL changes correctly

- [ ] **Step 4: Commit any remaining changes**

```bash
git status
# Commit only if there are meaningful uncommitted changes
```

---

## Phase 2 Complete

At this point:
- Map tab renders async Leaflet behind a skeleton
- Critical alert banner shows when there are unresolved critical reports
- Feed tab shows Facebook-inspired cards with photo grid (1/2/3+ layouts)
- Resolved reports show a green strip + "View resolution" modal
- Alerts tab merges weather + suspension cards + nearest report
- 3-step report flow with real navigation (no modals)
- All primary action buttons use `#FF3B30` (urgent token)
- No emojis anywhere

**Next:** `docs/superpowers/plans/2026-03-17-rebuild-phase-3-admin-profile.md` — AdminShell, TriageQueue, DispatchForm, ProfileTab, AvatarUpload.
