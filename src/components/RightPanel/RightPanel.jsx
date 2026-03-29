import { useState } from 'react';
import {
  Article,
  Bell,
  ChartBar,
} from '@phosphor-icons/react';
import FeedPanel from './FeedPanel';
import AlertsPanel from './AlertsPanel';
import WeatherTab from '../../pages/WeatherTab';
import IncidentDetail from './IncidentDetail';
import { useMapPanel } from '../../contexts/MapPanelContext';

const TABS = [
  { id: 'feed',    label: 'Feed',    icon: Article },
  { id: 'alerts',  label: 'Alerts', icon: Bell },
  { id: 'weather', label: 'Weather', icon: ChartBar },
];

function deriveInitialTab(activeTab) {
  if (activeTab === 'alerts') return 'alerts';
  if (activeTab === 'feed') return 'feed';
  if (activeTab === 'weather') return 'weather';
  return 'feed';
}

export default function RightPanel({ activeTab, className = '' }) {
  const { incidentDetailReport } = useMapPanel();
  const [activePanelTab, setActivePanelTab] = useState(() => deriveInitialTab(activeTab));

  if (incidentDetailReport) {
    return <IncidentDetail className={className} />;
  }

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-dark-card border-l border-border/60 dark:border-dark-border ${className}`}>
      <div className="flex border-b border-border/60 dark:border-dark-border" role="tablist">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={activePanelTab === id}
            onClick={() => setActivePanelTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium
                       transition-colors border-b-2 -mb-px
                       ${activePanelTab === id
                         ? 'text-primary dark:text-dark-accent border-primary dark:border-dark-accent'
                         : 'text-textLight dark:text-dark-textLight border-transparent hover:text-text dark:hover:text-white'
                       }`}
          >
            <Icon size={16} weight={activePanelTab === id ? 'fill' : 'regular'} aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-hidden">
        {activePanelTab === 'feed' && <FeedPanel />}
        {activePanelTab === 'alerts' && <AlertsPanel />}
        {activePanelTab === 'weather' && <WeatherTab />}
      </div>
    </div>
  );
}
