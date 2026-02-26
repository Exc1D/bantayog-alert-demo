import { useMemo } from 'react';
import { useAuthContext } from '../../contexts/AuthContext';
import { useReportsContext } from '../../contexts/ReportsContext';

export default function Header({ onProfileClick }) {
  const { user, userProfile, isAdmin, isSuperAdmin } = useAuthContext();
  const { reports } = useReportsContext();

  const activeCount = useMemo(
    () =>
      reports.filter(
        (r) => r.verification?.status === 'pending' || r.verification?.status === 'verified'
      ).length,
    [reports]
  );

  const getRoleBadge = () => {
    if (isSuperAdmin) return 'CNPIO';
    if (isAdmin) return 'MUNICIPAL ADMIN';
    if (user) return 'CITIZEN';
    return 'GUEST';
  };

  const getRoleBadgeColor = () => {
    if (isSuperAdmin) return 'bg-green-500/90';
    if (isAdmin) return 'bg-blue-500/90';
    return 'bg-white/15';
  };

  const avatarUrl = userProfile?.photoURL || user?.photoURL;
  const avatarInitial = (userProfile?.name || user?.displayName || 'U')[0].toUpperCase();

  return (
    <header className="sticky top-0 z-50 h-[56px] bg-primary text-white flex items-center justify-between px-4 shadow-dark">
      {/* Left: Brand */}
      <div className="flex items-center gap-2.5">
        <img src="/logo.svg" alt="Bantayog Alert" className="w-8 h-8 rounded-lg" />
        <div className="leading-none">
          <h1 className="text-[15px] font-extrabold tracking-wide text-white">BANTAYOG ALERT</h1>
          <p className="text-[9px] font-medium text-white/40 tracking-widest uppercase">
            Camarines Norte
          </p>
        </div>
      </div>

      {/* Right: Status + Role */}
      <div className="flex items-center gap-2">
        {/* Live Indicator */}
        {activeCount > 0 && (
          <div className="flex items-center gap-1.5 bg-white/[0.08] border border-white/10 rounded-full px-2.5 py-1">
            <span className="w-2 h-2 bg-accent rounded-full live-beacon" aria-hidden="true" />
            <span className="text-[10px] font-bold text-white/70 tracking-wide" aria-live="polite">
              {activeCount} ACTIVE
            </span>
          </div>
        )}

        <span
          className={`${getRoleBadgeColor()} text-white text-[10px] font-bold px-2 py-1 rounded tracking-wide`}
        >
          {getRoleBadge()}
        </span>

        <button
          onClick={onProfileClick}
          className="w-8 h-8 rounded-full border border-white/20 overflow-hidden bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center"
          aria-label="Open profile"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs font-bold text-white/90">{avatarInitial}</span>
          )}
        </button>
      </div>
    </header>
  );
}
