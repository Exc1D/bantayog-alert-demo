const VARIANTS = {
  primary: 'bg-accent text-white hover:bg-accentDark focus:ring-accent/30',
  secondary:
    'bg-white text-text border border-border hover:bg-surface focus:ring-primary/20 dark:bg-dark-card dark:text-dark-text dark:border-dark-border dark:hover:bg-dark-elevated',
  danger: 'bg-accent text-white hover:bg-accentDark focus:ring-accent/30',
  success: 'bg-success text-white hover:bg-green-700 focus:ring-success/30',
  warning: 'bg-warning text-white hover:bg-orange-700 focus:ring-warning/30',
  ghost:
    'text-textLight hover:text-text hover:bg-surface dark:text-dark-textLight dark:hover:text-dark-text dark:hover:bg-dark-elevated',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  onClick,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 rounded-xl font-semibold
        transition-all duration-200 focus:outline-none focus:ring-2
        active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed
        ${VARIANTS[variant]}
        ${SIZES[size]}
        ${className}
      `}
      {...props}
    >
      {loading && (
        <svg aria-hidden="true" className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
