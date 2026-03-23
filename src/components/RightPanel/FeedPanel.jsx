import { useState } from 'react';
import { Article, CheckCircle, Clock } from '@phosphor-icons/react';
import { Drop, Fire, Car, Users, Warning, Question } from '@phosphor-icons/react';
import { useReports } from '../../hooks/useReports';
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

function severityColor(severity) {
  switch (severity) {
    case 'critical':
      return 'bg-emergency dark:bg-emergency-dark';
    case 'urgent':
      return 'bg-warning-amber dark:bg-warning';
    case 'low':
      return 'bg-blue-500';
    default:
      return 'bg-gray-400';
  }
}

function FeedItem({ report, onSelect }) {
  const Icon = DISASTER_ICONS[report.disaster?.type] ?? Question;
  return (
    <div
      className="flex items-start gap-3 p-3 hover:bg-dark-bg/50 cursor-pointer transition-colors border-l-2 border-transparent hover:border-dark-border"
      onClick={() => onSelect(report)}
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${report.status === 'resolved' ? 'bg-safe/20 text-safe' : 'bg-emergency/10 text-emergency dark:text-emergency-dark'}`}
      >
        <Icon size={16} weight="fill" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-dark-text dark:text-dark-text capitalize">
            {report.disaster?.type ?? 'Unknown'}
          </span>
          <span
            className={`w-1.5 h-1.5 rounded-full ${severityColor(report.disaster?.severity)}`}
          />
          <span className="text-xs text-muted-dark dark:text-muted-dark">
            {report.municipality}
          </span>
        </div>
        <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-dark dark:text-muted-dark">
          <Clock size={12} aria-hidden="true" />
          <span>{timeAgo(report.createdAt)}</span>
          {report.status === 'resolved' && (
            <>
              <CheckCircle size={12} className="text-safe ml-1" aria-hidden="true" />
              <span className="text-safe">Resolved</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ResolvedItem({ report }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = DISASTER_ICONS[report.disaster?.type] ?? Question;
  return (
    <div className="border-t border-dark-border">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3 hover:bg-dark-bg/50 transition-colors"
      >
        <div className="w-6 h-6 rounded-full bg-safe/20 flex items-center justify-center flex-shrink-0">
          <Icon size={12} weight="fill" className="text-safe" aria-hidden="true" />
        </div>
        <span className="text-xs text-muted-dark dark:text-muted-dark flex-1 text-left capitalize">
          {report.disaster?.type}
        </span>
        <span className="text-xs text-muted-dark dark:text-muted-dark">{report.municipality}</span>
        <span className="text-xs text-muted-dark dark:text-muted-dark">
          {timeAgo(report.createdAt)}
        </span>
      </button>
      {expanded && (
        <div className="px-3 pb-3 pl-9 border-l-2 border-safe/30">
          <p className="text-xs text-muted-dark dark:text-muted-dark italic">
            {report.resolutionNote ?? 'No resolution notes provided.'}
          </p>
        </div>
      )}
    </div>
  );
}

export default function FeedPanel() {
  const { reports, loading } = useReports();
  const { setSelectedReportId } = useMapPanel();
  const [showResolved, setShowResolved] = useState(false);

  const activeReports = reports.filter((r) => r.status !== 'resolved');
  const resolvedReports = reports.filter((r) => r.status === 'resolved');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col gap-2 items-center text-muted-dark dark:text-muted-dark">
          <div className="w-6 h-6 border-2 border-text-muted-dark border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">Loading...</span>
        </div>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-dark dark:text-muted-dark">
        <Article size={32} aria-hidden="true" />
        <p className="text-sm font-medium">No reports yet</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      {activeReports.map((report) => (
        <FeedItem key={report.id} report={report} onSelect={(r) => setSelectedReportId(r.id)} />
      ))}
      {resolvedReports.length > 0 && (
        <div className="border-t border-dark-border">
          <button
            type="button"
            onClick={() => setShowResolved(!showResolved)}
            className="w-full px-3 py-2 text-xs text-muted-dark dark:text-muted-dark hover:text-dark-text dark:hover:text-dark-text hover:bg-dark-bg/30 transition-colors text-left"
          >
            Show resolved ({resolvedReports.length})
          </button>
          {showResolved &&
            resolvedReports.map((report) => <ResolvedItem key={report.id} report={report} />)}
        </div>
      )}
    </div>
  );
}
