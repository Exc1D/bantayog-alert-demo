import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../../utils/firebaseConfig';
import { useAuth } from '../../hooks/useAuth';
import { logAuditEvent, AuditEvent, AuditEventType } from '../../utils/auditLogger';
import { Button } from '../Common/Button';

const ANNOUNCEMENT_TYPES = [
  { value: 'class-suspension', label: 'Class Suspension' },
  { value: 'work-suspension', label: 'Work Suspension' },
  { value: 'flood-advisory', label: 'Flood Advisory' },
  { value: 'road-closure', label: 'Road Closure' },
  { value: 'evacuation-order', label: 'Evacuation Order' },
  { value: 'storm-surge', label: 'Storm Surge' },
  { value: 'health-advisory', label: 'Health Advisory' },
  { value: 'emergency-notice', label: 'Emergency Notice' },
];

const SEVERITY_LEVELS = [
  { value: 'critical', label: 'Critical' },
  { value: 'warning', label: 'Warning' },
  { value: 'info', label: 'Info' },
];

// Fixed Tailwind classes - dynamic classes won't work!
const severityButtonClasses = {
  critical: {
    base: 'border-gray-300 dark:border-gray-700',
    selected: 'border-red-500 bg-red-50 dark:bg-red-900/20',
  },
  warning: {
    base: 'border-gray-300 dark:border-gray-700',
    selected: 'border-orange-500 bg-orange-50 dark:bg-orange-900/20',
  },
  info: {
    base: 'border-gray-300 dark:border-gray-700',
    selected: 'border-gray-500 bg-gray-50 dark:bg-gray-900/20',
  },
};

export default function CreateAnnouncementForm() {
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const [type, setType] = useState('');
  const [severity, setSeverity] = useState('info');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  // Validation: type, title (non-empty), body (min 10 chars)
  const isValid = type && title.trim() && body.trim().length >= 10;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid || submitting) return;

    setSubmitting(true);
    try {
      // Compute deleteAt = now + 90 days
      const deleteAt = Timestamp.fromDate(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000));

      const docRef = await addDoc(collection(db, 'announcements'), {
        type,
        title: title.trim(),
        body: body.trim(),
        severity,
        scope: userData?.municipality || 'Provincial',
        createdBy: user.uid,
        createdByRole: userData?.role,
        active: true,
        createdAt: serverTimestamp(),
        deactivatedAt: null,
        deleteAt,
      });

      // Audit log
      await logAuditEvent(new AuditEvent({
        eventType: AuditEventType.ANNOUNCEMENT_CREATED,
        userId: user.uid,
        targetId: docRef.id,
        metadata: { type, severity, scope: userData?.municipality || 'Provincial' },
      }));

      navigate('/admin/alerts');
    } catch (error) {
      console.error('Failed to create announcement:', error);
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">New Announcement</h1>
        <Button variant="ghost" onClick={() => navigate('/admin/alerts')}>
          Cancel
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type selector */}
        <div>
          <label className="block text-sm font-medium mb-1">Type *</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
            required
          >
            <option value="">Select type...</option>
            {ANNOUNCEMENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {/* Severity selector with fixed Tailwind classes */}
        <div>
          <label className="block text-sm font-medium mb-1">Severity *</label>
          <div className="flex gap-2">
            {SEVERITY_LEVELS.map((s) => {
              const isSelected = severity === s.value;
              const classes = severityButtonClasses[s.value];
              return (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setSeverity(s.value)}
                  className={`px-4 py-2 rounded-lg border ${
                    isSelected ? classes.selected : classes.base
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-1">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Classes suspended in Daet"
            className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
            required
          />
        </div>

        {/* Body with min-length validation */}
        <div>
          <label className="block text-sm font-medium mb-1">Details * (min 10 chars)</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Full details of the announcement..."
            rows={4}
            className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
            minLength={10}
            required
          />
        </div>

        {/* Scope display */}
        <div className="text-sm text-gray-500">
          📍 This announcement will be scoped to: <strong>{userData?.municipality || 'Provincial'}</strong>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={!isValid || submitting}
          className="w-full"
        >
          {submitting ? 'Posting...' : 'Post announcement'}
        </Button>
      </form>
    </div>
  );
}
