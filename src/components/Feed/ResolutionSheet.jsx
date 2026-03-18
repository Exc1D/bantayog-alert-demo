export default function ResolutionSheet({ report, onClose }) {
  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Resolution details"
    >
      <div className="bg-surface w-full max-w-lg rounded-t-2xl p-6 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-base text-text-primary">Resolution details</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-text-tertiary text-sm"
            aria-label="Close"
          >
            Close
          </button>
        </div>
        {report.verification?.resolution?.resolutionNotes && (
          <p className="text-sm text-text-secondary mb-3">
            {report.verification.resolution.resolutionNotes}
          </p>
        )}
        {report.verification?.resolution?.actionsTaken && (
          <p className="text-sm text-text-secondary">
            <span className="font-semibold">Actions taken: </span>
            {report.verification.resolution.actionsTaken}
          </p>
        )}
        {!report.verification?.resolution?.resolutionNotes &&
          !report.verification?.resolution?.actionsTaken && (
            <p className="text-sm text-text-secondary">No resolution notes provided.</p>
          )}
      </div>
    </div>
  );
}
