import { NavLink } from 'react-router-dom';

function MapIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
      <line x1="9" y1="3" x2="9" y2="18" />
      <line x1="15" y1="6" x2="15" y2="21" />
    </svg>
  );
}

function FeedIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

function AlertsIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="9 3 15 8 9 13" />
    </svg>
  );
}

const TABS = [
  { label: 'Map', href: '/', icon: <MapIcon />, end: true },
  { label: 'Feed', href: '/feed', icon: <FeedIcon /> },
  { label: 'Alerts', href: '/alerts', icon: <AlertsIcon /> },
  { label: 'Profile', href: '/profile', icon: <ProfileIcon /> },
];

export default function EnhancedSidebar({ isCollapsed, onToggle }) {
  const width = isCollapsed ? '44px' : '180px';

  return (
    <nav
      aria-label="Main navigation"
      data-testid="enhanced-sidebar"
      className={`bg-surface border-r border-black/10 dark:border-white/10 flex flex-col transition-all duration-300 flex-shrink-0`}
      style={{ width }}
    >
      {/* App logo/brand area */}
      <div className="h-14 flex items-center justify-between px-3 border-b border-black/5 dark:border-white/10">
        {!isCollapsed && <span className="font-bold text-text-primary select-none">Bantayog</span>}
        <button
          onClick={onToggle}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={`w-6 h-6 rounded hover:bg-black/5 dark:hover:bg-black/10 flex items-center justify-center text-text-tertiary`}
        >
          <ChevronRightIcon
            className={`transform transition-transform ${isCollapsed ? 'rotate-0' : 'rotate-180'}`}
          />
        </button>
      </div>

      {/* Nav items */}
      <div className="flex-1 py-3 flex flex-col gap-1 overflow-y-auto">
        {TABS.map(({ label, href, icon, end }) => (
          <NavLink
            key={href}
            to={href}
            end={end}
            aria-label={label}
            title={isCollapsed ? label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 transition-colors relative
               ${isActive ? 'text-urgent bg-urgent/5 border-r-2 border-urgent' : 'text-text-tertiary hover:text-text-primary hover:bg-black/5 dark:hover:bg-black/10'}
               ${isCollapsed ? 'justify-center' : ''}`
            }
          >
            {icon}
            {!isCollapsed && <span className="font-medium text-sm whitespace-nowrap">{label}</span>}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
