const RESPONSE_ACTIONS = [
  { label: 'Deploy team', value: 'deploy-team' },
  { label: 'Issue advisory', value: 'issue-advisory' },
  { label: 'Monitor only', value: 'monitor-only' },
  { label: 'Coordinate LGU', value: 'coordinate-lgu' },
  { label: 'Evacuate area', value: 'evacuate-area' },
];

const UNITS = [
  { label: 'MDRRMO', value: 'mdrrmo' },
  { label: 'BFP', value: 'bfp' },
  { label: 'PNP', value: 'pnp' },
  { label: 'Barangay', value: 'barangay' },
  { label: 'Provincial', value: 'provincial' },
];

function ChipGroup({ options, selected, onChange, label }) {
  return (
    <div className="mb-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary mb-2">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map(({ label: optLabel, value }) => {
          const isActive = selected === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => onChange(value)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors
                ${isActive ? 'bg-shell text-white' : 'bg-app-bg text-text-secondary'}`}
            >
              {optLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function DispatchForm({
  responseAction,
  assignedUnit,
  notes,
  onResponseActionChange,
  onAssignedUnitChange,
  onNotesChange,
  onSubmit,
  onReject,
  submitting,
}) {
  const canDispatch = responseAction != null && assignedUnit != null;

  return (
    <div className="p-4">
      <ChipGroup
        options={RESPONSE_ACTIONS}
        selected={responseAction}
        onChange={onResponseActionChange}
        label="Response action"
      />

      <ChipGroup
        options={UNITS}
        selected={assignedUnit}
        onChange={onAssignedUnitChange}
        label="Assign to unit"
      />

      <div className="mb-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary mb-2">
          Notes for responders
        </p>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Specific instructions, access points, contacts…"
          className="w-full bg-app-bg border border-black/10 rounded-xl px-4 py-3
                     text-sm text-text-primary placeholder:text-text-tertiary
                     resize-none h-24 focus:outline-none focus:ring-2 focus:ring-urgent/30"
          aria-label="Notes for responders"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onReject}
          disabled={submitting}
          className="py-3.5 rounded-xl border-2 border-urgent/30 text-urgent text-sm font-bold"
          aria-label="Reject"
        >
          Reject
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canDispatch || submitting}
          className="py-3.5 rounded-xl bg-urgent text-white text-sm font-bold disabled:opacity-40"
          aria-label="Verify + Dispatch"
        >
          {submitting ? 'Dispatching…' : 'Verify + Dispatch'}
        </button>
      </div>
    </div>
  );
}
