export default function StatusBar({ pending, criticalActive, totalActive, resolvedToday }) {
  const stats = [
    { label: 'Pending', value: pending, color: 'text-urgent' },
    { label: 'Critical active', value: criticalActive, color: 'text-moderate' },
    { label: 'Total active', value: totalActive, color: 'text-white' },
    { label: 'Resolved today', value: resolvedToday, color: 'text-resolved' },
  ];

  return (
    <div className="bg-shell border-b border-white/10 grid grid-cols-4 py-3">
      {stats.map(({ label, value, color }) => (
        <div key={label} className="flex flex-col items-center gap-0.5">
          <span className={`text-base font-bold ${color}`}>{value}</span>
          <span className="text-[9px] text-white/50 uppercase tracking-wide text-center leading-tight">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
