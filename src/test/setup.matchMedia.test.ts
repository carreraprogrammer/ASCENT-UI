// TCW-27 CA10. CONTRATO: src/test/setup.ts llama stubMatchMedia() (importado de ./stubMatchMedia) y el stub define
// window.matchMedia con configurable: true, para que las pruebas que lo redefinen (Climber, MonthlyInsightDetailPage,
// useDesktopLayout) no choquen. Esta prueba NO llama al stub: si pasa, es por el setup global.
import { describe, it, expect } from 'vitest';

describe('setup global de pruebas', () => {
  it('TCW-27 CA10: el setup global instala window.matchMedia (jsdom no lo trae)', () => {
    expect(typeof window.matchMedia).toBe('function');
    expect(window.matchMedia('(min-width: 1024px)').matches).toBe(false);
  });

  it('TCW-27 CA10: matchMedia queda configurable para que las suites puedan redefinirlo', () => {
    const d = Object.getOwnPropertyDescriptor(window, 'matchMedia');
    expect(typeof d?.value).toBe('function');
    expect(d?.configurable).toBe(true);
  });

  it('TCW-27 CA10: themeStore se importa sin que la prueba instale el stub (las 7 suites con fallo)', async () => {
    await expect(import('../store/themeStore')).resolves.toBeDefined();
  });
});
