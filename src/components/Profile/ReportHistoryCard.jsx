import { getDisasterType } from '../../data/disasterTypes';
import { formatTimeAgo } from '../../utils/timeUtils';

const STATUS_STYLES = {
  verified: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  resolved: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
};

const STATUS_DOTS = {
  verified: '✓',
  pending: '⏳',
  resolved: '✓',
};

export default function ReportHistoryCard({ report }) {
  const disasterType = getDisasterType(report.disaster?.type);
  const status = report.verification?.status || 'pending';
  const style = STATUS_STYLES[status] || STATUS_STYLES.pending;
  const dot = STATUS_DOTS[status] || STATUS_DOTS.pending;

  return (
    <div className="bg-white dark:bg-dark-card rounded-xl p-3 shadow-card border border-stone-100 dark:border-dark-border">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-lg">{disasterType?.icon || '🏷️'}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs uppercase tracking-wide dark:text-dark-text">
                {disasterType?.label || report.disaster?.type}
              </span>
              <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide ${style}`}>
                {dot} {status}
              </span>
            </div>
            <p className="text-[10px] text-textLight dark:text-dark-textLight mt-0.5">
              {report.location?.municipality} · {formatTimeAgo(report.timestamp)}
            </p>
          </div>
        </div>
      </div>
      {report.disaster?.description && (
        <p className="text-[11px] text-textLight dark:text-dark-textLight mt-1.5 line-clamp-2 pl-[30px]">
          {report.disaster.description}
        </p>
      )}
    </div>
  );
}
