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
