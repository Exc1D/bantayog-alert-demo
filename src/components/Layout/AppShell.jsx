import { Outlet } from 'react-router-dom';
import { Suspense } from 'react';
import Header from './Header';
import TabNavigation from './TabNavigation';
import IconSidebar from './IconSidebar';
import LoadingSpinner from '../Common/LoadingSpinner';
import PersistentMapPanel from '../Map/PersistentMapPanel';
import { MapPanelProvider, useMapPanel } from '../../contexts/MapPanelContext';
import useIsLg from '../../hooks/useIsLg';

function PageFallback() {
  return (
    <div className="flex items-center justify-center h-full">
      <LoadingSpinner />
    </div>
  );
}

function AppShellInner() {
  const isLg = useIsLg();
  const { mapMode } = useMapPanel();

  if (isLg) {
    return (
      <div className="grid grid-cols-[44px_1fr] h-dvh bg-app-bg overflow-hidden">
        <IconSidebar />
        <div className="flex h-full overflow-hidden">
          <PersistentMapPanel className={mapMode === 'full' ? 'flex-1' : 'w-[45%]'} />
          <main
            role="main"
            className={mapMode === 'full' ? 'hidden' : 'flex-1 overflow-auto'}
          >
            <Suspense fallback={<PageFallback />}>
              <Outlet />
            </Suspense>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-dvh bg-app-bg overflow-hidden">
      <Header />
      <main role="main" className="flex-1 overflow-hidden relative">
        <Suspense fallback={<PageFallback />}>
          <Outlet />
        </Suspense>
      </main>
      <TabNavigation />
    </div>
  );
}

export default function AppShell() {
  return (
    <MapPanelProvider>
      <AppShellInner />
    </MapPanelProvider>
  );
}
