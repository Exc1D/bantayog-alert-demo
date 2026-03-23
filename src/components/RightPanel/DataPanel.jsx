import { useState, useMemo } from 'react';
import { ChartBar, MapPin } from '@phosphor-icons/react';
import { useReports } from '../../hooks/useReports';

const PERIODS = [
  { id: '24h', label: '24h' },
  { id: '7d', label: '7d' },
  { id: '30d', label: '30d' },
];

function StatCard({ label, value, color }) {
  return (
    <div className="bg-surface-dark/50 dark:bg-surface-dark rounded-lg p-3 border border-dark-border">
      <p className="text-xs text-muted-dark dark:text-muted-dark mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value ?? 0}</p>
    </div>
  );
}

function MunicipalityBar({ name, count, maxCount }) {
  const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-dark dark:text-muted-dark w-20 truncate">{name}</span>
      <div className="flex-1 h-4 bg-dark-bg dark:bg-dark-bg rounded-full overflow-hidden">
        <div
          className="h-full bg-emergency/70 dark:bg-emergency-dark/70 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-dark-text dark:text-dark-text w-6 text-right">{count}</span>
    </div>
  );
}

export default function DataPanel() {
  const { reports } = useReports();
  const [period, setPeriod] = useState('7d');

  const periodSeconds = useMemo(() => {
    switch (period) {
      case '24h':
        return 86400;
      case '7d':
        return 604800;
      case '30d':
        return 2592000;
      default:
        return 604800;
    }
  }, [period]);

  // eslint-disable-next-line react-hooks/purity -- cutoff intentionally updates each render when period changes
  const cutoff = Date.now() / 1000 - periodSeconds;
  const filteredReports = reports.filter(
    (r) => !r.createdAt?.seconds || r.createdAt.seconds >= cutoff
  );

  const stats = useMemo(() => {
    const active = reports.filter((r) => r.status === 'active').length;
    const resolved = reports.filter((r) => r.status === 'resolved').length;
    return { total: reports.length, active, resolved };
  }, [reports]);

  const municipalityCounts = useMemo(() => {
    const counts = {};
    filteredReports.forEach((r) => {
      const m = r.municipality ?? 'Unknown';
      counts[m] = (counts[m] ?? 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [filteredReports]);

  const maxCount = municipalityCounts[0]?.[1] ?? 1;

  return (
    <div className="h-full overflow-y-auto p-3 flex flex-col gap-3">
      <div className="flex gap-1 bg-surface-dark/50 dark:bg-surface-dark rounded-lg p-1 border border-dark-border">
        {PERIODS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setPeriod(id)}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${period === id ? 'bg-emergency/20 text-dark-text dark:text-dark-text' : 'text-muted-dark dark:text-muted-dark hover:text-dark-text dark:hover:text-dark-text'}`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <StatCard label="Total" value={stats.total} color="text-dark-text dark:text-dark-text" />
        <StatCard
          label="Active"
          value={stats.active}
          color="text-emergency dark:text-emergency-dark"
        />
        <StatCard label="Resolved" value={stats.resolved} color="text-safe" />
      </div>
      <div className="flex flex-col gap-1.5">
        <h3 className="text-xs font-semibold text-muted-dark dark:text-muted-dark flex items-center gap-1">
          <MapPin size={14} aria-hidden="true" />
          By Municipality
        </h3>
        {municipalityCounts.length === 0 ? (
          <p className="text-xs text-muted-dark dark:text-muted-dark italic">
            No data for this period
          </p>
        ) : (
          municipalityCounts
            .slice(0, 8)
            .map(([name, count]) => (
              <MunicipalityBar key={name} name={name} count={count} maxCount={maxCount} />
            ))
        )}
      </div>
      <div className="flex items-center gap-2 p-3 bg-surface-dark/30 dark:bg-surface-dark/30 rounded-lg border border-dark-border">
        <ChartBar size={18} className="text-muted-dark dark:text-muted-dark" aria-hidden="true" />
        <span className="text-xs text-muted-dark dark:text-muted-dark">
          {filteredReports.length} reports in the last {period}
        </span>
      </div>
    </div>
  );
}
