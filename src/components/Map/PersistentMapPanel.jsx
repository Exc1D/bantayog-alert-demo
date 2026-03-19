import { useMapPanel } from '../../contexts/MapPanelContext';
import LeafletMap from './LeafletMap';

export default function PersistentMapPanel({ className }) {
  const { mapMode, highlightedReportId, reportLocations, reports } = useMapPanel();

  if (mapMode === 'hidden') return null;

  return (
    <div className={`relative ${className ?? ''}`}>
      <LeafletMap
        reports={reports}
        reportLocations={reportLocations}
        flyToReportId={highlightedReportId}
      />
    </div>
  );
}
