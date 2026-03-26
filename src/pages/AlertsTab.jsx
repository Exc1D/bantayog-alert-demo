import { useAnnouncements } from '../hooks/useAnnouncements';
import { useAuthContext } from '../contexts/AuthContext';
import AnnouncementCard from '../components/Alerts/AnnouncementCard';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import EmptyState from '../components/Common/EmptyState';

export default function AlertsTab() {
  const { userProfile } = useAuthContext();
  const municipality = userProfile?.municipality;
  const { announcements, loading, error } = useAnnouncements(municipality);

  if (loading) {
    return <LoadingSpinner text="Loading announcements..." />;
  }

  if (error) {
    return (
      <div className="max-w-[800px] mx-auto px-3 py-4">
        <EmptyState
          icon="info"
          title="Unable to load announcements"
          description="There was a problem fetching announcements. Please try again later."
        />
      </div>
    );
  }

  return (
    <div className="max-w-[800px] mx-auto lg:max-w-5xl xl:max-w-7xl px-3 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-6">
      <div className="mb-4">
        <h1 className="text-base font-bold tracking-wide text-text dark:text-dark-text">
          Announcements
        </h1>
        <p className="text-xs text-textLight dark:text-dark-textLight mt-0.5">
          Official alerts for{' '}
          {municipality ? `${municipality}, Camarines Norte` : 'Camarines Norte'}
        </p>
      </div>

      {announcements.length === 0 ? (
        <EmptyState
          icon="info"
          title="No active announcements"
          description="There are no active alerts at this time. Stay safe!"
        />
      ) : (
        <div className="space-y-3">
          {announcements.map((announcement) => (
            <AnnouncementCard key={announcement.id} announcement={announcement} />
          ))}
        </div>
      )}
    </div>
  );
}
