import { Drop, Fire, Car, Users, Warning, Question } from '@phosphor-icons/react';

const TYPES = [
  { id: 'flooding', label: 'Flooding', icon: Drop },
  { id: 'landslide', label: 'Landslide', icon: Warning },
  { id: 'fire', label: 'Fire', icon: Fire },
  { id: 'accident', label: 'Accident', icon: Car },
  { id: 'crowding', label: 'Crowding', icon: Users },
  { id: 'other', label: 'Other', icon: Question },
];

export default function ReportTypeGrid({ selected, onSelect }) {
  return (
    <div className="grid grid-cols-2 gap-3 p-4" role="radiogroup" aria-label="Disaster type">
      {TYPES.map(({ id, label, icon: Icon }) => (
        <button key={id} type="button" role="radio" aria-checked={selected === id} onClick={() => onSelect(id)}
          className={`flex flex-col items-center justify-center gap-2 py-6 rounded-xl border-2 transition-all active:scale-95 min-h-[80px]
            ${selected === id ? 'border-emergency dark:border-emergency-dark bg-emergency/10 dark:bg-emergency-dark/10' : 'border-border-dark dark:border-border-dark bg-surface-dark/50 dark:bg-surface-dark hover:border-text-muted-dark'}`}>
          <Icon size={28} weight={selected === id ? 'fill' : 'regular'}
            className={selected === id ? 'text-emergency dark:text-emergency-dark' : 'text-text-muted-dark'} aria-hidden="true" />
          <span className={`text-sm font-medium ${selected === id ? 'text-emergency dark:text-emergency-dark' : 'text-text-dark'}`}>{label}</span>
        </button>
      ))}
    </div>
  );
}
