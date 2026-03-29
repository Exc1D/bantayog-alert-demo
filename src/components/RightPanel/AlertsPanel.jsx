import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../utils/firebaseConfig';
import { useMapPanel } from '../../contexts/MapPanelContext';
import { Drop, Fire, Car, Users, Warning, Question, Bell } from '@phosphor-icons/react';

const DISASTER_ICONS = {
  flooding: Drop,
  landslide: Warning,
  fire: Fire,
  accident: Car,
  crowding: Users,
  other: Question,
};

function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function timeAgo(timestamp) {
  if (!timestamp?.seconds) return '';
  const seconds = Math.floor(Date.now() / 1000 - timestamp.seconds);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function AlertItem({ report, onClick, isSelected }) {
  const Icon = DISASTER_ICONS[report.disaster?.type] ?? Question;
  const severityColors = {
    critical: 'border-l-red-500',
    moderate: 'border-l-amber-500',
    minor: 'border-l-emerald-500',
  };
  const colorClass = severityColors[report.disaster?.severity] ?? 'border-l-gray-400';

  return (
    <div
      className={`flex items-start gap-3 p-3 cursor-pointer transition-colors border-l-2 ${colorClass}
                 ${isSelected ? 'bg-accent/5 dark:bg-dark-accent/10' : 'hover:bg-stone-50 dark:hover:bg-dark-elevated'}`}
      onClick={() => onClick(report)}
      role="article"
    >
      <div className="w-8 h-8 rounded-full bg-alertRed/10 flex items-center justify-center flex-shrink-0">
        <Icon size={16} weight="fill" className="text-alertRed" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text dark:text-dark-text capitalize">
          {report.disaster?.type}
        </p>
        <p className="text-xs text-textLight dark:text-dark-textLight mt-0.5">
          {report.location?.municipality}
        </p>
        <p className="text-xs text-textLight dark:text-dark-textLight">
          {timeAgo(report.timestamp)}
        </p>
      </div>
    </div>
  );
}

export default function AlertsPanel() {
  const [alerts, setAlerts] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const { selectedReportId, setSelectedReportId, setIncidentDetailReport } = useMapPanel();

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, 'reports'),
      where('verification.status', 'in', ['pending', 'verified']),
      orderBy('timestamp', 'desc'),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let docs = snapshot.docs.map((d) => ({ ...d.data(), id: d.id }));
      if (userLocation) {
        docs.sort((a, b) => {
          const distA = distanceKm(
            userLocation.lat, userLocation.lng,
            a.location?.lat ?? 0, a.location?.lng ?? 0
          );
          const distB = distanceKm(
            userLocation.lat, userLocation.lng,
            b.location?.lat ?? 0, b.location?.lng ?? 0
          );
          return distA - distB;
        });
      }
      setAlerts(docs);
      setLoading(false);
    }, () => setLoading(false));

    return () => unsubscribe();
  }, [userLocation]);

  function handleClick(report) {
    setSelectedReportId(report.id);
    setIncidentDetailReport(report);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col gap-2 items-center text-textLight dark:text-dark-textLight">
          <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">Loading...</span>
        </div>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-textLight dark:text-dark-textLight">
        <Bell size={32} aria-hidden="true" />
        <p className="text-sm font-medium text-text dark:text-dark-text">No active alerts</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      {alerts.map((report) => (
        <AlertItem
          key={report.id}
          report={report}
          onClick={handleClick}
          isSelected={selectedReportId === report.id}
        />
      ))}
    </div>
  );
}
