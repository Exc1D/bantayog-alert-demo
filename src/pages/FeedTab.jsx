import { useState, useEffect } from 'react';
import { useReports } from '../hooks/useReports';
import FeedPost from '../components/Feed/FeedPost';
import ResolutionSheet from '../components/Feed/ResolutionSheet';
import { useMapPanel } from '../contexts/MapPanelContext';

export default function FeedTab() {
  const { reports, loading } = useReports();
  const [resolutionReport, setResolutionReport] = useState(null);
  const { setMapMode, setReportLocations, setReports, setHighlightedReportId } = useMapPanel();

  useEffect(() => setMapMode('pins'), [setMapMode]);

  useEffect(() => {
    setReports(reports);
    setReportLocations(
      reports.map((r) => ({ id: r.id, lat: r.lat, lng: r.lng, severity: r.severity }))
    );
  }, [reports, setReports, setReportLocations]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-text-tertiary text-sm">
        Loading…
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-text-tertiary">
        <p className="text-sm font-medium">No reports yet</p>
        <p className="text-xs">Be the first to report an emergency.</p>
      </div>
    );
  }

  return (
    <>
      <div className="h-full overflow-y-auto bg-app-bg">
        <div className="flex flex-col gap-2 py-2">
          {reports.map((report) => (
            <FeedPost
              key={report.id}
              report={report}
              onViewResolution={setResolutionReport}
              onHover={(id) => setHighlightedReportId(id)}
            />
          ))}
        </div>
      </div>

      {resolutionReport && (
        <ResolutionSheet report={resolutionReport} onClose={() => setResolutionReport(null)} />
      )}
    </>
  );
}
