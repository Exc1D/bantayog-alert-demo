const SEVERITIES = [
  { label: 'Critical', value: 'critical' },
  { label: 'Moderate', value: 'moderate' },
  { label: 'Minor', value: 'minor' },
];

const MIN_DESC_LENGTH = 10;

export default function DetailsStep({
  description,
  severity,
  municipality,
  onDescriptionChange,
  onSeverityChange,
  onSubmit,
  submitting,
}) {
  const canSubmit = description.trim().length >= MIN_DESC_LENGTH && severity != null;

  return (
    <div className="h-full overflow-y-auto bg-app-bg p-4 flex flex-col gap-4">
      {/* Severity chips */}
      <div>
        <p className="text-xs text-text-tertiary font-medium uppercase tracking-wide mb-2">
          How severe?
        </p>
        <div className="flex gap-2">
          {SEVERITIES.map(({ label, value }) => {
            const isActive = severity === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => onSeverityChange(value)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-colors
                  ${
                    isActive
                      ? 'border-urgent bg-urgent/5 text-urgent'
                      : 'border-black/10 text-text-secondary'
                  }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Description */}
      <div>
        <p className="text-xs text-text-tertiary font-medium uppercase tracking-wide mb-2">
          Describe it
        </p>
        <textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="What did you see? Any details that would help responders…"
          className="w-full bg-surface border border-black/10 rounded-xl px-4 py-3 text-sm
                     text-text-primary placeholder:text-text-tertiary resize-none h-32
                     focus:outline-none focus:ring-2 focus:ring-urgent/30"
          aria-label="Description"
        />
      </div>

      {/* Detected location */}
      {municipality && (
        <p className="text-xs text-text-tertiary">
          Location detected: <span className="font-medium text-text-secondary">{municipality}</span>
        </p>
      )}

      {/* Submit */}
      <button
        type="button"
        onClick={onSubmit}
        disabled={!canSubmit || submitting}
        className="bg-urgent text-white font-bold text-sm py-4 rounded-xl w-full
                   disabled:opacity-40 active:scale-95 transition-transform"
        aria-label="Submit report"
      >
        {submitting ? 'Submitting…' : 'Submit report'}
      </button>
    </div>
  );
}
