import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../utils/firebaseConfig';
import { useAuthContext } from '../../contexts/AuthContext';

const DEFAULT_PREFS = {
  weatherAlerts: true,
  nearbyHazards: true,
  reportStatusUpdates: true,
};

export default function NotificationPrefs() {
  const { user } = useAuthContext();
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const loadPrefs = async () => {
      const snap = await getDoc(doc(db, 'users', user.uid, 'settings', 'notifications'));
      if (snap.exists()) {
        setPrefs(snap.data());
      }
      setLoading(false);
    };
    loadPrefs();
  }, [user]);

  const savePref = async (key, value) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    await setDoc(doc(db, 'users', user.uid, 'settings', 'notifications'), next);
  };

  const toggle = (key) => savePref(key, !prefs[key]);

  if (loading) return null;

  return (
    <div className="bg-white dark:bg-dark-card rounded-xl p-5 shadow-card border border-stone-100 dark:border-dark-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-primary"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <h3 className="font-bold text-sm dark:text-dark-text">Notifications</h3>
        </div>
        <button
          onClick={() => setEditing(!editing)}
          aria-label={
            editing ? 'Done editing notification preferences' : 'Edit notification preferences'
          }
          aria-pressed={editing}
          className="text-xs text-accent hover:underline font-medium"
        >
          {editing ? 'Done' : 'Edit'}
        </button>
      </div>

      <div className="space-y-3">
        {[
          { key: 'weatherAlerts', label: 'Weather alerts' },
          { key: 'nearbyHazards', label: 'Nearby hazard alerts' },
          { key: 'reportStatusUpdates', label: 'Report status updates' },
        ].map(({ key, label }) => (
          <label
            key={key}
            className="flex items-center justify-between py-2 border-b border-stone-100 dark:border-dark-border last:border-0 cursor-pointer"
          >
            <span className="text-sm text-text dark:text-dark-text">{label}</span>
            <button
              onClick={() => editing && toggle(key)}
              disabled={!editing}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                prefs[key] ? 'bg-accent' : 'bg-stone-300 dark:bg-dark-border'
              } ${!editing ? 'cursor-default' : 'cursor-pointer'}`}
              role="switch"
              aria-checked={prefs[key]}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  prefs[key] ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </label>
        ))}
      </div>
    </div>
  );
}
