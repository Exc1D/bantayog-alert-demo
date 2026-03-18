import { useMemo } from 'react';
import { useGeolocation } from '../hooks/useGeolocation';
import { useWeather } from '../hooks/useWeather';
import { useReports } from '../hooks/useReports';
import { useAnnouncements } from '../hooks/useAnnouncements';
import { useNearestReport } from '../hooks/useNearestReport';
import { resolveMunicipality } from '../utils/geoFencing';
import SuspensionCard from '../components/Alerts/SuspensionCard';
import WeatherCard from '../components/Alerts/WeatherCard';
import NearestReportCard from '../components/Alerts/NearestReportCard';

export default function AlertsTab() {
  const { location } = useGeolocation();

  // Derive municipality string from GPS coordinates
  const municipality = useMemo(() => {
    if (!location?.lat || !location?.lng) return null;
    const result = resolveMunicipality(location.lat, location.lng);
    return result.municipality === 'Unknown' ? null : result.municipality;
  }, [location]);

  const { weather, loading: weatherLoading } = useWeather(municipality);
  const { suspensions } = useAnnouncements(municipality);
  const { reports } = useReports();
  const nearestReport = useNearestReport(reports);

  return (
    <div className="h-full overflow-y-auto bg-app-bg">
      <div className="flex flex-col gap-3 p-4">
        <SuspensionCard suspensions={suspensions} />
        <WeatherCard weather={weather} loading={weatherLoading} />
        <NearestReportCard report={nearestReport} />
      </div>
    </div>
  );
}
