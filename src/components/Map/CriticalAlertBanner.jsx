export default function CriticalAlertBanner({ reports = [] }) {
  const criticalActive = reports
    .filter(
      (r) =>
        r.disaster?.severity === 'critical' &&
        r.verification?.status !== 'resolved'
    )
    .sort((a, b) => (b.timestamp?.seconds ?? 0) - (a.timestamp?.seconds ?? 0));

  if (criticalActive.length === 0) return null;

  const top = criticalActive[0];
  const type = top.disaster?.type ?? 'Emergency';
  const municipality = top.location?.municipality ?? 'Unknown location';

  return (
    <div
      role="alert"
      className="bg-urgent text-white text-xs font-semibold px-4 py-2.5 flex items-center gap-2 flex-shrink-0"
    >
      {/* Pulse dot */}
      <span className="relative flex h-2 w-2 flex-shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
      </span>
      <span>
        Critical alert: {type} — {municipality}
      </span>
    </div>
  );
}
