// TCW-27 CA4 (asistentes) y CA5 (confirmación destructiva). Modal centrado único de escritorio.
//
// CONTRATO PARA EL CONSTRUCTOR
//   Módulo:  src/components/organisms/CenteredModal/CenteredModal.tsx (+ index.ts que re-exporta `CenteredModal`),
//            CenteredModal.module.css (solo tokens, sin hex).
//   Props comunes: isOpen: boolean; variant: 'wizard' | 'confirm'; title: string; origin?: string (línea mono);
//            onClose: () => void; children.
//   variant="wizard" (680 px): steps: Array<{ id: string; label: string }>; currentStep: number (índice 0-based);
//            onBack?: () => void; backLabel?: string (por defecto "← paso anterior"; el botón no existe si no hay onBack);
//            onPrimary: () => void; primaryLabel: string.
//   variant="confirm" (420 px): confirmLabel: string; cancelLabel: string; onConfirm: () => void; consequence: string;
//            `children` es lo que se va a borrar (la celda de categoría y el monto).
//   DOM:     portal en document.body; role="dialog" (wizard) o role="alertdialog" (confirm), aria-modal="true", nombre
//            accesible = título, data-testid="centered-modal". Cabecera con <kbd>Esc</kbd>. Barra de pasos: <ol
//            aria-label="Pasos"> con un <li> por paso, data-state="done" | "current" | "pending" (el actual además
//            aria-current="step"), cada uno con un segmento [data-segment] y el nombre del paso.
//            Botón de eliminar de la confirmación con data-tone="danger". La consecuencia va en un <p data-consequence>.
//   Efectos: Esc llama onClose; foco atrapado como en SidePanel; el foco vuelve al disparador; en confirm el foco inicial
//            cae en Cancelar (no en Eliminar); body sin scroll mientras está abierto.
//   CSS:     CenteredModal.module.css: wizard width: 680px; confirm width: 420px; border-radius: 14px; background:
//            var(--surface); velo 60%; position: fixed; segmento height: 3px; nombre de paso font-size: 11px.
import { useState } from 'react';
import { readSrc } from '../../../../tests/helpers/readSrc';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CenteredModal } from './CenteredModal';

const css = readSrc('src/components/organisms/CenteredModal/CenteredModal.module.css');

const STEPS = {
  es: [{ id: 'ingresos', label: 'Ingresos' }, { id: 'gavetas', label: 'Gavetas' }, { id: 'revision', label: 'Revisión' }],
  en: [{ id: 'income', label: 'Income' }, { id: 'drawers', label: 'Drawers' }, { id: 'review', label: 'Review' }],
} as const;

const Wizard = ({ lang = 'es', current = 1, onBack, onPrimary = () => {} }: {
  lang?: 'es' | 'en'; current?: number; onBack?: () => void; onPrimary?: () => void;
}) => (
  <CenteredModal
    isOpen variant="wizard" title={lang === 'es' ? 'Presupuesto mensual' : 'Monthly budget'}
    origin="paso a paso · 3 pasos" steps={[...STEPS[lang]]} currentStep={current}
    onClose={() => {}} onBack={onBack} backLabel={lang === 'es' ? '← paso anterior' : '← previous step'}
    onPrimary={onPrimary} primaryLabel={lang === 'es' ? 'Continuar' : 'Continue'}
  >
    <p>fila de categoría</p>
  </CenteredModal>
);

const ConfirmHarness = ({ lang = 'es', onConfirm = () => {}, onClosed = () => {} }: {
  lang?: 'es' | 'en'; onConfirm?: () => void; onClosed?: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const es = lang === 'es';
  return (
    <div>
      <button type="button" onClick={() => setOpen(true)}>borrar</button>
      <CenteredModal
        isOpen={open} variant="confirm" title={es ? 'Eliminar transacción' : 'Delete transaction'}
        confirmLabel={es ? 'Eliminar' : 'Delete'} cancelLabel={es ? 'Cancelar' : 'Cancel'}
        consequence={es ? 'Esta acción no se puede deshacer.' : 'This cannot be undone.'}
        onConfirm={onConfirm} onClose={() => { setOpen(false); onClosed(); }}
      >
        <span>Entretenimiento · Netflix</span><span>−78.000</span>
      </CenteredModal>
    </div>
  );
};

const openConfirm = async (user: ReturnType<typeof userEvent.setup>) => {
  const t = screen.getByRole('button', { name: 'borrar' });
  t.focus();
  await user.click(t);
  return screen.getByRole('alertdialog');
};

describe('CenteredModal wizard: CA4', () => {
  it.each(['es', 'en'] as const)('TCW-27 CA4: role=dialog, aria-modal, título, línea mono y tecla Esc (%s)', (lang) => {
    render(<Wizard lang={lang} />);
    const d = screen.getByRole('dialog', { name: lang === 'es' ? 'Presupuesto mensual' : 'Monthly budget' });
    expect(d).toHaveAttribute('aria-modal', 'true');
    expect(within(d).getByText('paso a paso · 3 pasos')).toBeInTheDocument();
    expect(within(d).getByText('Esc')).toBeInTheDocument();
  });

  it.each(['es', 'en'] as const)('TCW-27 CA4: barra de pasos con hecho / actual / pendiente y el nombre de cada paso (%s)', (lang) => {
    render(<Wizard lang={lang} current={1} />);
    const bar = screen.getByRole('list', { name: 'Pasos' });
    const items = within(bar).getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(items.map((i) => i.getAttribute('data-state'))).toEqual(['done', 'current', 'pending']);
    expect(items[1]).toHaveAttribute('aria-current', 'step');
    expect(items[0]).not.toHaveAttribute('aria-current');
    STEPS[lang].forEach((s, i) => {
      expect(items[i]).toHaveTextContent(s.label);
      expect(items[i].querySelector('[data-segment]')).not.toBeNull();
    });
  });

  it('TCW-27 CA4: en el primer paso ninguno está hecho; en el último todos los anteriores sí', () => {
    const { unmount } = render(<Wizard current={0} />);
    expect(screen.getAllByRole('listitem').map((i) => i.getAttribute('data-state'))).toEqual(['current', 'pending', 'pending']);
    unmount();
    render(<Wizard current={2} />);
    expect(screen.getAllByRole('listitem').map((i) => i.getAttribute('data-state'))).toEqual(['done', 'done', 'current']);
  });

  it.each(['es', 'en'] as const)('TCW-27 CA4: pie con "← paso anterior" y el principal; ambos actúan (%s)', async (lang) => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    const onPrimary = vi.fn();
    render(<Wizard lang={lang} onBack={onBack} onPrimary={onPrimary} />);
    await user.click(screen.getByRole('button', { name: lang === 'es' ? '← paso anterior' : '← previous step' }));
    await user.click(screen.getByRole('button', { name: lang === 'es' ? 'Continuar' : 'Continue' }));
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(onPrimary).toHaveBeenCalledTimes(1);
  });

  it('TCW-27 CA4: sin onBack (primer paso) no hay botón de paso anterior', () => {
    render(<Wizard current={0} />);
    expect(screen.queryByRole('button', { name: '← paso anterior' })).toBeNull();
  });

  it('TCW-27 CA4: la hoja de estilos fija 680 px, radio 14, --surface, velo 60 %, fixed y segmentos de 3 px con nombre de 11 px', () => {
    expect(css).toMatch(/width:\s*680px/);
    expect(css).toMatch(/border-radius:\s*14px/);
    expect(css).toMatch(/background:\s*var\(--surface\)/);
    expect(css).toMatch(/60%/);
    expect(css).toMatch(/position:\s*fixed/);
    expect(css).toMatch(/height:\s*3px/);
    expect(css).toMatch(/font-size:\s*11px/);
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});

describe('CenteredModal confirm: CA5', () => {
  it.each(['es', 'en'] as const)('TCW-27 CA5: caja de confirmación con lo que se borra, la consecuencia y Cancelar / Eliminar (%s)', async (lang) => {
    const user = userEvent.setup();
    render(<ConfirmHarness lang={lang} />);
    const d = await openConfirm(user);
    const es = lang === 'es';
    expect(d).toHaveAttribute('aria-modal', 'true');
    expect(d).toHaveAccessibleName(es ? 'Eliminar transacción' : 'Delete transaction');
    expect(within(d).getByText('Entretenimiento · Netflix')).toBeInTheDocument();
    expect(within(d).getByText('−78.000')).toBeInTheDocument();
    expect(d.querySelector('[data-consequence]')).toHaveTextContent(es ? 'Esta acción no se puede deshacer.' : 'This cannot be undone.');
    expect(within(d).getByRole('button', { name: es ? 'Cancelar' : 'Cancel' })).toBeInTheDocument();
    expect(within(d).getByRole('button', { name: es ? 'Eliminar' : 'Delete' })).toHaveAttribute('data-tone', 'danger');
  });

  it('TCW-27 CA5: Eliminar confirma una vez; Cancelar no confirma y devuelve el foco al disparador', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<ConfirmHarness onConfirm={onConfirm} />);
    await openConfirm(user);
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'borrar' }));
    await openConfirm(user);
    await user.click(screen.getByRole('button', { name: 'Eliminar' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('TCW-27 CA5: Esc cierra sin confirmar y el foco inicial está en Cancelar, no en Eliminar', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onClosed = vi.fn();
    render(<ConfirmHarness onConfirm={onConfirm} onClosed={onClosed} />);
    const d = await openConfirm(user);
    expect(document.activeElement).toBe(within(d).getByRole('button', { name: 'Cancelar' }));
    await user.keyboard('{Escape}');
    expect(onClosed).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  it('TCW-27 CA5: no usa window.confirm ni window.alert nativos', async () => {
    const user = userEvent.setup();
    const c = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const a = vi.spyOn(window, 'alert').mockImplementation(() => {});
    render(<ConfirmHarness />);
    await openConfirm(user);
    await user.click(screen.getByRole('button', { name: 'Eliminar' }));
    expect(c).not.toHaveBeenCalled();
    expect(a).not.toHaveBeenCalled();
  });

  it('TCW-27 CA5: la hoja de estilos fija la confirmación en 420 px', () => {
    expect(css).toMatch(/width:\s*420px/);
  });
});
