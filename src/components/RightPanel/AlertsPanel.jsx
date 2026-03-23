import { useMemo } from 'react';
import { Warning, Bell } from '@phosphor-icons/react';
import { useReports } from '../../hooks/useReports';
import { useGeolocation } from '../../hooks/useGeolocation';

function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function AlertItem({ report, userLat, userLng, onSelect }) {
  const dist = userLat && userLng ? distanceKm(userLat, userLng, report.location.lat, report.location.lng).toFixed(1) : null;
  return (
    <button
      type="button"
      onClick={() => onSelect(report)}
      className="w-full flex items-start gap-3 p-3 hover:bg-surface-dark/50 transition-colors border-l-2 border-emergency dark:border-emergency-dark text-left"
    >
      <Warning size={18} weight="fill" className="text-emergency dark:text-emergency-dark flex-shrink-0 mt-0.5" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-dark-text dark:text-dark-text capitalize">{report.disaster?.type} — {report.municipality}</p>
        <p className="text-xs text-muted-dark dark:text-muted-dark mt-0.5 line-clamp-2">{report.disaster?.description ?? `Severity: ${report.disaster?.severity}`}</p>
        <div className="flex items-center gap-2 mt-1">
          {dist && <span className="text-xs text-muted-dark dark:text-muted-dark">{dist} km away</span>}
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${report.disaster?.severity === 'critical' ? 'bg-emergency/20 text-emergency dark:text-emergency-dark' : 'bg-warning-amber/20 text-warning-amber'}`}>
            {report.disaster?.severity?.toUpperCase()}
          </span>
        </div>
      </div>
    </button>
  );
}

export default function AlertsPanel() {
  const { reports } = useReports();
  const { location } = useGeolocation();
  const userLat = location?.lat;
  const userLng = location?.lng;

  const sortedAlerts = useMemo(() => {
    return [...reports]
      .filter((r) => r.status === 'active')
      .sort((a, b) => {
        if (!userLat || !userLng) return 0;
        return distanceKm(userLat, userLng, a.location.lat, a.location.lng) - distanceKm(userLat, userLng, b.location.lat, b.location.lng);
      });
  }, [reports, userLat, userLng]);

  if (sortedAlerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-dark dark:text-muted-dark">
        <Bell size={32} aria-hidden="true" />
        <p className="text-sm font-medium">No active alerts</p>
        <p className="text-xs">You're all caught up</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      {sortedAlerts.map((report) => (
        <AlertItem key={report.id} report={report} userLat={userLat} userLng={userLng} onSelect={(r) => {}} />
      ))}
    </div>
  );
}
