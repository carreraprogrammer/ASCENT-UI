#!/usr/bin/env node
// TCW-5: el build de producción (sin VITE_LOCAL_FIXTURES) no puede contener la API simulada ni sus datos.
// Construye en un directorio temporal y falla si algún .js/.html trae un marcador. Espejo positivo: con la variable
// el mismo build SÍ los trae (así la comprobación no pasa siempre por error).
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MARKERS = ['__LOCAL_FIXTURES_MARKER__', 'ejemplo@ascent.local', 'local-fixtures-login', 'fixture_missing'];

const files = (dir) => readdirSync(dir).flatMap((n) => {
  const p = join(dir, n);
  return statSync(p).isDirectory() ? files(p) : [p];
});

const buildAndScan = (withVar) => {
  const out = mkdtempSync(join(tmpdir(), 'ascent-dist-'));
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

const leaked = buildAndScan(false);
if (leaked.length) {
  console.error(`check:bundle FALLA: el build de producción contiene la simulación: ${leaked.join(', ')}`);
  process.exit(1);
}
const present = buildAndScan(true);
if (present.length !== MARKERS.length) {
  console.error(`check:bundle FALLA: con VITE_LOCAL_FIXTURES=1 faltan marcadores (${present.join(', ') || 'ninguno'}); la comprobación no es fiable.`);
  process.exit(1);
}
console.log('check:bundle OK: sin la variable el bundle no contiene la simulación; con ella sí.');
