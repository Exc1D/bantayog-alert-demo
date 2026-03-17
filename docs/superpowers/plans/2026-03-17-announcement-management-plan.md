# Announcement Management Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement admin announcement creation/deactivation for the Alerts tab, replacing hard-coded suspensions. Admins can create announcements scoped to their municipality; superadmin creates province-wide. 90-day TTL auto-purges announcements. Rejected reports are hard-deleted with audit log.

**Architecture:**
- New `announcements/` Firestore collection with scoped queries (municipal + provincial)
- Admin UI: 4th tab in AdminShell with FAB for creating announcements
- Citizen UI: AlertsTab displays scoped announcements via `AnnouncementCard`
- Data lifecycle: Firestore native TTL via `deleteAt` field, soft deactivation

**Tech Stack:** React Router v6 (createBrowserRouter), Firestore, Firebase Rules, Turf.js for geolocation

---

## Task Breakdown

### Task 1: Firestore Configuration

**Files:**
- Modify: `firestore.rules:320-340`
- Modify: `firestore.indexes.json`
- Test: Manual verification in Firebase Console

- [ ] **Step 1: Add `isSuperAdmin()` helper to firestore.rules**

Add after the existing `isAdmin()` helper (around line 28):
```js
function isSuperAdmin() {
  return userRole().matches('^superadmin_.*');
}
```

- [ ] **Step 2: Add `announcements/{id}` match block to firestore.rules**

Add before the existing `system/{document=**}` match block:
```
match /announcements/{announcementId} {
  // Any signed-in user can read (citizens need real-time access)
  allow read: if isSignedIn();

  // Any admin can create — scope and role must match the authenticated user
  allow create: if isAdmin()
    && request.resource.data.keys().hasAll([
      'type', 'title', 'body', 'severity', 'scope',
      'createdBy', 'createdByRole', 'active', 'createdAt', 'deactivatedAt', 'deleteAt'
    ])
    && request.resource.data.createdBy == request.auth.uid
    && request.resource.data.createdByRole == userData().role
    && request.resource.data.active == true
    && request.resource.data.createdAt == request.time
    && request.resource.data.deactivatedAt == null
    && request.resource.data.deleteAt is timestamp
    && (isSuperAdmin()
        ? request.resource.data.scope == 'Provincial'
        : (request.resource.data.scope == userData().municipality
           && isValidMunicipality(request.resource.data.scope)));

  // Deactivate only: only 'active' and 'deactivatedAt' may change
  allow update: if isAdmin()
    && request.resource.data.diff(resource.data).affectedKeys()
         .hasOnly(['active', 'deactivatedAt'])
    && request.resource.data.active == false
    && (isSuperAdmin()
        || resource.data.scope == userData().municipality);

  // No manual hard deletes — TTL handles physical deletion automatically
  allow delete: if false;
}
```

- [ ] **Step 3: Fix audit subcollection rule in firestore.rules**

Find the `users/{userId}/audit/{auditId}` match block and change:
```
request.resource.data.keys().hasAll(['eventType', 'timestamp', 'details'])
```
to:
```
request.resource.data.keys().hasAll(['eventType', 'timestamp', 'metadata'])
```

- [ ] **Step 4: Add composite indexes to firestore.indexes.json**

Add to the `indexes` array:
```json
{
  "collectionGroup": "announcements",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "active", "order": "ASCENDING" },
    { "fieldPath": "scope", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
},
{
  "collectionGroup": "announcements",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "active", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```

- [ ] **Step 5: Add TTL policy to firestore.indexes.json**

Update `"fieldOverrides": []` to:
```json
"fieldOverrides": [
  {
    "collectionGroup": "announcements",
    "fieldPath": "deleteAt",
    "indexes": [],
    "ttlPolicy": {}
  }
]
```

- [ ] **Step 6: Deploy Firestore changes**

Run: `firebase deploy --only firestore:rules,firestore:indexes`

- [ ] **Step 7: Verify in Firebase Console**

Navigate to Firestore → TTL policies — confirm `announcements.deleteAt` shows status "Active"

- [ ] **Step 8: Commit**

```bash
git add firestore.rules firestore.indexes.json
git commit -m "feat: add announcements collection with TTL and Firestore rules"
```

---

### Task 2: Audit Event Types

**Files:**
- Modify: `src/utils/auditLogger.js:4-13`

- [ ] **Step 1: Add new event types to AuditEventType enum**

Add to the enum at line 4:
```js
ANNOUNCEMENT_CREATED: 'ANNOUNCEMENT_CREATED',
ANNOUNCEMENT_DEACTIVATED: 'ANNOUNCEMENT_DEACTIVATED',
```

- [ ] **Step 2: Commit**

```bash
git add src/utils/auditLogger.js
git commit -m "feat: add ANNOUNCEMENT_CREATED and ANNOUNCEMENT_DEACTIVATED audit event types"
```

---

### Task 3: useAnnouncements Hook

**Files:**
- Create: `src/hooks/useAnnouncements.js`
- Test: `src/hooks/useAnnouncements.test.js` (optional)

- [ ] **Step 1: Write the failing test**

Create `src/hooks/useAnnouncements.test.js`:
```js
import { renderHook, waitFor } from '@testing-library/react';
import { useAnnouncements } from './useAnnouncements';

jest.mock('../utils/firebaseConfig', () => ({
  db: {},
  serverTimestamp: jest.fn(() => new Date()),
}));

jest.mock('firebase/firestore', () => ({
  ...jest.requireActual('firebase/firestore'),
  collection: jest.fn(() => 'announcements'),
  query: jest.fn((...args) => args),
  where: jest.fn((col, field, op, val) => ({ col, field, op, val })),
  orderBy: jest.fn((field, dir) => ({ field, dir })),
  onSnapshot: jest.fn((query, callback) => {
    callback({ docs: [] });
    return jest.fn();
  }),
}));

describe('useAnnouncements', () => {
  it('returns announcements array', async () => {
    const { result } = renderHook(() => useAnnouncements('Daet'));
    await waitFor(() => {
      expect(result.current.announcements).toEqual([]);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern="useAnnouncements" --passWithNoTests`
Expected: FAIL or PASS (if file doesn't exist, will fail to import)

- [ ] **Step 3: Implement the hook**

Create `src/hooks/useAnnouncements.js`:
```js
import { useState, useEffect, useMemo } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../utils/firebaseConfig';

// Client-side sort: Critical first, then Warning, then Info, then by date
function sortBySeverityAndDate(announcements) {
  const severityOrder = { critical: 0, warning: 1, info: 2 };
  return [...announcements].sort((a, b) => {
    const aOrder = severityOrder[a.severity] ?? 2;
    const bOrder = severityOrder[b.severity] ?? 2;
    if (aOrder !== bOrder) return aOrder - bOrder;
    const aDate = a.createdAt?.toDate?.() || new Date(0);
    const bDate = b.createdAt?.toDate?.() || new Date(0);
    return bDate - aDate; // newest first
  });
}

export function useAnnouncements(municipality) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!municipality) {
      // Geolocation failure fallback: fetch all active announcements
      const q = query(
        collection(db, 'announcements'),
        where('active', '==', true),
        orderBy('createdAt', 'desc')
      );
      return onSnapshot(q,
        (snapshot) => {
          setAnnouncements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          setLoading(false);
        },
        (err) => {
          setError(err);
          setLoading(false);
        }
      );
    }

    // Fetch scoped announcements: user's municipality + provincial
    const q = query(
      collection(db, 'announcements'),
      where('active', '==', true),
      where('scope', 'in', [municipality, 'Provincial']),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q,
      (snapshot) => {
        setAnnouncements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );
  }, [municipality]);

  // Apply client-side severity sorting
  const sortedAnnouncements = useMemo(
    () => sortBySeverityAndDate(announcements),
    [announcements]
  );

  return { announcements: sortedAnnouncements, loading, error };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --testPathPattern="useAnnouncements"`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useAnnouncements.js src/hooks/useAnnouncements.test.js
git commit -m "feat: add useAnnouncements hook for scoped announcement queries"
```

---

### Task 4: AnnouncementCard (Citizen UI)

**Files:**
- Create: `src/components/Alerts/AnnouncementCard.jsx`
- Create: `src/components/Alerts/AnnouncementCard.test.jsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/Alerts/AnnouncementCard.test.jsx`:
```jsx
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AnnouncementCard from './AnnouncementCard';

const mockAnnouncement = {
  id: 'test-1',
  type: 'class-suspension',
  title: 'Classes suspended in Daet',
  body: 'All public and private schools in Daet are suspended tomorrow.',
  severity: 'critical',
  scope: 'Daet',
  createdAt: { toDate: () => new Date('2026-03-15') },
};

describe('AnnouncementCard', () => {
  it('renders announcement title and body', () => {
    render(
      <BrowserRouter>
        <AnnouncementCard announcement={mockAnnouncement} />
      </BrowserRouter>
    );
    expect(screen.getByText('Classes suspended in Daet')).toBeInTheDocument();
    expect(screen.getByText(/All public and private schools/)).toBeInTheDocument();
  });

  it('shows correct severity styling for critical', () => {
    render(
      <BrowserRouter>
        <AnnouncementCard announcement={mockAnnouncement} />
      </BrowserRouter>
    );
    const card = screen.getByText('Classes suspended in Daet').closest('[class*="card"]');
    expect(card).toHaveClass(/border-red/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern="AnnouncementCard"`
Expected: FAIL with "Cannot find module './AnnouncementCard'"

- [ ] **Step 3: Create Alerts directory and implement AnnouncementCard**

Create directory and file `src/components/Alerts/AnnouncementCard.jsx`:
```jsx
import { Card, Badge } from '../Common';

// Per spec: critical=#FF3B30(red), warning=#FF9500(orange), info=#1C1C1E(shell/dark)
const SEVERITY_STYLES = {
  critical: 'border-red-500 bg-red-50 dark:bg-red-900/20',
  warning: 'border-orange-500 bg-orange-50 dark:bg-orange-900/20',
  info: 'border-gray-500 bg-gray-50 dark:bg-gray-900/20',  // was blue - fixed to gray
};

const TYPE_LABELS = {
  'class-suspension': 'Class Suspension',
  'work-suspension': 'Work Suspension',
  'flood-advisory': 'Flood Advisory',
  'road-closure': 'Road Closure',
  'evacuation-order': 'Evacuation Order',
  'storm-surge': 'Storm Surge',
  'health-advisory': 'Health Advisory',
  'emergency-notice': 'Emergency Notice',
};

export default function AnnouncementCard({ announcement }) {
  const {
    type,
    title,
    body,
    severity = 'info',
    scope,
    createdAt,
  } = announcement;

  const createdDate = createdAt?.toDate ? createdAt.toDate() : new Date();
  const formattedDate = createdDate.toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Card className={`border-l-4 ${SEVERITY_STYLES[severity] || SEVERITY_STYLES.info}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <Badge variant={severity === 'critical' ? 'danger' : severity === 'warning' ? 'warning' : 'info'}>
          {TYPE_LABELS[type] || type}
        </Badge>
        <span className="text-xs text-gray-500 dark:text-gray-400">{formattedDate}</span>
      </div>
      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{body}</p>
      <div className="text-xs text-gray-500 dark:text-gray-400">
        📍 {scope}
      </div>
    </Card>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --testPathPattern="AnnouncementCard"`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/Alerts/AnnouncementCard.jsx src/components/Alerts/AnnouncementCard.test.jsx
git commit -m "feat: add AnnouncementCard component for citizen Alerts tab"
```

---

### Task 5: AdminShell and AdminNav (Admin Layout)

**Files:**
- Create: `src/components/Admin/AdminShell.jsx`
- Create: `src/components/Admin/AdminNav.jsx`

- [ ] **Step 1: Create AdminShell with routing**

Create `src/components/Admin/AdminShell.jsx`:
```jsx
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Suspense } from 'react';
import LoadingSpinner from '../Common/LoadingSpinner';
import AdminNav from './AdminNav';

const TABS = [
  { path: '/admin', label: 'Queue', icon: '📋' },
  { path: '/admin/map', label: 'Live Map', icon: '🗺️' },
  { path: '/admin/reports', label: 'All Reports', icon: '📊' },
  { path: '/admin/alerts', label: 'Alerts', icon: '🔔' },
];

export default function AdminShell() {
  const location = useLocation();
  const navigate = useNavigate();

  const currentTab = TABS.find(t => location.pathname.startsWith(t.path)) || TABS[0];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <AdminNav
        tabs={TABS}
        currentTab={currentTab.path}
        onTabChange={(path) => navigate(path)}
      />
      <main className="p-4">
        <Suspense fallback={<LoadingSpinner />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Create AdminNav component**

Create `src/components/Admin/AdminNav.jsx`:
```jsx
import { cn } from '../../utils/cn';

export default function AdminNav({ tabs, currentTab, onTabChange }) {
  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="flex overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.path}
            onClick={() => onTabChange(tab.path)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap',
              'border-b-2 transition-colors',
              currentTab === tab.path
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-300',
              'hover:text-gray-900 dark:hover:text-gray-100'
            )}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
```

- [ ] **Step 3: Create AdminGuard wrapper**

Create `src/components/Admin/AdminGuard.jsx`:
```jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { isAdminRole } from '../../utils/rbac';
import LoadingSpinner from '../Common/LoadingSpinner';

export default function AdminGuard({ children }) {
  const { user, userData, loading } = useAuth();

  if (loading) {
    return (
      <div role="status" className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  if (!user || !userData?.role || !isAdminRole(userData.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/Admin/AdminShell.jsx src/components/Admin/AdminNav.jsx src/components/Admin/AdminGuard.jsx
git commit -m "feat: add AdminShell and AdminNav components with routing"
```

---

### Task 6: App.jsx Router Integration

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Add admin routes to App.jsx**

Add imports at the top:
```js
const AdminShell = lazy(() => import('./components/Admin/AdminShell'));
const AdminGuard = lazy(() => import('./components/Admin/AdminGuard'));
```

Add admin route block inside the router configuration:
```js
{
  path: 'admin',
  element: <AdminGuard><AdminShell /></AdminGuard>,
  children: [
    { index: true, element: <AdminDashboard /> },
    { path: 'map', element: <div>Live Map Coming Soon</div> },
    { path: 'reports', element: <div>All Reports Coming Soon</div> },
    { path: 'alerts', element: <div>Alerts Coming Soon</div> },
  ],
},
```

- [ ] **Step 2: Commit**

```bash
git add src/App.jsx
git commit -m "feat: add admin routes with AdminGuard and AdminShell"
```

---

### Task 7: AdminAlertsTab (Admin List View)

**Files:**
- Create: `src/components/Admin/AdminAlertsTab.jsx`
- Create: `src/components/Admin/AnnouncementItem.jsx`
- Create: `src/components/Admin/AnnouncementItem.test.jsx`

- [ ] **Step 1: Create AnnouncementItem component**

Create `src/components/Admin/AnnouncementItem.jsx`:
```jsx
import { useState } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../utils/firebaseConfig';
import { logAuditEvent, AuditEvent, AuditEventType } from '../../utils/auditLogger';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../Common/Button';
import { ConfirmDialog } from '../Common/ConfirmDialog';

const SEVERITY_STYLES = {
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  warning: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
};

export default function AnnouncementItem({ announcement, canDeactivate, onUpdate }) {
  const { user } = useAuth();
  const [showConfirm, setShowConfirm] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  const handleDeactivate = async () => {
    setDeactivating(true);
    try {
      const announcementRef = doc(db, 'announcements', announcement.id);
      await updateDoc(announcementRef, {
        active: false,
        deactivatedAt: serverTimestamp(),
      });

      // Audit log
      await logAuditEvent(new AuditEvent({
        eventType: AuditEventType.ANNOUNCEMENT_DEACTIVATED,
        userId: user.uid,
        targetId: announcement.id,
        metadata: { type: announcement.type, scope: announcement.scope },
      }));

      onUpdate();
    } catch (error) {
      console.error('Failed to deactivate:', error);
    } finally {
      setDeactivating(false);
      setShowConfirm(false);
    }
  };

  const createdDate = announcement.createdAt?.toDate?.() || new Date();
  const formattedDate = createdDate.toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${SEVERITY_STYLES[announcement.severity]}`}>
                {announcement.severity.toUpperCase()}
              </span>
              <span className="text-xs text-gray-500">{announcement.scope}</span>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{announcement.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{announcement.body}</p>
            <p className="text-xs text-gray-400 mt-2">{formattedDate}</p>
          </div>
          {canDeactivate && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConfirm(true)}
              disabled={deactivating}
            >
              {deactivating ? 'Deactivating...' : 'Deactivate'}
            </Button>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleDeactivate}
        title="Deactivate Announcement"
        message="Are you sure you want to deactivate this announcement? It will no longer be visible to citizens."
        confirmLabel="Deactivate"
        confirmVariant="danger"
      />
    </>
  );
}
```

- [ ] **Step 2: Create AdminAlertsTab with separate sections**

Create `src/components/Admin/AdminAlertsTab.jsx`:
```jsx
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../../utils/firebaseConfig';
import { useAuth } from '../../hooks/useAuth';
import { isAdminRole } from '../../utils/rbac';
import AnnouncementItem from './AnnouncementItem';
import { Button } from '../Common/Button';

// Sort by severity (critical first), then by date
function sortBySeverityAndDate(announcements) {
  const severityOrder = { critical: 0, warning: 1, info: 2 };
  return [...announcements].sort((a, b) => {
    const aOrder = severityOrder[a.severity] ?? 2;
    const bOrder = severityOrder[b.severity] ?? 2;
    if (aOrder !== bOrder) return aOrder - bOrder;
    const aDate = a.createdAt?.toDate?.() || new Date(0);
    const bDate = b.createdAt?.toDate?.() || new Date(0);
    return bDate - aDate; // newest first
  });
}

function useAdminAnnouncements(municipality, isSuperAdmin) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const conditions = [where('active', '==', true)];

    if (!isSuperAdmin) {
      conditions.push(where('scope', 'in', [municipality, 'Provincial']));
    }

    const q = query(
      collection(db, 'announcements'),
      ...conditions,
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      setAnnouncements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
  }, [municipality, isSuperAdmin]);

  return { announcements, loading };
}

export default function AdminAlertsTab() {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const isSuperAdmin = isAdminRole(userData?.role) && userData?.role === 'superadmin_provincial';
  const { announcements, loading } = useAdminAnnouncements(userData?.municipality, isSuperAdmin);

  // Separate into municipal and provincial sections
  const { municipal, provincial } = useMemo(() => {
    const sorted = sortBySeverityAndDate(announcements);
    return {
      municipal: sorted.filter(a => a.scope === userData?.municipality),
      provincial: sorted.filter(a => a.scope === 'Provincial'),
    };
  }, [announcements, userData?.municipality]);

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  const totalCount = municipal.length + provincial.length;

  return (
    <div className="pb-20">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Announcements</h1>
        <span className="text-sm text-gray-500">{totalCount} active</span>
      </div>

      {totalCount === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No active announcements in {userData?.municipality || 'your scope'}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Municipal section */}
          {municipal.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-3">
                Active · {userData?.municipality} ({municipal.length})
              </h2>
              <div className="space-y-3">
                {municipal.map((announcement) => (
                  <AnnouncementItem
                    key={announcement.id}
                    announcement={announcement}
                    canDeactivate={true}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Provincial section (read-only for municipal admins) */}
          {provincial.length > 0 && (
            <section className={!isSuperAdmin ? 'opacity-50' : ''}>
              <h2 className="text-lg font-semibold mb-3">
                Provincial ({provincial.length})
              </h2>
              <div className="space-y-3">
                {provincial.map((announcement) => (
                  <AnnouncementItem
                    key={announcement.id}
                    announcement={announcement}
                    canDeactivate={isSuperAdmin}
                  />
                ))}
              </div>
              {!isSuperAdmin && (
                <p className="text-xs text-gray-500 mt-2">
                  Provincial announcements are read-only for municipal admins
                </p>
              )}
            </section>
          )}
        </div>
      )}

      {/* FAB for new announcement */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2">
        <Button
          onClick={() => navigate('/admin/alerts/new')}
          className="px-6 py-3 rounded-full font-medium shadow-lg"
        >
          New Announcement
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create AnnouncementItem test**

Create `src/components/Admin/AnnouncementItem.test.jsx`:
```jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AnnouncementItem from './AnnouncementItem';

const mockAnnouncement = {
  id: 'test-1',
  type: 'class-suspension',
  title: 'Classes suspended in Daet',
  body: 'All public and private schools in Daet are suspended tomorrow.',
  severity: 'critical',
  scope: 'Daet',
  createdAt: { toDate: () => new Date('2026-03-15') },
};

describe('AnnouncementItem', () => {
  it('renders announcement details', () => {
    render(
      <BrowserRouter>
        <AnnouncementItem
          announcement={mockAnnouncement}
          canDeactivate={true}
          onUpdate={jest.fn()}
        />
      </BrowserRouter>
    );
    expect(screen.getByText('Classes suspended in Daet')).toBeInTheDocument();
    expect(screen.getByText(/All public and private schools/)).toBeInTheDocument();
  });

  it('hides Deactivate button when canDeactivate is false', () => {
    render(
      <BrowserRouter>
        <AnnouncementItem
          announcement={mockAnnouncement}
          canDeactivate={false}
          onUpdate={jest.fn()}
        />
      </BrowserRouter>
    );
    expect(screen.queryByText('Deactivate')).not.toBeInTheDocument();
  });

  it('shows Deactivate button when canDeactivate is true', () => {
    render(
      <BrowserRouter>
        <AnnouncementItem
          announcement={mockAnnouncement}
          canDeactivate={true}
          onUpdate={jest.fn()}
        />
      </BrowserRouter>
    );
    expect(screen.getByText('Deactivate')).toBeInTheDocument();
  });
});
```

- [ ] **Step 4: Commit**

```bash
git add src/components/Admin/AdminAlertsTab.jsx src/components/Admin/AnnouncementItem.jsx src/components/Admin/AnnouncementItem.test.jsx
git commit -m "feat: add AdminAlertsTab with municipal/provincial sections and AnnouncementItem with deactivate"
```

---

### Task 8: CreateAnnouncementForm

**Files:**
- Create: `src/components/Admin/CreateAnnouncementForm.jsx`
- Create: `src/components/Admin/CreateAnnouncementForm.test.jsx`

- [ ] **Step 1: Create the form component**

Create `src/components/Admin/CreateAnnouncementForm.jsx`:
```jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../../utils/firebaseConfig';
import { useAuth } from '../../hooks/useAuth';
import { logAuditEvent, AuditEvent, AuditEventType } from '../../utils/auditLogger';
import { Button } from '../Common/Button';

const ANNOUNCEMENT_TYPES = [
  { value: 'class-suspension', label: 'Class Suspension' },
  { value: 'work-suspension', label: 'Work Suspension' },
  { value: 'flood-advisory', label: 'Flood Advisory' },
  { value: 'road-closure', label: 'Road Closure' },
  { value: 'evacuation-order', label: 'Evacuation Order' },
  { value: 'storm-surge', label: 'Storm Surge' },
  { value: 'health-advisory', label: 'Health Advisory' },
  { value: 'emergency-notice', label: 'Emergency Notice' },
];

const SEVERITY_LEVELS = [
  { value: 'critical', label: 'Critical' },
  { value: 'warning', label: 'Warning' },
  { value: 'info', label: 'Info' },
];

// Fixed Tailwind classes - dynamic classes won't work!
const severityButtonClasses = {
  critical: {
    base: 'border-gray-300 dark:border-gray-700',
    selected: 'border-red-500 bg-red-50 dark:bg-red-900/20',
  },
  warning: {
    base: 'border-gray-300 dark:border-gray-700',
    selected: 'border-orange-500 bg-orange-50 dark:bg-orange-900/20',
  },
  info: {
    base: 'border-gray-300 dark:border-gray-700',
    selected: 'border-gray-500 bg-gray-50 dark:bg-gray-900/20',
  },
};

export default function CreateAnnouncementForm() {
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const [type, setType] = useState('');
  const [severity, setSeverity] = useState('info');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  // Validation: type, title (non-empty), body (min 10 chars)
  const isValid = type && title.trim() && body.trim().length >= 10;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid || submitting) return;

    setSubmitting(true);
    try {
      // Compute deleteAt = now + 90 days
      const deleteAt = Timestamp.fromDate(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000));

      const docRef = await addDoc(collection(db, 'announcements'), {
        type,
        title: title.trim(),
        body: body.trim(),
        severity,
        scope: userData?.municipality || 'Provincial',
        createdBy: user.uid,
        createdByRole: userData?.role,
        active: true,
        createdAt: serverTimestamp(),
        deactivatedAt: null,
        deleteAt,
      });

      // Audit log
      await logAuditEvent(new AuditEvent({
        eventType: AuditEventType.ANNOUNCEMENT_CREATED,
        userId: user.uid,
        targetId: docRef.id,
        metadata: { type, severity, scope: userData?.municipality || 'Provincial' },
      }));

      navigate('/admin/alerts');
    } catch (error) {
      console.error('Failed to create announcement:', error);
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">New Announcement</h1>
        <Button variant="ghost" onClick={() => navigate('/admin/alerts')}>
          Cancel
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type selector */}
        <div>
          <label className="block text-sm font-medium mb-1">Type *</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
            required
          >
            <option value="">Select type...</option>
            {ANNOUNCEMENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {/* Severity selector with fixed Tailwind classes */}
        <div>
          <label className="block text-sm font-medium mb-1">Severity *</label>
          <div className="flex gap-2">
            {SEVERITY_LEVELS.map((s) => {
              const isSelected = severity === s.value;
              const classes = severityButtonClasses[s.value];
              return (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setSeverity(s.value)}
                  className={`px-4 py-2 rounded-lg border ${
                    isSelected ? classes.selected : classes.base
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-1">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Classes suspended in Daet"
            className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
            required
          />
        </div>

        {/* Body with min-length validation */}
        <div>
          <label className="block text-sm font-medium mb-1">Details * (min 10 chars)</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Full details of the announcement..."
            rows={4}
            className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
            minLength={10}
            required
          />
        </div>

        {/* Scope display */}
        <div className="text-sm text-gray-500">
          📍 This announcement will be scoped to: <strong>{userData?.municipality || 'Provincial'}</strong>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={!isValid || submitting}
          className="w-full"
        >
          {submitting ? 'Posting...' : 'Post announcement'}
        </Button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Create CreateAnnouncementForm test**

Create `src/components/Admin/CreateAnnouncementForm.test.jsx`:
```jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import CreateAnnouncementForm from './CreateAnnouncementForm';

const mockUser = { uid: 'test-uid' };
const mockUserData = { role: 'admin_daet', municipality: 'Daet' };

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    userData: mockUserData,
  }),
}));

jest.mock('firebase/firestore', () => ({
  addDoc: jest.fn(() => Promise.resolve({ id: 'new-doc-id' })),
  collection: jest.fn(() => 'announcements'),
  serverTimestamp: jest.fn(() => new Date()),
  Timestamp: {
    fromDate: jest.fn(() => ({ toDate: () => new Date() })),
  },
}));

jest.mock('../../utils/auditLogger', () => ({
  logAuditEvent: jest.fn(() => Promise.resolve()),
  AuditEvent: jest.fn(),
  AuditEventType: {
    ANNOUNCEMENT_CREATED: 'ANNOUNCEMENT_CREATED',
  },
}));

describe('CreateAnnouncementForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders form fields', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <CreateAnnouncementForm />
        </AuthProvider>
      </BrowserRouter>
    );
    expect(screen.getByLabelText(/Type/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Title/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Details/)).toBeInTheDocument();
  });

  it('validates minimum body length', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <CreateAnnouncementForm />
        </AuthProvider>
      </BrowserRouter>
    );
    const titleInput = screen.getByLabelText(/Title/);
    const bodyInput = screen.getByLabelText(/Details/);
    const submitButton = screen.getByText('Post announcement');

    fireEvent.change(titleInput, { target: { value: 'Test Title' } });
    fireEvent.change(bodyInput, { target: { value: 'Short' } }); // less than 10 chars

    expect(submitButton).toBeDisabled();
  });

  it('enables submit when all fields valid', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <CreateAnnouncementForm />
        </AuthProvider>
      </BrowserRouter>
    );
    const titleInput = screen.getByLabelText(/Title/);
    const bodyInput = screen.getByLabelText(/Details/);
    const typeSelect = screen.getByLabelText(/Type/);
    const submitButton = screen.getByText('Post announcement');

    fireEvent.change(titleInput, { target: { value: 'Test Title' } });
    fireEvent.change(bodyInput, { target: { value: 'This is a valid body with enough characters' } });
    fireEvent.change(typeSelect, { target: { value: 'class-suspension' } });

    expect(submitButton).not.toBeDisabled();
  });
});
```

- [ ] **Step 3: Update App.jsx routes to include the form**

Add route in App.jsx:
```js
{ path: 'alerts/new', element: <CreateAnnouncementForm /> },
```

- [ ] **Step 4: Commit**

```bash
git add src/components/Admin/CreateAnnouncementForm.jsx src/components/Admin/CreateAnnouncementForm.test.jsx src/App.jsx
git commit -m "feat: add CreateAnnouncementForm with 90-day TTL and validation"
```

---

### Task 9: Replace Suspensions in AlertsTab (Citizen UI)

**Files:**
- Modify: `src/pages/AlertsTab.jsx`
- Modify: `src/hooks/useGeolocation.js` (if needed for fallback)

- [ ] **Step 1: Update AlertsTab to use AnnouncementCard**

Read the current AlertsTab and replace SuspensionCard with AnnouncementCard:
```jsx
import AnnouncementCard from '../components/Alerts/AnnouncementCard';
import { useAnnouncements } from '../hooks/useAnnouncements';

// Replace the existing suspension cards section:
const { announcements, loading } = useAnnouncements(municipality);

// In the JSX, replace Suspensions section with:
{announcements.length > 0 ? (
  <div className="space-y-3">
    {announcements.map((announcement) => (
      <AnnouncementCard key={announcement.id} announcement={announcement} />
    ))}
  </div>
) : (
  <p className="text-gray-500 text-center py-4">No active alerts</p>
)}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/AlertsTab.jsx
git commit -m "feat: replace Suspensions with AnnouncementCard in AlertsTab"
```

---

### Task 10: Rejected Report Hard Delete

**Files:**
- Modify: Existing report rejection flow (likely in VerificationPanel or AdminDashboard)

- [ ] **Step 1: Find the rejection handler**

Search for where reports are rejected in the admin UI:
```bash
grep -r "rejected" src/components/Admin/
```

- [ ] **Step 2: Update to hard delete instead of status update**

Replace `updateDoc(reportRef, { status: 'rejected' })` with:
```js
// First write audit log
await logAuditEvent(new AuditEvent({
  eventType: AuditEventType.REPORT_DELETE,
  userId: user.uid,
  targetId: reportId,
  metadata: { reason: rejectionReason, type: report.type, municipality: report.municipality },
}));

// Then hard delete the report
await deleteDoc(doc(db, 'reports', reportId));
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Admin/VerificationPanel.jsx  # or whichever file
git commit -m "feat: hard delete rejected reports with audit log"
```

---

## Summary

**Estimated tasks:** 10 tasks with ~25 steps total

**Execute in order:**
1. Firestore Configuration (Task 1)
2. Audit Event Types (Task 2)
3. useAnnouncements Hook (Task 3)
4. AnnouncementCard (Task 4)
5. AdminShell/AdminNav (Task 5)
6. App.jsx Router (Task 6)
7. AdminAlertsTab (Task 7)
8. CreateAnnouncementForm (Task 8)
9. AlertsTab Integration (Task 9)
10. Rejected Report Hard Delete (Task 10)

**Before deployment:**
- Run `npm run build` to verify no errors
- Deploy: `firebase deploy --only hosting`
- Clear service worker cache or bump SW version in `public/sw.js`
- Test in production: create announcement as admin, verify citizen sees it in Alerts tab

---

**Plan complete and saved to `docs/superpowers/plans/2026-03-17-announcement-management-plan.md`. Ready to execute?**
