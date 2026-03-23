import { useState, useEffect } from 'react';

const QUERY = '(min-width: 1024px)';

/**
 * Hook that returns true when the viewport is lg (1024px) or wider.
 * Uses window.matchMedia for accurate reactive detection.
 */
export function useIsLg() {
  const [isLg, setIsLg] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(QUERY).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia(QUERY);
    const handler = (e) => setIsLg(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return isLg;
}

export default useIsLg;
