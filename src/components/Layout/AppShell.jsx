import PropTypes from 'prop-types';
import Header from './Header';
import TabNavigation from './TabNavigation';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * AppShell
 *
 * Main layout component that wraps the app with a persistent header,
 * tab navigation, and content area. Supports dark mode via ThemeContext.
 *
 * Structure:
 * - Header (fixed, top)
 * - TabNavigation (sticky, below header)
 * - Main content area (children)
 */
function AppShell({ children, activeTab, onTabChange, location }) {
  const { isDark } = useTheme();

  return (
    <div
      className={`flex flex-col h-screen w-screen overflow-hidden ${
        isDark ? 'dark' : ''
      }`}
    >
      {/* Header */}
      <Header location={location} />

      {/* Tab Navigation */}
      <TabNavigation activeTab={activeTab} onTabChange={onTabChange} />

      {/* Main Content Area */}
      <main
        className={`flex-1 overflow-y-auto ${
          isDark ? 'bg-dark-bg' : 'bg-app-bg'
        }`}
        role="main"
      >
        {children}
      </main>
    </div>
  );
}

AppShell.propTypes = {
  /**
   * The active tab ID (e.g., 'map', 'feed', 'alerts', 'profile')
   */
  activeTab: PropTypes.string.isRequired,

  /**
   * Callback when tab changes; receives tab ID
   */
  onTabChange: PropTypes.func.isRequired,

  /**
   * The content to render in the main area (typically the active tab component)
   */
  children: PropTypes.node.isRequired,

  /**
   * Optional location string displayed in header
   */
  location: PropTypes.string,
};

AppShell.defaultProps = {
  location: null,
};

export default AppShell;
