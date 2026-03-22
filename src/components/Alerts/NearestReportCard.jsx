import { Link } from 'react-router-dom';

const STRIP = {
  critical: 'bg-urgent',
  moderate: 'bg-moderate',
  minor: 'bg-moderate',
};

export default function NearestReportCard({ report }) {
  if (!report) return null;

  const { id, disaster = {}, location = {}, verification = {}, distanceKm } = report;
  const strip = STRIP[disaster.severity] ?? 'bg-text-tertiary';

  return (
    <Link to={`/report/${id}`} className="block bg-surface shadow-card overflow-hidden">
      <div className="flex">
        {/* Left border strip by severity */}
        <div className={`w-1 flex-shrink-0 ${strip}`} aria-hidden="true" />
        <div className="flex-1 px-4 py-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-bold text-text-primary">{disaster.type}</p>
              <p className="text-xs text-text-tertiary mt-0.5">
                {[location.barangay, location.municipality].filter(Boolean).join(', ')}
              </p>
            </div>
            {distanceKm != null && (
              <span className="text-xs font-semibold text-text-secondary whitespace-nowrap flex-shrink-0">
                {distanceKm.toFixed(1)} km
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] text-text-tertiary capitalize">{verification.status}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
