// TCW-27 CA6 (+ CA1: sin textos de relleno). El formulario real usa los átomos nuevos: nada de iconos sueltos ni <select>.
//
// CONTRATO: TransactionComposer renderiza Medio de pago con <SegmentedControl label="Medio de pago"> (Tarjeta / Cuenta /
// Efectivo) y también Tipo (Gasto/Ingreso) y Estado (Confirmada/Pendiente) como SegmentedControl; el monto y la fecha usan
// NumberInput(currency) y DateInput; desaparecen "Contexto base" y el texto "Fecha, tipo y monto primero...".
// Comportamiento y validaciones no cambian (misma lógica de submit).
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TX_78000 } from '../../../../tests/fixtures/transaction';

// El composer importa themeStore (matchMedia al importar): se aísla de CA10 para que el rojo de esta suite sea el de CA6.
vi.hoisted(async () => (await import('../../../test/stubMatchMedia')).stubMatchMedia());
import { mockMedia } from '../../../../tests/helpers/media';

let native = false;
vi.mock('@ionic/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@ionic/react')>();
  return { ...actual, isPlatform: (p: string) => (p === 'capacitor' ? native : actual.isPlatform(p as never)) };
});

import { TransactionComposer } from './TransactionComposer';

// CONTRATO ADICIONAL (CA12): los cambios del composer solo aplican en escritorio (useDesktopLayout). En móvil y en
// Capacitor se conserva el composer actual: Medio de pago con botones de icono, <select> para Tipo/Estado, y los
// encabezados "Contexto base" y "Categoría y subcategoría" con su texto.
beforeEach(() => { native = false; mockMedia({ desktop: true }); });

describe.each([
  ['móvil (< 1024 px)', () => { native = false; mockMedia({ desktop: false }); }],
  ['Capacitor (>= 1024 px nativo)', () => { native = true; mockMedia({ desktop: true }); }],
])('TransactionComposer sin cambios en %s', (_n, setup) => {
  it('TCW-27 CA12: Medio de pago son botones de icono con aria-label y aria-pressed, sin radiogroup', () => {
    setup();
    render(<TransactionComposer transaction={TX_78000} categories={[]} onCreate={async () => {}} onUpdate={async () => {}} />);
    expect(screen.queryByRole('radiogroup')).toBeNull();
    expect(screen.getByRole('button', { name: 'Tarjeta de crédito' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Débito / Nequi' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Efectivo' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('TCW-27 CA12: Tipo y Estado siguen siendo <select>', () => {
    setup();
    render(<TransactionComposer transaction={TX_78000} categories={[]} onCreate={async () => {}} onUpdate={async () => {}} />);
    expect(screen.getAllByRole('combobox')).toHaveLength(2);
  });

  it('TCW-27 CA12: conserva los encabezados originales ("Contexto base", "Categoría y subcategoría") y su texto', () => {
    setup();
    render(<TransactionComposer transaction={TX_78000} categories={[]} onCreate={async () => {}} onUpdate={async () => {}} />);
    expect(screen.getByRole('heading', { name: 'Contexto base' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Categoría y subcategoría' })).toBeInTheDocument();
    expect(screen.getByText(/Fecha, tipo y monto primero/)).toBeInTheDocument();
  });

  it('TCW-27 CA12: sin texto formateado de fecha ni punto en el monto (como antes)', () => {
    setup();
    render(<TransactionComposer transaction={TX_78000} categories={[]} onCreate={async () => {}} onUpdate={async () => {}} />);
    expect(screen.queryByTestId('date-display')).toBeNull();
    expect(screen.getByRole('textbox', { name: /Monto/ })).toHaveValue(new Intl.NumberFormat().format(78000));
  });
});

const renderEdit = () =>
  render(<TransactionComposer transaction={TX_78000} categories={[]} onCreate={async () => {}} onUpdate={async () => {}} />);

describe('TransactionComposer (escritorio)', () => {
  it('TCW-27 CA6: Medio de pago es un radiogroup con texto Tarjeta, Cuenta, Efectivo y marca Cuenta (debit)', () => {
    renderEdit();
    const group = screen.getByRole('radiogroup', { name: /Medio de pago/ });
    expect(within(group).getAllByRole('radio').map((r) => r.textContent)).toEqual(['Tarjeta', 'Cuenta', 'Efectivo']);
    expect(within(group).getByRole('radio', { name: 'Cuenta' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.queryByText('Tarjeta de crédito')).toBeNull();
    expect(screen.queryByText('Débito / Nequi')).toBeNull();
  });

  it('TCW-27 CA6: elegir Efectivo cambia la marca', async () => {
    const user = userEvent.setup();
    renderEdit();
    await user.click(screen.getByRole('radio', { name: 'Efectivo' }));
    expect(screen.getByRole('radio', { name: 'Efectivo' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'Cuenta' })).toHaveAttribute('aria-checked', 'false');
  });

  it('TCW-27 CA6: Tipo y Estado son segmentados con texto, no <select>', () => {
    renderEdit();
    expect(screen.queryAllByRole('combobox')).toHaveLength(0);
    expect(within(screen.getByRole('radiogroup', { name: /Tipo/ })).getAllByRole('radio').map((r) => r.textContent)).toEqual(['Gasto', 'Ingreso']);
    expect(within(screen.getByRole('radiogroup', { name: /Estado/ })).getAllByRole('radio').map((r) => r.textContent)).toEqual(['Confirmada', 'Pendiente']);
  });

  it('TCW-27 CA6: el monto se ve 78.000 (punto) y la fecha "20 nov 2026"', () => {
    renderEdit();
    expect(screen.getByRole('textbox', { name: /Monto/ })).toHaveValue('78.000');
    expect(screen.getByTestId('date-display')).toHaveTextContent('20 nov 2026');
  });

  it('TCW-27 CA1: sin textos de relleno ("Contexto base", "Fecha, tipo y monto primero")', () => {
    renderEdit();
    expect(screen.queryByText(/Contexto base/)).toBeNull();
    expect(screen.queryByText(/Fecha, tipo y monto primero/)).toBeNull();
  });
});
