import { memo } from 'react';
import { formatTimeAgo } from '../../utils/timeUtils';

// Announcement type display config
const ANNOUNCEMENT_TYPES = {
  'class-suspension': {
    label: 'Class Suspension',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/>
        <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
      </svg>
    ),
  },
  'work-suspension': {
    label: 'Work Suspension',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
        <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
      </svg>
    ),
  },
  'flood-advisory': {
    label: 'Flood Advisory',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
        <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
        <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
      </svg>
    ),
  },
  'road-closure': {
    label: 'Road Closure',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/>
        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
      </svg>
    ),
  },
  'evacuation-order': {
    label: 'Evacuation Order',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
  },
  'storm-surge': {
    label: 'Storm Surge',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z"/>
      </svg>
    ),
  },
  'health-advisory': {
    label: 'Health Advisory',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4.8 2.3A.3.3 0 105 2H4a2 2 0 00-2 2v5a6 6 0 006 6v0a6 6 0 006-6V4a2 2 0 00-2-2h-1a.2.2 0 10.3.3"/>
        <path d="M8 15v1a6 6 0 006 6v0a6 6 0 006-6v-4"/>
        <circle cx="20" cy="10" r="2"/>
      </svg>
    ),
  },
  'emergency-notice': {
    label: 'Emergency Notice',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    ),
  },
};

const SEVERITY_STYLES = {
  critical: {
    bg: 'bg-[#FF3B30]',
    text: 'text-white',
    border: 'border-[#FF3B30]',
    badge: 'bg-[#FF3B30]/10 text-[#FF3B30] border border-[#FF3B30]/20',
  },
  warning: {
    bg: 'bg-[#FF9500]',
    text: 'text-white',
    border: 'border-[#FF9500]',
    badge: 'bg-[#FF9500]/10 text-[#FF9500] border border-[#FF9500]/20',
  },
  info: {
    bg: 'bg-[#1C1C1E]',
    text: 'text-white',
    border: 'border-[#1C1C1E]',
    badge: 'bg-[#1C1C1E]/10 text-[#1C1C1E] border border-[#1C1C1E]/20 dark:bg-white/10 dark:text-white dark:border-white/20',
  },
};

const SCOPE_STYLES = {
  Provincial: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  default: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
};

function getAnnouncementType(typeId) {
  return ANNOUNCEMENT_TYPES[typeId] || ANNOUNCEMENT_TYPES['emergency-notice'];
}

function getSeverityStyle(severity) {
  return SEVERITY_STYLES[severity] || SEVERITY_STYLES.info;
}

function getScopeStyle(scope) {
  return scope === 'Provincial' ? SCOPE_STYLES.Provincial : SCOPE_STYLES.default;
}

const AnnouncementCard = memo(function AnnouncementCard({
  announcement: { type, title, body, severity, scope, createdAt },
}) {
  const typeInfo = getAnnouncementType(type);
  const sevStyle = getSeverityStyle(severity);
  const scopeStyle = getScopeStyle(scope);

  return (
    <div
      className={`rounded-xl border-l-4 ${sevStyle.border} ${sevStyle.bg} ${sevStyle.text} p-4 shadow-card dark:shadow-dark-card`}
    >
      {/* Header row: type chip + severity badge */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide opacity-90">
            <span className="w-5 h-5 rounded bg-white/20 flex items-center justify-center">
              {typeInfo.icon}
            </span>
            {typeInfo.label}
          </span>
        </div>
        <span
          className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${sevStyle.badge}`}
        >
          {severity}
        </span>
      </div>

      {/* Title */}
      <h3 className="font-bold text-sm mb-1 leading-snug">{title}</h3>

      {/* Body */}
      {body && (
        <p className="text-xs opacity-90 mb-3 leading-relaxed">{body}</p>
      )}

      {/* Footer: scope badge + time ago */}
      <div className="flex items-center justify-between gap-2 mt-auto">
        <span
          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${scopeStyle}`}
        >
          {scope}
        </span>
        <span className="text-[10px] opacity-70">
          {formatTimeAgo(createdAt)}
        </span>
      </div>
    </div>
  );
});

export default AnnouncementCard;
