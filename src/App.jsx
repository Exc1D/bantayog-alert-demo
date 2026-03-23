import { lazy, Suspense, useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import ErrorBoundary from './components/Common/ErrorBoundary';
import MapErrorBoundary from './components/Map/MapErrorBoundary';
import ReportFormErrorBoundary from './components/Reports/ReportFormErrorBoundary';
import { AuthProvider } from './contexts/AuthContext';
import { ReportsProvider } from './contexts/ReportsContext';
import { MapPanelProvider } from './contexts/MapPanelContext';
import { ToastProvider } from './components/Common/Toast';
import { ThemeProvider } from './contexts/ThemeContext';
import SignUpPromptModal from './components/Common/SignUpPromptModal';
import AppShell from './components/Layout/AppShell';
import LoadingSpinner from './components/Common/LoadingSpinner';

const MapTab = lazy(() => import('./pages/MapTab'));
const FeedTab = lazy(() => import('./pages/FeedTab'));
const AlertsTab = lazy(() => import('./pages/AlertsTab'));
const WeatherTab = lazy(() => import('./pages/WeatherTab'));
const ProfileTab = lazy(() => import('./pages/ProfileTab'));
const ReportPage = lazy(() => import('./pages/ReportPage'));
const ReportModal = lazy(() => import('./components/Reports/ReportModal'));

const TAB_TITLES = {
  '/': 'Map - BANTAYOG ALERT',
  '/feed': 'Feed - BANTAYOG ALERT',
  '/alerts': 'Alerts - BANTAYOG ALERT',
  '/weather': 'Weather - BANTAYOG ALERT',
  '/profile': 'Profile - BANTAYOG ALERT',
  '/report': 'Report - BANTAYOG ALERT',
};

function DocumentTitleUpdater() {
  // Simple approach: update title based on current path
  const path = window.location.pathname;
  document.title = TAB_TITLES[path] || 'BANTAYOG ALERT';
  return null;
}

const LoadingFallback = () => (
  <div className="h-[calc(100vh-112px)] lg:h-[calc(100vh-56px)] flex items-center justify-center">
    <LoadingSpinner />
  </div>
);

function AppRoutes() {
  const navigate = useNavigate();
  const [showReportModal, setShowReportModal] = useState(false);
  const [showSignUpPrompt, setShowSignUpPrompt] = useState(false);

  const openSignUpPrompt = () => setShowSignUpPrompt(true);
  const closeSignUpPrompt = () => setShowSignUpPrompt(false);
  const handleSignUpNow = () => {
    setShowSignUpPrompt(false);
    navigate('/profile');
  };
  const handleOpenReportModal = () => setShowReportModal(true);

  return (
    <>
      <DocumentTitleUpdater />

      {/* Floating Report Button — mobile only */}
      <button
        onClick={handleOpenReportModal}
        className="fixed bottom-20 lg:bottom-6 right-4 z-50 flex items-center gap-2 report-btn-glow text-white rounded-full emergency-pulse transition-all duration-200 px-5 py-3.5 sm:px-6"
        aria-label="Report a hazard"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <span className="text-sm font-display tracking-wide">REPORT</span>
      </button>

      {/* Report Modal */}
      <Suspense fallback={null}>
        <ReportFormErrorBoundary>
          <ReportModal
            isOpen={showReportModal}
            onClose={() => setShowReportModal(false)}
            onAnonymousReportSubmitted={openSignUpPrompt}
          />
        </ReportFormErrorBoundary>
      </Suspense>

      <SignUpPromptModal
        isOpen={showSignUpPrompt}
        onClose={closeSignUpPrompt}
        onSignUpNow={handleSignUpNow}
      />

      <Routes>
        {/* AppShell wraps all main routes */}
        <Route element={<AppShell />}>
          <Route
            path="/"
            element={
              <MapErrorBoundary>
                <Suspense fallback={<LoadingFallback />}>
                  <MapTab onViewReport={() => {}} />
                </Suspense>
              </MapErrorBoundary>
            }
          />
          <Route
            path="/feed"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <FeedTab onViewMap={() => {}} onRequireSignUp={openSignUpPrompt} />
              </Suspense>
            }
          />
          <Route
            path="/alerts"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <AlertsTab />
              </Suspense>
            }
          />
          <Route
            path="/weather"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <WeatherTab />
              </Suspense>
            }
          />
          <Route
            path="/profile"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <ProfileTab />
              </Suspense>
            }
          />
          <Route
            path="/report"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <ReportPage />
              </Suspense>
            }
          />
        </Route>
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <ReportsProvider>
              <MapPanelProvider>
                <BrowserRouter>
                  <AppRoutes />
                </BrowserRouter>
              </MapPanelProvider>
            </ReportsProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
