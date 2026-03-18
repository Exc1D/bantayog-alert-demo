import { useMapPanel } from '../../contexts/MapPanelContext';
import LeafletMap from './LeafletMap';

export default function PersistentMapPanel({ className }) {
  const { mapMode, highlightedReportId, reportLocations } = useMapPanel();

  if (mapMode === 'hidden') return null;

  return (
    <div className={`relative ${className ?? ''}`}>
      <LeafletMap reportLocations={reportLocations} flyToReportId={highlightedReportId} />
    </div>
  );
}
