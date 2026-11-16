import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const isPlatform = vi.fn(() => false);
vi.mock('@ionic/react', () => ({ isPlatform: (p: string) => isPlatform(p) }));

import { DESKTOP_QUERY, useDesktopLayout } from './useDesktopLayout';

const stubMatchMedia = (matches: boolean) => {
  const mql = { matches, media: DESKTOP_QUERY, addEventListener: vi.fn(), removeEventListener: vi.fn() };
  vi.stubGlobal('matchMedia', vi.fn(() => mql));
  Object.defineProperty(window, 'matchMedia', { configurable: true, value: vi.fn(() => mql) });
};

afterEach(() => {
  vi.unstubAllGlobals();
  isPlatform.mockReturnValue(false);
});

describe('useDesktopLayout', () => {
  it('es true en web a partir de 1024 px', () => {
    stubMatchMedia(true);
    expect(renderHook(() => useDesktopLayout()).result.current).toBe(true);
  });

  it('es false por debajo de 1024 px (móvil queda igual)', () => {
    stubMatchMedia(false);
    expect(renderHook(() => useDesktopLayout()).result.current).toBe(false);
  });

  it('es false siempre en la app nativa (Capacitor), aunque la pantalla sea ancha', () => {
    stubMatchMedia(true);
    isPlatform.mockReturnValue(true);
    expect(renderHook(() => useDesktopLayout()).result.current).toBe(false);
  });
});
