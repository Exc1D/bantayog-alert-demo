import { Link } from 'react-router-dom';
import { formatTimeAgo } from '../../utils/timeUtils';

const STRIP = {
  critical: 'bg-urgent',
  moderate: 'bg-moderate',
  minor: 'bg-moderate',
};

function normalizeTimestamp(ts) {
  if (!ts) return null;
  if (ts.toDate) return ts.toDate();
  if (ts.seconds) return new Date(ts.seconds * 1000);
  return ts;
}

export default function QueueItem({ report, onVerify, onReject }) {
  const { id, disaster = {}, location = {}, timestamp, media = {} } = report;
  const photos = media.photos ?? [];
  const strip = STRIP[disaster.severity] ?? 'bg-text-tertiary';
  const timeAgo = formatTimeAgo(normalizeTimestamp(timestamp));

  return (
    <div className="bg-surface shadow-card overflow-hidden flex">
      {/* Severity strip */}
      <div className={`w-1 flex-shrink-0 ${strip}`} aria-hidden="true" />

      <div className="flex-1 min-w-0">
        {/* Card body — tap to open detail */}
        <Link
          to={`/admin/report/${id}`}
          className="block px-4 pt-3 pb-2"
          aria-label={`View ${disaster.type} report`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-bold text-text-primary">{disaster.type}</p>
              <p className="text-xs text-text-tertiary mt-0.5">
                {location.municipality} · {timeAgo}
                {photos.length > 0 && ` · ${photos.length} photo${photos.length > 1 ? 's' : ''}`}
              </p>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-1 rounded capitalize flex-shrink-0
              ${disaster.severity === 'critical' ? 'bg-urgent/10 text-urgent' : 'bg-moderate/10 text-moderate'}`}
            >
              {disaster.severity}
            </span>
          </div>
          {disaster.description && (
            <p className="text-xs text-text-secondary mt-1.5 line-clamp-1">
              {disaster.description}
            </p>
          )}
        </Link>

        {/* Inline action buttons */}
        <div className="flex gap-2 px-4 pb-3">
          <button
            type="button"
            onClick={() => onReject?.(id)}
            className="flex-1 py-2 rounded-lg border-2 border-urgent/30 text-urgent text-xs font-semibold"
            aria-label="Reject"
          >
            Reject
          </button>
          <button
            type="button"
            onClick={() => onVerify?.(id)}
            className="flex-1 py-2 rounded-lg bg-shell text-white text-xs font-semibold"
            aria-label="Verify"
          >
            Verify
          </button>
        </div>
      </div>
    </div>
  );
}
