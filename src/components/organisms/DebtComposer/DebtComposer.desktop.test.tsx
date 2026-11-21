// TCW-27: Tipo y Estado de deuda como segmentados con texto en escritorio (4 opciones); <select> en móvil y Capacitor.
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockMedia } from '../../../../tests/helpers/media';

let native = false;
vi.mock('@ionic/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@ionic/react')>();
  return { ...actual, isPlatform: (p: string) => (p === 'capacitor' ? native : actual.isPlatform(p as never)) };
});

import { DebtComposer } from './DebtComposer';

const renderNew = () => render(<DebtComposer onCreate={async () => {}} onUpdate={async () => {}} />);

beforeEach(() => { native = false; mockMedia({ desktop: true }); });

describe('DebtComposer', () => {
  it('escritorio: Tipo y Estado son radiogroups con texto (4 opciones cada uno) y no hay <select> de ellos', async () => {
    const user = userEvent.setup();
    renderNew();
    const tipo = screen.getByRole('radiogroup', { name: /Tipo/ });
    expect(within(tipo).getAllByRole('radio').map((r) => r.textContent)).toEqual(['Tarjeta de crédito', 'Préstamo personal', 'Familiar', 'Hipoteca']);
    const estado = screen.getByRole('radiogroup', { name: /Estado/ });
    expect(within(estado).getAllByRole('radio').map((r) => r.textContent)).toEqual(['Activa', 'Pagada', 'Pausada', 'En disputa']);
    await user.click(within(tipo).getByRole('radio', { name: 'Hipoteca' }));
    expect(within(tipo).getByRole('radio', { name: 'Hipoteca' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.queryByRole('combobox', { name: 'Tipo' })).toBeNull();
  });

  it.each([
    ['móvil', () => { native = false; mockMedia({ desktop: false }); }],
    ['Capacitor', () => { native = true; mockMedia({ desktop: true }); }],
  ])('%s: Tipo y Estado siguen siendo <select>', (_n, setup) => {
    setup();
    renderNew();
    expect(screen.queryByRole('radiogroup')).toBeNull();
    expect(screen.getByRole('combobox', { name: /Tipo/ })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /Estado/ })).toBeInTheDocument();
  });
});
