import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGeolocation } from '../hooks/useGeolocation';
import { Warning, MapPin, ArrowRight } from '@phosphor-icons/react';

export default function UrgencyHome({ onDismiss }) {
  const navigate = useNavigate();
  const { location } = useGeolocation();
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    if (location) {
      // GPS already captured silently per spec
    }
  }, [location]);

  function handleMaybeLater() {
    if (onDismiss) {
      onDismiss();
    } else {
      setTransitioning(true);
      setTimeout(() => navigate('/'), 200);
    }
  }

  return (
    <div
      className={`flex flex-col items-center justify-center h-full bg-bg-app-light dark:bg-bg-app
                  transition-opacity duration-200 ${transitioning ? 'opacity-0' : 'opacity-100'}`}
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
        className="mt-8 text-sm text-text-muted-dark dark:text-text-muted-dark
                   hover:text-text-dark dark:hover:text-text-dark transition-colors
                   flex items-center gap-1"
        aria-label="Continue to map"
      >
        Maybe later
        <ArrowRight size={16} aria-hidden="true" />
      </button>

      {location && (
        <div className="absolute bottom-4 flex items-center gap-1 text-xs text-text-muted-dark dark:text-text-muted-dark">
          <MapPin size={12} aria-hidden="true" />
          <span>Location available</span>
        </div>
      )}
    </div>
  );
}
