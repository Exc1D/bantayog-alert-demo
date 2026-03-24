import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../utils/firebaseConfig';
import { useAuthContext } from '../../contexts/AuthContext';
import { useToast } from '../Common/Toast';
import { MUNICIPALITIES } from '../../utils/constants';
import { captureException } from '../../utils/sentry';

const ANNOUNCEMENT_TYPES = [
  { id: 'class-suspension', label: 'Class Suspension' },
  { id: 'work-suspension', label: 'Work Suspension' },
  { id: 'flood-advisory', label: 'Flood Advisory' },
  { id: 'road-closure', label: 'Road Closure' },
  { id: 'evacuation-order', label: 'Evacuation Order' },
  { id: 'storm-surge', label: 'Storm Surge' },
  { id: 'health-advisory', label: 'Health Advisory' },
  { id: 'emergency-notice', label: 'Emergency Notice' },
];

const SEVERITIES = [
  { id: 'critical', label: 'Critical', color: 'bg-red-500 text-white' },
  { id: 'warning', label: 'Warning', color: 'bg-orange-500 text-white' },
  { id: 'info', label: 'Info', color: 'bg-stone-600 text-white' },
];

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

export default function CreateAnnouncementForm({ onSuccess }) {
  const [type, setType] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [severity, setSeverity] = useState('');
  const [scope, setScope] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const { user, userProfile } = useAuthContext();
  const { addToast } = useToast();

  const isSuperAdmin = userProfile?.role === 'superadmin_provincial';

  function validate() {
    const newErrors = {};
    if (!type) newErrors.type = 'Please select a type';
    if (!title.trim()) newErrors.title = 'Title is required';
    if (!severity) newErrors.severity = 'Please select a severity';
    if (!scope) newErrors.scope = 'Please select a scope';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const now = new Date();
      const deleteAt = new Date(now.getTime() + NINETY_DAYS_MS);

      await addDoc(collection(db, 'announcements'), {
        type,
        title: title.trim(),
        body: body.trim(),
        severity,
        scope,
        active: true,
        createdAt: serverTimestamp(),
        deactivatedAt: null,
        deleteAt,
        createdBy: user?.uid || 'unknown',
        createdByRole: userProfile?.role || 'unknown',
      });

      addToast('Announcement created successfully', 'success');
      // Reset form
      setType('');
      setTitle('');
      setBody('');
      setSeverity('');
      setScope('');
      setErrors({});
      if (onSuccess) onSuccess();
    } catch (err) {
      captureException(err, {
        tags: { component: 'CreateAnnouncementForm', action: 'submit' },
      });
      addToast('Failed to create announcement', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Type */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wide text-textLight dark:text-dark-textLight mb-2">
          Type <span className="text-red-500">*</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {ANNOUNCEMENT_TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setType(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                type === t.id
                  ? 'bg-accent text-white border-accent'
                  : 'bg-white dark:bg-dark-elevated text-textLight dark:text-dark-textLight border-stone-200 dark:border-dark-border hover:border-accent'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {errors.type && <p className="text-xs text-red-500 mt-1">{errors.type}</p>}
      </div>

      {/* Title */}
      <div>
        <label
          htmlFor="announcement-title"
          className="block text-xs font-bold uppercase tracking-wide text-textLight dark:text-dark-textLight mb-2"
        >
          Title <span className="text-red-500">*</span>
        </label>
        <input
          id="announcement-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Suspension of Classes in Daet"
          className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-dark-border bg-white dark:bg-dark-elevated text-sm text-text dark:text-dark-text placeholder-textLight dark:placeholder-dark-textLight focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
          maxLength={200}
        />
        {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
      </div>

      {/* Body */}
      <div>
        <label
          htmlFor="announcement-body"
          className="block text-xs font-bold uppercase tracking-wide text-textLight dark:text-dark-textLight mb-2"
        >
          Details
        </label>
        <textarea
          id="announcement-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Additional details or instructions (optional)"
          rows={3}
          className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-dark-border bg-white dark:bg-dark-elevated text-sm text-text dark:text-dark-text placeholder-textLight dark:placeholder-dark-textLight focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-none"
          maxLength={1000}
        />
      </div>

      {/* Severity */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wide text-textLight dark:text-dark-textLight mb-2">
          Severity <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2">
          {SEVERITIES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSeverity(s.id)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border ${
                severity === s.id
                  ? `${s.color} border-transparent`
                  : 'bg-white dark:bg-dark-elevated text-textLight dark:text-dark-textLight border-stone-200 dark:border-dark-border hover:border-accent'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        {errors.severity && <p className="text-xs text-red-500 mt-1">{errors.severity}</p>}
      </div>

      {/* Scope */}
      <div>
        <label
          htmlFor="announcement-scope"
          className="block text-xs font-bold uppercase tracking-wide text-textLight dark:text-dark-textLight mb-2"
        >
          Scope <span className="text-red-500">*</span>
        </label>
        <select
          id="announcement-scope"
          value={scope}
          onChange={(e) => setScope(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-dark-border bg-white dark:bg-dark-elevated text-sm text-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
        >
          <option value="">Select scope...</option>
          <option value="Provincial">Provincial</option>
          {!isSuperAdmin &&
            MUNICIPALITIES.filter((m) => m !== 'Provincial').map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          {isSuperAdmin &&
            MUNICIPALITIES.filter((m) => m !== 'Provincial').map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
        </select>
        {errors.scope && <p className="text-xs text-red-500 mt-1">{errors.scope}</p>}
      </div>

      {/* TTL note */}
      <p className="text-[10px] text-textLight dark:text-dark-textLight">
        This announcement will automatically expire after 90 days.
      </p>

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full py-2.5 bg-accent hover:bg-accent/90 text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? 'Creating...' : 'Create Announcement'}
      </button>
    </form>
  );
}
