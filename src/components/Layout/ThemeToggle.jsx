import { memo } from 'react';

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

export default ThemeToggle;
