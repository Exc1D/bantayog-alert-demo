import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const DAY_RANGES = [7, 30, 90];

function groupByDate(reports, days) {
  const now = Date.now();
  const cutoff = now - days * 24 * 60 * 60 * 1000;
  const buckets = {};
  for (let i = 0; i < days; i++) {
    const d = new Date(now - i * 86400000);
    buckets[d.toISOString().slice(0, 10)] = 0;
  }
  reports.forEach((r) => {
    const ts = (() => {
      const raw = r.timestamp;
      if (raw?.toMillis) return raw.toMillis();
      if (raw instanceof Date) return raw.getTime();
      if (typeof raw === 'number') return raw;
      return null;
    })();
    if (ts >= cutoff) {
      const key = new Date(ts).toISOString().slice(0, 10);
      if (buckets[key] !== undefined) buckets[key]++;
    }
  });
  return Object.entries(buckets)
    .map(([date, count]) => ({ date, count }))
    .reverse();
}

function groupByType(reports) {
  const map = {};
  reports.forEach((r) => {
    const t = r.disaster?.type || 'Unknown';
    map[t] = (map[t] || 0) + 1;
  });
  return Object.entries(map)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
}

export default function AnalyticsChart({ reports = [] }) {
  const [dayRange, setDayRange] = useState(7);

  const total = reports.length;
  const verified = reports.filter((r) => r.verification?.status === 'verified').length;

  const resolvedReports = reports.filter(
    (r) => r.verification?.status === 'resolved' && r.resolution?.resolvedAt
  );
  const avgResponseMs =
    resolvedReports.length > 0
      ? resolvedReports.reduce((sum, r) => {
          const resolvedAt = r.resolution.resolvedAt?.toMillis
            ? r.resolution.resolvedAt.toMillis()
            : new Date(r.resolution.resolvedAt).getTime();
          const submitted = r.timestamp?.toMillis
            ? r.timestamp.toMillis()
            : new Date(r.timestamp).getTime();
          return sum + (resolvedAt - submitted);
        }, 0) /
        resolvedReports.length /
        3600000 // ms → hours
      : 0;

  const lineData = useMemo(() => groupByDate(reports, dayRange), [reports, dayRange]);
  const barData = useMemo(() => groupByType(reports), [reports]);

  return (
    <div className="bg-white dark:bg-dark-elevated border border-border/60 dark:border-dark-border rounded-xl p-4 mb-3">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Total Reports', value: total },
          { label: 'Verified', value: verified },
          { label: 'Avg Response', value: `${avgResponseMs.toFixed(1)}h` },
        ].map(({ label, value }) => (
          <div key={label} className="text-center bg-stone-50 dark:bg-dark-card rounded-lg p-3">
            <p className="text-xl font-bold text-accent dark:text-dark-accent">{value}</p>
            <p className="text-[10px] uppercase tracking-wider text-textLight dark:text-dark-textLight font-semibold">
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* Line Chart */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-bold uppercase tracking-wide text-textLight dark:text-dark-textLight">
            Report Volume
          </h4>
          <div className="flex gap-1">
            {DAY_RANGES.map((d) => (
              <button
                key={d}
                onClick={() => setDayRange(d)}
                className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
                  dayRange === d
                    ? 'bg-accent text-white'
                    : 'bg-stone-100 dark:bg-dark-border text-textLight dark:text-dark-textLight hover:bg-stone-200 dark:hover:bg-dark-textMuted'
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={lineData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => d.slice(5)} />
            <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#e63946" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Bar Chart — Disaster Types */}
      <div className="mb-4">
        <h4 className="text-xs font-bold uppercase tracking-wide text-textLight dark:text-dark-textLight mb-2">
          Disaster Types
        </h4>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="type" tick={{ fontSize: 10 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="count" fill="#e63946" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
