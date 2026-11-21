// TCW-27 (pulido) CA1: la columna de acciones mide solo lo que ocupan sus botones (<= 150 px) y el esqueleto la reserva.
//
// CONTRATO PARA EL CONSTRUCTOR
//   InstBlocks.module.css: .thActions y .tdActions con width (y min/max-width si existen) <= 150px.
//   InstTableSkeleton acepta la prop opcional `withActions?: boolean`; con ella renderiza la MISMA columna final que
//   InstTable con rowActions: un <th scope="col"> "Acciones" (clase thActions) y, por fila, un <td data-cell="actions">
//   (clase tdActions). TransactionsPage pasa `withActions` a su InstTableSkeleton.
import { render, screen, within } from '@testing-library/react';
import { readSrc } from '../../../../tests/helpers/readSrc';
import { InstTable, InstTableSkeleton } from './InstBlocks';

const css = readSrc('src/components/molecules/Inst/InstBlocks.module.css');
const HEADS = ['Fecha', 'Concepto', 'Monto'];
const rule = (sel: string) => css.match(new RegExp(`(?:^|[\\s,}])${sel.replace('.', '\\.')}\\s*[,{][^}]*\\}`, 'm'))?.[0] ?? '';
const px = (decl: string, prop: string) => {
  const m = decl.match(new RegExp(`(?:^|[;{\\s])${prop}:\\s*(\\d+)px`));
  return m ? Number(m[1]) : null;
};

describe('Columna de acciones angosta (CA1)', () => {
  it.each(['.thActions', '.tdActions'])('TCW-27 CA1: %s tiene width fijo <= 150px (hoy 260px), y min/max-width tampoco lo superan', (sel) => {
    const r = rule(sel);
    expect(r).not.toBe('');
    const width = px(r, 'width');
    expect(width).not.toBeNull();
    expect(width as number).toBeLessThanOrEqual(150);
    for (const p of ['min-width', 'max-width']) {
      const v = px(r, p);
      if (v !== null) expect(v).toBeLessThanOrEqual(150);
    }
  });

  it('TCW-27 CA1: InstTableSkeleton con withActions reserva la misma columna final que InstTable (encabezado "Acciones" y una celda por fila)', () => {
    const { container } = render(<InstTableSkeleton heads={HEADS} rows={3} {...({ withActions: true } as object)} />);
    expect(within(container).getAllByRole('columnheader')).toHaveLength(HEADS.length + 1);
    expect(within(container).getByRole('columnheader', { name: 'Acciones' })).toBeInTheDocument();
    for (const tr of within(container).getAllByRole('row').slice(1)) {
      expect(within(tr).getAllByRole('cell')).toHaveLength(HEADS.length + 1);
      expect(tr.querySelector('td[data-cell="actions"]')).not.toBeNull();
    }
  });

  it('TCW-27 CA1: la columna del esqueleto usa las mismas clases (mismo ancho) que la de InstTable', () => {
    const skel = render(<InstTableSkeleton heads={HEADS} rows={1} {...({ withActions: true } as object)} />).container;
    const real = render(<InstTable heads={HEADS} rows={[['a', 'b', 'c']]} rowActions={[<span key="x">x</span>]} />).container;
    const skelTh = skel.querySelector('th:last-child');
    const realTh = real.querySelector('th:last-child');
    const skelTd = skel.querySelector('td[data-cell="actions"]');
    const realTd = real.querySelector('td[data-cell="actions"]');
    expect(skelTh).not.toBeNull();
    expect(skelTd).not.toBeNull();
    expect(skelTh?.className).toBe(realTh?.className);
    expect(skelTd?.className).toBe(realTd?.className);
    expect(skelTh?.getAttribute('style') ?? '').toBe(realTh?.getAttribute('style') ?? '');
  });

  it('TCW-27 CA1: sin withActions el esqueleto no agrega columna (tablas sin acciones)', () => {
    render(<InstTableSkeleton heads={HEADS} rows={2} />);
    expect(screen.getAllByRole('columnheader')).toHaveLength(HEADS.length);
  });

  it('TCW-27 CA1: TransactionsPage pasa withActions a su InstTableSkeleton (la tabla no salta al cargar)', () => {
    const src = readSrc('src/components/pages/TransactionsPage/TransactionsPage.tsx');
    expect(src).toMatch(/<InstTableSkeleton[^>]*\bwithActions\b/);
  });

  it.each([
    ['DebtsPage', 'src/components/pages/DebtsPage/DebtsPage.tsx'],
  ])('TCW-27 CA1: %s también pasa withActions al esqueleto si lo usa', (_n, file) => {
    const src = readSrc(file);
    const uses = src.match(/<InstTableSkeleton[^>]*>/g) ?? [];
    for (const tag of uses) expect(tag).toMatch(/\bwithActions\b/);
  });
});
