// TCW-27 CA7 (columna de acciones propia, prueba de estructura) y CA2 (fila editada resaltada).
//
// CONTRATO PARA EL CONSTRUCTOR
//   InstTable (src/components/molecules/Inst/InstBlocks.tsx) añade props opcionales:
//     rowActions?: ReactNode[]   un nodo por fila. Si se pasa, la tabla agrega UNA columna final: un <th scope="col">
//                                 con texto accesible "Acciones" (visible solo para lectores) y, por fila, un <td
//                                 data-cell="actions"> que contiene ese nodo. Esa celda existe en todas las filas
//                                 (reservada siempre, la tabla no salta) aunque el nodo sea null.
//     editingRow?: number        índice de la fila en edición: su <tr> lleva data-editing="true".
//   instDesk.tsx exporta RowActions({ actions: RowAction[] }): los botones de acción de fila (sin envoltorio posicionado).
//   InstBlocks.module.css: .tdActions con ancho fijo en px; .trEditing con background: var(--surface) y
//   box-shadow/border-left de 2px var(--violet).
//   instDesk.module.css: ya no hay `position: absolute` en .acts ni existe .cellEnd; las acciones están en opacity: 0
//   (reservan espacio) y pasan a opacity: 1 con tr:hover y tr:focus-within.
//   Deudas, Recurrentes, Subcategorías y Planeados usan estas mismas piezas (ninguna importa CellWithActions).
import { listDir, readSrc } from '../../../../tests/helpers/readSrc';
import { render, screen, within } from '@testing-library/react';
import { InstTable } from './InstBlocks';
import { RowActions } from '../../pages/TransactionsPage/instDesk';

const deskCss = readSrc('src/components/pages/TransactionsPage/instDesk.module.css');
const tableCss = readSrc('src/components/molecules/Inst/InstBlocks.module.css');

const HEADS = ['Fecha', 'Concepto', 'Categoría', 'Origen', 'Estado', 'Monto'];
const row = (concept: string, amount: string) => ['20 nov', concept, 'Entretenimiento', 'Correo', 'Confirmado', amount];

const renderTable = (extra: Record<string, unknown> = {}) =>
  render(
    <InstTable
      heads={HEADS}
      rows={[row('Netflix', '−78.000'), row('Spotify', '−17.000')]}
      aligns={['left', 'left', 'left', 'left', 'left', 'right']}
      rowActions={[
        <RowActions key="a" actions={[{ label: 'Editar', onClick: () => {} }, { label: 'Borrar', danger: true, onClick: () => {} }]} />,
        <RowActions key="b" actions={[{ label: 'Editar', onClick: () => {} }]} />,
      ]}
      {...extra}
    />,
  );

describe('InstTable: columna de acciones (CA7)', () => {
  it('TCW-27 CA7: hay una columna extra de encabezado "Acciones" y cada fila tiene una celda más que columnas de datos', () => {
    renderTable();
    expect(screen.getAllByRole('columnheader')).toHaveLength(HEADS.length + 1);
    expect(screen.getByRole('columnheader', { name: 'Acciones' })).toBeInTheDocument();
    for (const tr of screen.getAllByRole('row').slice(1)) {
      expect(within(tr).getAllByRole('cell')).toHaveLength(HEADS.length + 1);
    }
  });

  it('TCW-27 CA7: las acciones están en su propia celda final (data-cell="actions"), nunca en la celda del monto ni de Estado/Origen', () => {
    renderTable();
    const [netflix] = screen.getAllByRole('row').slice(1);
    const cells = within(netflix).getAllByRole('cell');
    const actionsCell = cells[cells.length - 1];
    expect(actionsCell).toHaveAttribute('data-cell', 'actions');
    const edit = within(netflix).getByRole('button', { name: 'Editar' });
    expect(actionsCell).toContainElement(edit);
    expect(edit.closest('td')).toBe(actionsCell);
    // Ninguna de las celdas de datos contiene botones.
    for (const c of cells.slice(0, -1)) expect(within(c).queryAllByRole('button')).toHaveLength(0);
    // El monto, Estado y Origen conservan su texto en su propia celda.
    expect(cells[5]).toHaveTextContent('−78.000');
    expect(cells[4]).toHaveTextContent('Confirmado');
    expect(cells[3]).toHaveTextContent('Correo');
  });

  it('TCW-27 CA7: la celda de acciones se reserva aunque la fila no tenga acciones (la tabla no salta)', () => {
    render(
      <InstTable heads={HEADS} rows={[row('Netflix', '−78.000'), row('Spotify', '−17.000')]} rowActions={[<RowActions key="a" actions={[]} />, null]} />,
    );
    for (const tr of screen.getAllByRole('row').slice(1)) {
      expect(tr.querySelector('td[data-cell="actions"]')).not.toBeNull();
    }
  });

  it('TCW-27 CA7: sin rowActions la tabla no agrega columna (resto de tablas sin cambios)', () => {
    render(<InstTable heads={HEADS} rows={[row('Netflix', '−78.000')]} />);
    expect(screen.getAllByRole('columnheader')).toHaveLength(HEADS.length);
  });

  it('TCW-27 CA7: CSS: sin position:absolute en las acciones, ancho fijo para la columna, invisibles hasta hover o foco', () => {
    expect(deskCss).not.toMatch(/\.cellEnd\b/);
    const acts = deskCss.match(/\.acts\s*\{[^}]*\}/)?.[0] ?? '';
    expect(acts).not.toMatch(/position:\s*absolute/);
    expect(acts).toMatch(/opacity:\s*0/);
    expect(deskCss).toMatch(/tr\)?:hover\s+\.acts/);
    expect(deskCss).toMatch(/tr\)?:focus-within\s+\.acts/);
    expect(tableCss).toMatch(/\.tdActions\s*\{[^}]*width:\s*\d+px/);
  });

  it('TCW-27 CA7: las páginas de Deudas, Recurrentes, Subcategorías y Planeados no usan el CellWithActions flotante', () => {
    const pages = 'src/components/pages';
    const offenders: string[] = [];
    for (const dir of listDir(pages)) {
      const files = listDir(`${pages}/${dir}`).filter((f) => f.endsWith('.tsx') && !f.endsWith('.test.tsx'));
      for (const f of files) {
        if (readSrc(`${pages}/${dir}/${f}`).includes('CellWithActions')) offenders.push(`${dir}/${f}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe('InstTable: fila en edición (CA2)', () => {
  it('TCW-27 CA2: la fila editada lleva data-editing="true" y las demás no', () => {
    renderTable({ editingRow: 1 });
    const [a, b] = screen.getAllByRole('row').slice(1);
    expect(a).not.toHaveAttribute('data-editing');
    expect(b).toHaveAttribute('data-editing', 'true');
  });

  it('TCW-27 CA2: CSS de la fila editada: --surface y filete violeta de 2 px', () => {
    const rule = tableCss.match(/\.trEditing\s*\{[^}]*\}/)?.[0] ?? '';
    expect(rule).toMatch(/var\(--surface\)/);
    expect(rule).toMatch(/2px[^;]*var\(--violet\)/);
  });
});
