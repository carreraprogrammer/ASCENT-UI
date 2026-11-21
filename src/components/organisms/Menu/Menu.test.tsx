// TCW-27 CA3. Menú único de escritorio (filtros, orden y el filtro Gaveta de instDesk).
//
// CONTRATO PARA EL CONSTRUCTOR
//   Módulo:  src/components/organisms/Menu/Menu.tsx (+ index.ts que re-exporta `Menu`), Menu.module.css (solo tokens).
//   Props:   label: string (texto del botón y aria-label del menú); options: Array<{ value: string; label: string;
//            color?: string (punto de gaveta, p. ej. var(--color-committed)); count?: number (conteo mono a la derecha) }>;
//            selected: string[]; onChange: (selected: string[]) => void;
//            multiple?: boolean (por defecto false: elegir una opción reemplaza la selección y cierra);
//            clearLabel?: string (por defecto "Limpiar"); searchLabel?: string (aria-label del buscador, por defecto "Buscar").
//   DOM:     botón disparador con aria-haspopup="menu" y aria-expanded. Abierto: elemento role="menu" con data-ui="menu"
//            justo después del botón (mismo contenedor, debajo de él). Opciones: role="menuitemcheckbox" si multiple,
//            "menuitemradio" si no, con aria-checked; la marcada lleva un [data-check] (check violeta); el punto es un
//            [aria-hidden] con la variable --dot; el conteo va en un [data-count]. Buscador (input type=search, role
//            searchbox) solo si hay MÁS de 6 opciones. Pie con botón "Limpiar" que llama onChange([]).
//   Teclado: ArrowDown/ArrowUp mueven el foco entre opciones; Espacio marca/desmarca; Esc cierra y devuelve el foco al
//            botón; mousedown fuera cierra.
//   CSS:     Menu.module.css fija min-width: 220px; max-width: 250px; background: var(--surface); border: 1px solid
//            var(--line); border-radius: 10px; box-shadow; opciones font-size: 13px.
//   Unificación: ChipSelect (instDesk.tsx) con opciones de color usa este Menu (su menú lleva data-ui="menu") e
//            instDesk.module.css ya no define .menu, .menuItem ni .menuRoot.
import { useState } from 'react';
import { readSrc } from '../../../../tests/helpers/readSrc';
import { render, screen, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GAVETAS_FILTRO } from '../../../../tests/fixtures/gavetas';
import { ChipSelect } from '../../pages/TransactionsPage/instDesk';
import { Menu } from './Menu';

const css = readSrc('src/components/organisms/Menu/Menu.module.css');
const deskCss = readSrc('src/components/pages/TransactionsPage/instDesk.module.css');

const OPTIONS = GAVETAS_FILTRO.map((g, i) => ({ value: g.value, label: g.label, color: g.color, count: (i + 1) * 12 }));
const MANY = Array.from({ length: 7 }, (_, i) => ({ value: `m${i}`, label: `Opción ${i + 1}` }));

const Harness = ({ options = OPTIONS, multiple = true, initial = [] as string[], onChange = () => {} }: {
  options?: typeof OPTIONS | typeof MANY; multiple?: boolean; initial?: string[]; onChange?: (s: string[]) => void;
}) => {
  const [sel, setSel] = useState<string[]>(initial);
  return (
    <div>
      <Menu label="Gaveta" options={options as never} selected={sel} multiple={multiple} onChange={(s) => { setSel(s); onChange(s); }} />
      <button type="button">afuera</button>
    </div>
  );
};

const trigger = () => screen.getByRole('button', { name: /Gaveta/ });
const open = async (user: ReturnType<typeof userEvent.setup>) => { await user.click(trigger()); return screen.getByRole('menu'); };

describe('Menu: CA3', () => {
  it('TCW-27 CA3: el botón anuncia un menú (aria-haspopup, aria-expanded) y al abrir aparece role=menu debajo de él', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    expect(trigger()).toHaveAttribute('aria-haspopup', 'menu');
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
    const menu = await open(user);
    expect(trigger()).toHaveAttribute('aria-expanded', 'true');
    expect(menu).toHaveAttribute('data-ui', 'menu');
    expect(trigger().parentElement).toContainElement(menu);
    expect(trigger().compareDocumentPosition(menu) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('TCW-27 CA3: cada opción de gaveta muestra su punto de color, su nombre y su conteo a la derecha', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const menu = await open(user);
    for (const o of OPTIONS) {
      const item = within(menu).getByRole('menuitemcheckbox', { name: new RegExp(o.label) });
      const dot = item.querySelector('[aria-hidden="true"]') as HTMLElement | null;
      expect(dot, `punto de ${o.label}`).not.toBeNull();
      expect(dot!.style.getPropertyValue('--dot')).toBe(o.color);
      expect(item.querySelector('[data-count]')).toHaveTextContent(String(o.count));
    }
  });

  it('TCW-27 CA3: la opción marcada lleva check (aria-checked y [data-check]); las demás no', async () => {
    const user = userEvent.setup();
    render(<Harness initial={['c2']} />);
    const menu = await open(user);
    const on = within(menu).getByRole('menuitemcheckbox', { name: /Necesario/ });
    const off = within(menu).getByRole('menuitemcheckbox', { name: /Flexible/ });
    expect(on).toHaveAttribute('aria-checked', 'true');
    expect(on.querySelector('[data-check]')).not.toBeNull();
    expect(off).toHaveAttribute('aria-checked', 'false');
    expect(off.querySelector('[data-check]')).toBeNull();
  });

  it('TCW-27 CA3: con 6 opciones o menos no hay buscador; con 7 sí, y filtra por texto', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Harness options={OPTIONS} />);
    await open(user);
    expect(screen.queryByRole('searchbox')).toBeNull();
    unmount();
    render(<Harness options={MANY} />);
    const menu = await open(user);
    const search = within(menu).getByRole('searchbox');
    await user.type(search, 'Opción 3');
    expect(within(menu).getAllByRole('menuitemcheckbox')).toHaveLength(1);
    expect(within(menu).getByRole('menuitemcheckbox', { name: 'Opción 3' })).toBeInTheDocument();
  });

  it('TCW-27 CA3: el pie "Limpiar" vacía la selección', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness initial={['c1', 'c3']} onChange={onChange} />);
    const menu = await open(user);
    await user.click(within(menu).getByRole('button', { name: 'Limpiar' }));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it('TCW-27 CA3: las flechas mueven el foco entre opciones (con vuelta al final)', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const menu = await open(user);
    const items = within(menu).getAllByRole('menuitemcheckbox');
    items[0].focus();
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(items[1]);
    await user.keyboard('{ArrowUp}{ArrowUp}');
    expect(document.activeElement).toBe(items[items.length - 1]);
  });

  it('TCW-27 CA3: Espacio marca y desmarca la opción enfocada', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const menu = await open(user);
    within(menu).getByRole('menuitemcheckbox', { name: /Necesario/ }).focus();
    await user.keyboard(' ');
    expect(onChange).toHaveBeenLastCalledWith(['c2']);
    await user.keyboard(' ');
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it('TCW-27 CA3: Esc cierra el menú y devuelve el foco al botón', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const menu = await open(user);
    within(menu).getAllByRole('menuitemcheckbox')[1].focus();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toBe(trigger());
  });

  it('TCW-27 CA3: el clic fuera cierra el menú; el clic dentro no', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const menu = await open(user);
    fireEvent.mouseDown(menu);
    expect(screen.getByRole('menu')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'afuera' }));
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('TCW-27 CA3: sin multiple, elegir una opción la selecciona (menuitemradio) y cierra', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness multiple={false} onChange={onChange} />);
    const menu = await open(user);
    await user.click(within(menu).getByRole('menuitemradio', { name: /Flexible/ }));
    expect(onChange).toHaveBeenLastCalledWith(['c3']);
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('TCW-27 CA3: la hoja de estilos del menú fija 220-250 px, --surface, --line, radio 10 y opciones de 13 px', () => {
    expect(css).toMatch(/min-width:\s*220px/);
    expect(css).toMatch(/max-width:\s*250px/);
    expect(css).toMatch(/background:\s*var\(--surface\)/);
    expect(css).toMatch(/border:\s*1px solid var\(--line\)/);
    expect(css).toMatch(/border-radius:\s*10px/);
    expect(css).toMatch(/box-shadow:/);
    expect(css).toMatch(/font-size:\s*13px/);
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});

describe('Menu: CA3/CA8 un solo menú (unificado con el filtro Gaveta de instDesk)', () => {
  it('TCW-27 CA3: el filtro Gaveta de instDesk abre el Menu compartido (data-ui="menu", con "Limpiar")', async () => {
    const user = userEvent.setup();
    const Gaveta = () => {
      const [v, setV] = useState('');
      return <ChipSelect label="Gaveta" value={v} options={[...GAVETAS_FILTRO]} onChange={setV} />;
    };
    render(<Gaveta />);
    await user.click(screen.getByRole('button', { name: /Gaveta/ }));
    const menu = screen.getByRole('menu');
    expect(menu).toHaveAttribute('data-ui', 'menu');
    expect(within(menu).getByRole('button', { name: 'Limpiar' })).toBeInTheDocument();
  });

  it('TCW-27 CA8: instDesk.module.css ya no define un menú propio (.menu, .menuItem, .menuRoot)', () => {
    expect(deskCss).not.toMatch(/\.menu\b/);
    expect(deskCss).not.toMatch(/\.menuItem/);
    expect(deskCss).not.toMatch(/\.menuRoot\b/);
  });
});
