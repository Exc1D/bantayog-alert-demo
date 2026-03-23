import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Article, Bell, ChartBar } from '@phosphor-icons/react';
import FeedPanel from './FeedPanel';
import AlertsPanel from './AlertsPanel';
import DataPanel from './DataPanel';
import IncidentDetail from './IncidentDetail';
import { useMapPanel } from '../../contexts/MapPanelContext';

const TABS = [
  { id: 'feed', label: 'Feed', icon: Article },
  { id: 'alerts', label: 'Alerts', icon: Bell },
  { id: 'data', label: 'Data', icon: ChartBar },
];

export default function RightPanel() {
  const location = useLocation();
  const { incidentDetailReport } = useMapPanel();

  const getInitialTab = () => {
    if (location.pathname === '/alerts') return 'alerts';
    if (location.pathname === '/weather') return 'data';
    return 'feed';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);

  if (incidentDetailReport) {
    return <IncidentDetail />;
  }

  return (
    <div className="flex flex-col h-full bg-surface dark:bg-dark-bg border-l border-dark-border">
      <div className="flex border-b border-dark-border">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium
                       transition-colors border-b-2 -mb-px
                       ${activeTab === id
                         ? 'text-dark-text dark:text-dark-text border-emergency dark:border-emergency-dark'
                         : 'text-muted-dark dark:text-muted-dark border-transparent hover:text-dark-text dark:hover:text-dark-text'
                       }`}
            role="tab"
            aria-selected={activeTab === id}
          >
            <Icon size={16} weight={activeTab === id ? 'fill' : 'regular'} aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-hidden">
        {activeTab === 'feed' && <FeedPanel />}
        {activeTab === 'alerts' && <AlertsPanel />}
        {activeTab === 'data' && <DataPanel />}
      </div>
    </div>
  );
}
