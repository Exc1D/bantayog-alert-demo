import { Link } from 'react-router-dom';
import { useGeolocation } from '../hooks/useGeolocation';
import { Warning, MapPin, ArrowRight } from '@phosphor-icons/react';

export default function UrgencyHome({ onDismiss }) {
  const { location } = useGeolocation();

  function handleMaybeLater() {
    onDismiss();
  }

  return (
    <div
      className="flex flex-col items-center justify-center h-full bg-bg-app-light dark:bg-bg-app"
    >
      <Link
        to="/report"
        className="relative flex flex-col items-center gap-3 bg-emergency dark:bg-emergency-dark
                   text-white rounded-full w-48 h-48 shadow-lg
                   animate-pulse-glow
                   active:scale-95 transition-transform"
        aria-label="Report an emergency"
      >
        <Warning size={48} weight="fill" aria-hidden="true" />
        <span className="font-bold text-lg tracking-wide">REPORT</span>
        <span className="text-xs opacity-80">Tap to report</span>
      </Link>

      <button
        type="button"
        onClick={handleMaybeLater}
        className="mt-8 text-sm text-muted-dark dark:text-muted-dark
                   hover:text-dark-text dark:hover:text-dark-text transition-colors
                   flex items-center gap-1"
        aria-label="Continue to map"
      >
        Maybe later
        <ArrowRight size={16} aria-hidden="true" />
      </button>

      {location && (
        <div className="absolute bottom-4 flex items-center gap-1 text-xs text-muted-dark dark:text-muted-dark">
          <MapPin size={12} aria-hidden="true" />
          <span>Location available</span>
        </div>
      )}
    </div>
  );
}
