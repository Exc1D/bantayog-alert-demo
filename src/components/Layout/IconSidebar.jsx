import { NavLink } from 'react-router-dom';
import { MapTrifold, Article, Bell, User, PlusCircle } from '@phosphor-icons/react';

const TABS = [
  { label: 'Map', href: '/', icon: MapTrifold, end: true },
  { label: 'Feed', href: '/feed', icon: Article },
  { label: 'Alerts', href: '/alerts', icon: Bell },
  { label: 'Profile', href: '/profile', icon: User },
];

export default function IconSidebar() {
  return (
    <nav
      aria-label="Main navigation"
      className="w-11 bg-surface border-r border-black/10 flex flex-col items-center py-3 gap-1 flex-shrink-0"
    >
      {/* Report shortcut button */}
      <NavLink
        to="/report"
        aria-label="Create report"
        className="w-9 h-9 rounded-lg flex items-center justify-center text-emergency dark:text-emergency-dark hover:bg-emergency/10 transition-colors"
      >
        <PlusCircle weight="fill" size={20} />
      </NavLink>

      {/* Separator */}
      <div className="w-6 h-px bg-black/10 my-1" />

      {TABS.map(({ label, href, icon: Icon, end }) => (
        <NavLink
          key={href}
          to={href}
          end={end}
          aria-label={label}
          className={({ isActive }) =>
            `group relative w-9 h-9 rounded-lg flex items-center justify-center transition-colors
             ${isActive ? 'text-emergency dark:text-emergency-dark bg-emergency/10' : 'text-text-tertiary hover:text-text-primary hover:bg-black/5'}`
          }
        >
          {({ isActive }) => (
            <>
              <Icon weight={isActive ? 'fill' : 'regular'} size={20} />
              {isActive && (
                <span className="absolute left-0 top-1 bottom-1 w-0.5 bg-emergency dark:bg-emergency-dark rounded-r" />
              )}
              {/* Tooltip */}
              <span className="absolute left-full ml-2 px-2 py-1 bg-shell text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                {label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
