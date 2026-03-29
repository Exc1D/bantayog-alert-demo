import { useState, useEffect } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../../utils/firebaseConfig';

function MunicipalityBar({ municipality, count, maxCount }) {
  const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-textLight dark:text-dark-textLight w-24 truncate">{municipality}</span>
      <div className="flex-1 h-2 bg-surface dark:bg-dark-elevated rounded-full overflow-hidden">
        <div
          className="h-full bg-primary dark:bg-dark-accent rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-medium text-text dark:text-dark-text w-6 text-right">{count}</span>
    </div>
  );
}

export default function DataPanel() {
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    resolved: 0,
    byMunicipality: [],
    maxCount: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const allQ = query(collection(db, 'reports'));
        const allSnap = await getDocs(allQ);
        const all = allSnap.docs.map((d) => ({ ...d.data(), id: d.id }));
        const total = all.length;
        const resolved = all.filter((r) => r.verification?.status === 'resolved').length;
        const active = total - resolved;

        const munMap = {};
        all.forEach((r) => {
          const mun = r.location?.municipality ?? 'Unknown';
          munMap[mun] = (munMap[mun] ?? 0) + 1;
        });
        const byMunicipality = Object.entries(munMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8);
        const maxCount = byMunicipality[0]?.[1] ?? 1;

        setStats({ total, active, resolved, byMunicipality, maxCount });
        setError(null);
      } catch (e) {
        console.error('DataPanel failed to load stats:', e);
        setError('Failed to load statistics.');
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-textLight dark:text-dark-textLight px-4 text-center">
        <p className="text-sm font-medium text-text dark:text-dark-text">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 overflow-y-auto h-full">
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-surface dark:bg-dark-elevated rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-text dark:text-dark-text">{stats.total}</p>
          <p className="text-xs text-textLight dark:text-dark-textLight">Total</p>
        </div>
        <div className="bg-alertRed/10 rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-alertRed">{stats.active}</p>
          <p className="text-xs text-textLight dark:text-dark-textLight">Active</p>
        </div>
        <div className="bg-success/10 rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-success">{stats.resolved}</p>
          <p className="text-xs text-textLight dark:text-dark-textLight">Resolved</p>
        </div>
      </div>

      <h3 className="text-xs font-semibold text-textLight dark:text-dark-textLight uppercase tracking-wide mb-3">
        Reports by Municipality
      </h3>
      <div className="space-y-2">
        {stats.byMunicipality.map(([municipality, count]) => (
          <MunicipalityBar
            key={municipality}
            municipality={municipality}
            count={count}
            maxCount={stats.maxCount}
          />
        ))}
      </div>
    </div>
  );
}
