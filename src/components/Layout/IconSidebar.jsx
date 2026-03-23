// src/components/Layout/IconSidebar.jsx
import { NavLink } from 'react-router-dom';
import { MapTrifold, Article, Bell, User, PlusCircle } from '@phosphor-icons/react';

const TABS = [
  { label: 'Map', href: '/', icon: MapTrifold, end: true },
  { label: 'Feed', href: '/feed', icon: Article },
  { label: 'Alerts', href: '/alerts', icon: Bell },
  { label: 'Profile', href: '/profile', icon: User },
];

function SidebarTab({ label, href, icon: Icon, end }) {
  return (
    <NavLink
      key={href}
      to={href}
      end={end}
      aria-label={label}
      className={({ isActive }) =>
        `group relative w-9 h-9 rounded-lg flex items-center justify-center
         transition-colors
         ${
           isActive
             ? 'bg-surface dark:bg-dark-bg text-dark-text dark:text-dark-text'
             : 'text-muted-dark dark:text-muted-dark hover:text-dark-text hover:bg-dark-bg/50'
         }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={22} weight={isActive ? 'fill' : 'regular'} aria-hidden="true" />
          {/* Active indicator — accent left border */}
          {isActive && (
            <span className="absolute left-0 top-1 bottom-1 w-0.5 bg-emergency dark:bg-emergency-dark rounded-r" />
          )}
          {/* Hover tooltip */}
          <span
            className="absolute left-full ml-2 px-2 py-1 bg-[#1C1C1E] text-white text-xs
                           rounded opacity-0 group-hover:opacity-100 pointer-events-none
                           whitespace-nowrap z-50 transition-opacity"
          >
            {label}
          </span>
        </>
      )}
    </NavLink>
  );
}

export default function IconSidebar() {
  return (
    <nav
      aria-label="Main navigation"
      className="w-11 bg-surface dark:bg-dark-bg border-r border-dark-border
                 flex flex-col items-center py-3 gap-1 flex-shrink-0"
    >
      {/* Report shortcut — desktop "+" icon */}
      <NavLink
        to="/report"
        aria-label="New report"
        className="w-9 h-9 rounded-lg flex items-center justify-center
                   text-emergency dark:text-emergency-dark hover:bg-emergency/10 transition-colors"
      >
        <PlusCircle size={22} weight="fill" aria-hidden="true" />
      </NavLink>

      <div className="w-6 h-px bg-dark-border my-1" aria-hidden="true" />

      {TABS.map(({ label, href, icon, end }) => (
        <SidebarTab key={href} label={label} href={href} icon={icon} end={end} />
      ))}
    </nav>
  );
}
