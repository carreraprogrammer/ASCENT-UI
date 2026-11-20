// TCW-5: filtro "Gaveta" (ChipSelect con color -> ColorChipMenu). La app solo está en español (sin capa i18n),
// por eso los textos visibles se prueban en español.
import { useState } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GAVETAS_FILTRO } from '../../../../tests/fixtures/gavetas';
import { ChipSelect } from './instDesk';

const Harness = ({ initial = '' }: { initial?: string }) => {
  const [v, setV] = useState(initial);
  return (
    <div>
      <ChipSelect label="Gaveta" value={v} options={[...GAVETAS_FILTRO]} onChange={setV} />
      <button type="button">siguiente control</button>
    </div>
  );
};

const trigger = () => screen.getAllByRole('button').find((b) => b.hasAttribute('aria-haspopup')) as HTMLElement;
const open = async (user: ReturnType<typeof userEvent.setup>, initial = '') => {
  render(<Harness initial={initial} />);
  await user.click(trigger());
  return screen.getByRole('menu');
};

describe('ColorChipMenu (filtro Gaveta)', () => {
  it('TCW-5 CA4: cada opción de gaveta lleva un punto de su color y el nombre escrito', async () => {
    const user = userEvent.setup();
    const menu = await open(user);
    for (const g of GAVETAS_FILTRO) {
      const item = within(menu).getByRole('menuitemradio', { name: g.label });
      expect(item).toHaveTextContent(g.label);
      const dot = item.querySelector('[aria-hidden="true"]') as HTMLElement | null;
      expect(dot, `falta el punto en ${g.label}`).not.toBeNull();
      expect(dot!.style.getPropertyValue('--dot')).toBe(g.color);
    }
  });

  it('TCW-5 CA4: con foco en el botón, ArrowUp va a la última opción', async () => {
    const user = userEvent.setup();
    const menu = await open(user);
    trigger().focus();
    await user.keyboard('{ArrowUp}');
    const items = within(menu).getAllByRole('menuitemradio');
    expect(document.activeElement).toBe(items[items.length - 1]);
    expect(document.activeElement).toHaveTextContent('Flexible');
  });

  it('TCW-5 CA4: con foco en el botón, ArrowDown va a la primera opción', async () => {
    const user = userEvent.setup();
    const menu = await open(user);
    trigger().focus();
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(within(menu).getAllByRole('menuitemradio')[0]);
    expect(document.activeElement).toHaveTextContent('Gaveta: todas');
  });

  it('TCW-5 CA4: Tab hacia fuera cierra el menú', async () => {
    const user = userEvent.setup();
    await open(user);
    trigger().focus();
    const next = screen.getByRole('button', { name: 'siguiente control' });
    for (let i = 0; i < 10 && document.activeElement !== next; i += 1) await user.tab(); // sale del componente
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'siguiente control' }));
    expect(screen.queryByRole('menu')).toBeNull();
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
  });

  it('TCW-5 CA4: al abrir, el foco pasa a la opción activa (todas)', async () => {
    const user = userEvent.setup();
    const menu = await open(user);
    expect(document.activeElement).toBe(within(menu).getByRole('menuitemradio', { checked: true }));
    expect(document.activeElement).toHaveTextContent('Gaveta: todas');
  });

  it('TCW-5 CA4: al abrir con una gaveta elegida, el foco pasa a esa opción', async () => {
    const user = userEvent.setup();
    await open(user, 'c2');
    expect(document.activeElement).toBe(screen.getByRole('menuitemradio', { name: 'Necesario' }));
  });

  it('TCW-5 CA4: sin gaveta elegida, el nombre accesible del botón contiene su texto visible (WCAG 2.5.3)', () => {
    render(<Harness />);
    expect(trigger()).toHaveAccessibleName(expect.stringContaining('Gaveta'));
  });

  it.each(GAVETAS_FILTRO)('TCW-5 CA4: con "$label" elegida, el nombre accesible del botón contiene "$label" (WCAG 2.5.3)', ({ value, label }) => {
    render(<Harness initial={value} />);
    expect(trigger()).toHaveTextContent(label);
    expect(trigger()).toHaveAccessibleName(expect.stringContaining(label));
  });
});
