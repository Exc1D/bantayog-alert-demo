// Per spec: critical=#FF3B30(red), warning=#FF9500(orange), info=#1C1C1E(shell/dark)
const SEVERITY_STYLES = {
  critical: 'border-red-500 bg-red-50 dark:bg-red-900/20',
  warning: 'border-orange-500 bg-orange-50 dark:bg-orange-900/20',
  info: 'border-gray-500 bg-gray-50 dark:bg-gray-900/20',
};

const TYPE_LABELS = {
  'class-suspension': 'Class Suspension',
  'work-suspension': 'Work Suspension',
  'flood-advisory': 'Flood Advisory',
  'road-closure': 'Road Closure',
  'evacuation-order': 'Evacuation Order',
  'storm-surge': 'Storm Surge',
  'health-advisory': 'Health Advisory',
  'emergency-notice': 'Emergency Notice',
};

export default function AnnouncementCard({ announcement }) {
  const {
    type,
    title,
    body,
    severity = 'info',
    scope,
    createdAt,
  } = announcement;

  const createdDate = createdAt?.toDate ? createdAt.toDate() : new Date();
  const formattedDate = createdDate.toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const severityBadgeVariant = severity === 'critical' ? 'danger' : severity === 'warning' ? 'warning' : 'info';

  return (
    <div className={`border-l-4 rounded-lg bg-white dark:bg-dark-card shadow-card overflow-hidden p-3.5 ${SEVERITY_STYLES[severity] || SEVERITY_STYLES.info}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className={`
          px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wide
          ${severityBadgeVariant === 'danger' ? 'bg-accent text-white' : severityBadgeVariant === 'warning' ? 'bg-warning text-white' : 'bg-textLight text-text dark:bg-dark-textLight dark:text-dark-text'}
        `}>
          {TYPE_LABELS[type] || type}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">{formattedDate}</span>
      </div>
      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{body}</p>
      <div className="text-xs text-gray-500 dark:text-gray-400">
        📍 {scope}
      </div>
    </div>
  );
}
