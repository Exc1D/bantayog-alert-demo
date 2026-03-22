import { formatTimeAgo } from '../../utils/timeUtils';

function normalizeTimestamp(ts) {
  if (!ts) return null;
  if (ts.toDate) return ts.toDate();
  if (ts.seconds) return new Date(ts.seconds * 1000);
  return ts;
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
            <span className="text-white/70 text-xs">
              {formatTimeAgo(normalizeTimestamp(s.issuedAt))}
            </span>
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
