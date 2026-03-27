import { useState, memo } from 'react';
import { getDisasterType } from '../../data/disasterTypes';
import { formatTimeAgo } from '../../utils/timeUtils';
import EngagementButtons from './EngagementButtons';
import { getSafeMediaUrls } from '../../utils/mediaSafety';
import { sanitizeText } from '../../utils/sanitization';
import ShareButton from '../Common/ShareButton';
import DisasterIcon from '../Common/DisasterIcon';

function SeverityBadge({ severity }) {
  const styles = {
    critical: 'bg-accent text-white',
    moderate: 'bg-warning text-white',
    minor: 'bg-success text-white',
  };
  return (
    <span
      className={`${styles[severity] || styles.minor} px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wide`}
    >
      {severity}
    </span>
  );
}

function StatusBadge({ status }) {
  const styles = {
    pending: 'bg-surface text-text dark:bg-dark-elevated dark:text-dark-text',
    verified: 'bg-blue-100 text-primary dark:bg-blue-900/40 dark:text-blue-400',
    rejected: 'bg-red-100 text-accent dark:bg-red-900/40 dark:text-red-300',
    resolved: 'bg-emerald-100 text-success dark:bg-emerald-900/40 dark:text-emerald-300',
  };
  return (
    <span
      className={`${styles[status] || styles.pending} px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wide`}
    >
      {status}
    </span>
  );
}

const SEVERITY_BORDER = {
  critical: 'severity-border-critical',
  moderate: 'severity-border-moderate',
  minor: 'severity-border-minor',
};

export default memo(function FeedPost({ report, onViewMap, onRequireSignUp }) {
  const [showComments, setShowComments] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

  const disasterType = getDisasterType(report.disaster?.type);
  const photos = getSafeMediaUrls(report.media?.photos);
  const severity = report.disaster?.severity || 'minor';
  const status = report.verification?.status || 'pending';
  const isCritical = severity === 'critical' && status !== 'resolved';

  return (
    <div
      className={`bg-white dark:bg-dark-card rounded-xl mb-3 shadow-card overflow-hidden hover:shadow-card-hover transition-shadow animate-stagger-in ${SEVERITY_BORDER[severity] || ''} ${isCritical ? 'critical-glow' : ''} status-stripe-${status}`}
      style={{ '--stagger-index': 0 }}
    >
      {/* Resolved Banner */}
      {status === 'resolved' && (
        <div className="bg-success text-white py-1.5 text-center text-[10px] font-bold uppercase tracking-widest">
          RESOLVED
        </div>
      )}

      {/* Post Header */}
      <div className="p-3.5">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <DisasterIcon typeId={report.disaster?.type} size={24} className="text-lg" />
              <span className="font-bold text-sm uppercase tracking-wide truncate dark:text-dark-text">
                {disasterType.label}
              </span>
              {status === 'verified' && (
                <svg
                  aria-hidden="true"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="#1B2A41"
                  stroke="white"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="9 12 11.5 14.5 16 10" />
                </svg>
              )}
            </div>
            <div className="text-xs text-textLight dark:text-dark-textLight mt-1 flex items-center gap-1">
              <svg
                aria-hidden="true"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span className="truncate">
                {report.location?.municipality ?? 'Unknown Municipality'}
                {report.location?.barangay && `, ${report.location.barangay}`}
              </span>
            </div>
            <div className="text-[11px] text-textMuted dark:text-dark-textMuted mt-0.5 flex items-center gap-1.5">
              <span>{formatTimeAgo(report.timestamp)}</span>
              <span className="text-border">&bull;</span>
              <span>{report.reporter?.name || 'Anonymous'}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <SeverityBadge severity={severity} />
            <StatusBadge status={status} />
            <ShareButton report={report} />
          </div>
        </div>
      </div>

      {/* Critical metrics — above the fold for emergency clarity */}
      {(report.disaster?.waterLevel ||
        report.disaster?.windSpeed ||
        report.disaster?.casualties > 0) && (
        <div className="px-3.5 pt-3 flex flex-wrap gap-2">
          {report.disaster?.waterLevel && (
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 rounded-lg px-3 py-1.5 flex items-center gap-2">
              <svg
                aria-hidden="true"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
              </svg>
              <span className="text-xs font-bold text-blue-700 dark:text-blue-400">
                {report.disaster.waterLevel}cm
              </span>
            </div>
          )}
          {report.disaster?.windSpeed && (
            <div className="bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-100 dark:border-cyan-900/40 rounded-lg px-3 py-1.5 flex items-center gap-2">
              <svg
                aria-hidden="true"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" />
              </svg>
              <span className="text-xs font-bold text-cyan-700 dark:text-cyan-400">
                {report.disaster.windSpeed} kph
              </span>
            </div>
          )}
          {report.disaster?.casualties > 0 && (
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/40 rounded-lg px-3 py-1.5 flex items-center gap-2">
              <svg
                aria-hidden="true"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span className="text-xs font-bold text-red-700 dark:text-red-400">
                {report.disaster.casualties}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Photo */}
      {photos.length > 0 && (
        <div className="relative">
          <img
            src={photos[imageIndex]}
            alt="Report"
            className="w-full max-h-80 object-cover"
            loading="lazy"
          />
          {photos.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] font-mono px-2 py-0.5 rounded-full">
              {imageIndex + 1}/{photos.length}
            </div>
          )}
          {photos.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {photos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setImageIndex(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    i === imageIndex ? 'bg-white' : 'bg-white/40'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="px-3.5 py-3">
        <p className="text-sm leading-relaxed dark:text-dark-text">
          {report.disaster?.description}
        </p>

        {/* Type-specific details */}
        {report.disaster?.waterLevel && (
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 rounded-lg p-2 mt-2.5 text-xs flex items-center gap-2">
            <span className="font-bold text-blue-700 dark:text-blue-400">Water Level</span>
            <span className="text-blue-600 dark:text-blue-400">{report.disaster.waterLevel}cm</span>
          </div>
        )}

        {report.disaster?.windSpeed && (
          <div className="bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-100 dark:border-cyan-900/40 rounded-lg p-2 mt-2.5 text-xs flex items-center gap-2">
            <span className="font-bold text-cyan-700 dark:text-cyan-400">Wind Speed</span>
            <span className="text-cyan-600 dark:text-cyan-400">
              {report.disaster.windSpeed} kph
            </span>
          </div>
        )}

        {report.disaster?.casualties > 0 && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/40 rounded-lg p-2 mt-2.5 text-xs flex items-center gap-2">
            <span className="font-bold text-red-700 dark:text-red-400">Casualties</span>
            <span className="text-red-600 dark:text-red-400">{report.disaster.casualties}</span>
          </div>
        )}

        {/* Tags */}
        {report.disaster?.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2.5">
            {report.disaster.tags.map((tag) => (
              <span
                key={tag}
                className="bg-primary/5 dark:bg-dark-elevated/20 text-primary/70 dark:text-dark-textLight/70 text-[10px] px-2 py-0.5 rounded-full font-medium"
              >
                #{sanitizeText(tag)}
              </span>
            ))}
          </div>
        )}

        {/* Weather Context */}
        {report.weatherContext && (
          <div className="bg-surface dark:bg-dark-elevated border border-borderLight dark:border-dark-border rounded-lg p-2 mt-2.5 text-[11px] text-textLight dark:text-dark-textLight">
            <span className="font-semibold">Weather:</span> {report.weatherContext.condition},{' '}
            {report.weatherContext.temperature}&deg;C
            {report.weatherContext.windSpeed
              ? ` &bull; Wind: ${report.weatherContext.windSpeed}kph`
              : ''}
          </div>
        )}
      </div>

      {/* Resolution Evidence */}
      {status === 'resolved' && report.verification?.resolution && (
        <div className="bg-green-50 p-3.5 border-t border-success/20">
          <p className="text-[10px] font-bold text-success uppercase tracking-wider mb-2">Update</p>
          {report.verification.resolution.evidencePhotos?.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-2">
              {getSafeMediaUrls(report.verification.resolution.evidencePhotos).map((photo, i) => (
                <img
                  key={`${photo}-${i}`}
                  src={photo}
                  alt={`Evidence ${i + 1}`}
                  className="w-full h-16 object-cover rounded-lg border border-success/20"
                  loading="lazy"
                />
              ))}
            </div>
          )}
          {report.verification.resolution.actionsTaken && (
            <p className="text-xs text-emerald-800">
              {report.verification.resolution.actionsTaken}
            </p>
          )}
          {report.verification.resolution.resolutionNotes && (
            <p className="text-[11px] text-emerald-600 mt-1">
              {report.verification.resolution.resolutionNotes}
            </p>
          )}
        </div>
      )}

      {/* Engagement */}
      <EngagementButtons
        report={report}
        onViewMap={onViewMap}
        onToggleComments={() => setShowComments(!showComments)}
        onRequireSignUp={onRequireSignUp}
      />

      {showComments && (
        <div
          role="status"
          aria-live="polite"
          className="p-3 border-t border-borderLight dark:border-dark-border bg-surface dark:bg-dark-elevated"
        >
          <p className="text-[11px] text-textMuted dark:text-dark-textMuted text-center">
            Comments are being developed. Check back soon.
          </p>
        </div>
      )}
    </div>
  );
});
