import { ArrowLeft, MapPin, Clock, CheckCircle } from '@phosphor-icons/react';
import { Warning, Drop, Fire, Car, Users, Question } from '@phosphor-icons/react';
import { useMapPanel } from '../../contexts/MapPanelContext';

const DISASTER_ICONS = {
  flooding: Drop,
  landslide: Warning,
  fire: Fire,
  accident: Car,
  crowding: Users,
  other: Question,
};

function timeAgo(timestamp) {
  if (!timestamp?.seconds) return '';
  const seconds = Math.floor(Date.now() / 1000 - timestamp.seconds);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function IncidentDetail() {
  const { incidentDetailReport, setIncidentDetailReport, setSelectedReportId } = useMapPanel();

  if (!incidentDetailReport) return null;

  const report = incidentDetailReport;
  const Icon = DISASTER_ICONS[report.disaster?.type] ?? Warning;

  function handleBack() {
    setIncidentDetailReport(null);
    setSelectedReportId(null);
  }

  return (
    <div className="flex flex-col h-full bg-surface-dark dark:bg-surface-dark overflow-hidden">
      <div className="flex items-center gap-3 p-3 border-b border-border-dark flex-shrink-0">
        <button
          type="button"
          onClick={handleBack}
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-dark/50 text-text-muted-dark hover:text-text-dark transition-colors"
          aria-label="Back to feed"
        >
          <ArrowLeft size={18} aria-hidden="true" />
        </button>
        <div className="flex-1">
          <h2 className="text-sm font-bold text-text-dark dark:text-text-dark capitalize">{report.disaster?.type ?? 'Incident'}</h2>
          <p className="text-xs text-text-muted-dark dark:text-text-muted-dark">{report.municipality}</p>
        </div>
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${report.status === 'resolved' ? 'bg-safe/20 text-safe' : report.disaster?.severity === 'critical' ? 'bg-emergency/20 text-emergency dark:text-emergency-dark' : 'bg-warning-amber/20 text-warning-amber'}`}>
          {report.status === 'resolved' ? 'Resolved' : report.disaster?.severity}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
        <div className="flex items-start gap-2">
          <MapPin size={16} className="text-text-muted-dark dark:text-text-muted-dark flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-sm text-text-dark dark:text-text-dark">{report.municipality}</p>
            {report.location && <p className="text-xs text-text-muted-dark dark:text-text-muted-dark font-mono">{report.location.lat?.toFixed(5)}, {report.location.lng?.toFixed(5)}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-text-muted-dark dark:text-text-muted-dark" aria-hidden="true" />
          <span className="text-xs text-text-muted-dark dark:text-text-muted-dark">{timeAgo(report.createdAt)}</span>
        </div>
        {report.disaster?.description && (
          <p className="text-sm text-text-dark dark:text-text-dark leading-relaxed">{report.disaster.description}</p>
        )}
        {report.photoURLs?.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {report.photoURLs.map((url, i) => (
              <div key={i} className="aspect-square bg-surface-dark dark:bg-surface-dark rounded-lg overflow-hidden">
                <img src={url} alt={`Evidence ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
              </div>
            ))}
          </div>
        )}
        {report.status === 'resolved' && report.resolutionNote && (
          <div className="mt-2 p-3 bg-safe/10 border-l-2 border-safe rounded">
            <p className="text-xs font-semibold text-safe flex items-center gap-1 mb-1">
              <CheckCircle size={14} aria-hidden="true" />
              Resolution
            </p>
            <p className="text-sm text-text-dark dark:text-text-dark">{report.resolutionNote}</p>
          </div>
        )}
      </div>
    </div>
  );
}
