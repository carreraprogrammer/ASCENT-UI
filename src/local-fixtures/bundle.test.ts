// TCW-5 CA3 (T3) y T4: la simulación no entra al bundle de producción; el script de arranque existe.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, statSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const ROOT = resolve(__dirname, '../..');
const MARKERS = ['__LOCAL_FIXTURES_MARKER__', 'ejemplo@ascent.local', 'local-fixtures-login', 'fixture_missing'];

const files = (dir: string): string[] => readdirSync(dir).flatMap((n) => {
  const p = join(dir, n);
  return statSync(p).isDirectory() ? files(p) : [p];
});

const buildAndScan = (withVar: boolean) => {
  const out = mkdtempSync(join(tmpdir(), 'tcw5-dist-'));
  try {
    const env = { ...process.env };
    delete env.VITE_LOCAL_FIXTURES;
    if (withVar) env.VITE_LOCAL_FIXTURES = '1';
    execFileSync('npx', ['vite', 'build', '--outDir', out, '--emptyOutDir'], { cwd: ROOT, env, stdio: 'pipe' });
    const text = files(out).filter((f) => /\.(js|html)$/.test(f)).map((f) => readFileSync(f, 'utf8')).join('\n');
    return MARKERS.filter((m) => text.includes(m));
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
};

describe('TCW-5 CA3: bundle de producción', () => {
  it('TCW-5 CA3: vite build sin VITE_LOCAL_FIXTURES no contiene ningún marcador de simulación', () => {
    expect(buildAndScan(false)).toEqual([]);
  }, 300_000);

  it('TCW-5 CA3: espejo positivo, con VITE_LOCAL_FIXTURES=1 el build SÍ contiene los marcadores', () => {
    expect(buildAndScan(true).sort()).toEqual([...MARKERS].sort());
  }, 300_000);

  it('TCW-5 CA3: package.json (build/ios), Dockerfile.web, vercel.json y ci.yml no definen VITE_LOCAL_FIXTURES', () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).scripts as Record<string, string>;
    for (const k of ['build', 'ios:sync', 'ios:open', 'ios:clean-build', 'preview']) {
      expect(pkg[k] ?? '').not.toContain('VITE_LOCAL_FIXTURES');
    }
    for (const f of ['Dockerfile.web', 'vercel.json', '.github/workflows/ci.yml']) {
      expect(readFileSync(join(ROOT, f), 'utf8')).not.toContain('VITE_LOCAL_FIXTURES');
    }
  });
});

describe('TCW-5 T4: scripts/serve-local.sh', () => {
  const path = join(ROOT, 'scripts/serve-local.sh');
  it('TCW-5 T4: existe y es ejecutable', () => {
    expect(existsSync(path)).toBe(true);
    expect(statSync(path).mode & 0o111).not.toBe(0);
  });
  it('TCW-5 T4: exporta VITE_LOCAL_FIXTURES=1, usa el puerto 5173 con strictPort y solo 127.0.0.1', () => {
    const s = readFileSync(path, 'utf8');
    expect(s).toContain('set -euo pipefail');
    expect(s).toContain('VITE_LOCAL_FIXTURES=1');
    expect(s).toContain('5173');
    expect(s).toContain('--strictPort');
    expect(s).toContain('127.0.0.1');
  });
});
