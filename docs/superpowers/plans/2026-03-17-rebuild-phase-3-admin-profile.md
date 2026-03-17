# Bantayog Alert Rebuild — Phase 3: Admin + Profile

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the admin section (triage queue, report detail with dispatch form) and the Profile tab (iOS-grouped settings, avatar upload with camera badge).

**Architecture:** The admin section lives entirely inside the `AdminShell` lazy chunk — zero bytes loaded for citizens. The triage queue uses `onSnapshot` real-time listeners from the existing `useReports` hook. Profile tab reuses all existing hooks (`useAuth`, `ThemeContext`, `usePushNotifications`) and adds avatar upload via Firebase Storage.

**Tech Stack:** React 18 · React Router v6 · Vite · Tailwind CSS · Firebase Firestore/Storage · Vitest + React Testing Library

**Spec:** `docs/superpowers/specs/2026-03-17-bantayog-rebuild-design.md`

**Prerequisites:** Phase 1 + Phase 2 complete.

---

## Chunk 1: Admin Shell + Triage Queue

### Task 1: Build AdminShell with inner nav

**Files:**
- Modify: `src/components/Admin/AdminShell.jsx` (replace Phase 1 stub)
- Create: `src/components/Admin/AdminNav.jsx`

`AdminShell` is the layout for the `/admin` route group. It renders an inner tab bar (Queue · Live Map · All Reports) above the active admin page.

- [ ] **Step 1: Implement AdminNav**

```jsx
// src/components/Admin/AdminNav.jsx
import { NavLink } from 'react-router-dom';

const TABS = [
  { label: 'Queue',       href: '/admin' },
  { label: 'Live Map',    href: '/admin/map' },
  { label: 'All Reports', href: '/admin/reports' },
];

export default function AdminNav() {
  return (
    <nav
      aria-label="Admin navigation"
      className="bg-shell border-b border-white/10 grid grid-cols-3"
    >
      {TABS.map(({ label, href }) => (
        <NavLink
          key={href}
          to={href}
          end={href === '/admin'}
          className={({ isActive }) =>
            `py-3 text-center text-xs font-semibold transition-colors
             ${isActive ? 'text-white border-b-2 border-urgent' : 'text-white/50'}`
          }
        >
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
```

- [ ] **Step 2: Implement AdminShell**

```jsx
// src/components/Admin/AdminShell.jsx
import { Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import AdminNav from './AdminNav';
import LoadingSpinner from '../Common/LoadingSpinner';

const TriageQueue   = lazy(() => import('./TriageQueue'));
const AdminMapView  = lazy(() => import('./AdminMapView'));
const AllReports    = lazy(() => import('./AllReports'));
const ReportDetail  = lazy(() => import('./ReportDetail'));

function PageFallback() {
  return (
    <div className="flex items-center justify-center h-full">
      <LoadingSpinner />
    </div>
  );
}

export default function AdminShell() {
  return (
    <div className="flex flex-col h-full">
      <AdminNav />
      <div className="flex-1 overflow-hidden">
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route index element={<TriageQueue />} />
            <Route path="map" element={<AdminMapView />} />
            <Route path="reports" element={<AllReports />} />
            <Route path="report/:id" element={<ReportDetail />} />
          </Routes>
        </Suspense>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create stubs for routes not yet built**

```jsx
// src/components/Admin/AdminMapView.jsx
export default function AdminMapView() {
  return <div className="p-4 text-text-secondary text-sm">Live map — coming soon</div>;
}
```

```jsx
// src/components/Admin/AllReports.jsx
export default function AllReports() {
  return <div className="p-4 text-text-secondary text-sm">All reports — coming soon</div>;
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/Admin/AdminShell.jsx src/components/Admin/AdminNav.jsx \
        src/components/Admin/AdminMapView.jsx src/components/Admin/AllReports.jsx
git commit -m "feat: add AdminShell layout with inner nav tabs"
```

---

### Task 2: Build TriageQueue with status bar

**Files:**
- Create: `src/components/Admin/TriageQueue.jsx`
- Create: `src/components/Admin/StatusBar.jsx`
- Create: `src/components/Admin/StatusBar.test.jsx`
- Create: `src/components/Admin/QueueItem.jsx`
- Create: `src/components/Admin/QueueItem.test.jsx`

- [ ] **Step 1: Write the failing test for StatusBar**

```jsx
// src/components/Admin/StatusBar.test.jsx
import { render, screen } from '@testing-library/react';
import StatusBar from './StatusBar';

describe('StatusBar', () => {
  it('shows pending count', () => {
    render(<StatusBar pending={5} criticalActive={2} totalActive={8} resolvedToday={3} />);
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText(/pending/i)).toBeInTheDocument();
  });

  it('shows critical active count', () => {
    render(<StatusBar pending={0} criticalActive={3} totalActive={5} resolvedToday={1} />);
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText(/critical/i)).toBeInTheDocument();
  });

  it('shows resolved today count', () => {
    render(<StatusBar pending={0} criticalActive={0} totalActive={2} resolvedToday={7} />);
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText(/resolved/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to confirm failure**

```bash
npx vitest run src/components/Admin/StatusBar.test.jsx
```

Expected: FAIL — file doesn't exist.

- [ ] **Step 3: Implement StatusBar**

```jsx
// src/components/Admin/StatusBar.jsx
export default function StatusBar({ pending, criticalActive, totalActive, resolvedToday }) {
  const stats = [
    { label: 'Pending',         value: pending,        color: 'text-urgent' },
    { label: 'Critical active', value: criticalActive,  color: 'text-moderate' },
    { label: 'Total active',    value: totalActive,     color: 'text-white' },
    { label: 'Resolved today',  value: resolvedToday,   color: 'text-resolved' },
  ];

  return (
    <div className="bg-shell border-b border-white/10 grid grid-cols-4 py-3">
      {stats.map(({ label, value, color }) => (
        <div key={label} className="flex flex-col items-center gap-0.5">
          <span className={`text-base font-bold ${color}`}>{value}</span>
          <span className="text-[9px] text-white/50 uppercase tracking-wide text-center leading-tight">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Run StatusBar test to confirm pass**

```bash
npx vitest run src/components/Admin/StatusBar.test.jsx
```

Expected: 3 passing.

- [ ] **Step 5: Write the failing test for QueueItem**

```jsx
// src/components/Admin/QueueItem.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import QueueItem from './QueueItem';

const report = {
  id: 'r1',
  disaster: {
    type: 'Flood',
    severity: 'critical',
    description: 'Water rising near municipal bridge.',
  },
  location: { municipality: 'Daet' },
  timestamp: { seconds: Math.floor(Date.now() / 1000) - 300 },
  photoUrls: ['https://example.com/1.jpg', 'https://example.com/2.jpg'],
};

function renderItem(props = {}) {
  return render(
    <MemoryRouter>
      <QueueItem report={report} onVerify={vi.fn()} onReject={vi.fn()} {...props} />
    </MemoryRouter>
  );
}

describe('QueueItem', () => {
  it('renders disaster type and municipality', () => {
    renderItem();
    expect(screen.getByText('Flood')).toBeInTheDocument();
    expect(screen.getByText(/Daet/i)).toBeInTheDocument();
  });

  it('renders photo count', () => {
    renderItem();
    expect(screen.getByText(/2/)).toBeInTheDocument();
  });

  it('calls onVerify when Verify button is clicked', () => {
    const onVerify = vi.fn();
    renderItem({ onVerify });
    fireEvent.click(screen.getByRole('button', { name: /verify/i }));
    expect(onVerify).toHaveBeenCalledWith('r1');
  });

  it('calls onReject when Reject button is clicked', () => {
    const onReject = vi.fn();
    renderItem({ onReject });
    fireEvent.click(screen.getByRole('button', { name: /reject/i }));
    expect(onReject).toHaveBeenCalledWith('r1');
  });

  it('links card body to report detail', () => {
    renderItem();
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/admin/report/r1');
  });
});
```

- [ ] **Step 6: Run test to confirm failure**

```bash
npx vitest run src/components/Admin/QueueItem.test.jsx
```

Expected: FAIL — file doesn't exist.

- [ ] **Step 7: Implement QueueItem**

```jsx
// src/components/Admin/QueueItem.jsx
import { Link } from 'react-router-dom';

const STRIP = {
  critical: 'bg-urgent',
  moderate: 'bg-moderate',
  minor: 'bg-moderate',
};

function formatTimeAgo(seconds) {
  if (!seconds) return '';
  const diff = Math.floor(Date.now() / 1000) - seconds;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function QueueItem({ report, onVerify, onReject }) {
  const { id, disaster = {}, location = {}, timestamp, photoUrls = [] } = report;
  const strip = STRIP[disaster.severity] ?? 'bg-text-tertiary';
  const timeAgo = formatTimeAgo(timestamp?.seconds);

  return (
    <div className="bg-surface shadow-card overflow-hidden flex">
      {/* Severity strip */}
      <div className={`w-1 flex-shrink-0 ${strip}`} aria-hidden="true" />

      <div className="flex-1 min-w-0">
        {/* Card body — tap to open detail */}
        <Link
          to={`/admin/report/${id}`}
          className="block px-4 pt-3 pb-2"
          aria-label={`View ${disaster.type} report`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-bold text-text-primary">{disaster.type}</p>
              <p className="text-xs text-text-tertiary mt-0.5">
                {location.municipality} · {timeAgo}
                {photoUrls.length > 0 && ` · ${photoUrls.length} photo${photoUrls.length > 1 ? 's' : ''}`}
              </p>
            </div>
            <span className={`text-[10px] font-bold px-2 py-1 rounded capitalize flex-shrink-0
              ${disaster.severity === 'critical' ? 'bg-urgent/10 text-urgent' : 'bg-moderate/10 text-moderate'}`}>
              {disaster.severity}
            </span>
          </div>
          {disaster.description && (
            <p className="text-xs text-text-secondary mt-1.5 line-clamp-1">
              {disaster.description}
            </p>
          )}
        </Link>

        {/* Inline action buttons */}
        <div className="flex gap-2 px-4 pb-3">
          <button
            type="button"
            onClick={() => onReject?.(id)}
            className="flex-1 py-2 rounded-lg border-2 border-urgent/30 text-urgent
                       text-xs font-semibold"
            aria-label="Reject"
          >
            Reject
          </button>
          <button
            type="button"
            onClick={() => onVerify?.(id)}
            className="flex-1 py-2 rounded-lg bg-shell text-white text-xs font-semibold"
            aria-label="Verify"
          >
            Verify
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Run QueueItem test to confirm pass**

```bash
npx vitest run src/components/Admin/QueueItem.test.jsx
```

Expected: 5 passing.

- [ ] **Step 9: Implement TriageQueue**

```jsx
// src/components/Admin/TriageQueue.jsx
import { useNavigate } from 'react-router-dom';
import { useReports } from '../../hooks/useReports';
import StatusBar from './StatusBar';
import QueueItem from './QueueItem';

function countResolvedToday(reports) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startSeconds = startOfDay.getTime() / 1000;
  return reports.filter(
    (r) =>
      r.verification?.status === 'resolved' &&
      (r.verification?.resolution?.resolvedAt?.seconds ?? 0) >= startSeconds
  ).length;
}

export default function TriageQueue() {
  const navigate = useNavigate();
  const { reports, loading } = useReports();

  const pending = reports.filter((r) => r.verification?.status === 'pending');
  const criticalActive = reports.filter(
    (r) => r.disaster?.severity === 'critical' && r.verification?.status !== 'resolved'
  );
  const totalActive = reports.filter((r) => r.verification?.status !== 'resolved');
  const resolvedToday = countResolvedToday(reports);

  // Sort pending: critical first, then by timestamp (newest first)
  const sorted = [...pending].sort((a, b) => {
    const sevA = a.disaster?.severity === 'critical' ? 0 : 1;
    const sevB = b.disaster?.severity === 'critical' ? 0 : 1;
    if (sevA !== sevB) return sevA - sevB;
    return (b.timestamp?.seconds ?? 0) - (a.timestamp?.seconds ?? 0);
  });

  function handleVerify(id) {
    navigate(`/admin/report/${id}`);
  }

  function handleReject(id) {
    navigate(`/admin/report/${id}?action=reject`);
  }

  return (
    <div className="flex flex-col h-full">
      <StatusBar
        pending={pending.length}
        criticalActive={criticalActive.length}
        totalActive={totalActive.length}
        resolvedToday={resolvedToday}
      />

      <div className="flex-1 overflow-y-auto bg-app-bg">
        {loading && (
          <div className="flex items-center justify-center h-32 text-text-tertiary text-sm">
            Loading…
          </div>
        )}
        {!loading && sorted.length === 0 && (
          <div className="flex items-center justify-center h-32 text-text-tertiary text-sm">
            Queue is clear
          </div>
        )}
        <div className="flex flex-col gap-2 p-3">
          {sorted.map((report) => (
            <QueueItem
              key={report.id}
              report={report}
              onVerify={handleVerify}
              onReject={handleReject}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 10: Commit**

```bash
git add src/components/Admin/StatusBar.jsx src/components/Admin/StatusBar.test.jsx \
        src/components/Admin/QueueItem.jsx src/components/Admin/QueueItem.test.jsx \
        src/components/Admin/TriageQueue.jsx
git commit -m "feat: add admin triage queue with status bar and inline verify/reject"
```

---

## Chunk 2: Report Detail + Dispatch Form

### Task 3: Build DispatchForm component

**Files:**
- Create: `src/components/Admin/DispatchForm.jsx`
- Create: `src/components/Admin/DispatchForm.test.jsx`

This is the highest-stakes component in Phase 3. `responseAction` and `assignedUnit` are both always required before "Verify + Dispatch" becomes enabled.

- [ ] **Step 1: Write the failing test**

```jsx
// src/components/Admin/DispatchForm.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import DispatchForm from './DispatchForm';

const defaultProps = {
  responseAction: null,
  assignedUnit: null,
  notes: '',
  onResponseActionChange: vi.fn(),
  onAssignedUnitChange: vi.fn(),
  onNotesChange: vi.fn(),
  onSubmit: vi.fn(),
  onReject: vi.fn(),
  submitting: false,
};

describe('DispatchForm', () => {
  it('renders all response action chips', () => {
    render(<DispatchForm {...defaultProps} />);
    expect(screen.getByText('Deploy team')).toBeInTheDocument();
    expect(screen.getByText('Issue advisory')).toBeInTheDocument();
    expect(screen.getByText('Monitor only')).toBeInTheDocument();
    expect(screen.getByText('Coordinate LGU')).toBeInTheDocument();
    expect(screen.getByText('Evacuate area')).toBeInTheDocument();
  });

  it('renders all unit chips', () => {
    render(<DispatchForm {...defaultProps} />);
    expect(screen.getByText('MDRRMO')).toBeInTheDocument();
    expect(screen.getByText('BFP')).toBeInTheDocument();
    expect(screen.getByText('PNP')).toBeInTheDocument();
    expect(screen.getByText('Barangay')).toBeInTheDocument();
    expect(screen.getByText('Provincial')).toBeInTheDocument();
  });

  it('Verify + Dispatch is disabled when no responseAction selected', () => {
    render(<DispatchForm {...defaultProps} assignedUnit="mdrrmo" />);
    expect(screen.getByRole('button', { name: /verify.*dispatch/i })).toBeDisabled();
  });

  it('Verify + Dispatch is disabled when no assignedUnit selected', () => {
    render(<DispatchForm {...defaultProps} responseAction="deploy-team" />);
    expect(screen.getByRole('button', { name: /verify.*dispatch/i })).toBeDisabled();
  });

  it('Verify + Dispatch is enabled when both are selected', () => {
    render(
      <DispatchForm
        {...defaultProps}
        responseAction="deploy-team"
        assignedUnit="mdrrmo"
      />
    );
    expect(screen.getByRole('button', { name: /verify.*dispatch/i })).not.toBeDisabled();
  });

  it('Verify + Dispatch remains disabled for monitor-only without assignedUnit', () => {
    // assignedUnit is ALWAYS required — no exceptions
    render(<DispatchForm {...defaultProps} responseAction="monitor-only" assignedUnit={null} />);
    expect(screen.getByRole('button', { name: /verify.*dispatch/i })).toBeDisabled();
  });

  it('calls onResponseActionChange when chip is clicked', () => {
    const onResponseActionChange = vi.fn();
    render(<DispatchForm {...defaultProps} onResponseActionChange={onResponseActionChange} />);
    fireEvent.click(screen.getByText('Deploy team'));
    expect(onResponseActionChange).toHaveBeenCalledWith('deploy-team');
  });

  it('calls onAssignedUnitChange when unit chip is clicked', () => {
    const onAssignedUnitChange = vi.fn();
    render(<DispatchForm {...defaultProps} onAssignedUnitChange={onAssignedUnitChange} />);
    fireEvent.click(screen.getByText('MDRRMO'));
    expect(onAssignedUnitChange).toHaveBeenCalledWith('mdrrmo');
  });

  it('calls onReject when Reject button is clicked', () => {
    const onReject = vi.fn();
    render(<DispatchForm {...defaultProps} onReject={onReject} />);
    fireEvent.click(screen.getByRole('button', { name: /reject/i }));
    expect(onReject).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to confirm failure**

```bash
npx vitest run src/components/Admin/DispatchForm.test.jsx
```

Expected: FAIL — file doesn't exist.

- [ ] **Step 3: Implement**

```jsx
// src/components/Admin/DispatchForm.jsx
const RESPONSE_ACTIONS = [
  { label: 'Deploy team',    value: 'deploy-team' },
  { label: 'Issue advisory', value: 'issue-advisory' },
  { label: 'Monitor only',   value: 'monitor-only' },
  { label: 'Coordinate LGU', value: 'coordinate-lgu' },
  { label: 'Evacuate area',  value: 'evacuate-area' },
];

const UNITS = [
  { label: 'MDRRMO',     value: 'mdrrmo' },
  { label: 'BFP',        value: 'bfp' },
  { label: 'PNP',        value: 'pnp' },
  { label: 'Barangay',   value: 'barangay' },
  { label: 'Provincial', value: 'provincial' },
];

function ChipGroup({ options, selected, onChange, label }) {
  return (
    <div className="mb-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary mb-2">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map(({ label: optLabel, value }) => {
          const isActive = selected === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => onChange(value)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors
                ${isActive
                  ? 'bg-shell text-white'
                  : 'bg-app-bg text-text-secondary'}`}
            >
              {optLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function DispatchForm({
  responseAction,
  assignedUnit,
  notes,
  onResponseActionChange,
  onAssignedUnitChange,
  onNotesChange,
  onSubmit,
  onReject,
  submitting,
}) {
  const canDispatch = responseAction != null && assignedUnit != null;

  return (
    <div className="p-4">
      <ChipGroup
        options={RESPONSE_ACTIONS}
        selected={responseAction}
        onChange={onResponseActionChange}
        label="Response action"
      />

      <ChipGroup
        options={UNITS}
        selected={assignedUnit}
        onChange={onAssignedUnitChange}
        label="Assign to unit"
      />

      {/* Notes */}
      <div className="mb-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary mb-2">
          Notes for responders
        </p>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Specific instructions, access points, contacts…"
          className="w-full bg-app-bg border border-black/10 rounded-xl px-4 py-3
                     text-sm text-text-primary placeholder:text-text-tertiary
                     resize-none h-24 focus:outline-none focus:ring-2 focus:ring-urgent/30"
          aria-label="Notes for responders"
        />
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onReject}
          disabled={submitting}
          className="py-3.5 rounded-xl border-2 border-urgent/30 text-urgent
                     text-sm font-bold"
          aria-label="Reject"
        >
          Reject
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canDispatch || submitting}
          className="py-3.5 rounded-xl bg-urgent text-white text-sm font-bold
                     disabled:opacity-40"
          aria-label="Verify + Dispatch"
        >
          {submitting ? 'Dispatching…' : 'Verify + Dispatch'}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to confirm pass**

```bash
npx vitest run src/components/Admin/DispatchForm.test.jsx
```

Expected: 9 passing.

- [ ] **Step 5: Commit**

```bash
git add src/components/Admin/DispatchForm.jsx src/components/Admin/DispatchForm.test.jsx
git commit -m "feat: add DispatchForm with response action + unit chips"
```

---

### Task 4: Build ReportDetail admin page

**Files:**
- Create: `src/components/Admin/ReportDetail.jsx`

`ReportDetail` fetches a single report by ID, shows its metadata and photos, and renders the `DispatchForm`. On "Verify + Dispatch" it writes the `verification` object with all required fields.

- [ ] **Step 1: Implement**

```jsx
// src/components/Admin/ReportDetail.jsx
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useReports } from '../../hooks/useReports';
import { useAuth } from '../../hooks/useAuth';
import DispatchForm from './DispatchForm';
import LoadingSpinner from '../Common/LoadingSpinner';

function formatTimestamp(seconds) {
  if (!seconds) return '';
  return new Date(seconds * 1000).toLocaleString();
}

export default function ReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { reports, verifyReport, rejectReport } = useReports();
  const { userProfile, user } = useAuth();

  const [responseAction, setResponseAction] = useState(null);
  const [assignedUnit, setAssignedUnit] = useState(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

  const report = reports.find((r) => r.id === id);

  if (!report) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner />
      </div>
    );
  }

  const { disaster = {}, location = {}, timestamp, photoUrls = [], reporter = {} } = report;

  async function handleDispatch() {
    if (submitting) return;
    setSubmitting(true);
    try {
      await verifyReport(id, {
        verifiedBy: user.uid,
        verifierRole: userProfile.role,
        responseAction,
        assignedUnit,
        notes,
      });
      navigate('/admin');
    } catch (err) {
      console.error('Dispatch failed:', err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReject() {
    const reason = window.prompt('Rejection reason (required):');
    if (!reason?.trim()) return;
    await rejectReport(id, { rejectedBy: user.uid, reason });
    navigate('/admin');
  }

  return (
    <div className="h-full overflow-y-auto bg-app-bg">
      {/* Photos */}
      {photoUrls.length > 0 && (
        <div className="relative bg-black">
          <img
            src={photoUrls[photoIndex]}
            alt={`Report photo ${photoIndex + 1}`}
            className="w-full object-cover"
            style={{ maxHeight: 220 }}
          />
          {photoUrls.length > 1 && (
            <div className="absolute bottom-2 right-3 bg-black/50 text-white text-xs
                            px-2 py-0.5 rounded">
              {photoIndex + 1} / {photoUrls.length}
            </div>
          )}
        </div>
      )}

      {/* Report metadata */}
      <div className="bg-surface px-4 py-4 shadow-card mb-2">
        <h1 className="text-base font-bold text-text-primary">{disaster.type}</h1>
        <p className="text-xs text-text-tertiary mt-0.5">
          {[location.barangay, location.municipality].filter(Boolean).join(', ')}
        </p>
        <p className="text-xs text-text-tertiary mt-0.5">
          {formatTimestamp(timestamp?.seconds)} ·{' '}
          {reporter.name ?? 'Anonymous'}
        </p>
        {disaster.description && (
          <p className="text-sm text-text-secondary mt-3 leading-relaxed">
            {disaster.description}
          </p>
        )}
      </div>

      {/* Dispatch form */}
      <div className="bg-surface shadow-card">
        <DispatchForm
          responseAction={responseAction}
          assignedUnit={assignedUnit}
          notes={notes}
          onResponseActionChange={setResponseAction}
          onAssignedUnitChange={setAssignedUnit}
          onNotesChange={setNotes}
          onSubmit={handleDispatch}
          onReject={handleReject}
          submitting={submitting}
        />
      </div>
    </div>
  );
}
```

> **Note:** `verifyReport` and `rejectReport` must exist in `useReports`. Check the existing hook — if named differently, adjust the call. The verification write must include all fields in `verification.responseAction`, `verification.assignedUnit`, `verification.notes`, `verification.verifiedBy`, `verification.verifierRole`, `verification.status: 'verified'`, and `verification.verifiedAt: serverTimestamp()`.

- [ ] **Step 2: Verify verifyReport exists in useReports**

```bash
grep -n "verifyReport\|rejectReport\|verify\|reject" src/hooks/useReports.js | head -20
```

If neither exists, add them to `useReports.js`:

```js
// Add to useReports.js return object
async function verifyReport(id, dispatchData) {
  const { verifiedBy, verifierRole, responseAction, assignedUnit, notes } = dispatchData;
  await updateDoc(doc(db, 'reports', id), {
    'verification.status': 'verified',
    'verification.verifiedBy': verifiedBy,
    'verification.verifiedAt': serverTimestamp(),
    'verification.verifierRole': verifierRole,
    'verification.responseAction': responseAction,
    'verification.assignedUnit': assignedUnit,
    'verification.notes': notes ?? '',
  });
  await logAuditEvent(AuditEventType.REPORT_VERIFIED, { reportId: id, ...dispatchData });
}

async function rejectReport(id, { rejectedBy, reason }) {
  await updateDoc(doc(db, 'reports', id), {
    'verification.status': 'rejected',
    'verification.rejectedBy': rejectedBy,
    'verification.rejectedAt': serverTimestamp(),
    'verification.rejectionReason': reason,
  });
  await logAuditEvent(AuditEventType.REPORT_REJECTED, { reportId: id, rejectedBy, reason });
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Admin/ReportDetail.jsx src/hooks/useReports.js
git commit -m "feat: add admin ReportDetail with DispatchForm integration"
```

---

## Chunk 3: Profile Tab

### Task 5: Build ProfileTab with avatar upload

**Files:**
- Modify: `src/pages/ProfileTab.jsx`
- Create: `src/components/Profile/AvatarUpload.jsx`
- Create: `src/components/Profile/AvatarUpload.test.jsx`
- Create: `src/components/Profile/SettingsGroup.jsx`

- [ ] **Step 1: Write the failing test for AvatarUpload**

```jsx
// src/components/Profile/AvatarUpload.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import AvatarUpload from './AvatarUpload';

describe('AvatarUpload', () => {
  it('renders user initial when no photo', () => {
    render(<AvatarUpload name="David Aviado" photoUrl={null} onUpload={vi.fn()} uploading={false} />);
    expect(screen.getByText('D')).toBeInTheDocument();
  });

  it('renders photo when photoUrl is provided', () => {
    render(
      <AvatarUpload
        name="David"
        photoUrl="https://example.com/avatar.jpg"
        onUpload={vi.fn()}
        uploading={false}
      />
    );
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg');
  });

  it('shows spinner overlay when uploading', () => {
    render(<AvatarUpload name="David" photoUrl={null} onUpload={vi.fn()} uploading={true} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('camera badge is hidden when uploading', () => {
    render(<AvatarUpload name="David" photoUrl={null} onUpload={vi.fn()} uploading={true} />);
    // Camera badge should not be present during upload
    expect(screen.queryByLabelText('Change photo')).not.toBeInTheDocument();
  });

  it('renders camera badge when not uploading', () => {
    render(<AvatarUpload name="David" photoUrl={null} onUpload={vi.fn()} uploading={false} />);
    expect(screen.getByLabelText('Change photo')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to confirm failure**

```bash
npx vitest run src/components/Profile/AvatarUpload.test.jsx
```

Expected: FAIL — file doesn't exist.

- [ ] **Step 3: Implement AvatarUpload**

```jsx
// src/components/Profile/AvatarUpload.jsx
import { useRef } from 'react';

function CameraIcon() {
  return (
    <svg
      width="10" height="10" viewBox="0 0 24 24"
      fill="none" stroke="white" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

export default function AvatarUpload({ name, photoUrl, onUpload, uploading }) {
  const inputRef = useRef(null);
  const initial = name?.charAt(0)?.toUpperCase() ?? '?';

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
  }

  return (
    <div className="relative w-14 h-14 flex-shrink-0">
      {/* Avatar circle */}
      <div className="w-14 h-14 rounded-full bg-gray-200 border-2 border-surface
                      flex items-center justify-center overflow-hidden">
        {photoUrl ? (
          <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-xl font-semibold text-gray-400">{initial}</span>
        )}
      </div>

      {/* Upload spinner overlay */}
      {uploading && (
        <div
          className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center"
          role="status"
          aria-label="Uploading…"
        >
          <svg
            className="animate-spin h-5 w-5 text-white"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle className="opacity-20" cx="12" cy="12" r="10"
              stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-80" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      )}

      {/* Camera badge */}
      {!uploading && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          aria-label="Change photo"
          className="absolute bottom-0 right-0 w-5 h-5 bg-shell rounded-full
                     border-2 border-surface flex items-center justify-center
                     shadow-sm"
        >
          <CameraIcon />
        </button>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleFileChange}
        aria-hidden="true"
      />
    </div>
  );
}
```

- [ ] **Step 4: Run AvatarUpload test to confirm pass**

```bash
npx vitest run src/components/Profile/AvatarUpload.test.jsx
```

Expected: 5 passing.

- [ ] **Step 5: Implement SettingsGroup**

```jsx
// src/components/Profile/SettingsGroup.jsx
// SettingsGroup renders an iOS-style grouped list.
// items: Array<{ label, rightLabel?, href?, onPress?, rightElement? }>
import { Link } from 'react-router-dom';

export default function SettingsGroup({ items }) {
  return (
    <div className="bg-surface rounded-xl overflow-hidden shadow-card">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        const inner = (
          <div
            className={`flex items-center justify-between px-4 py-3
              ${!isLast ? 'border-b border-black/5' : ''}`}
          >
            <span
              className={`text-sm ${item.destructive ? 'text-urgent font-medium' : 'text-text-primary'}`}
            >
              {item.label}
            </span>
            <div className="flex items-center gap-1 text-text-tertiary">
              {item.rightElement}
              {item.rightLabel && (
                <span className="text-sm">{item.rightLabel}</span>
              )}
              {(item.href || item.onPress) && !item.rightElement && (
                <span className="text-base">›</span>
              )}
            </div>
          </div>
        );

        if (item.href) {
          return (
            <Link key={item.label} to={item.href}>
              {inner}
            </Link>
          );
        }
        if (item.onPress) {
          return (
            <button key={item.label} type="button" onClick={item.onPress} className="w-full text-left">
              {inner}
            </button>
          );
        }
        return <div key={item.label}>{inner}</div>;
      })}
    </div>
  );
}
```

- [ ] **Step 6: Implement ProfileTab**

```jsx
// src/pages/ProfileTab.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import AvatarUpload from '../components/Profile/AvatarUpload';
import SettingsGroup from '../components/Profile/SettingsGroup';
import { isAdmin } from '../utils/rbac';
import { compressImage } from '../utils/imageCompression';

// Toggle component for settings rows
function Toggle({ value, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0
        ${value ? 'bg-resolved' : 'bg-gray-200'}`}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform
          ${value ? 'translate-x-4.5 right-0.5' : 'left-0.5'}`}
      />
    </button>
  );
}

export default function ProfileTab() {
  const navigate = useNavigate();
  const { user, userProfile, signOut, uploadAvatar } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [uploading, setUploading] = useState(false);

  async function handleAvatarUpload(file) {
    if (uploading) return;
    setUploading(true);
    try {
      const compressed = await compressImage(file, { maxSizeMB: 0.5, maxWidthOrHeight: 400 });
      await uploadAvatar(compressed);
    } finally {
      setUploading(false);
    }
  }

  const adminRole = userProfile && isAdmin(userProfile.role);

  return (
    <div className="h-full overflow-y-auto bg-app-bg">
      <div className="flex flex-col gap-3 p-4">

        {/* User card */}
        <div className="bg-surface shadow-card rounded-xl p-4">
          <div className="flex items-center gap-4">
            <AvatarUpload
              name={userProfile?.displayName}
              photoUrl={userProfile?.photoURL}
              onUpload={handleAvatarUpload}
              uploading={uploading}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-text-primary truncate">
                {userProfile?.displayName ?? user?.email}
              </p>
              <p className="text-xs text-text-tertiary mt-0.5 truncate">{user?.email}</p>
              {userProfile?.role && (
                <span className="inline-block mt-1.5 bg-urgent/10 border border-urgent/20
                                  px-2 py-0.5 rounded text-[10px] font-bold text-urgent capitalize">
                  {userProfile.role}
                </span>
              )}
            </div>
            <span className="text-text-tertiary text-lg">›</span>
          </div>
        </div>

        {/* Admin shortcut — admins only */}
        {adminRole && (
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="bg-shell rounded-xl p-4 flex items-center justify-between text-left"
          >
            <div>
              <p className="text-sm font-bold text-white">Admin dashboard</p>
              <p className="text-xs text-white/50 mt-0.5">Manage and dispatch reports</p>
            </div>
            <span className="bg-urgent text-white text-xs font-bold px-3 py-1.5 rounded-lg">
              Open
            </span>
          </button>
        )}

        {/* Account group */}
        <SettingsGroup
          items={[
            { label: 'Edit profile', href: '/profile/edit' },
            { label: 'Change password', href: '/profile/password' },
            { label: 'My reports', href: '/profile/reports' },
          ]}
        />

        {/* Preferences group */}
        <SettingsGroup
          items={[
            {
              label: 'Notifications',
              rightElement: <Toggle value={true} onChange={() => {}} />,
            },
            {
              label: 'Dark mode',
              rightElement: <Toggle value={isDark} onChange={toggleTheme} />,
            },
            {
              label: 'Language',
              rightLabel: 'English',
              href: '/profile/language',
            },
          ]}
        />

        {/* Legal group */}
        <SettingsGroup
          items={[
            { label: 'Privacy settings', href: '/profile/privacy' },
            { label: 'About Bantayog Alert', href: '/profile/about' },
          ]}
        />

        {/* Danger zone */}
        <SettingsGroup
          items={[
            {
              label: 'Sign out',
              destructive: true,
              onPress: () => { signOut(); navigate('/'); },
            },
            {
              label: 'Delete account',
              destructive: true,
              onPress: () => {
                if (window.confirm('Delete your account? This cannot be undone.')) {
                  // deleteAccount() — implement when needed
                }
              },
            },
          ]}
        />

      </div>
    </div>
  );
}
```

> **Note:** `uploadAvatar` may not exist in `useAuth` yet. Check the existing hook. If missing, add it:
> ```js
> async function uploadAvatar(file) {
>   const { getStorage, ref, uploadBytes, getDownloadURL } = await getFirebaseStorage();
>   const storageRef = ref(getStorage(), `users/${user.uid}/avatar`);
>   await uploadBytes(storageRef, file);
>   const url = await getDownloadURL(storageRef);
>   await updateDoc(doc(db, 'users', user.uid), { photoURL: url });
>   setUserProfile((prev) => ({ ...prev, photoURL: url }));
> }
> ```

- [ ] **Step 7: Run all Profile tests**

```bash
npx vitest run src/components/Profile/
```

Expected: all passing.

- [ ] **Step 8: Commit**

```bash
git add src/pages/ProfileTab.jsx \
        src/components/Profile/AvatarUpload.jsx \
        src/components/Profile/AvatarUpload.test.jsx \
        src/components/Profile/SettingsGroup.jsx
git commit -m "feat: rebuild ProfileTab with avatar upload and iOS-style settings groups"
```

---

## Chunk 4: Phase 3 Verification

### Task 6: Full test suite + manual smoke test

- [ ] **Step 1: Run full test suite**

```bash
npx vitest run 2>&1 | tail -20
```

Expected: All tests pass (Phases 1, 2, and 3). Zero regressions.

- [ ] **Step 2: Build production bundle**

```bash
npm run build 2>&1 | grep -E "kB|chunk"
```

Verify:
- Admin chunk is separate from citizen bundle
- No chunk exceeds ~300KB gzipped (Leaflet vendor chunk is expected to be the largest)

- [ ] **Step 3: Manual smoke test — admin flow**

```bash
npm run dev
```

Log in as an admin user. Verify:
- `/admin` loads without errors
- Queue shows pending reports sorted critical-first
- Inline Verify/Reject buttons work
- `/admin/report/:id` opens with dispatch form
- Selecting `responseAction` chip updates selection
- Selecting `assignedUnit` chip updates selection
- "Verify + Dispatch" button is disabled until both chips selected
- After submit: Firestore `reports/{id}.verification` has all fields

- [ ] **Step 4: Manual smoke test — profile tab**

- Avatar initial renders correctly
- Camera badge tap opens file picker
- Upload progress shows spinner overlay
- After upload: avatar updates from initial to photo
- Dark mode toggle: toggles immediately, persists on refresh
- Sign out: redirects to `/`

- [ ] **Step 5: Final commit**

```bash
git add -A && git status
# Only commit if there are remaining meaningful changes
```

---

## Phase 3 Complete

At this point the full rebuild is complete:

- **Phase 1** — Router, design tokens, AppShell, AdminGuard
- **Phase 2** — Map, Feed, Alerts, Report flow
- **Phase 3** — Admin triage, dispatch, ProfileTab with avatar upload

**Verification checklist from spec:** Run through all 14 items in `docs/superpowers/specs/2026-03-17-bantayog-rebuild-design.md` before shipping.
