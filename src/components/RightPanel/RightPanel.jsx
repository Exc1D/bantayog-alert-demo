import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Article, Bell, ChartBar } from '@phosphor-icons/react';
import { useMapPanel } from '../../contexts/MapPanelContext';
import FeedPanel from './FeedPanel';
import AlertsPanel from './AlertsPanel';
import DataPanel from './DataPanel';
import IncidentDetail from './IncidentDetail';

const TABS = [
  { id: 'feed', label: 'Feed', icon: Article },
  { id: 'alerts', label: 'Alerts', icon: Bell },
  { id: 'data', label: 'Data', icon: ChartBar },
];

function getTabFromPathname(pathname) {
  if (pathname === '/alerts') return 'alerts';
  if (pathname === '/feed') return 'feed';
  if (pathname === '/weather') return 'data';
  return 'feed';
}

export default function RightPanel() {
  const location = useLocation();
  const { incidentDetailReport } = useMapPanel();

  const [activeTab, setActiveTab] = useState(() => getTabFromPathname(location.pathname));
  const userSelected = useRef(false);

  useEffect(() => {
    if (!userSelected.current) {
      setActiveTab(getTabFromPathname(location.pathname));
    }
  }, [location.pathname]);

  function handleTabClick(id) {
    userSelected.current = true;
    setActiveTab(id);
  }

  // If an incident is selected, show detail instead of tabs
  if (incidentDetailReport) {
    return <IncidentDetail />;
  }

  return (
    <div className="flex flex-col h-full bg-surface-dark dark:bg-surface-dark border-l border-border-dark">
      {/* Tab bar */}
      <div className="flex border-b border-border-dark">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => handleTabClick(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium
                       transition-colors border-b-2 -mb-px
                       ${activeTab === id
                         ? 'text-text-dark border-emergency dark:border-emergency-dark'
                         : 'text-text-muted-dark border-transparent hover:text-text-dark'
                       }`}
            aria-selected={activeTab === id}
            role="tab"
          >
            <Icon size={16} weight={activeTab === id ? 'fill' : 'regular'} aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'feed' && <FeedPanel />}
        {activeTab === 'alerts' && <AlertsPanel />}
        {activeTab === 'data' && <DataPanel />}
      </div>
    </div>
  );
}
