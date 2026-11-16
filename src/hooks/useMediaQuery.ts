import { useEffect, useState } from 'react';

const matches = (query: string): boolean =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia(query).matches : false;

/** true mientras la media query se cumple. Sin matchMedia (jsdom) devuelve false. */
export const useMediaQuery = (query: string): boolean => {
  const [value, setValue] = useState(() => matches(query));

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
    const list = window.matchMedia(query);
    const sync = () => setValue(list.matches);
    sync();
    list.addEventListener('change', sync);
    return () => list.removeEventListener('change', sync);
  }, [query]);

  return value;
};

/** ASC-4: el layout de escritorio empieza en 1024 px; por debajo, móvil y tableta quedan como estaban. */
export const DESKTOP_QUERY = '(min-width: 1024px)';
