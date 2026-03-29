import { useRef, useMemo } from 'react';
import LeafletMap from '../Map/LeafletMap';
import { useMapPanel } from '../../contexts/MapPanelContext';
import { useReportsContext } from '../../contexts/ReportsContext';

export default function PersistentMapPanel({ style }) {
  const { setSelectedReportId, setIncidentDetailReport } = useMapPanel();
  const { reports } = useReportsContext();
  const containerRef = useRef(null);

  const mapReports = useMemo(
    () => reports.filter((r) => r.verification?.status !== 'resolved'),
    [reports]
  );

  return (
    <div ref={containerRef} style={style} className="relative flex-shrink-0">
      <LeafletMap
        reports={mapReports}
        onReportClick={(report) => {
          setSelectedReportId(report.id);
          setIncidentDetailReport(report);
        }}
      />
    </div>
  );
}
