import { useEffect, useState } from 'react';

// TCW-2: true cuando el sistema pide menos movimiento. Sin matchMedia (jsdom, SSR) se asume que no.
export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

const matchesReduced = (): boolean =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(REDUCED_MOTION_QUERY).matches;

export const usePrefersReducedMotion = (): boolean => {
  const [reduced, setReduced] = useState<boolean>(matchesReduced);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
    const mql = window.matchMedia(REDUCED_MOTION_QUERY);
    const sync = () => setReduced(mql.matches);
    sync();
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', sync);
      return () => mql.removeEventListener('change', sync);
    }
    mql.addListener(sync);
    return () => mql.removeListener(sync);
  }, []);

  return reduced;
};
