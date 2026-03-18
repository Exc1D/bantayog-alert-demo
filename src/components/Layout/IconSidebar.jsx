import { NavLink } from 'react-router-dom';

function MapIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
      <line x1="9" y1="3" x2="9" y2="18" />
      <line x1="15" y1="6" x2="15" y2="21" />
    </svg>
  );
}

function FeedIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

const TABS = [
  { label: 'Map', href: '/', icon: <MapIcon />, end: true },
  { label: 'Feed', href: '/feed', icon: <FeedIcon /> },
  { label: 'Alerts', href: '/alerts', icon: <AlertsIcon /> },
  { label: 'Profile', href: '/profile', icon: <ProfileIcon /> },
];

export default function IconSidebar() {
  return (
    <nav
      aria-label="Main navigation"
      className="w-11 bg-surface border-r border-black/10 flex flex-col items-center py-3 gap-1 flex-shrink-0"
    >
      {/* App name initial */}
      <span className="text-xs font-bold text-text-primary mb-3 select-none">B</span>

      {TABS.map(({ label, href, icon, end }) => (
        <NavLink
          key={href}
          to={href}
          end={end}
          aria-label={label}
          className={({ isActive }) =>
            `w-9 h-9 rounded-lg flex items-center justify-center transition-colors relative
             ${isActive ? 'text-urgent bg-urgent/10' : 'text-text-tertiary hover:text-text-primary hover:bg-black/5'}`
          }
        >
          {({ isActive }) => (
            <>
              {icon}
              {isActive && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-urgent" />
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
