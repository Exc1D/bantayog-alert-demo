import { useState, useEffect } from 'react';

export default function useIsLg() {
  const [isLg, setIsLg] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(min-width: 1024px)').matches;
  });

  useEffect(() => {
    const mql = window.matchMedia('(min-width: 1024px)');
    function handleChange(e) {
      setIsLg(e.matches);
    }
    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, []);

  return isLg;
}
