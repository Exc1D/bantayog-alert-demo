import { Link } from 'react-router-dom';
import { Warning } from '@phosphor-icons/react';

export default function FloatingReportButton() {
  return (
    <div
      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000]
                    lg:left-auto lg:right-6 lg:translate-x-0"
    >
      <Link
        to="/report"
        className="bg-emergency dark:bg-emergency-dark text-white font-bold text-sm
                   px-6 py-3 rounded-full shadow-lg flex items-center gap-2
                   active:scale-95 transition-transform animate-pulse-glow"
        aria-label="Report emergency"
      >
        <Warning size={16} weight="fill" aria-hidden="true" />
        REPORT
      </Link>
    </div>
  );
}
