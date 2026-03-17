import React from 'react';
import PropTypes from 'prop-types';

/**
 * TabNavigation component
 *
 * Renders a horizontal tab bar (mobile) or vertical sidebar (desktop) with:
 * - Tab icons and labels
 * - Active indicator (red 4px dot above tab label)
 * - Dark mode support using new design tokens
 * - Proper accessibility with ARIA labels
 *
 * Design spec: 4 citizen tabs with bottom tab bar on mobile, sidebar on desktop (lg+)
 * Active indicator: Small red dot (#FF3B30, 4px circle) above tab label
 *
 * @param {Array<{id: string, label: string, icon: Function}>} tabs - Tab configuration array
 * @param {string} currentTab - Currently active tab ID
 * @param {Function} onTabChange - Callback when tab changes (receives tab id)
 */
function TabNavigation({ tabs, currentTab, onTabChange }) {
  return (
    <nav
      className="
        fixed bottom-0 left-0 right-0 lg:fixed lg:left-0 lg:top-14 lg:bottom-auto lg:w-14 lg:flex-col
        flex lg:flex
        bg-surface dark:bg-dark-card
        border-t lg:border-t-0 lg:border-r border-separator dark:border-dark-border
        backdrop-blur-xl
        z-50
      "
      role="tablist"
      aria-label="Main navigation"
    >
      {tabs.map((tab) => {
        const isActive = currentTab === tab.id;

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-label={tab.label}
            onClick={() => onTabChange(tab.id)}
            className="
              flex-1 lg:flex-1
              flex flex-col items-center justify-center
              py-2 lg:py-4 px-3 lg:px-0
              gap-1 lg:gap-2
              relative
              transition-colors duration-200
              text-text-tertiary hover:text-text-secondary
              dark:text-dark-textLight dark:hover:text-dark-text
              focus:outline-none focus-visible:ring-2 focus-visible:ring-urgent focus-visible:ring-offset-2
              dark:focus-visible:ring-offset-dark-card
            "
          >
            {/* Active indicator dot - positioned above icon */}
            {isActive && (
              <div
                className="
                  absolute -top-1.5 lg:top-1 lg:-left-1.5
                  w-1 h-1 lg:w-1 lg:h-1
                  rounded-full
                  bg-urgent
                  animate-pulse
                "
                aria-hidden="true"
              />
            )}

            {/* Tab icon */}
            <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
              {tab.icon(isActive, document.documentElement.classList.contains('dark'))}
            </div>

            {/* Tab label */}
            <span
              className={`
                text-xs font-medium
                tracking-tight
                transition-colors duration-200
                ${isActive
                  ? 'text-text-primary dark:text-dark-text'
                  : 'text-text-tertiary dark:text-dark-textLight'
                }
              `}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

TabNavigation.propTypes = {
  tabs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      icon: PropTypes.func.isRequired,
    })
  ).isRequired,
  currentTab: PropTypes.string.isRequired,
  onTabChange: PropTypes.func.isRequired,
};

export default TabNavigation;
