import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useReports } from '../hooks/useReports';
import CriticalAlertBanner from '../components/Map/CriticalAlertBanner';
import MapSkeleton from '../components/Map/MapSkeleton';

// LeafletMap is imported statically but the route is lazy-loaded (React.lazy
// in App.jsx), so Leaflet only parses when the Map tab is first visited.
// The 50ms delay gives MapSkeleton one paint frame before the heavier
// Leaflet render begins.
import LeafletMap from '../components/Map/LeafletMap';

export default function MapTab() {
  const [mapReady, setMapReady] = useState(false);
  const { reports } = useReports();

  useEffect(() => {
    // Small delay to let the skeleton paint before the heavier map render begins
    const id = setTimeout(() => setMapReady(true), 50);
    return () => clearTimeout(id);
  }, []);

  return (
    <div className="flex flex-col h-full relative">
      <CriticalAlertBanner reports={reports} />

      {/* Map container */}
      <div className="flex-1 relative overflow-hidden">
        {!mapReady && <MapSkeleton />}
        {mapReady && <LeafletMap reports={reports} />}
      </div>

      {/* Floating report button */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000]">
        <Link
          to="/report"
          className="bg-urgent text-white font-bold text-sm px-6 py-3 rounded-full shadow-lg
                     flex items-center gap-2 active:scale-95 transition-transform"
        >
          {/* Exclamation triangle SVG */}
          <svg
            width="16"
            height="16"
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
          REPORT EMERGENCY
        </Link>
      </div>
    </div>
  );
}
