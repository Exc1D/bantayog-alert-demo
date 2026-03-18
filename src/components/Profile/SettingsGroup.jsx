import { Link } from 'react-router-dom';

export default function SettingsGroup({ items }) {
  return (
    <div className="bg-surface rounded-xl overflow-hidden shadow-card">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        const inner = (
          <div
            className={`flex items-center justify-between px-4 py-3
              ${!isLast ? 'border-b border-black/5' : ''}`}
          >
            <span
              className={`text-sm ${item.destructive ? 'text-urgent font-medium' : 'text-text-primary'}`}
            >
              {item.label}
            </span>
            <div className="flex items-center gap-1 text-text-tertiary">
              {item.rightElement}
              {item.rightLabel && <span className="text-sm">{item.rightLabel}</span>}
              {(item.href || item.onPress) && !item.rightElement && (
                <span className="text-base">›</span>
              )}
            </div>
          </div>
        );

        if (item.href) {
          return (
            <Link key={item.label} to={item.href}>
              {inner}
            </Link>
          );
        }
        if (item.onPress) {
          return (
            <button
              key={item.label}
              type="button"
              onClick={item.onPress}
              className="w-full text-left"
            >
              {inner}
            </button>
          );
        }
        return <div key={item.label}>{inner}</div>;
      })}
    </div>
  );
}
