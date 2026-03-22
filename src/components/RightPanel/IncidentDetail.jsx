import { useEffect } from 'react';
import { MapPin, Clock, ArrowLeft, CheckCircle } from '@phosphor-icons/react';
import { useMapPanel } from '../../contexts/MapPanelContext';
import { useReports } from '../../hooks/useReports';

function timeAgo(ts) {
  if (!ts?.seconds) return '';
  const s = Math.floor(Date.now() / 1000 - ts.seconds);
  if (s < 60) return 'Just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function IncidentDetail() {
  const { incidentDetailReport, setIncidentDetailReport, setSelectedReportId } = useMapPanel();
  const { reports } = useReports();

  const report = reports?.find((r) => r.id === incidentDetailReport?.id) ?? incidentDetailReport;

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        setIncidentDetailReport(null);
        setSelectedReportId(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setIncidentDetailReport, setSelectedReportId]);

  if (!report) return <div className="p-4 text-text-muted-dark text-sm">Select a report</div>;

  const isResolved = report.status === 'resolved';
  const severityColors = {
    critical: 'bg-emergency/20 text-emergency dark:text-emergency-dark',
    urgent: 'bg-warning-amber/20 text-warning-amber',
    low: 'bg-blue-500/20 text-blue-500',
  };
  const sevColor = severityColors[report.disaster?.severity] ?? severityColors.low;

  return (
    <div className="flex flex-col h-full bg-surface-dark dark:bg-surface-dark overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 border-b border-border-dark flex-shrink-0">
        <button
          type="button"
          onClick={() => {
            setIncidentDetailReport(null);
            setSelectedReportId(null);
          }}
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-dark/50 text-text-muted-dark hover:text-text-dark transition-colors"
          aria-label="Back"
        >
          <ArrowLeft size={18} aria-hidden="true" />
        </button>
        <div className="flex-1">
          <h2 className="text-sm font-bold text-text-dark capitalize">
            {report.disaster?.type ?? 'Incident'}
          </h2>
          <p className="text-xs text-text-muted-dark">{report.municipality}</p>
        </div>
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${isResolved ? 'bg-safe/20 text-safe' : sevColor}`}
        >
          {isResolved ? 'Resolved' : report.disaster?.severity}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
        <div className="flex items-start gap-2">
          <MapPin
            size={16}
            className="text-text-muted-dark flex-shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div>
            <p className="text-sm text-text-dark">{report.municipality}</p>
            {report.location && (
              <p className="text-xs text-text-muted-dark font-mono">
                {report.location.lat?.toFixed(5)}, {report.location.lng?.toFixed(5)}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-text-muted-dark" aria-hidden="true" />
          <span className="text-xs text-text-muted-dark">{timeAgo(report.createdAt)}</span>
        </div>
        {report.disaster?.description && (
          <p className="text-sm text-text-dark leading-relaxed">{report.disaster.description}</p>
        )}
        {report.photoURLs?.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {report.photoURLs.map((url, i) => (
              <div key={i} className="aspect-square bg-surface-dark rounded-lg overflow-hidden">
                <img
                  src={url}
                  alt={`Evidence ${i + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        )}
        {isResolved && report.resolutionNote && (
          <div className="mt-2 p-3 bg-safe/10 border-l-2 border-safe rounded">
            <p className="text-xs font-semibold text-safe flex items-center gap-1 mb-1">
              <CheckCircle size={14} aria-hidden="true" />
              Resolution
            </p>
            <p className="text-sm text-text-dark">{report.resolutionNote}</p>
          </div>
        )}
      </div>
    </div>
  );
}
