import { useState, useMemo, useEffect } from 'react';
import { ChartBar, MapPin } from '@phosphor-icons/react';
import { useReports } from '../../hooks/useReports';

const PERIODS = [
  { id: '24h', label: '24h', seconds: 86400 },
  { id: '7d', label: '7d', seconds: 604800 },
  { id: '30d', label: '30d', seconds: 2592000 },
];

function StatCard({ label, value, color }) {
  return (
    <div className="bg-surface-dark/50 rounded-lg p-3 border border-border-dark">
      <p className="text-xs text-text-muted-dark mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value ?? 0}</p>
    </div>
  );
}

export default function DataPanel() {
  const { reports } = useReports();
  const [period, setPeriod] = useState('7d');

  // Capture a fresh timestamp whenever period changes to compute cutoff
  const [mountTimestamp, setMountTimestamp] = useState(() => Date.now() / 1000);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: need fresh timestamp on period change
    setMountTimestamp(Date.now() / 1000);
  }, [period]);

  const periodSec = PERIODS.find((p) => p.id === period)?.seconds ?? 604800;
  const cutoff = mountTimestamp - periodSec;
  const filtered = useMemo(
    () => reports.filter((r) => !r.createdAt?.seconds || r.createdAt.seconds >= cutoff),
    [reports, cutoff]
  );

  const stats = useMemo(
    () => ({
      total: reports.length,
      active: reports.filter((r) => r.status === 'active').length,
      resolved: reports.filter((r) => r.status === 'resolved').length,
    }),
    [reports]
  );

  const municipalityCounts = useMemo(() => {
    const counts = {};
    filtered.forEach((r) => {
      counts[r.municipality ?? 'Unknown'] = (counts[r.municipality ?? 'Unknown'] ?? 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [filtered]);

  const maxCount = municipalityCounts[0]?.[1] ?? 1;

  return (
    <div className="h-full overflow-y-auto p-3 flex flex-col gap-3">
      {/* Period toggle */}
      <div className="flex gap-1 bg-surface-dark/50 rounded-lg p-1 border border-border-dark">
        {PERIODS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setPeriod(id)}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${period === id ? 'bg-emergency/20 text-text-dark' : 'text-text-muted-dark hover:text-text-dark'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-2">
        <StatCard label="Total" value={stats.total} color="text-text-dark" />
        <StatCard
          label="Active"
          value={stats.active}
          color="text-emergency dark:text-emergency-dark"
        />
        <StatCard label="Resolved" value={stats.resolved} color="text-safe" />
      </div>

      {/* Municipality chart */}
      <div className="flex flex-col gap-1.5">
        <h3 className="text-xs font-semibold text-text-muted-dark flex items-center gap-1">
          <MapPin size={14} aria-hidden="true" />
          By Municipality
        </h3>
        {municipalityCounts.length === 0 ? (
          <p className="text-xs text-text-muted-dark italic">No data for this period</p>
        ) : (
          municipalityCounts.map(([name, count]) => (
            <div key={name} className="flex items-center gap-2">
              <span className="text-xs text-text-muted-dark w-20 truncate">{name}</span>
              <div className="flex-1 h-4 bg-surface-dark rounded-full overflow-hidden">
                <div
                  className="h-full bg-emergency/70 dark:bg-emergency-dark/70 rounded-full transition-all"
                  style={{ width: `${(count / maxCount) * 100}%` }}
                />
              </div>
              <span className="text-xs text-text-dark w-6 text-right">{count}</span>
            </div>
          ))
        )}
      </div>

      {/* Trend */}
      <div className="flex items-center gap-2 p-3 bg-surface-dark/30 rounded-lg border border-border-dark">
        <ChartBar size={18} className="text-text-muted-dark" aria-hidden="true" />
        <span className="text-xs text-text-muted-dark">
          {filtered.length} reports in the last {period}
        </span>
      </div>
    </div>
  );
}
