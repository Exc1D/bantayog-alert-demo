import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../utils/firebaseConfig';
import { useMapPanel } from '../../contexts/MapPanelContext';
import {
  Drop, Fire, Car, Users, Warning, Question,
  CheckCircle, Clock, Article,
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

function severityDot(severity) {
  const colors = {
    critical: 'bg-red-500',
    moderate: 'bg-amber-500',
    minor: 'bg-emerald-500',
  };
  return colors[severity] ?? 'bg-gray-400';
}

function FeedItem({ report, onExpand }) {
  const Icon = DISASTER_ICONS[report.disaster?.type] ?? Question;
  const isResolved = report.verification?.status === 'resolved';

  return (
    <div
      className="flex items-start gap-3 p-3 hover:bg-stone-50 dark:hover:bg-dark-elevated cursor-pointer transition-colors border-l-2 border-transparent hover:border-border dark:hover:border-dark-border"
      onClick={() => onExpand(report)}
      role="article"
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                      ${isResolved ? 'bg-success/10 text-success' : 'bg-accent/10 text-accent'}`}>
        <Icon size={16} weight="fill" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text dark:text-dark-text capitalize">
            {report.disaster?.type ?? 'Unknown'}
          </span>
          <span className={`w-1.5 h-1.5 rounded-full ${severityDot(report.disaster?.severity)}`} />
          <span className="text-xs text-textLight dark:text-dark-textLight">{report.location?.municipality}</span>
        </div>
        <div className="flex items-center gap-1 mt-0.5 text-xs text-textLight dark:text-dark-textLight">
          <Clock size={12} aria-hidden="true" />
          <span>{timeAgo(report.timestamp)}</span>
          {isResolved && (
            <>
              <CheckCircle size={12} className="text-success ml-1" aria-hidden="true" />
              <span className="text-success">Resolved</span>
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
    <div className="border-t border-border/60 dark:border-dark-border">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3 hover:bg-stone-50 dark:hover:bg-dark-elevated transition-colors"
      >
        <div className="w-6 h-6 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
          <Icon size={12} weight="fill" className="text-success" aria-hidden="true" />
        </div>
        <span className="text-xs text-textLight dark:text-dark-textLight flex-1 text-left capitalize">
          {report.disaster?.type}
        </span>
        <span className="text-xs text-textLight dark:text-dark-textLight">{report.location?.municipality}</span>
        <span className="text-xs text-textLight dark:text-dark-textLight">{timeAgo(report.timestamp)}</span>
      </button>
      {expanded && report.verification?.resolution?.resolutionNotes && (
        <div className="px-3 pb-3 pl-9 border-l-2 border-success/30">
          <p className="text-xs text-textLight dark:text-dark-textLight italic">
            {report.verification.resolution.resolutionNotes}
          </p>
        </div>
      )}
    </div>
  );
}

export default function FeedPanel() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { setSelectedReportId, setIncidentDetailReport } = useMapPanel();

  useEffect(() => {
    const q = query(
      collection(db, 'reports'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((d) => ({ ...d.data(), id: d.id }));
      setReports(docs);
      setLoading(false);
      setError(null);
    }, (err) => {
      console.error('FeedPanel Firestore error:', err);
      setError('Failed to load reports. Check your connection.');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const activeReports = reports.filter((r) => r.verification?.status !== 'resolved');
  const resolvedReports = reports.filter((r) => r.verification?.status === 'resolved');
  const [showResolved, setShowResolved] = useState(false);

  function handleExpand(report) {
    setIncidentDetailReport(report);
    setSelectedReportId(report.id);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col gap-2 items-center text-textLight dark:text-dark-textLight">
          <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-textLight dark:text-dark-textLight px-4 text-center">
        <Article size={32} aria-hidden="true" />
        <p className="text-sm font-medium text-text dark:text-dark-text">{error}</p>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-textLight dark:text-dark-textLight">
        <Article size={32} aria-hidden="true" />
        <p className="text-sm font-medium text-text dark:text-dark-text">No reports yet</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      {activeReports.map((report) => (
        <FeedItem key={report.id} report={report} onExpand={handleExpand} />
      ))}
      {resolvedReports.length > 0 && (
        <div className="border-t border-border/60 dark:border-dark-border">
          <button
            type="button"
            onClick={() => setShowResolved(!showResolved)}
            className="w-full px-3 py-2 text-xs text-textLight dark:text-dark-textLight hover:text-text dark:hover:text-dark-text
                       hover:bg-stone-50 dark:hover:bg-dark-elevated transition-colors text-left"
          >
            Show resolved ({resolvedReports.length})
          </button>
          {showResolved && resolvedReports.map((report) => (
            <ResolvedItem key={report.id} report={report} />
          ))}
        </div>
      )}
    </div>
  );
}
