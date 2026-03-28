const ALERT_COLORS = {
  watch: {
    bg: 'bg-yellow-50',
    border: 'border-warning',
    text: 'text-warning',
    icon: '\u{1F7E1}',
  },
  warning: {
    bg: 'bg-orange-50',
    border: 'border-warning',
    text: 'text-warning',
    icon: '\u{1F7E0}',
  },
  alert: { bg: 'bg-red-50', border: 'border-accent', text: 'text-accent', icon: '\u{1F534}' },
};

export default function WeatherAlerts({ alerts = [] }) {
  if (alerts.length === 0) {
    return (
      <div className="bg-green-50 dark:bg-green-900/30 border border-success rounded-xl p-3">
        <div className="flex items-center gap-2">
          <span className="text-success dark:text-green-400">
            <svg
              aria-hidden="true"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
          <div>
            <p className="font-bold text-success dark:text-green-400 text-xs uppercase tracking-wider">
              No Active Weather Alerts
            </p>
            <p className="text-[10px] text-green-700 dark:text-green-400 mt-0.5">
              Conditions are normal across the province
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {alerts.map((alert, index) => {
        const colors = ALERT_COLORS[alert.severity] || ALERT_COLORS.watch;
        return (
          <div key={index} className={`${colors.bg} border-l-4 ${colors.border} rounded-r-xl p-3`}>
            <div className="flex items-start gap-2">
              <span className="text-sm flex-shrink-0">{colors.icon}</span>
              <div>
                <p className={`font-bold text-xs ${colors.text} uppercase tracking-wide`}>
                  {alert.type?.replace('-', ' ')} {alert.severity}
                </p>
                <p className="text-xs mt-0.5">{alert.message}</p>
                {alert.municipality && (
                  <p className="text-[10px] text-textMuted mt-0.5">Area: {alert.municipality}</p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
