import { useEffect, useState } from 'react';
import { isPlatform } from '@ionic/react';

// Escritorio = web (no Capacitor) y ancho ≥ 1024 px. Debajo de eso, y siempre en la app
// nativa, las páginas renderizan exactamente el árbol de móvil de siempre (ASC-4).
export const DESKTOP_QUERY = '(min-width: 1024px)';

const isNative = (): boolean => {
  try {
    return isPlatform('capacitor');
  } catch {
    return false;
  }
};

const matchesDesktop = (): boolean => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  if (isNative()) return false;
  return window.matchMedia(DESKTOP_QUERY).matches;
};

export const useDesktopLayout = (): boolean => {
  const [desktop, setDesktop] = useState<boolean>(matchesDesktop);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function' || isNative()) return undefined;
    const mql = window.matchMedia(DESKTOP_QUERY);
    const sync = () => setDesktop(mql.matches);
    sync();
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', sync);
      return () => mql.removeEventListener('change', sync);
    }
    mql.addListener(sync);
    return () => mql.removeListener(sync);
  }, []);

  return desktop;
};
