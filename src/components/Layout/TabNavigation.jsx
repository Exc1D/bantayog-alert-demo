import { NavLink } from 'react-router-dom';
import { MapTrifold, Article, CloudSun, User } from '@phosphor-icons/react';

const TABS = [
  { label: 'Map', href: '/', icon: MapTrifold },
  { label: 'Feed', href: '/feed', icon: Article },
  { label: 'Weather', href: '/weather', icon: CloudSun },
  { label: 'Profile', href: '/profile', icon: User },
];

export default function TabNavigation() {
  return (
    <nav
      aria-label="Main navigation"
      className="bg-surface dark:bg-dark-bg border-t border-dark-border
                 grid grid-cols-4"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {TABS.map(({ label, href, icon: Icon }) => (
        <NavLink
          key={href}
          to={href}
          end={href === '/'}
          aria-label={label}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium
             transition-colors focus-visible:outline-none focus-visible:ring-2
             focus-visible:ring-emergency focus-visible:ring-inset relative
             ${isActive ? 'text-dark-text dark:text-dark-text' : 'text-muted-dark dark:text-muted-dark'}`
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={`w-full h-0.5 absolute top-0 transition-colors rounded-b
                  ${isActive ? 'bg-emergency dark:bg-emergency-dark' : 'bg-transparent'}`}
                aria-hidden="true"
              />
              <Icon size={20} weight={isActive ? 'fill' : 'regular'} aria-hidden="true" />
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
