import { useState, useCallback, useEffect } from 'react';
import IconSidebar from './IconSidebar';
import PersistentMapPanel from './PersistentMapPanel';
import RightPanel from '../RightPanel/RightPanel';
import TabNavigation from './TabNavigation';
import { useMapPanel } from '../../contexts/MapPanelContext';

// Detect desktop breakpoint — use a ref to avoid stale closures
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 1024);
  useEffect(() => {
    function onResize() {
      setIsDesktop(window.innerWidth >= 1024);
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return isDesktop;
}

export default function AppShell({ children, activeTab, onTabChange }) {
  useMapPanel(); // Ensure context is initialized
  const isDesktop = useIsDesktop();
  const [mapWidth, setMapWidth] = useState(() => Math.floor(window.innerWidth * 0.38));
  const [isResizing, setIsResizing] = useState(false);

  // Sync hash changes back to parent
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') || 'map';
      const tab = hash.replace('/', '');
      if (tab !== activeTab) onTabChange(tab);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [activeTab, onTabChange]);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsResizing(true);
    const startX = e.clientX;
    const startWidth = mapWidth;
    function onMove(e) {
      const delta = e.clientX - startX;
      setMapWidth(Math.max(200, Math.min(window.innerWidth - 480, startWidth + delta)));
    }
    function onUp() {
      setIsResizing(false);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [mapWidth]);

  // Desktop layout: IconSidebar | [MapPanel | ResizeHandle] | RightPanel
  if (isDesktop) {
    return (
      <div className="flex h-dvh bg-bg dark:bg-dark-bg overflow-hidden">
        <IconSidebar activeTab={activeTab} onTabChange={onTabChange} />
        <>
          <PersistentMapPanel style={{ width: mapWidth }} />
          <div
            className={`w-1 flex-shrink-0 cursor-col-resize bg-border dark:bg-dark-border ${isResizing ? 'bg-accent/50' : ''}`}
            onMouseDown={handleMouseDown}
            role="separator"
            aria-orientation="vertical"
          />
        </>
        <RightPanel className="flex-1" />
      </div>
    );
  }

  // Mobile layout: TabNavigation + page content (children = renderTab() output)
  return (
    <div className="flex flex-col h-dvh bg-bg dark:bg-dark-bg overflow-hidden">
      <main className="flex-1 overflow-hidden flex flex-col">
        {children}
      </main>
      <TabNavigation activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  );
}
