import { useMemo } from 'react';
import { Warning, Bell } from '@phosphor-icons/react';
import { useReports } from '../../hooks/useReports';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useMapPanel } from '../../contexts/MapPanelContext';

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const d = (a, b) => ((b - a) * Math.PI) / 180;
  const a = Math.sin(d(lat2, lat1) / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(d(lng2, lng1) / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function AlertItem({ report, dist, onSelect }) {
  const severityColors = {
    critical: 'bg-emergency/20 text-emergency dark:text-emergency-dark',
    urgent: 'bg-warning-amber/20 text-warning-amber',
    low: 'bg-blue-500/20 text-blue-500',
  };
  const colorClass = severityColors[report.disaster?.severity] ?? severityColors.low;
  return (
    <button type="button" onClick={() => onSelect(report)} className="w-full flex items-start gap-3 p-3 hover:bg-surface-dark/50 transition-colors border-l-2 border-emergency dark:border-emergency-dark text-left">
      <Warning size={18} weight="fill" className="text-emergency dark:text-emergency-dark flex-shrink-0 mt-0.5" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-dark capitalize">{report.disaster?.type} — {report.municipality}</p>
        <p className="text-xs text-text-muted-dark mt-0.5 line-clamp-2">{report.disaster?.description ?? `Severity: ${report.disaster?.severity}`}</p>
        <div className="flex items-center gap-2 mt-1">
          {dist != null && <span className="text-xs text-text-muted-dark">{dist.toFixed(1)} km away</span>}
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${colorClass}`}>{report.disaster?.severity?.toUpperCase()}</span>
        </div>
      </div>
    </button>
  );
}

export default function AlertsPanel() {
  const { reports } = useReports();
  const { location } = useGeolocation();
  const { setSelectedReportId } = useMapPanel();
  const lat = location?.lat;
  const lng = location?.lng;

  const sorted = useMemo(() => {
    return [...reports]
      .filter(r => r.status === 'active')
      .sort((a, b) => {
        if (!lat || !lng) return 0;
        return haversineKm(lat, lng, a.lat, a.lng) - haversineKm(lat, lng, b.lat, b.lng);
      });
  }, [reports, lat, lng]);

  if (sorted.length === 0) return <div className="flex flex-col items-center justify-center h-full gap-2 text-text-muted-dark"><Bell size={32} aria-hidden="true" /><p className="text-sm font-medium">No active alerts</p><p className="text-xs">You're all caught up</p></div>;

  return (
    <div className="h-full overflow-y-auto">
      {sorted.map(r => (
        <AlertItem key={r.id} report={r} dist={lat && lng ? haversineKm(lat, lng, r.lat, r.lng) : null} onSelect={(r) => setSelectedReportId(r.id)} />
      ))}
    </div>
  );
}
