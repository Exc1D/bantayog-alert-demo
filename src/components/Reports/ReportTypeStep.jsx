const DISASTER_TYPES = [
  'Flood',
  'Landslide',
  'Fire',
  'Earthquake',
  'Storm surge',
  'Typhoon',
  'Road accident',
  'Other',
];

export default function ReportTypeStep({ types = DISASTER_TYPES, selected, onSelect }) {
  return (
    <div className="h-full overflow-y-auto bg-app-bg p-4">
      <p className="text-xs text-text-tertiary font-medium uppercase tracking-wide mb-4">
        What happened?
      </p>
      <ul className="flex flex-col gap-2">
        {types.map((type) => {
          const isSelected = type === selected;
          return (
            <li key={type}>
              <button
                type="button"
                onClick={() => onSelect(type)}
                className={`w-full text-left px-4 py-4 rounded-xl text-sm font-medium
                  bg-surface shadow-card border-2 transition-colors
                  ${
                    isSelected
                      ? 'border-urgent bg-urgent/5 text-urgent'
                      : 'border-transparent text-text-primary'
                  }`}
              >
                {type}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
