import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MUNICIPALITIES } from '../../utils/constants';

export default function MunicipalityChart({ reports = [] }) {
  const data = useMemo(() => {
    const counts = {};
    MUNICIPALITIES.forEach((m) => {
      counts[m] = 0;
    });
    reports.forEach((r) => {
      const m = r.location?.municipality;
      if (m && counts[m] !== undefined) counts[m]++;
    });
    return Object.entries(counts)
      .map(([municipality, count]) => ({ municipality, count }))
      .sort((a, b) => b.count - a.count);
  }, [reports]);

  return (
    <div className="bg-white dark:bg-dark-elevated border border-border/60 dark:border-dark-border rounded-xl p-4 mb-3">
      <h4 className="text-xs font-bold uppercase tracking-wide text-textLight dark:text-dark-textLight mb-2">
        Reports by Municipality
      </h4>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
          <YAxis
            dataKey="municipality"
            type="category"
            tick={{ fontSize: 9 }}
            width={80}
          />
          <Tooltip />
          <Bar dataKey="count" fill="#1A2744" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
