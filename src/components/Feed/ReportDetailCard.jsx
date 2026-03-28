import { formatTimeAgo } from '../../utils/timeUtils';
import { sanitizeText } from '../../utils/sanitization';

export default function ReportDetailCard({ report, onViewFull }) {
  const sevStyles = {
    critical: 'bg-red-600 dark:bg-red-900 text-white dark:text-red-200',
    moderate: 'bg-amber-500 dark:bg-amber-700 text-white dark:text-amber-100',
    minor: 'bg-emerald-600 dark:bg-emerald-900 text-white dark:text-emerald-200',
  };
  const statusStyles = {
    pending: 'bg-stone-200 text-stone-700',
    verified: 'bg-blue-100 text-blue-700',
    rejected: 'bg-red-100 text-red-700',
    resolved: 'bg-emerald-100 text-emerald-700',
  };

  const disasterType = report.disaster?.type;
  const severity = report.disaster?.severity || 'minor';
  const status = report.verification?.status || 'pending';

  return (
    <div className="space-y-3">
      {/* Severity + Status row */}
      <div className="flex items-center gap-2">
        <span
          className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide ${sevStyles[severity]}`}
        >
          {severity}
        </span>
        <span
          className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide ${statusStyles[status]}`}
        >
          {status}
        </span>
      </div>

      {/* Disaster type */}
      <div>
        <h3 className="font-bold text-base text-text dark:text-dark-text">
          {disasterType
            ? disasterType.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
            : 'Unknown Incident'}
        </h3>
        <p className="text-sm text-textLight dark:text-dark-textLight mt-0.5">
          {report.location?.municipality}
          {report.location?.barangay ? `, ${report.location?.barangay}` : ''}
        </p>
      </div>

      {/* Description */}
      {report.disaster?.description && (
        <p className="text-sm text-text dark:text-dark-text line-clamp-3">
          {report.disaster.description}
        </p>
      )}

      {/* Reporter — hide if anonymous */}
      {!report.reporter?.isAnonymous && report.reporter?.name && (
        <div className="flex items-center gap-2 pt-2 border-t border-stone-100 dark:border-dark-border">
          <span className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
            {sanitizeText(report.reporter.name).charAt(0).toUpperCase()}
          </span>
          <span className="text-sm font-medium text-text dark:text-dark-text">
            {sanitizeText(report.reporter.name)}
          </span>
        </div>
      )}

      {/* Timestamp */}
      <p className="text-xs text-textMuted dark:text-dark-textMuted">
        {report.timestamp ? formatTimeAgo(report.timestamp) : ''}
      </p>

      {/* Photo thumbnail */}
      {report.media?.thumbnails?.[0] && (
        <img
          src={report.media.thumbnails[0]}
          alt="Report photo"
          className="w-full h-32 object-cover rounded-lg"
          loading="lazy"
        />
      )}

      {/* View Full Report button */}
      <button
        onClick={onViewFull}
        className="w-full py-2.5 bg-primary text-white rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors"
      >
        View Full Report
      </button>
    </div>
  );
}
