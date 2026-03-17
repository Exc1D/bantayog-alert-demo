import { useState } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../utils/firebaseConfig';
import { logAuditEvent, AuditEvent, AuditEventType } from '../../utils/auditLogger';
import { useAuth } from '../../hooks/useAuth';
import Button from '../Common/Button';
import ConfirmDialog from '../Common/ConfirmDialog';

const SEVERITY_STYLES = {
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  warning: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
};

export default function AnnouncementItem({ announcement, canDeactivate, onUpdate }) {
  const { user } = useAuth();
  const [showConfirm, setShowConfirm] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  const handleDeactivate = async () => {
    setDeactivating(true);
    try {
      const announcementRef = doc(db, 'announcements', announcement.id);
      await updateDoc(announcementRef, {
        active: false,
        deactivatedAt: serverTimestamp(),
      });

      // Audit log
      await logAuditEvent(
        new AuditEvent({
          eventType: AuditEventType.ANNOUNCEMENT_DEACTIVATED,
          userId: user.uid,
          targetId: announcement.id,
          metadata: { type: announcement.type, scope: announcement.scope },
        })
      );

      onUpdate();
    } catch (error) {
      console.error('Failed to deactivate:', error);
    } finally {
      setDeactivating(false);
      setShowConfirm(false);
    }
  };

  const createdDate = announcement.createdAt?.toDate?.() || new Date();
  const formattedDate = createdDate.toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`px-2 py-0.5 rounded text-xs font-medium ${SEVERITY_STYLES[announcement.severity]}`}
              >
                {announcement.severity.toUpperCase()}
              </span>
              <span className="text-xs text-gray-500">{announcement.scope}</span>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{announcement.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{announcement.body}</p>
            <p className="text-xs text-gray-400 mt-2">{formattedDate}</p>
          </div>
          {canDeactivate && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConfirm(true)}
              disabled={deactivating}
            >
              {deactivating ? 'Deactivating...' : 'Deactivate'}
            </Button>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleDeactivate}
        title="Deactivate Announcement"
        message="Are you sure you want to deactivate this announcement? It will no longer be visible to citizens."
        confirmLabel="Deactivate"
        confirmVariant="danger"
      />
    </>
  );
}
