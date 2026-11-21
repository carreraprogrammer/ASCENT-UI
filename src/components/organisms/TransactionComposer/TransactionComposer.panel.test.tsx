// TCW-27 (pulido) CA3: etiqueta "Tarjeta" con la pista "opcional" dentro del campo (a la derecha) y chips de Gaveta en una fila.
//
// CONTRATO PARA EL CONSTRUCTOR (solo escritorio; móvil y Capacitor conservan "Nombre de la tarjeta (opcional)")
//   Con Medio de pago = Tarjeta el campo del producto tiene la etiqueta exacta "Tarjeta" (accessible name "Tarjeta") y un
//   elemento con el texto "opcional" DENTRO del mismo contenedor del campo (a la derecha del input), fuera del <label>.
//   ComposerForm.module.css: dentro de [data-testid="side-panel"], .categoryRail no envuelve (flex-wrap: nowrap o
//   grid-auto-flow: column) para que los chips de Gaveta ocupen una sola fila de 480 px.
import { render, screen } from '@testing-library/react';
import { readSrc } from '../../../../tests/helpers/readSrc';
import { GAVETAS_FILTRO } from '../../../../tests/fixtures/gavetas';

vi.hoisted(async () => (await import('../../../test/stubMatchMedia')).stubMatchMedia());
import { mockMedia } from '../../../../tests/helpers/media';

let native = false;
vi.mock('@ionic/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@ionic/react')>();
  return { ...actual, isPlatform: (p: string) => (p === 'capacitor' ? native : actual.isPlatform(p as never)) };
});

import { TransactionComposer } from './TransactionComposer';

const css = readSrc('src/components/organisms/ComposerForm.module.css');
const rules = (text: string) => [...text.matchAll(/([^{}@][^{}]*)\{([^{}]*)\}/g)].map((m) => ({ sel: m[1].trim(), body: m[2] }));

beforeEach(() => { native = false; mockMedia({ desktop: true }); });

const renderCard = () =>
  render(<TransactionComposer categories={[]} initialPaymentSource="credit_card" onCreate={async () => {}} onUpdate={async () => {}} />);

describe('Campo de tarjeta (CA3)', () => {
  it('TCW-27 CA3: escritorio: la etiqueta es "Tarjeta" y ya no existe "Nombre de la tarjeta (opcional)"', () => {
    renderCard();
    expect(screen.queryByText(/Nombre de la tarjeta/)).toBeNull();
    const input = screen.getByRole('textbox', { name: 'Tarjeta' });
    const label = document.querySelector(`label[for="${input.id}"]`);
    expect(label?.textContent?.trim()).toBe('Tarjeta');
  });

  it('TCW-27 CA3: la pista "opcional" está dentro del campo (mismo contenedor que el input), fuera de la etiqueta', () => {
    renderCard();
    const input = screen.getByRole('textbox', { name: 'Tarjeta' });
    const hint = screen.getByText('opcional');
    expect(hint.closest('label')).toBeNull();
    expect(input.parentElement).toContainElement(hint);
    // a la derecha del input en el orden del DOM
    expect(input.compareDocumentPosition(hint) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it.each([
    ['móvil', () => { native = false; mockMedia({ desktop: false }); }],
    ['Capacitor', () => { native = true; mockMedia({ desktop: true }); }],
  ])('TCW-27 CA3: %s conserva la etiqueta "Nombre de la tarjeta (opcional)"', (_n, setup) => {
    setup();
    renderCard();
    expect(screen.getByText('Nombre de la tarjeta (opcional)')).toBeInTheDocument();
  });
});

describe('Chips de Gaveta en una fila (CA3)', () => {
  it('TCW-27 CA3: dentro del panel .categoryRail no envuelve (flex-wrap: nowrap o grid de una fila)', () => {
    const own = rules(css).filter((r) => /side-panel/.test(r.sel) && /\.categoryRail\b/.test(r.sel));
    const body = own.map((r) => r.body).join(';');
    expect(body).toMatch(/flex-wrap:\s*nowrap|grid-auto-flow:\s*column|grid-template-columns:\s*repeat\(\s*(3|4|5)\s*,/);
  });

  it(`TCW-27 CA3: las ${GAVETAS_FILTRO.length} gavetas (${GAVETAS_FILTRO.map((g) => g.label).join(', ')}) caben en 480 px: chips con min-width 0 y texto recortable`, () => {
    const tokens = rules(css).filter((r) => /side-panel/.test(r.sel) && /\.categoryToken\b/.test(r.sel)).map((r) => r.body).join(';');
    expect(tokens).toMatch(/min-width:\s*0/);
  });
});
