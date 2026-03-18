import { NavLink } from 'react-router-dom';

const TABS = [
  { label: 'Map', href: '/' },
  { label: 'Feed', href: '/feed' },
  { label: 'Alerts', href: '/alerts' },
  { label: 'Profile', href: '/profile' },
];

export default function TabNavigation() {
  return (
    <nav
      aria-label="Main navigation"
      className="bg-white/90 backdrop-blur border-t border-black/10 grid grid-cols-4"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {TABS.map(({ label, href }) => (
        <NavLink
          key={href}
          to={href}
          end={href === '/'}
          aria-label={label}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium
             transition-colors focus-visible:outline-none focus-visible:ring-2
             focus-visible:ring-urgent focus-visible:ring-inset
             ${isActive ? 'text-text-primary' : 'text-text-tertiary'}`
          }
        >
          {({ isActive }) => (
            <>
              <span
                aria-hidden="true"
                className={`w-1 h-1 rounded-full transition-colors
                  ${isActive ? 'bg-urgent' : 'bg-transparent'}`}
              />
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
