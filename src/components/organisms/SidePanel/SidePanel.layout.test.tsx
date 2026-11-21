// TCW-27 CA3 (refuerzo tras la revisión del PR #14): el panel no puede encogerse por debajo de 480 px.
// jsdom no calcula layout, así que la prueba exige las declaraciones que impiden el encogimiento (min-width, flex: none,
// border-box); con la hoja anterior (solo width + max-width) estas aserciones fallan. La medición real en navegador
// (getBoundingClientRect().width === 480 a 1440 px) queda como verificación manual.
import { readSrc } from '../../../../tests/helpers/readSrc';

const css = readSrc('src/components/organisms/SidePanel/SidePanel.module.css');
const composerCss = readSrc('src/components/organisms/ComposerForm.module.css');
const panel = css.match(/\.panel\s*\{[^}]*\}/)?.[0] ?? '';

describe('Panel: no se encoge por debajo de 480 px (CA3)', () => {
  it('TCW-27 CA3: .panel declara width y min-width de 480px, flex: none y box-sizing: border-box', () => {
    expect(panel).toMatch(/(^|[;{\s])width:\s*480px/);
    expect(panel).toMatch(/min-width:\s*480px/);
    expect(panel).toMatch(/flex:\s*none/);
    expect(panel).toMatch(/box-sizing:\s*border-box/);
  });

  it('TCW-27 CA3: el tope max-width no baja de 480px (solo 100vw)', () => {
    expect(panel).toMatch(/max-width:\s*100vw/);
  });

  it('TCW-27 CA3: los chips de Gaveta del panel recortan su texto en vez de desbordar el carril', () => {
    expect(composerCss).toMatch(/\.categoryRail \.categoryToken\s*\{[^}]*min-width:\s*0/);
    expect(composerCss).toMatch(/\.categoryRail \.categoryTokenText\s*\{[^}]*text-overflow:\s*ellipsis/);
  });
});
