import { useState, useEffect } from 'react';
import { useReports } from '../hooks/useReports';
import CriticalAlertBanner from '../components/Map/CriticalAlertBanner';
import MapSkeleton from '../components/Map/MapSkeleton';
import { useMapPanel } from '../contexts/MapPanelContext';
import useIsLg from '../hooks/useIsLg';
import UrgencyHome from './UrgencyHome';
import FloatingReportButton from '../components/Layout/FloatingReportButton';

// LeafletMap is imported statically but the route is lazy-loaded (React.lazy
// in App.jsx), so Leaflet only parses when the Map tab is first visited.
// The 50ms delay gives MapSkeleton one paint frame before the heavier
// Leaflet render begins.
import LeafletMap from '../components/Map/LeafletMap';

export default function MapTab() {
  const [mapReady, setMapReady] = useState(false);
  const [showUrgency, setShowUrgency] = useState(true);
  const { reports } = useReports();
  const { setMapMode } = useMapPanel();
  const isLg = useIsLg();

  useEffect(() => setMapMode('full'), [setMapMode]);

  useEffect(() => {
    // Small delay to let the skeleton paint before the heavier map render begins
    const id = setTimeout(() => setMapReady(true), 50);
    return () => clearTimeout(id);
  }, []);

  return (
    <div className="flex flex-col h-full relative">
      <CriticalAlertBanner reports={reports} />

      {/* Mobile urgency home screen */}
      {!isLg && showUrgency && (
        <UrgencyHome onDismiss={() => setShowUrgency(false)} />
      )}

      {/* Mobile map-dominant view */}
      {!isLg && !showUrgency && (
        <div className="flex-1 relative overflow-hidden">
          {!mapReady && <MapSkeleton />}
          {mapReady && <LeafletMap reports={reports} />}
          <FloatingReportButton />
        </div>
      )}

      {/* Desktop layout — map always visible via PersistentMapPanel */}
      {isLg && (
        <div className="flex-1 relative overflow-hidden">
          {!mapReady && <MapSkeleton />}
          {mapReady && <LeafletMap reports={reports} />}
        </div>
      )}
    </div>
  );
}
