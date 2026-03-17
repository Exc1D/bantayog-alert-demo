import { useState, useEffect, useMemo } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../utils/firebaseConfig';

// Client-side sort: Critical first, then Warning, then Info, then by date
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

export function useAnnouncements(municipality) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!municipality) {
      // Geolocation failure fallback: fetch all active announcements
      const q = query(
        collection(db, 'announcements'),
        where('active', '==', true),
        orderBy('createdAt', 'desc')
      );
      return onSnapshot(q,
        (snapshot) => {
          setAnnouncements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          setLoading(false);
        },
        (err) => {
          setError(err);
          setLoading(false);
        }
      );
    }

    // Fetch scoped announcements: user's municipality + provincial
    const q = query(
      collection(db, 'announcements'),
      where('active', '==', true),
      where('scope', 'in', [municipality, 'Provincial']),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q,
      (snapshot) => {
        setAnnouncements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );
  }, [municipality]);

  // Apply client-side severity sorting
  const sortedAnnouncements = useMemo(
    () => sortBySeverityAndDate(announcements),
    [announcements]
  );

  return { announcements: sortedAnnouncements, loading, error };
}
