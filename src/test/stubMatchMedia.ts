// jsdom has no matchMedia, and themeStore reads it on import (ASC-2). Tests that import the stores call this from
// vi.hoisted so it runs before the imports.
export const stubMatchMedia = (matches = false): void => {
  if (typeof window.matchMedia === 'function') return;
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches, media: query, onchange: null,
      addListener: () => {}, removeListener: () => {}, addEventListener: () => {}, removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
};
