import { useRef } from 'react';
import LeafletMap from '../Map/LeafletMap';
import { useMapPanel } from '../../contexts/MapPanelContext';

export default function PersistentMapPanel({ style }) {
  const { setSelectedReportId } = useMapPanel();
  const containerRef = useRef(null);

  return (
    <div ref={containerRef} style={style} className="relative flex-shrink-0">
      <LeafletMap
        reports={[]}
        onReportClick={(report) => setSelectedReportId(report.id)}
      />
    </div>
  );
}
