import { Outlet } from 'react-router-dom';
import { Suspense, useState, useEffect, useRef } from 'react';
import Header from './Header';
import TabNavigation from './TabNavigation';
import EnhancedSidebar from './EnhancedSidebar';
import LoadingSpinner from '../Common/LoadingSpinner';
import PersistentMapPanel from '../Map/PersistentMapPanel';
import RightPanel from '../RightPanel/RightPanel';
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

  // Sidebar collapse state (default expanded = false)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const stored = localStorage.getItem('bantayog-sidebar-collapsed');
    return stored ? JSON.parse(stored) : false;
  });

  // Persist sidebar state
  useEffect(() => {
    localStorage.setItem('bantayog-sidebar-collapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  const toggleSidebar = () => setIsCollapsed((prev) => !prev);

  // Map panel resize state
  const [mapPanelWidth, setMapPanelWidth] = useState(() => {
    const stored = localStorage.getItem('bantayog-map-panel-width');
    return stored ? parseInt(stored, 10) : 45; // default 45%
  });

  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef(null);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    if (!isResizing) return;

    const handlePointerMove = (e) => {
      // Get clientX from mouse or touch event
      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      if (clientX == null) return;

      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const sidebarWidth = isCollapsed ? 44 : 180; // must match EnhancedSidebar widths
      const mapLeft = rect.left + sidebarWidth;
      const mapWidthPx = clientX - mapLeft;
      const availableWidth = rect.width - sidebarWidth;

      // Calculate percentage of available width
      const newWidthPercent = (mapWidthPx / availableWidth) * 100;
      // Clamp between 20% and 70%
      const clamped = Math.min(70, Math.max(20, newWidthPercent));
      setMapPanelWidth(clamped);
    };

    const handlePointerUp = () => {
      setIsResizing(false);
      localStorage.setItem('bantayog-map-panel-width', JSON.stringify(mapPanelWidth));
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('touchmove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchend', handlePointerUp);

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [isResizing, mapPanelWidth, isCollapsed]);

  if (isLg) {
    // Large desktop layout
    const showMapPanel = mapMode !== 'hidden';

    return (
      <div className="resizable-container flex h-dvh bg-app-bg overflow-hidden" ref={containerRef}>
        <EnhancedSidebar isCollapsed={isCollapsed} onToggle={toggleSidebar} />
        {showMapPanel && (
          <>
            <PersistentMapPanel
              style={{
                width: `${mapPanelWidth}%`,
                minWidth: '300px',
                maxWidth: '70%',
                transition: 'width 0.3s',
              }}
            />
            {/* Resize handle */}
            <div
              className={`w-1 cursor-col-resize bg-black/10 hover:bg-urgent/30 dark:bg-white/10 dark:hover:bg-urgent/30 transition-colors ${isResizing ? 'bg-urgent/50' : ''}`}
              onMouseDown={handleMouseDown}
              onTouchStart={handleMouseDown}
              aria-label="Resize map panel"
              role="separator"
              aria-orientation="vertical"
            />
          </>
        )}
        <main className={mapMode === 'full' ? 'hidden' : 'flex-1 overflow-hidden'}>
          <RightPanel />
        </main>
      </div>
    );
  }

  // Mobile layout
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

export default function AppShell({ initialMapMode = 'hidden' }) {
  return (
    <MapPanelProvider initialMapMode={initialMapMode}>
      <AppShellInner />
    </MapPanelProvider>
  );
}
