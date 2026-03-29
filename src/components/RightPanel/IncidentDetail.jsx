import { useMapPanel } from '../../contexts/MapPanelContext';
import {
  X,
  MapPin,
  Clock,
  Warning,
  CheckCircle,
  Drop,
  Fire,
  Car,
  Users,
  Question,
} from '@phosphor-icons/react';

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

export default function IncidentDetail({ className = '' }) {
  const { incidentDetailReport, setIncidentDetailReport, setSelectedReportId } = useMapPanel();

  if (!incidentDetailReport) return null;

  const report = incidentDetailReport;
  const Icon = DISASTER_ICONS[report.disaster?.type] ?? Question;
  const isResolved = report.verification?.status === 'resolved';

  function handleClose() {
    setIncidentDetailReport(null);
    setSelectedReportId(null);
  }

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-dark-card ${className}`}>
      <div className="flex items-center justify-between p-4 border-b border-border/60 dark:border-dark-border">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center
                          ${isResolved ? 'bg-success/10' : 'bg-accent/10'}`}
          >
            <Icon
              size={20}
              weight="fill"
              className={isResolved ? 'text-success' : 'text-accent'}
              aria-hidden="true"
            />
          </div>
          <div>
            <h2 className="text-base font-semibold text-text dark:text-dark-text capitalize">
              {report.disaster?.type ?? 'Unknown Incident'}
            </h2>
            <p className="text-xs text-textLight dark:text-dark-textLight">
              {report.location?.municipality}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface dark:hover:bg-dark-elevated transition-colors"
          aria-label="Close incident detail"
        >
          <X size={18} className="text-textLight dark:text-dark-textLight" aria-hidden="true" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="flex items-center gap-2">
          {isResolved ? (
            <>
              <CheckCircle size={16} className="text-success" aria-hidden="true" />
              <span className="text-xs font-medium text-success">Resolved</span>
            </>
          ) : (
            <>
              <Warning size={16} className="text-alertRed" aria-hidden="true" />
              <span className="text-xs font-medium text-alertRed capitalize">
                {report.verification?.status ?? 'Active'}
              </span>
            </>
          )}
          <span className="text-xs text-textLight dark:text-dark-textLight capitalize">
            — {report.disaster?.severity ?? 'Unknown'} severity
          </span>
        </div>

        <div className="flex items-start gap-2">
          <MapPin
            size={14}
            className="text-textLight dark:text-dark-textLight mt-0.5 flex-shrink-0"
            aria-hidden="true"
          />
          <div>
            <p className="text-sm text-text dark:text-dark-text">{report.location?.municipality}</p>
            {report.location?.barangay && (
              <p className="text-xs text-textLight dark:text-dark-textLight">
                {report.location.barangay}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Clock size={14} className="text-textLight dark:text-dark-textLight" aria-hidden="true" />
          <span className="text-sm text-text dark:text-dark-text">{timeAgo(report.timestamp)}</span>
        </div>

        {report.disaster?.description && (
          <div className="bg-surface dark:bg-dark-elevated rounded-lg p-3">
            <p className="text-sm text-text dark:text-dark-text">{report.disaster.description}</p>
          </div>
        )}

        <div className="border-t border-border/60 dark:border-dark-border pt-3">
          <p className="text-xs text-textLight dark:text-dark-textLight">
            Reported by{' '}
            <span className="font-medium text-text dark:text-dark-text">
              {report.reporter?.name ?? 'Anonymous'}
            </span>
          </p>
        </div>

        {isResolved && report.verification?.resolution?.resolutionNotes && (
          <div className="border-t border-border/60 dark:border-dark-border pt-3">
            <p className="text-xs text-textLight dark:text-dark-textLight mb-1">Resolution:</p>
            <p className="text-sm text-text dark:text-dark-text italic">
              {report.verification.resolution.resolutionNotes}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
