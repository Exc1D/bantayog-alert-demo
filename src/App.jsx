import { useState, useEffect, useCallback, lazy, Suspense, useTransition } from 'react';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import TabNavigation from './components/Layout/TabNavigation';
import Footer from './components/Layout/Footer';
import LoadingSpinner from './components/Common/LoadingSpinner';
import ErrorBoundary from './components/Common/ErrorBoundary';
import MapErrorBoundary from './components/Map/MapErrorBoundary';
import ReportFormErrorBoundary from './components/Reports/ReportFormErrorBoundary';
import OfflineIndicator from './components/Common/OfflineIndicator';
import { AuthProvider } from './contexts/AuthContext';
import { ReportsProvider } from './contexts/ReportsContext';
import { MapPanelProvider } from './contexts/MapPanelContext';
import { ToastProvider } from './components/Common/Toast';
import { ThemeProvider } from './contexts/ThemeContext';
import SignUpPromptModal from './components/Common/SignUpPromptModal';
import BottomSheet from './components/Common/BottomSheet';
import ReportDetailCard from './components/Feed/ReportDetailCard';

const MapTab = lazy(() => import('./pages/MapTab'));
const FeedTab = lazy(() => import('./pages/FeedTab'));
const WeatherTab = lazy(() => import('./pages/WeatherTab'));
const AlertsTab = lazy(() => import('./pages/AlertsTab'));
const ProfileTab = lazy(() => import('./pages/ProfileTab'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const ReportModal = lazy(() => import('./components/Reports/ReportModal'));

const VALID_TABS = ['map', 'feed', 'weather', 'alerts', 'profile', 'admin'];

const TAB_TITLES = {
  map: 'Map - BANTAYOG ALERT',
  feed: 'Feed - BANTAYOG ALERT',
  weather: 'Weather - BANTAYOG ALERT',
  alerts: 'Alerts - BANTAYOG ALERT',
  profile: 'Profile - BANTAYOG ALERT',
  admin: 'Admin Dashboard - BANTAYOG ALERT',
};

function getTabFromHash() {
  const hash = window.location.hash.replace('#', '');
  return VALID_TABS.includes(hash) ? hash : 'map';
}

function AppContent() {
  const [activeTab, setActiveTab] = useState(getTabFromHash);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showSignUpPrompt, setShowSignUpPrompt] = useState(false);
  const [, startTransition] = useTransition();
  const [selectedPinReport, setSelectedPinReport] = useState(null);

  // Sync tab changes to URL hash + browser history
  const changeTab = useCallback((tab) => {
    const validTab = VALID_TABS.includes(tab) ? tab : 'map';
    startTransition(() => {
      setActiveTab(validTab);
    });
    const newHash = `#${validTab}`;
    if (window.location.hash !== newHash) {
      window.history.pushState(null, '', newHash);
    }
  }, []);

  // Listen for browser back/forward navigation (popstate)
  useEffect(() => {
    const handlePopState = () => {
      setActiveTab(getTabFromHash());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Set initial hash on mount if not already present
  useEffect(() => {
    if (!window.location.hash) {
      window.history.replaceState(null, '', '#map');
    }
  }, []);

  // Update document title on tab change
  useEffect(() => {
    document.title = TAB_TITLES[activeTab] || 'BANTAYOG ALERT';
  }, [activeTab]);

  const handleViewMap = () => {
    changeTab('map');
  };

  const openSignUpPrompt = () => {
    setShowSignUpPrompt(true);
  };

  const handleSignUpNow = () => {
    setShowSignUpPrompt(false);
    changeTab('profile');
  };

  const handleOpenProfileTab = () => {
    changeTab('profile');
  };

  const handleOpenReportModal = () => setShowReportModal(true);

  const renderTab = () => {
    switch (activeTab) {
      case 'map':
        return (
          <MapErrorBoundary>
            <MapTab
              onViewReport={(report) => setSelectedPinReport(report)}
              selectedReport={selectedPinReport}
            />
          </MapErrorBoundary>
        );
      case 'feed':
        return <FeedTab onViewMap={handleViewMap} onRequireSignUp={openSignUpPrompt} />;
      case 'weather':
        return <WeatherTab />;
      case 'alerts':
        return <AlertsTab />;
      case 'profile':
        return <ProfileTab />;
      case 'admin':
        return <AdminDashboardPage />;
      default:
        return (
          <MapErrorBoundary>
            <MapTab
              onViewReport={(report) => setSelectedPinReport(report)}
              selectedReport={selectedPinReport}
            />
          </MapErrorBoundary>
        );
    }
  };

  return (
    <div className="min-h-screen bg-topo dark:bg-topo flex flex-col transition-colors">
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-accent focus:text-white focus:rounded-lg focus:font-semibold focus:text-sm"
      >
        Skip to main content
      </a>
      <OfflineIndicator />
      <Header onProfileClick={handleOpenProfileTab} />

      {/* Desktop Sidebar - Sidebar handles its own responsive visibility */}
      <Sidebar activeTab={activeTab} onTabChange={changeTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0 lg:ml-56" id="main-content">
        {/* Mobile Tab Navigation - hidden on desktop */}
        <div className="lg:hidden">
          <TabNavigation activeTab={activeTab} onTabChange={changeTab} />
        </div>

        <main id={`tabpanel-${activeTab}`} className="flex-1 flex flex-col min-h-0">
          <Suspense
            fallback={
              <div className="h-[calc(100vh-112px)] lg:h-[calc(100vh-56px)] flex items-center justify-center">
                <LoadingSpinner />
              </div>
            }
          >
            {renderTab()}
          </Suspense>
        </main>
      </div>

      {activeTab !== 'profile' && <Footer className="lg:hidden" />}

      {/* Emergency Report Button */}
      <button
        onClick={handleOpenReportModal}
        className="fixed bottom-6 right-4 z-50 flex items-center gap-2 report-btn-glow text-white rounded-full emergency-pulse transition-all duration-200 px-5 py-3.5 sm:px-6"
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
      {showReportModal && (
        <Suspense fallback={null}>
          <ReportFormErrorBoundary>
            <ReportModal
              isOpen={showReportModal}
              onClose={() => setShowReportModal(false)}
              onAnonymousReportSubmitted={openSignUpPrompt}
            />
          </ReportFormErrorBoundary>
        </Suspense>
      )}

      {selectedPinReport && (
        <BottomSheet
          isOpen={!!selectedPinReport}
          onClose={() => setSelectedPinReport(null)}
          title="Report Details"
        >
          <ReportDetailCard
            report={selectedPinReport}
            onViewFull={() => {
              setSelectedPinReport(null);
              changeTab('feed');
            }}
          />
        </BottomSheet>
      )}

      <SignUpPromptModal
        isOpen={showSignUpPrompt}
        onClose={() => setShowSignUpPrompt(false)}
        onSignUpNow={handleSignUpNow}
      />
    </div>
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
                <AppContent />
              </MapPanelProvider>
            </ReportsProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
