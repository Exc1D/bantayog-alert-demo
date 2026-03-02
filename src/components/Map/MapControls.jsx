import { useState } from 'react';
import { MUNICIPALITIES } from '../../utils/constants';
const LAYERS = [
  { id: 'streets', name: 'Streets' },
  { id: 'satellite', name: 'Satellite' },
];

export default function MapControls({
  filters,
  onFilterChange,
  reportCount,
  activeLayer,
  onLayerChange,
}) {
  const [showLegend, setShowLegend] = useState(false);

  const selectClass =
    'text-[11px] font-medium border border-border rounded-lg px-2 py-1.5 bg-bg text-text focus:ring-2 focus:ring-accent/50 focus:border-accent appearance-none dark:bg-dark-elevated dark:text-dark-text dark:border-dark-border';

  const legendItems = [
    { type: 'critical', label: 'Critical', color: 'bg-red-500' },
    { type: 'moderate', label: 'Moderate', color: 'bg-amber-500' },
    { type: 'minor', label: 'Minor', color: 'bg-emerald-500' },
    { type: 'resolved', label: 'Resolved', color: 'bg-blue-500' },
  ];

  return (
    <div className="absolute top-3 left-3 z-[1000] pointer-events-none">
      <div className="bg-white/95 dark:bg-dark-card/95 backdrop-blur-sm rounded-xl shadow-card dark:shadow-dark p-2.5 pointer-events-auto w-fit border border-border/60 dark:border-dark-border">
        <div className="flex flex-wrap gap-2 items-center">
          <select
            aria-label="Filter by municipality"
            value={filters.municipality || 'all'}
            onChange={(e) => onFilterChange({ ...filters, municipality: e.target.value })}
            className={selectClass}
          >
            <option value="all">All Areas</option>
            {MUNICIPALITIES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          {/* Layer Toggle */}
          <div className="flex items-center gap-1">
            {LAYERS.map((layer) => (
              <button
                key={layer.id}
                onClick={() => onLayerChange?.(layer.id)}
                className={`text-[11px] font-medium border rounded-lg px-2 py-1 transition-colors ${
                  activeLayer === layer.id
                    ? 'bg-accent border-accent text-white'
                    : 'border-border dark:border-dark-border text-textLight dark:text-dark-textLight hover:bg-border/50 dark:hover:bg-dark-elevated'
                }`}
                aria-label={`Switch to ${layer.name} view`}
              >
                {layer.name}
              </button>
            ))}
          </div>

          {/* Legend Toggle */}
          <button
            onClick={() => setShowLegend(!showLegend)}
            className="text-[11px] font-medium border border-border dark:border-dark-border rounded-lg px-2 py-1.5 text-text dark:text-dark-text hover:bg-border/50 dark:hover:bg-dark-elevated transition-colors"
            aria-label="Toggle legend"
            aria-expanded={showLegend}
            aria-controls="map-legend"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="18" rx="2" height="18" ry="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="9" y1="21" x2="9" y2="9" />
            </svg>
          </button>

          <div className="ml-auto flex items-center gap-1.5 bg-border/40 dark:bg-dark-elevated rounded-full px-2.5 py-1">
            <span className="w-1.5 h-1.5 bg-accent rounded-full live-beacon" />
            <span className="text-[10px] font-bold text-textLight dark:text-dark-textLight tracking-wide">
              {reportCount}
            </span>
          </div>
        </div>

        {/* Legend Dropdown */}
        {showLegend && (
          <div id="map-legend" className="mt-2 pt-2 border-t border-border dark:border-dark-border">
            <p className="text-[10px] text-textMuted dark:text-dark-textMuted uppercase tracking-wider font-semibold mb-2">
              Marker Legend
            </p>
            <div className="space-y-1.5">
              {legendItems.map((item) => (
                <div key={item.type} className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${item.color}`} />
                  <span className="text-[10px] text-textLight dark:text-dark-textLight">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
