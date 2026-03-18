import { Link } from 'react-router-dom';
import PhotoGrid from './PhotoGrid';
import { formatTimeAgo } from '../../utils/timeUtils';

const SEVERITY_STRIP = {
  critical: 'bg-urgent',
  moderate: 'bg-moderate',
  minor: 'bg-moderate',
  resolved: 'bg-resolved',
  default: 'bg-text-tertiary',
};

const SEVERITY_BADGE = {
  critical: 'bg-urgent/10 text-urgent',
  moderate: 'bg-moderate/10 text-moderate',
  minor: 'bg-moderate/10 text-moderate',
};

const STATUS_BADGE = {
  verified: 'bg-shell/10 text-text-secondary',
  pending: 'bg-text-tertiary/10 text-text-tertiary',
  resolved: 'bg-resolved/10 text-resolved',
};

export default function FeedPost({ report, onViewResolution }) {
  const {
    id,
    disaster = {},
    location = {},
    verification = {},
    timestamp,
    photoUrls = [],
    upvotes = [],
  } = report;

  const isResolved = verification.status === 'resolved';
  const severity = isResolved ? 'resolved' : (disaster.severity ?? 'default');
  const stripColor = SEVERITY_STRIP[severity] ?? SEVERITY_STRIP.default;
  const normalizedTimestamp =
    timestamp && !timestamp.toDate && timestamp.seconds
      ? new Date(timestamp.seconds * 1000)
      : timestamp;
  const timeAgo = formatTimeAgo(normalizedTimestamp);

  return (
    <article className="bg-surface shadow-card overflow-hidden">
      {/* 3px severity strip */}
      <div className={`h-1 ${stripColor}`} aria-hidden="true" />

      <div className="px-4 pt-3 pb-2">
        {/* Header row */}
        <div className="flex items-start gap-3 mb-2">
          {/* Type icon circle */}
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0
              ${SEVERITY_BADGE[disaster.severity ?? 'minor'] ?? 'bg-text-tertiary/10 text-text-tertiary'}`}
          >
            {/* Alert triangle */}
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
              <span className="font-bold text-sm text-text-primary">{disaster.type}</span>
              {disaster.severity && !isResolved && (
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded capitalize
                  ${SEVERITY_BADGE[disaster.severity] ?? ''}`}
                >
                  {disaster.severity}
                </span>
              )}
              {isResolved && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-resolved/10 text-resolved">
                  Resolved
                </span>
              )}
              <span
                className={`text-[10px] font-medium px-1.5 py-0.5 rounded capitalize
                ${STATUS_BADGE[verification.status] ?? ''}`}
              >
                {verification.status}
              </span>
            </div>
            <p className="text-xs text-text-tertiary">
              {[location.barangay, location.municipality].filter(Boolean).join(', ')} · {timeAgo}
            </p>
          </div>
        </div>

        {/* Description */}
        {disaster.description && (
          <p className="text-sm text-text-secondary leading-relaxed mb-3 line-clamp-3">
            {disaster.description}
          </p>
        )}
      </div>

      {/* Photo grid — full bleed */}
      {photoUrls.length > 0 && <PhotoGrid photos={photoUrls} />}

      {/* Engagement bar */}
      <div className="px-4 py-2.5 flex items-center gap-4 border-t border-black/5">
        {/* Upvote */}
        <div className="flex items-center gap-1.5 text-text-tertiary">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z" />
            <path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3" />
          </svg>
          <span className="text-xs">{upvotes.length}</span>
        </div>

        {/* Share */}
        <div className="flex items-center gap-1.5 text-text-tertiary">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          <span className="text-xs">Share</span>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Resolved: view resolution */}
        {isResolved && (
          <button
            type="button"
            onClick={() => onViewResolution?.(report)}
            className="text-xs text-resolved font-semibold"
            aria-label="View resolution"
          >
            View resolution →
          </button>
        )}

        {/* View full report */}
        <Link
          to={`/report/${id}`}
          className="text-xs text-text-tertiary font-medium"
          aria-label="View full report"
        >
          View full report →
        </Link>
      </div>
    </article>
  );
}
