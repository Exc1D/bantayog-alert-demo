import { Outlet } from 'react-router-dom';
import useIsLg from '../../hooks/useIsLg';
import IconSidebar from './IconSidebar';
import PersistentMapPanel from '../Map/PersistentMapPanel';
import RightPanel from '../RightPanel/RightPanel';
import Header from './Header';
import TabNavigation from './TabNavigation';
import OfflineIndicator from '../Common/OfflineIndicator';

/**
 * Desktop (lg+): IconSidebar + PersistentMapPanel + RightPanel
 * Mobile: Header + Outlet + TabNavigation
 */
export default function AppShell() {
  const isLg = useIsLg();

  return (
    <div className="min-h-screen bg-topo dark:bg-topo transition-colors">
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-accent focus:text-white focus:rounded-lg focus:font-semibold focus:text-sm"
      >
        Skip to main content
      </a>

      <OfflineIndicator />

      {isLg ? (
        /* ── Desktop layout ── */
        <div className="flex h-screen pt-[60px]">
          <IconSidebar />
          <PersistentMapPanel className="flex-1 min-w-0" />
          <RightPanel />
        </div>
      ) : (
        /* ── Mobile layout ── */
        <div className="flex flex-col h-screen">
          <Header />
          <main id="main-content" className="flex-1 min-h-0 overflow-y-auto">
            <Outlet />
          </main>
          <TabNavigation />
        </div>
      )}
    </div>
  );
}
