import { lazy } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ReportsProvider } from './contexts/ReportsContext';
import { ToastProvider } from './components/Common/Toast';
import { ThemeProvider } from './contexts/ThemeContext';
import ErrorBoundary from './components/Common/ErrorBoundary';
import AppShell from './components/Layout/AppShell';
import AdminGuard from './components/Admin/AdminGuard';

// Citizen pages — lazy loaded per route
const MapTab = lazy(() => import('./pages/MapTab'));
const FeedTab = lazy(() => import('./pages/FeedTab'));
const AlertsTab = lazy(() => import('./pages/AlertsTab'));
const ProfileTab = lazy(() => import('./pages/ProfileTab'));
const ReportPage = lazy(() => import('./pages/ReportPage'));

// Admin — separate lazy chunk (zero bytes for citizens)
// NOTE: AdminShell is the pre-existing component, not the Phase 3 stub.
// Its internal tab navigation (activeTab/onTabChange props) is non-functional
// under the new router — it always renders AdminDashboard. This is intentional:
// admin tab routing will be rebuilt in Phase 3 using nested React Router routes.
const AdminShell = lazy(() => import('./components/Admin/AdminShell'));

const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { index: true, element: <MapTab /> },
      { path: 'feed', element: <FeedTab /> },
      { path: 'alerts', element: <AlertsTab /> },
      { path: 'profile', element: <ProfileTab /> },
      { path: 'report', element: <ReportPage /> },
      { path: 'report/:id', element: <ReportPage /> },
      {
        path: 'admin',
        element: <AdminGuard />,
        children: [
          { index: true, element: <AdminShell /> },
          { path: '*', element: <AdminShell /> },
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
