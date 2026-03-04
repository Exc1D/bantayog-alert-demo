export default function Footer({ className = '' }) {
  return (
    <footer
      className={`bg-white dark:bg-dark-card dark:backdrop-blur-sm border-t border-border/60 dark:border-dark-border text-textLight dark:text-dark-textLight text-center py-3 text-[10px] tracking-wide ${className}`}
    >
      <p className="font-display">
        BANTAYOG ALERT &copy; {new Date().getFullYear()} &mdash; Camarines Norte PIO
      </p>
      <p className="mt-0.5 text-textMuted dark:text-dark-textMuted">
        All-Hazard Disaster Reporting System
      </p>
    </footer>
  );
}
