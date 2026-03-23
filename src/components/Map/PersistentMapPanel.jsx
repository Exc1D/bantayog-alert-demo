import { useEffect, useRef } from 'react';
import LeafletMap from './LeafletMap';
import MapSkeleton from './MapSkeleton';
import { useMapPanel } from '../../contexts/MapPanelContext';

export default function PersistentMapPanel({ className = '' }) {
  const { reports, highlightedReportId } = useMapPanel();
  const mapRef = useRef(null);

  return (
    <div className={`relative ${className}`}>
      <MapSkeleton />
      <LeafletMap reports={reports} highlightedReportId={highlightedReportId} />
    </div>
  );
}
