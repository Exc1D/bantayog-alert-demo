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

  const currentTab = TABS.find((t) => location.pathname.startsWith(t.path)) || TABS[0];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <AdminNav tabs={TABS} currentTab={currentTab.path} onTabChange={(path) => navigate(path)} />
      <main className="p-4">
        <Suspense fallback={<LoadingSpinner />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}
