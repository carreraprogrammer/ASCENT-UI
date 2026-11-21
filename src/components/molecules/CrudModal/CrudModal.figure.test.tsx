// TCW-27 (pulido) CA2: el monto sale UNA vez en el panel: la cifra grande de arriba ES el campo editable.
//
// CONTRATO PARA EL CONSTRUCTOR (escritorio; móvil y Capacitor no cambian)
//   Se prueba con la misma composición que hacen las páginas: <CrudModal figure={{ label, value }}> con el composer
//   dentro. Con `figure` el panel renderiza la cifra como un <input> editable dentro de data-testid="panel-figure"
//   (accessible name = figure.label, mono 34 px), con el signo como texto aparte ("−" para Gasto, sin "−" para Ingreso)
//   y el valor con punto de miles ("78.000", y al escribir 1234567 -> "1.234.567").
//   Ese campo ES el monto del composer (TransactionComposer) o el saldo (DebtComposer): al guardar, el payload lleva el
//   número escrito. El composer, dentro del panel, ya no muestra su fila "Monto" / "Saldo actual" ni la etiqueta
//   "Concepto"; el Concepto queda como campo a todo ancho (aria-label "Concepto") debajo de la cifra.
//   Fuera del panel (composer suelto) la fila Monto se conserva: TransactionComposer.desktop.test.tsx sigue válido.
//   DebtsPage pasa `figure` (saldo) a su CrudModal de deudas.
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TX_78000 } from '../../../../tests/fixtures/transaction';
import { DEBT_1500000 } from '../../../../tests/fixtures/debt';
import { readSrc } from '../../../../tests/helpers/readSrc';

vi.hoisted(async () => (await import('../../../test/stubMatchMedia')).stubMatchMedia());
import { mockMedia } from '../../../../tests/helpers/media';

vi.mock('@ionic/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@ionic/react')>();
  return { ...actual, isPlatform: (p: string) => (p === 'capacitor' ? false : actual.isPlatform(p as never)) };
});

import { CrudModal } from './CrudModal';
import { TransactionComposer } from '../../organisms/TransactionComposer';
import { DebtComposer } from '../../organisms/DebtComposer';
import type { Transaction } from '../../../types/finance.types';

beforeEach(() => { mockMedia({ desktop: true }); });

const TX = {
  es: { title: 'Editar transacción', label: 'MONTO', save: 'Guardar cambios', cancel: 'Cancelar', del: 'Eliminar' },
  en: { title: 'Edit transaction', label: 'AMOUNT', save: 'Save changes', cancel: 'Cancel', del: 'Delete' },
} as const;
const DEBT = {
  es: { title: 'Editar deuda', label: 'SALDO', save: 'Guardar cambios', cancel: 'Cancelar', del: 'Eliminar' },
  en: { title: 'Edit debt', label: 'BALANCE', save: 'Save changes', cancel: 'Cancel', del: 'Delete' },
} as const;

const renderTx = (lang: 'es' | 'en', tx: Transaction = TX_78000, onUpdate = vi.fn(async () => {})) => {
  const t = TX[lang];
  const sign = tx.attributes.transaction_type === 'income' ? '+78.000' : '−78.000';
  render(
    <CrudModal isOpen title={t.title} onClose={() => {}} figure={{ label: t.label, value: sign }}
      submitLabel={t.save} cancelLabel={t.cancel} deleteLabel={t.del} onSubmit={undefined}>
      <TransactionComposer transaction={tx} categories={[]} onCreate={async () => {}} onUpdate={onUpdate} />
    </CrudModal>,
  );
  return { dialog: screen.getByRole('dialog'), onUpdate, t };
};

describe.each(['es', 'en'] as const)('Panel de transacción: un solo campo de monto (%s)', (lang) => {
  it(`TCW-27 CA2: la cifra grande es un campo editable con el monto 78.000 y el signo "−" del Gasto (${lang})`, () => {
    const { dialog, t } = renderTx(lang);
    const figure = within(dialog).getByTestId('panel-figure');
    const input = within(figure).getByRole('textbox', { name: t.label });
    expect(input).toHaveValue('78.000');
    expect(figure).toHaveTextContent('−');
  });

  it(`TCW-27 CA2: en todo el panel hay exactamente un campo de monto: sin fila "Monto" (${lang})`, () => {
    const { dialog } = renderTx(lang);
    const amountFields = within(dialog).queryAllByRole('textbox').filter((el) => /monto|amount/i.test(el.getAttribute('aria-label') ?? '') || /monto|amount/i.test(el.id) || (el as HTMLInputElement).name === 'transaction-amount');
    expect(amountFields).toHaveLength(1);
    expect(within(dialog).queryAllByRole('textbox', { name: /monto|amount/i })).toHaveLength(1);
    expect(dialog.querySelector('label[for="transaction-amount"]')).toBeNull();
  });

  it(`TCW-27 CA2: Ingreso no lleva el signo "−" en la cifra (${lang})`, () => {
    const income: Transaction = { ...TX_78000, attributes: { ...TX_78000.attributes, transaction_type: 'income' } };
    const { dialog } = renderTx(lang, income);
    expect(within(dialog).getByTestId('panel-figure')).not.toHaveTextContent('−');
  });

  it(`TCW-27 CA2: se escribe en la cifra con punto de miles y el guardado manda ese monto (${lang})`, async () => {
    const user = userEvent.setup();
    const { dialog, onUpdate, t } = renderTx(lang);
    const input = within(within(dialog).getByTestId('panel-figure')).getByRole('textbox', { name: t.label });
    await user.clear(input);
    await user.type(input, '1234567');
    expect(input).toHaveValue('1.234.567');
    await user.click(within(dialog).getByRole('button', { name: new RegExp(t.save) }));
    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(onUpdate).toHaveBeenCalledWith('27', expect.objectContaining({ amount: 1234567, concept: 'Netflix' }));
  });

  it(`TCW-27 CA2: Concepto va sin etiqueta, a todo ancho, debajo de la cifra, y no hay fila "Concepto" (${lang})`, () => {
    const { dialog, t } = renderTx(lang);
    expect(Array.from(dialog.querySelectorAll('label')).filter((l) => l.textContent?.trim().startsWith('Concepto'))).toHaveLength(0);
    const concept = within(dialog).getByRole('textbox', { name: 'Concepto' });
    expect(concept).toHaveValue('Netflix');
    const figure = within(dialog).getByTestId('panel-figure');
    expect(figure.compareDocumentPosition(concept) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // No vive en la rejilla de filas de dos columnas (etiqueta 112 px + control).
    expect(concept.closest('[class*="grid"]')).toBeNull();
    expect(t.title).toBeTruthy();
  });
});

describe.each(['es', 'en'] as const)('Panel de deuda: un solo campo de saldo (%s)', (lang) => {
  const renderDebt = (onUpdate = vi.fn(async () => {})) => {
    const t = DEBT[lang];
    render(
      <CrudModal isOpen title={t.title} onClose={() => {}} figure={{ label: t.label, value: '1.500.000' }}
        submitLabel={t.save} cancelLabel={t.cancel} deleteLabel={t.del}>
        <DebtComposer debt={DEBT_1500000} onCreate={async () => {}} onUpdate={onUpdate} />
      </CrudModal>,
    );
    return { dialog: screen.getByRole('dialog'), onUpdate, t };
  };

  it(`TCW-27 CA2: la cifra grande es el saldo editable 1.500.000 y no queda la fila "Saldo actual" (${lang})`, () => {
    const { dialog, t } = renderDebt();
    const input = within(within(dialog).getByTestId('panel-figure')).getByRole('textbox', { name: t.label });
    expect(input).toHaveValue('1.500.000');
    expect(within(dialog).queryAllByRole('textbox', { name: /saldo|balance/i })).toHaveLength(1);
    expect(dialog.querySelector('label[for="debt-current-balance"]')).toBeNull();
  });

  it(`TCW-27 CA2: escribir en la cifra cambia el saldo que se guarda (${lang})`, async () => {
    const user = userEvent.setup();
    const { dialog, onUpdate, t } = renderDebt();
    const input = within(within(dialog).getByTestId('panel-figure')).getByRole('textbox', { name: t.label });
    await user.clear(input);
    await user.type(input, '2000000');
    expect(input).toHaveValue('2.000.000');
    await user.click(within(dialog).getByRole('button', { name: new RegExp(t.save) }));
    expect(onUpdate).toHaveBeenCalledWith('d27', expect.objectContaining({ current_balance: 2000000 }));
  });
});

describe('Páginas pasan la cifra al panel (CA2)', () => {
  it('TCW-27 CA2: DebtsPage pasa figure= a un CrudModal (saldo como cifra principal)', () => {
    expect(readSrc('src/components/pages/DebtsPage/DebtsPage.tsx')).toMatch(/<CrudModal[^>]*\bfigure=/s);
  });
});
