// TCW-5: `vite build` con VITE_LOCAL_FIXTURES=1 falla salvo con el segundo interruptor ALLOW_FIXTURES_BUILD=1.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const ROOT = resolve(__dirname, '../..');

const build = (extra: Record<string, string>) => {
  const out = mkdtempSync(join(tmpdir(), 'tcw5-guard-'));
  try {
    const env = { ...process.env } as Record<string, string | undefined>;
    delete env.VITE_LOCAL_FIXTURES;
    delete env.ALLOW_FIXTURES_BUILD;
    return spawnSync('npx', ['vite', 'build', '--outDir', out, '--emptyOutDir'], { cwd: ROOT, env: { ...env, ...extra }, encoding: 'utf8' });
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
};

describe('TCW-5: guardia del build con la API simulada', () => {
  it('vite build con VITE_LOCAL_FIXTURES=1 y sin ALLOW_FIXTURES_BUILD falla con un mensaje claro', () => {
    const r = build({ VITE_LOCAL_FIXTURES: '1' });
    expect(r.status).not.toBe(0);
    expect(`${r.stdout}${r.stderr}`).toContain('ALLOW_FIXTURES_BUILD=1');
  }, 300_000);

  it('con VITE_LOCAL_FIXTURES=1 y ALLOW_FIXTURES_BUILD=1 el build sigue funcionando', () => {
    expect(build({ VITE_LOCAL_FIXTURES: '1', ALLOW_FIXTURES_BUILD: '1' }).status).toBe(0);
  }, 300_000);
});
