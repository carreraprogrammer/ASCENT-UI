import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// TCW-5: un build con la API simulada no debe llegar a producción por accidente. `vite build` con
// VITE_LOCAL_FIXTURES=1 falla salvo con un segundo interruptor explícito (ALLOW_FIXTURES_BUILD=1), que solo usan
// scripts/check-no-fixtures.mjs y src/local-fixtures/bundle.test.ts. El dev server no se ve afectado.
const guardFixturesBuild = (): Plugin => ({
  name: 'tcw5-guard-fixtures-build',
  configResolved(config) {
    if (config.command === 'build' && config.env.VITE_LOCAL_FIXTURES === '1' && process.env.ALLOW_FIXTURES_BUILD !== '1') {
      throw new Error(
        'VITE_LOCAL_FIXTURES=1 incluiría la API simulada en el build. Quita la variable (producción) o define '
        + 'ALLOW_FIXTURES_BUILD=1 solo para npm run check:bundle.',
      );
    }
  },
});

export default defineConfig({
  plugins: [react(), guardFixturesBuild()],
  build: {
    chunkSizeWarningLimit: 1000, // Increased: lazy routes + recharts are separate concerns
  },
  test: { environment: 'jsdom', globals: true, setupFiles: './src/test/setup.ts' },
});
