import { useMemo, memo, useCallback } from 'react';
import { useAuthContext } from '../../contexts/AuthContext';
import { useReportsContext } from '../../contexts/ReportsContext';
import { useTheme } from '../../contexts/ThemeContext';

const ThemeToggle = memo(function ThemeToggle({ isDark, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="relative flex items-center w-[52px] h-7 rounded-full border border-border dark:border-dark-border bg-stone-100 dark:bg-dark-bg p-1 transition-colors hover:border-border dark:hover:border-dark-textMuted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-1"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {/* Sliding thumb */}
      <span
        className={`absolute left-1 w-5 h-5 rounded-full bg-white dark:bg-dark-elevated shadow-sm border border-border/60 dark:border-dark-border transition-transform duration-200 ease-in-out ${
          isDark ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
      {/* Sun icon */}
      <span
        className={`relative z-10 flex items-center justify-center w-5 h-5 transition-colors duration-200 ${
          !isDark ? 'text-amber-500' : 'text-textMuted dark:text-dark-textMuted'
        }`}
      >
        <svg
          aria-hidden="true"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      </span>
      {/* Moon icon */}
      <span
        className={`relative z-10 flex items-center justify-center w-5 h-5 transition-colors duration-200 ${
          isDark ? 'text-indigo-300' : 'text-textMuted'
        }`}
      >
        <svg
          aria-hidden="true"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      </span>
    </button>
  );
});

const RoleBadge = memo(function RoleBadge({ role, color }) {
  return (
    <span
      className={`${color} hidden sm:inline text-[10px] font-bold px-2 py-1 rounded tracking-wide whitespace-nowrap`}
    >
      {role}
    </span>
  );
});

const ActiveIndicator = memo(function ActiveIndicator({ count }) {
  if (count <= 0) return null;
  return (
    <div
      className="flex items-center gap-1.5 bg-live/10 dark:bg-live/10 border border-live/20 dark:border-live/25 rounded-full px-2 py-1 sm:px-2.5"
      aria-live="polite"
      aria-label={`${count} active reports`}
    >
      <span className="w-2 h-2 shrink-0 bg-live rounded-full live-beacon" aria-hidden="true" />
      <span className="hidden sm:inline text-[10px] font-bold text-live dark:text-live tracking-wide whitespace-nowrap">
        {count} ACTIVE
      </span>
    </div>
  );
});

const Avatar = memo(function Avatar({ url, initial, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-8 h-8 rounded-full border border-border dark:border-dark-border overflow-hidden bg-primary/10 dark:bg-primary/20 hover:bg-primary/20 dark:hover:bg-primary/30 transition-colors flex items-center justify-center"
      aria-label="Open profile"
    >
      {url ? (
        <img src={url} alt="Profile" className="w-full h-full object-cover" loading="lazy" />
      ) : (
        <span className="text-xs font-bold text-primary dark:text-dark-accent">{initial}</span>
      )}
    </button>
  );
});

export default memo(function Header({ onProfileClick }) {
  const { user, userProfile, isAdmin, isSuperAdmin } = useAuthContext();
  const { reports } = useReportsContext();
  const { isDark, toggleTheme } = useTheme();

  const activeCount = useMemo(
    () =>
      reports.filter(
        (r) => r.verification?.status === 'pending' || r.verification?.status === 'verified'
      ).length,
    [reports]
  );

  const role = useMemo(() => {
    if (isSuperAdmin) return { badge: 'CNPIO', color: 'bg-green-600 text-white' };
    if (isAdmin) return { badge: 'MUNICIPAL ADMIN', color: 'bg-blue-600 text-white' };
    if (user)
      return { badge: 'CITIZEN', color: 'bg-primary/10 text-primary dark:text-dark-accent' };
    return { badge: 'GUEST', color: 'bg-primary/10 text-textLight dark:text-dark-textLight' };
  }, [isSuperAdmin, isAdmin, user]);

  const avatarUrl = userProfile?.photoURL || user?.photoURL;
  const avatarInitial = useMemo(
    () =>
      (userProfile?.displayName || userProfile?.name || user?.displayName || 'U')[0].toUpperCase(),
    [userProfile?.displayName, userProfile?.name, user?.displayName]
  );

  const handleProfileClick = useCallback(() => {
    onProfileClick?.();
  }, [onProfileClick]);

  return (
    <header className="sticky top-0 z-50 h-[60px] bg-white dark:bg-dark-card dark:backdrop-blur-sm text-text dark:text-dark-text border-b-2 border-primary/10 dark:border-dark-border flex items-center justify-between px-4 shadow-card">
      {/* Left: Brand */}
      <div className="flex items-center gap-2.5">
        <img src="/logo.svg" alt="Bantayog Alert" className="w-8 h-8 rounded-lg" loading="lazy" />
        <div className="leading-none">
          <h1 className="text-[16px] font-display tracking-wide text-primary dark:text-dark-text">
            BANTAYOG ALERT
          </h1>
          <p className="text-[9px] font-medium text-textMuted dark:text-dark-textMuted tracking-widest uppercase">
            Camarines Norte
          </p>
        </div>
      </div>

      {/* Right: Status + Role */}
      <div className="flex items-center gap-2">
        <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
        <ActiveIndicator count={activeCount} />
        <RoleBadge role={role.badge} color={role.color} />
        <Avatar url={avatarUrl} initial={avatarInitial} onClick={handleProfileClick} />
      </div>
    </header>
  );
});
