import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, or, orderBy } from 'firebase/firestore';
import { db } from '../utils/firebaseConfig';
import { captureException } from '../utils/sentry';

/**
 * Hook for querying announcements from Firestore with real-time updates.
 *
 * @param {string} [municipality] - Optional municipality filter. If provided,
 *   shows announcements with scope == municipality OR scope == 'Provincial'.
 * @returns {{ announcements: array, loading: boolean, error: object|null }}
 */
export function useAnnouncements(municipality) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let unsubscribe = null;

    try {
      // Base query: active == true, ordered by createdAt descending
      const baseConstraints = [where('active', '==', true), orderBy('createdAt', 'desc')];

      let announcementsQuery;
      if (municipality) {
        // Filter by scope: municipality OR Provincial
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
      } else {
        announcementsQuery = query(
          collection(db, 'announcements'),
          where('active', '==', true),
          orderBy('createdAt', 'desc')
        );
      }

      unsubscribe = onSnapshot(
        announcementsQuery,
        (snapshot) => {
          const docs = snapshot.docs.map((d) => ({ ...d.data(), id: d.id }));
          setAnnouncements(docs);
          setLoading(false);
          setError(null);
        },
        (err) => {
          captureException(err, {
            tags: { component: 'useAnnouncements', action: 'onSnapshot' },
          });
          setError(err);
          setLoading(false);
        }
      );
    } catch (err) {
      captureException(err, {
        tags: { component: 'useAnnouncements', action: 'query' },
      });
      setError(err);
      setLoading(false);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [municipality]);

  return { announcements, loading, error };
}

export default useAnnouncements;
