import { useState, useMemo } from 'react';
import { useReportsContext } from '../contexts/ReportsContext';
import LeafletMap from '../components/Map/LeafletMap';
import UrgencyHome from './UrgencyHome';
import FloatingReportButton from '../components/Layout/FloatingReportButton';
import useIsLg from '../hooks/useIsLg';

export default function MapTab({ onViewReport }) {
  const { reports } = useReportsContext();
  const [showUrgency, setShowUrgency] = useState(true);
  const isLg = useIsLg();

  // Filter out resolved reports — resolved pins should not appear on the map
  const mapReports = useMemo(() => {
    return reports.filter((report) => report.verification?.status !== 'resolved');
  }, [reports]);

  const showMap = isLg || !showUrgency;

  return (
    <div className="flex-1 min-h-0 relative isolate overflow-hidden">
      {showMap && <LeafletMap reports={mapReports} onReportClick={onViewReport} />}
      {!isLg && !showUrgency && <FloatingReportButton />}
      {!isLg && showUrgency && <UrgencyHome onDismiss={() => setShowUrgency(false)} />}
    </div>
  );
}
