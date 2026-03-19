import { useState, useEffect } from 'react';

export default function useIsLg() {
  const [isLg, setIsLg] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(min-width: 1024px)').matches;
  });

  useEffect(() => {
    const mql = window.matchMedia('(min-width: 1024px)');
    const handleChange = (e) => setIsLg(e.matches);

    // Modern browsers support addEventListener; older Safari uses addListener
    if (mql.addEventListener) {
      mql.addEventListener('change', handleChange);
      return () => mql.removeEventListener('change', handleChange);
    }

    // Fallback for older browsers (Safari < 14)
    mql.addListener(handleChange);
    return () => mql.removeListener(handleChange);
  }, []);

  return isLg;
}
