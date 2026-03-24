import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, or, orderBy, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../utils/firebaseConfig';
import { useAuthContext } from '../../contexts/AuthContext';
import { useToast } from '../Common/Toast';
import { formatTimeAgo } from '../../utils/timeUtils';
import LoadingSpinner from '../Common/LoadingSpinner';
import EmptyState from '../Common/EmptyState';
import { captureException } from '../../utils/sentry';

const ANNOUNCEMENT_TYPE_LABELS = {
  'class-suspension': 'Class Suspension',
  'work-suspension': 'Work Suspension',
  'flood-advisory': 'Flood Advisory',
  'road-closure': 'Road Closure',
  'evacuation-order': 'Evacuation Order',
  'storm-surge': 'Storm Surge',
  'health-advisory': 'Health Advisory',
  'emergency-notice': 'Emergency Notice',
};

const SEVERITY_BADGES = {
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  warning: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  info: 'bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-300',
};

const SCOPE_BADGES = {
  Provincial: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  default: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
};

export default function AdminAlertsTab() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deactivatingId, setDeactivatingId] = useState(null);
  const [confirmDeactivateId, setConfirmDeactivateId] = useState(null);

  const { userProfile } = useAuthContext();
  const { addToast } = useToast();

  const isSuperAdmin = userProfile?.role === 'superadmin_provincial';
  const municipality = userProfile?.municipality;

  useEffect(() => {
    let unsubscribe = null;

    try {
      let announcementsQuery;

      if (isSuperAdmin) {
        // Super admin sees all active announcements
        announcementsQuery = query(
          collection(db, 'announcements'),
          where('active', '==', true),
          orderBy('createdAt', 'desc')
        );
      } else {
        // Municipal admin sees their municipality + provincial
        const scopeFilter = or(
          where('scope', '==', municipality),
          where('scope', '==', 'Provincial')
        );
        announcementsQuery = query(
          collection(db, 'announcements'),
          where('active', '==', true),
          scopeFilter,
          orderBy('createdAt', 'desc')
        );
      }

      unsubscribe = onSnapshot(
        announcementsQuery,
        (snapshot) => {
          const docs = snapshot.docs.map((d) => ({ ...d.data(), id: d.id }));
          setAnnouncements(docs);
          setLoading(false);
        },
        (err) => {
          captureException(err, {
            tags: { component: 'AdminAlertsTab', action: 'onSnapshot' },
          });
          setLoading(false);
        }
      );
    } catch (err) {
      captureException(err, {
        tags: { component: 'AdminAlertsTab', action: 'query' },
      });
      setLoading(false);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isSuperAdmin, municipality]);

  const handleDeactivate = async (announcementId) => {
    setDeactivatingId(announcementId);
    setConfirmDeactivateId(null);
    try {
      await updateDoc(doc(db, 'announcements', announcementId), {
        active: false,
        deactivatedAt: serverTimestamp(),
        deactivatedBy: userProfile?.role || 'unknown',
      });
      addToast('Announcement deactivated', 'success');
    } catch (err) {
      captureException(err, {
        tags: { component: 'AdminAlertsTab', action: 'deactivate' },
      });
      addToast('Failed to deactivate announcement', 'error');
    } finally {
      setDeactivatingId(null);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading announcements..." />;
  }

  return (
    <div>
      {/* Header */}
      <div className="bg-white dark:bg-dark-elevated border border-border/60 dark:border-dark-border rounded-xl p-4 mb-3">
        <div className="flex items-center gap-2">
          <svg
            aria-hidden="true"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#2ec4b6"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
          <h2 className="text-sm font-bold tracking-wide uppercase text-primary dark:text-dark-text">
            {isSuperAdmin ? 'Provincial' : 'Municipal'} Announcements
          </h2>
        </div>
        <p className="text-xs text-textLight dark:text-dark-textLight mt-1 ml-[26px]">
          {announcements.length} active announcement{announcements.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Announcement list */}
      {announcements.length === 0 ? (
        <EmptyState
          icon="info"
          title="No active announcements"
          description="There are no active announcements to manage."
        />
      ) : (
        <div className="space-y-2">
          {announcements.map((announcement) => {
            const typeLabel = ANNOUNCEMENT_TYPE_LABELS[announcement.type] || announcement.type;
            const sevBadge = SEVERITY_BADGES[announcement.severity] || SEVERITY_BADGES.info;
            const scopeBadge =
              announcement.scope === 'Provincial'
                ? SCOPE_BADGES.Provincial
                : SCOPE_BADGES.default;

            return (
              <div
                key={announcement.id}
                className="bg-white dark:bg-dark-card rounded-xl p-3 shadow-card border border-stone-100 dark:border-dark-border"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-bold uppercase tracking-wide dark:text-dark-text">
                        {typeLabel}
                      </span>
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${sevBadge}`}>
                        {announcement.severity}
                      </span>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${scopeBadge}`}>
                        {announcement.scope}
                      </span>
                    </div>
                    <p className="font-bold text-sm dark:text-dark-text leading-snug">
                      {announcement.title}
                    </p>
                    {announcement.body && (
                      <p className="text-xs text-textLight dark:text-dark-textLight mt-1 line-clamp-2">
                        {announcement.body}
                      </p>
                    )}
                    <p className="text-[10px] text-textLight dark:text-dark-textLight mt-1.5">
                      {formatTimeAgo(announcement.createdAt)}
                    </p>
                  </div>

                  {/* Deactivate button */}
                  <div className="shrink-0">
                    {confirmDeactivateId === announcement.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDeactivate(announcement.id)}
                          disabled={deactivatingId === announcement.id}
                          className="bg-red-600 text-white rounded-lg px-2 py-1.5 text-xs font-bold hover:bg-red-700 transition-colors disabled:opacity-40"
                        >
                          {deactivatingId === announcement.id ? '...' : 'Confirm'}
                        </button>
                        <button
                          onClick={() => setConfirmDeactivateId(null)}
                          className="bg-stone-200 dark:bg-dark-elevated text-stone-600 dark:text-dark-textLight rounded-lg px-2 py-1.5 text-xs font-bold hover:bg-stone-300 dark:hover:bg-dark-border transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeactivateId(announcement.id)}
                        className="text-stone-400 dark:text-dark-border hover:text-red-500 dark:hover:text-red-400 transition-colors p-1"
                        aria-label="Deactivate announcement"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
