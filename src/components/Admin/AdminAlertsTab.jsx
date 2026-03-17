import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../utils/firebaseConfig';
import { useAuth } from '../../hooks/useAuth';
import { isAdminRole } from '../../utils/rbac';
import AnnouncementItem from './AnnouncementItem';
import { Button } from '../Common/Button';

// Sort by severity (critical first), then by date
function sortBySeverityAndDate(announcements) {
  const severityOrder = { critical: 0, warning: 1, info: 2 };
  return [...announcements].sort((a, b) => {
    const aOrder = severityOrder[a.severity] ?? 2;
    const bOrder = severityOrder[b.severity] ?? 2;
    if (aOrder !== bOrder) return aOrder - bOrder;
    const aDate = a.createdAt?.toDate?.() || new Date(0);
    const bDate = b.createdAt?.toDate?.() || new Date(0);
    return bDate - aDate; // newest first
  });
}

function useAdminAnnouncements(municipality, isSuperAdmin) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const conditions = [where('active', '==', true)];

    if (!isSuperAdmin) {
      conditions.push(where('scope', 'in', [municipality, 'Provincial']));
    }

    const q = query(collection(db, 'announcements'), ...conditions, orderBy('createdAt', 'desc'));

    return onSnapshot(q, (snapshot) => {
      setAnnouncements(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
  }, [municipality, isSuperAdmin]);

  return { announcements, loading };
}

export default function AdminAlertsTab() {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const isSuperAdmin = isAdminRole(userData?.role) && userData?.role === 'superadmin_provincial';
  const { announcements, loading } = useAdminAnnouncements(userData?.municipality, isSuperAdmin);

  // Separate into municipal and provincial sections
  const { municipal, provincial } = useMemo(() => {
    const sorted = sortBySeverityAndDate(announcements);
    return {
      municipal: sorted.filter((a) => a.scope === userData?.municipality),
      provincial: sorted.filter((a) => a.scope === 'Provincial'),
    };
  }, [announcements, userData?.municipality]);

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  const totalCount = municipal.length + provincial.length;

  return (
    <div className="pb-20">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Announcements</h1>
        <span className="text-sm text-gray-500">{totalCount} active</span>
      </div>

      {totalCount === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No active announcements in {userData?.municipality || 'your scope'}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Municipal section */}
          {municipal.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-3">
                Active · {userData?.municipality} ({municipal.length})
              </h2>
              <div className="space-y-3">
                {municipal.map((announcement) => (
                  <AnnouncementItem
                    key={announcement.id}
                    announcement={announcement}
                    canDeactivate={true}
                    onUpdate={() => {
                      // Triggers re-fetch via onSnapshot
                    }}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Provincial section (read-only for municipal admins) */}
          {provincial.length > 0 && (
            <section className={!isSuperAdmin ? 'opacity-50' : ''}>
              <h2 className="text-lg font-semibold mb-3">Provincial ({provincial.length})</h2>
              <div className="space-y-3">
                {provincial.map((announcement) => (
                  <AnnouncementItem
                    key={announcement.id}
                    announcement={announcement}
                    canDeactivate={isSuperAdmin}
                    onUpdate={() => {
                      // Triggers re-fetch via onSnapshot
                    }}
                  />
                ))}
              </div>
              {!isSuperAdmin && (
                <p className="text-xs text-gray-500 mt-2">
                  Provincial announcements are read-only for municipal admins
                </p>
              )}
            </section>
          )}
        </div>
      )}

      {/* FAB for new announcement */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2">
        <Button
          onClick={() => navigate('/admin/alerts/new')}
          className="px-6 py-3 rounded-full font-medium shadow-lg"
        >
          New Announcement
        </Button>
      </div>
    </div>
  );
}
