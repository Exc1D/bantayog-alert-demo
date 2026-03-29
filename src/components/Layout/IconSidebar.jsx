// src/components/Layout/IconSidebar.jsx
import {
  MapTrifold,
  Article,
  Bell,
  ChartBar,
  User,
  PlusCircle,
  ShieldCheck,
} from '@phosphor-icons/react';
import { useAuthContext } from '../../contexts/AuthContext';

const TABS = [
  { id: 'map',     label: 'Map',     icon: MapTrifold },
  { id: 'feed',    label: 'Feed',    icon: Article },
  { id: 'alerts',  label: 'Alerts',  icon: Bell },
  { id: 'weather', label: 'Weather', icon: ChartBar },
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'admin',   label: 'Admin',   icon: ShieldCheck, adminOnly: true },
];

export default function IconSidebar({ activeTab, onTabChange }) {
  const { isAdmin } = useAuthContext();

  function handleClick(tabId) {
    window.location.hash = tabId === 'map' ? '' : tabId;
    onTabChange(tabId);
  }

  function handleReportClick() {
    window.location.hash = 'report';
  }

  return (
    <nav
      aria-label="Main navigation"
      className="w-11 bg-white dark:bg-dark-card border-r border-border/60 dark:border-dark-border
                 flex flex-col items-center py-3 gap-1 flex-shrink-0"
    >
      {/* Report shortcut */}
      <button
        type="button"
        onClick={handleReportClick}
        aria-label="New report"
        className="w-9 h-9 rounded-lg flex items-center justify-center
                   text-accent hover:bg-accent/10 transition-colors"
      >
        <PlusCircle size={22} weight="fill" aria-hidden="true" />
      </button>

      <div className="w-6 h-px bg-border/40 dark:bg-dark-border/40 my-1" aria-hidden="true" />

      {TABS.filter((t) => !t.adminOnly || isAdmin).map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => handleClick(tab.id)}
          aria-label={tab.label}
          aria-pressed={activeTab === tab.id}
          className={`group relative w-9 h-9 rounded-lg flex items-center justify-center transition-colors
                     ${activeTab === tab.id
                       ? 'bg-primary/10 text-primary dark:bg-dark-accent/20 dark:text-dark-accent'
                       : 'text-textLight dark:text-dark-textLight hover:bg-stone-100 dark:hover:bg-dark-elevated hover:text-text dark:hover:text-white'
                     }`}
        >
          <tab.icon
            size={22}
            weight={activeTab === tab.id ? 'fill' : 'regular'}
            aria-hidden="true"
          />
          {/* Hover tooltip */}
          <span className="absolute left-full ml-3 px-2 py-1 bg-dark-bg text-white text-xs
                           rounded opacity-0 group-hover:opacity-100 pointer-events-none
                           whitespace-nowrap z-50 transition-opacity duration-150 shadow-lg">
            {tab.label}
          </span>
        </button>
      ))}
    </nav>
  );
}
