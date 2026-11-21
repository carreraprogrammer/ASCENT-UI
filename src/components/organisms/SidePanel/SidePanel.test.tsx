// TCW-27 CA1, CA2. Panel lateral único de escritorio.
//
// CONTRATO PARA EL CONSTRUCTOR
//   Módulo:  src/components/organisms/SidePanel/SidePanel.tsx  (+ index.ts que re-exporta `SidePanel`)
//   Estilos: src/components/organisms/SidePanel/SidePanel.module.css (solo tokens, sin hex)
//   Props:   isOpen: boolean; title: string; origin?: string (línea mono 11 px); figure?: { label: string; value: string }
//            (cifra mono 34 px con su etiqueta 11 px); children (cuerpo, con scroll interno); onClose: () => void;
//            onSubmit: () => void; onDelete?: () => void (el botón de eliminar solo existe si se pasa);
//            submitLabel, cancelLabel, deleteLabel: string (los textos vienen de quien lo usa: es/en).
//   DOM:     se monta en un portal en document.body. El elemento con role="dialog" aria-modal="true" aria-labelledby=<título>
//            es el panel (data-testid="side-panel"). Cabecera con <h2> título, origen y una tecla <kbd>Esc</kbd>.
//            Pie con Eliminar (izquierda, data-tone="danger"), Cancelar y el principal con <kbd>⌘↵</kbd>.
//   Efectos: al abrir, foco dentro del panel; Tab/Shift+Tab ciclan dentro; al cerrar, el foco vuelve al elemento que lo
//            tenía al abrir; Esc llama onClose; Cmd+Enter o Ctrl+Enter llama onSubmit una sola vez; mientras está abierto
//            document.body.style.overflow === 'hidden' y se restaura al cerrar; con prefers-reduced-motion el panel lleva
//            data-reduced-motion="true" (y la hoja de estilos no anima).
import { useState } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockMedia } from '../../../../tests/helpers/media';
import { readSrc } from '../../../../tests/helpers/readSrc';
import { SidePanel } from './SidePanel';

const css = readSrc('src/components/organisms/SidePanel/SidePanel.module.css');

const TEXTS = {
  es: { title: 'Editar transacción', submit: 'Guardar cambios', cancel: 'Cancelar', del: 'Eliminar' },
  en: { title: 'Edit transaction', submit: 'Save changes', cancel: 'Cancel', del: 'Delete' },
} as const;

type Lang = keyof typeof TEXTS;

const Harness = ({ lang = 'es', withDelete = true, onSubmit = () => {}, onClosed = () => {} }: {
  lang?: Lang; withDelete?: boolean; onSubmit?: () => void; onClosed?: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const t = TEXTS[lang];
  return (
    <div>
      <button type="button" onClick={() => setOpen(true)}>abrir</button>
      <SidePanel
        isOpen={open}
        title={t.title}
        origin="correo del banco · clasificó el agente"
        figure={{ label: 'MONTO', value: '−78.000' }}
        onClose={() => { setOpen(false); onClosed(); }}
        onSubmit={onSubmit}
        onDelete={withDelete ? () => {} : undefined}
        submitLabel={t.submit}
        cancelLabel={t.cancel}
        deleteLabel={t.del}
      >
        <label>Concepto <input aria-label="Concepto" defaultValue="Netflix" /></label>
        <input aria-label="Monto" defaultValue="78.000" />
      </SidePanel>
    </div>
  );
};

const openPanel = async (user: ReturnType<typeof userEvent.setup>) => {
  const trigger = screen.getByRole('button', { name: 'abrir' });
  trigger.focus();
  await user.click(trigger);
  return screen.getByRole('dialog');
};

beforeEach(() => { mockMedia({ desktop: true }); document.body.style.overflow = ''; });

describe('SidePanel: CA1 estructura y contenido', () => {
  it.each(['es', 'en'] as const)('TCW-27 CA1: cabecera con título, origen mono y tecla Esc, sin "Ascent" (%s)', async (lang) => {
    const user = userEvent.setup();
    render(<Harness lang={lang} />);
    const dialog = await openPanel(user);
    expect(within(dialog).getByRole('heading', { name: TEXTS[lang].title })).toBeInTheDocument();
    expect(within(dialog).getByText('correo del banco · clasificó el agente')).toBeInTheDocument();
    expect(within(dialog).getByText('Esc')).toBeInTheDocument();
    expect(dialog).not.toHaveTextContent(/Ascent/);
  });

  it('TCW-27 CA1: la cifra principal lleva su etiqueta', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const dialog = await openPanel(user);
    expect(within(dialog).getByText('−78.000')).toBeInTheDocument();
    expect(within(dialog).getByText('MONTO')).toBeInTheDocument();
  });

  it.each(['es', 'en'] as const)('TCW-27 CA1: pie con Eliminar (peligro), Cancelar y principal con "⌘↵" (%s)', async (lang) => {
    const user = userEvent.setup();
    render(<Harness lang={lang} />);
    const dialog = await openPanel(user);
    const t = TEXTS[lang];
    expect(within(dialog).getByRole('button', { name: t.del })).toHaveAttribute('data-tone', 'danger');
    expect(within(dialog).getByRole('button', { name: t.cancel })).toBeInTheDocument();
    const primary = within(dialog).getByRole('button', { name: new RegExp(t.submit) });
    expect(primary).toHaveTextContent('⌘↵');
  });

  it('TCW-27 CA1: sin onDelete (al crear) no hay botón Eliminar', async () => {
    const user = userEvent.setup();
    render(<Harness withDelete={false} />);
    const dialog = await openPanel(user);
    expect(within(dialog).queryByRole('button', { name: 'Eliminar' })).toBeNull();
  });

  it('TCW-27 CA1: la hoja de estilos fija 480 px, position fixed, --surface, borde izquierdo 1 px --line, velo 45 %, scroll interno', () => {
    expect(css).toMatch(/position:\s*fixed/);
    expect(css).toMatch(/width:\s*480px/);
    expect(css).toMatch(/background:\s*var\(--surface\)/);
    expect(css).toMatch(/border-left:\s*1px solid var\(--line\)/);
    expect(css).toMatch(/45%/);
    expect(css).toMatch(/overflow-y:\s*auto/);
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});

describe('SidePanel: CA2 comportamiento', () => {
  it('TCW-27 CA2: role=dialog, aria-modal y nombre accesible igual al título', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const dialog = await openPanel(user);
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleName('Editar transacción');
    expect(dialog).toHaveAttribute('data-testid', 'side-panel');
  });

  it('TCW-27 CA2: cerrado no hay diálogo en el DOM', () => {
    render(<Harness />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('TCW-27 CA2: al abrir el foco queda dentro del panel', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const dialog = await openPanel(user);
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it('TCW-27 CA2: el foco queda atrapado: Tab desde el último control vuelve al primero y Shift+Tab al revés', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const dialog = await openPanel(user);
    const focusables = Array.from(dialog.querySelectorAll<HTMLElement>('button, input, [tabindex]:not([tabindex="-1"])'));
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    last.focus();
    await user.tab();
    expect(document.activeElement).toBe(first);
    first.focus();
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(last);
    for (let i = 0; i < 12; i += 1) {
      await user.tab();
      expect(dialog.contains(document.activeElement)).toBe(true);
    }
  });

  it('TCW-27 CA2: Esc cierra el panel y el foco vuelve al botón que lo abrió', async () => {
    const user = userEvent.setup();
    const onClosed = vi.fn();
    render(<Harness onClosed={onClosed} />);
    await openPanel(user);
    await user.keyboard('{Escape}');
    expect(onClosed).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'abrir' }));
  });

  it('TCW-27 CA2: Cancelar también devuelve el foco al disparador', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await openPanel(user);
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'abrir' }));
  });

  it.each([
    ['Cmd+Enter', '{Meta>}{Enter}{/Meta}'],
    ['Ctrl+Enter', '{Control>}{Enter}{/Control}'],
  ])('TCW-27 CA2: %s guarda (onSubmit una vez) incluso con el foco en un campo', async (_n, keys) => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} />);
    await openPanel(user);
    await user.click(screen.getByRole('textbox', { name: 'Concepto' }));
    await user.keyboard(keys);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('TCW-27 CA2: Enter solo (sin Cmd/Ctrl) no guarda', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} />);
    await openPanel(user);
    await user.click(screen.getByRole('textbox', { name: 'Concepto' }));
    await user.keyboard('{Enter}');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('TCW-27 CA2: el fondo no hace scroll mientras está abierto y se restaura al cerrar', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    expect(document.body.style.overflow).toBe('');
    await openPanel(user);
    expect(document.body.style.overflow).toBe('hidden');
    await user.keyboard('{Escape}');
    expect(document.body.style.overflow).toBe('');
  });

  it('TCW-27 CA2: con prefers-reduced-motion el panel lo declara (data-reduced-motion)', async () => {
    mockMedia({ desktop: true, reduced: true });
    const user = userEvent.setup();
    render(<Harness />);
    const dialog = await openPanel(user);
    expect(dialog).toHaveAttribute('data-reduced-motion', 'true');
  });

  it('TCW-27 CA2: sin prefers-reduced-motion el panel no lo declara', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const dialog = await openPanel(user);
    expect(dialog).toHaveAttribute('data-reduced-motion', 'false');
  });
});
