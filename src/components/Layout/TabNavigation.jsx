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
      className="bg-white/90 backdrop-blur border-t border-black/10 grid grid-cols-4"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {TABS.map(({ label, href, icon: Icon }) => (
        <NavLink
          key={href}
          to={href}
          end={href === '/'}
          aria-label={label}
          className={({ isActive }) =>
            `relative flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium
             transition-colors focus-visible:outline-none focus-visible:ring-2
             focus-visible:ring-urgent focus-visible:ring-inset
             ${isActive ? 'text-text-primary' : 'text-text-tertiary'}`
          }
        >
          {({ isActive }) => (
            <>
              <span
                aria-hidden="true"
                className={`w-full h-0.5 absolute top-0 rounded-b transition-colors ${isActive ? 'bg-emergency dark:bg-emergency-dark' : 'bg-transparent'}`}
              />
              <Icon size={20} weight={isActive ? 'fill' : 'regular'} aria-hidden="true" />
              <span className={isActive ? 'font-bold' : ''}>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
