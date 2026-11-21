// TCW-27 (pulido) CA1: el nombre del movimiento vuelve a una sola línea (nowrap + ellipsis) con title del texto completo.
//
// CONTRATO PARA EL CONSTRUCTOR
//   src/components/atoms/Inst exporta `NameCell({ children: string })`: un <span> con la clase `nameCell` y
//   title={children} (el texto completo). Inst.module.css: `.nameCell` con white-space: nowrap, text-overflow: ellipsis,
//   overflow: hidden, min-width: 0 y display: block (o inline-block) con max-width: 100%.
//   TransactionsPage (txRows), DebtsPage, RecurringObligationsPage, SubcategoriesPage y PlannedExpensesPage usan NameCell
//   para la columna del nombre; ya no queda el <span style={{ fontWeight: 500 }}> suelto con el concepto.
import { render, screen } from '@testing-library/react';
import { readSrc } from '../../../../tests/helpers/readSrc';
import * as Inst from './index';

const css = readSrc('src/components/atoms/Inst/Inst.module.css');
const LONG = 'Compra Tarjeta Crédito ****7248 - BOLD / SA*ahumao c';

describe('NameCell (CA1)', () => {
  it('TCW-27 CA1: el nombre largo se renderiza en un solo elemento con la clase nameCell y title con el texto completo', () => {
    const NameCell = (Inst as Record<string, unknown>).NameCell as ((p: { children: string }) => JSX.Element) | undefined;
    expect(NameCell, 'atoms/Inst debe exportar NameCell').toBeTypeOf('function');
    render(<NameCell>{LONG}</NameCell>);
    const el = screen.getByText(LONG);
    expect(el).toHaveAttribute('title', LONG);
    expect(el.className).toMatch(/nameCell/);
  });

  it('TCW-27 CA1: CSS de .nameCell: white-space nowrap, text-overflow ellipsis, overflow hidden, min-width 0', () => {
    const rule = css.match(/\.nameCell\s*\{[^}]*\}/)?.[0] ?? '';
    expect(rule).toMatch(/white-space:\s*nowrap/);
    expect(rule).toMatch(/text-overflow:\s*ellipsis/);
    expect(rule).toMatch(/overflow:\s*hidden/);
    expect(rule).toMatch(/min-width:\s*0/);
  });
});

describe('Páginas con tabla usan NameCell para el nombre (CA1)', () => {
  it.each([
    ['Transacciones', 'src/components/pages/TransactionsPage/TransactionsPage.tsx'],
    ['Deudas', 'src/components/pages/DebtsPage/DebtsPage.tsx'],
    ['Recurrentes', 'src/components/pages/RecurringObligationsPage/RecurringObligationsPage.tsx'],
    ['Subcategorías', 'src/components/pages/SubcategoriesPage/SubcategoriesPage.tsx'],
    ['Planeados', 'src/components/pages/PlannedExpensesPage/PlannedExpensesPage.tsx'],
  ])('TCW-27 CA1: %s importa y usa <NameCell>', (_n, file) => {
    const src = readSrc(file);
    expect(src).not.toBe('');
    expect(src).toMatch(/\bNameCell\b[^\n]*from|import[^;]*\bNameCell\b/);
    expect(src).toMatch(/<NameCell[\s>]/);
  });

  it('TCW-27 CA1: Transacciones ya no deja el concepto en un span con fontWeight 500 sin nowrap', () => {
    const src = readSrc('src/components/pages/TransactionsPage/TransactionsPage.tsx');
    expect(src).not.toMatch(/<span style=\{\{ fontWeight: 500 \}\}>\{transaction\.attributes\.concept\}<\/span>/);
  });
});
