import { useMemo } from 'react';
import AnnouncementCard from '../components/Alerts/AnnouncementCard';
import { useAnnouncements } from '../hooks/useAnnouncements';
import { useGeolocation } from '../hooks/useGeolocation';
import { resolveMunicipality } from '../utils/geoFencing';

export default function AlertsTab() {
  const { location } = useGeolocation();

  // Resolve municipality from geolocation
  const municipality = useMemo(() => {
    if (!location?.lat || !location?.lng) {
      return null;
    }
    const result = resolveMunicipality(location.lat, location.lng);
    return result.municipality;
  }, [location]);

  // Fetch announcements with scope
  const { announcements, loading: announcementsLoading } = useAnnouncements(municipality);

  return (
    <div className="max-w-[800px] mx-auto lg:max-w-none px-3 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Active Alerts</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {municipality ? `Showing alerts for ${municipality}` : 'Locating you...'}
        </p>
      </div>

      {announcementsLoading ? (
        <p className="text-gray-500 text-center py-4">Loading alerts...</p>
      ) : announcements.length > 0 ? (
        <div className="space-y-3">
          {announcements.map((announcement) => (
            <AnnouncementCard key={announcement.id} announcement={announcement} />
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-4">No active alerts</p>
      )}
    </div>
  );
}
