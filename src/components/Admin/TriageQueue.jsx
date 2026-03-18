import { useNavigate } from 'react-router-dom';
import { useReports } from '../../hooks/useReports';
import StatusBar from './StatusBar';
import QueueItem from './QueueItem';

function countResolvedToday(reports) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startSeconds = startOfDay.getTime() / 1000;
  return reports.filter(
    (r) =>
      r.verification?.status === 'resolved' &&
      (r.verification?.resolution?.resolvedAt?.seconds ?? 0) >= startSeconds
  ).length;
}

export default function TriageQueue() {
  const navigate = useNavigate();
  const { reports, loading } = useReports();

  const pending = reports.filter((r) => r.verification?.status === 'pending');
  const criticalActive = reports.filter(
    (r) => r.disaster?.severity === 'critical' && r.verification?.status !== 'resolved'
  );
  const totalActive = reports.filter((r) => r.verification?.status !== 'resolved');
  const resolvedToday = countResolvedToday(reports);

  const sorted = [...pending].sort((a, b) => {
    const sevA = a.disaster?.severity === 'critical' ? 0 : 1;
    const sevB = b.disaster?.severity === 'critical' ? 0 : 1;
    if (sevA !== sevB) return sevA - sevB;
    return (b.timestamp?.seconds ?? 0) - (a.timestamp?.seconds ?? 0);
  });

  function handleVerify(id) {
    navigate(`/admin/report/${id}`);
  }

  function handleReject(id) {
    navigate(`/admin/report/${id}?action=reject`);
  }

  return (
    <div className="flex flex-col h-full">
      <StatusBar
        pending={pending.length}
        criticalActive={criticalActive.length}
        totalActive={totalActive.length}
        resolvedToday={resolvedToday}
      />
      <div className="flex-1 overflow-y-auto bg-app-bg">
        {loading && (
          <div className="flex items-center justify-center h-32 text-text-tertiary text-sm">
            Loading…
          </div>
        )}
        {!loading && sorted.length === 0 && (
          <div className="flex items-center justify-center h-32 text-text-tertiary text-sm">
            Queue is clear
          </div>
        )}
        <div className="flex flex-col gap-2 p-3">
          {sorted.map((report) => (
            <QueueItem
              key={report.id}
              report={report}
              onVerify={handleVerify}
              onReject={handleReject}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
