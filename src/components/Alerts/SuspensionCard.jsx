function formatTimeAgo(seconds) {
  if (!seconds) return '';
  const diff = Math.floor(Date.now() / 1000) - seconds;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function SuspensionCard({ suspensions = [] }) {
  const active = suspensions.filter((s) => s.active);
  if (active.length === 0) return null;

  return (
    <>
      {active.map((s, i) => (
        <div
          key={i}
          className="bg-surface shadow-card overflow-hidden"
          role="region"
          aria-label={s.type}
        >
          <div className="bg-urgent px-4 py-2 flex items-center justify-between">
            <span className="text-white text-xs font-bold tracking-wide">{s.type}</span>
            <span className="text-white/70 text-xs">{formatTimeAgo(s.issuedAt?.seconds)}</span>
          </div>
          <div className="px-4 py-3">
            <p className="text-sm font-semibold text-text-primary">{s.issuedBy}</p>
            {s.scope && <p className="text-xs text-text-secondary mt-0.5">{s.scope}</p>}
          </div>
        </div>
      ))}
    </>
  );
}
