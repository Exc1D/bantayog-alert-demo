import { lazy, Suspense } from 'react';
import LoadingSpinner from '../Common/LoadingSpinner';
import AdminNav from './AdminNav';

const AdminDashboard = lazy(() => import('./AdminDashboard'));
const AdminAlertsTab = lazy(() => import('./AdminAlertsTab'));

const TABS = [
  { path: 'admin', label: 'Queue', icon: '📋' },
  { path: 'admin-map', label: 'Live Map', icon: '🗺️' },
  { path: 'admin-reports', label: 'All Reports', icon: '📊' },
  { path: 'admin-alerts', label: 'Alerts', icon: '🔔' },
];

export default function AdminShell({ activeTab, onTabChange }) {
  const renderContent = () => {
    switch (activeTab) {
      case 'admin-alerts':
        return <AdminAlertsTab />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <AdminNav tabs={TABS} currentTab={activeTab} onTabChange={onTabChange} />
      <main className="p-4">
        <Suspense fallback={<LoadingSpinner />}>{renderContent()}</Suspense>
      </main>
    </div>
  );
}
