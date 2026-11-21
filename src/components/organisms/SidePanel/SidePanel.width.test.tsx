// TCW-27 (pulido) CA3: el panel mide 480 px de ancho en escritorio (en producción se ve de ~400).
// La hoja de SidePanel ya declara 480px; esta prueba además busca CUALQUIER regla del repo que reduzca el panel.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { render, screen } from '@testing-library/react';
import { mockMedia } from '../../../../tests/helpers/media';
import { readSrc } from '../../../../tests/helpers/readSrc';
import { SidePanel } from './SidePanel';

const css = readSrc('src/components/organisms/SidePanel/SidePanel.module.css');

const cssFiles = (dir: string): string[] => readdirSync(dir).flatMap((n) => {
  const p = join(dir, n);
  return statSync(p).isDirectory() ? cssFiles(p) : /\.css$/.test(n) ? [p] : [];
});
const rules = (text: string) => [...text.matchAll(/([^{}@][^{}]*)\{([^{}]*)\}/g)].map((m) => ({ sel: m[1].trim(), body: m[2] }));

describe('Ancho del panel (CA3)', () => {
  it('TCW-27 CA3: .panel declara width: 480px y ningún max-width/min-width lo recorta por debajo de 480', () => {
    const panel = rules(css).find((r) => /(^|,)\s*\.panel\s*(,|$)/.test(r.sel))?.body ?? '';
    expect(panel).toMatch(/(^|[;\s])width:\s*480px/);
    const max = panel.match(/max-width:\s*(\d+)px/);
    if (max) expect(Number(max[1])).toBeGreaterThanOrEqual(480);
    const min = panel.match(/min-width:\s*(\d+)px/);
    if (min) expect(Number(min[1])).toBeLessThanOrEqual(480);
  });

  it('TCW-27 CA3: ninguna hoja del repo fija el ancho del propio panel ([data-testid="side-panel"]) por debajo de 480px', () => {
    const root = resolve(process.cwd(), 'src');
    const offenders: string[] = [];
    for (const f of cssFiles(root)) {
      for (const r of rules(readFileSync(f, 'utf8'))) {
        const targetsPanelItself = r.sel.split(',').some((s) => /\[data-testid=["']side-panel["']\]\s*$/.test(s.trim()) || /\[data-testid=["']side-panel["']\](:[\w-]+)*\s*$/.test(s.trim()));
        if (!targetsPanelItself) continue;
        for (const m of r.body.matchAll(/(?:^|[;\s])(width|max-width|min-width|inline-size|max-inline-size):\s*([^;]+)/g)) {
          const v = m[2].trim();
          const n = v.match(/^(\d+)px$/);
          if (n && Number(n[1]) < 480) offenders.push(`${f}: ${r.sel} { ${m[1]}: ${v} }`);
          if (/^(min|clamp|calc)\(/.test(v) && !/480/.test(v)) offenders.push(`${f}: ${r.sel} { ${m[1]}: ${v} }`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('TCW-27 CA3: el panel es un hijo directo de body (portal), sin contenedor con ancho propio que lo estreche', () => {
    mockMedia({ desktop: true });
    render(<SidePanel isOpen title="Editar transacción" onClose={() => {}} onSubmit={() => {}}><p>x</p></SidePanel>);
    const panel = screen.getByTestId('side-panel');
    // root (fixed, inset 0) -> aside; el root no debe declarar ancho.
    expect(panel.parentElement?.parentElement).toBe(document.body);
    const root = rules(css).find((r) => /(^|,)\s*\.root\s*(,|$)/.test(r.sel))?.body ?? '';
    expect(root).not.toMatch(/(^|[;\s])(width|max-width):/);
    expect(existsSync(resolve(process.cwd(), 'src/components/organisms/SidePanel/SidePanel.module.css'))).toBe(true);
  });

  it('TCW-27 CA3: el body del panel no añade padding horizontal que deje la columna útil bajo 440px (480 - 2x20)', () => {
    const body = rules(css).find((r) => /(^|,)\s*\.body\s*(,|$)/.test(r.sel))?.body ?? '';
    const pad = body.match(/padding:\s*(\d+)px(?:\s+(\d+)px)?/);
    expect(pad).not.toBeNull();
    const horizontal = Number(pad?.[2] ?? pad?.[1]);
    expect(480 - 2 * horizontal).toBeGreaterThanOrEqual(440);
  });
});
