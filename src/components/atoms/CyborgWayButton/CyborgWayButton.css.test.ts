// TCW-5: la marca del botón violeta se lee sobre el violeta. Se prueba leyendo el CSS como texto (como CategoryCell.test).
import { readFileSync } from 'node:fs';

describe('CyborgWayButton.module.css', () => {
  const css = readFileSync('src/components/atoms/CyborgWayButton/CyborgWayButton.module.css', 'utf8');
  const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, sel, body]) => ({ sel: sel.trim(), body }));

  it('TCW-5 CA4: el rect de la marca se recolorea a var(--on-violet)', () => {
    const rect = rules.find((r) => /(^|[\s,])\.mark\b[^,{]*(:global\(rect\)|\brect\b)/.test(r.sel) && /fill:\s*var\(--on-violet\)/.test(r.body));
    expect(rect, 'falta una regla ".mark rect { fill: var(--on-violet) }"').toBeDefined();
  });
});
