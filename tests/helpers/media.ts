// TCW-27: ayuda de pruebas. Redefine window.matchMedia (configurable) para simular escritorio, móvil y reduced-motion.
export const mockMedia = ({ desktop = true, reduced = false }: { desktop?: boolean; reduced?: boolean } = {}): void => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: query.includes('min-width: 1024px') ? desktop : query.includes('prefers-reduced-motion') ? reduced : false,
      media: query, onchange: null,
      addListener: () => {}, removeListener: () => {}, addEventListener: () => {}, removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
};
