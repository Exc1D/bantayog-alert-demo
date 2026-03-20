import { useMapPanel } from '../../contexts/MapPanelContext';
import LeafletMap from './LeafletMap';

export default function PersistentMapPanel({ className, style }) {
  const { mapMode, highlightedReportId, reportLocations, reports } = useMapPanel();

  if (mapMode === 'hidden') return null;

  return (
    <div className={`relative ${className ?? ''}`} style={style}>
      <LeafletMap
        reports={reports}
        reportLocations={reportLocations}
        flyToReportId={highlightedReportId}
      />
    </div>
  );
}
