import type { KeyboardEvent, ReactNode } from 'react';
import { Eyebrow, InstButton } from '../../atoms/Inst';
import styles from './InstBlocks.module.css';

// TCW-5 "Instrumento": tabla, bloque de cifras, sección, fila clave-valor, encabezado de página y estados.

export type Align = 'left' | 'right';

export interface InstTableProps {
  heads: ReactNode[];
  rows: ReactNode[][];
  aligns?: Align[];
  caption?: string;
  rowKeys?: Array<string | number>;
  onRowClick?: (index: number) => void;
  /** Un nodo por fila. Agrega una columna final propia ("Acciones", ancho fijo, siempre reservada). */
  rowActions?: ReactNode[];
  /** Índice de la fila en edición (resaltada). */
  editingRow?: number;
  /** Columna del nombre (con NameCell): cede ancho y recorta con puntos suspensivos en vez de partirse en dos líneas. */
  nameCol?: number;
}

export const InstTable = ({ heads, rows, aligns, caption, rowKeys, onRowClick, rowActions, editingRow, nameCol }: InstTableProps) => {
  const al = (i: number) => styles[aligns?.[i] ?? 'left'];
  const key = (e: KeyboardEvent, i: number) => {
    if (onRowClick && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onRowClick(i); }
  };
  return (
    <table className={styles.table}>
      {caption ? <caption className="sr-only" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>{caption}</caption> : null}
      <thead><tr>{heads.map((h, i) => <th key={i} scope="col" className={`${styles.th} ${al(i)}`}>{h}</th>)}{rowActions ? <th scope="col" className={styles.thActions}><span className={styles.srOnly}>Acciones</span></th> : null}</tr></thead>
      <tbody>
        {rows.map((r, ri) => (
          <tr key={rowKeys?.[ri] ?? ri} className={`${styles.tr} ${onRowClick ? styles.trClick : ''} ${editingRow === ri ? styles.trEditing : ''}`.trim()}
            data-editing={editingRow === ri ? 'true' : undefined}
            tabIndex={onRowClick ? 0 : undefined} onClick={onRowClick ? () => onRowClick(ri) : undefined}
            onKeyDown={onRowClick ? (e) => key(e, ri) : undefined}>
            {r.map((c, ci) => <td key={ci} className={`${styles.td} ${al(ci)} ${ci === nameCol ? styles.tdName : ''}`.trim()}>{c}</td>)}
            {rowActions ? <td data-cell="actions" className={styles.tdActions}>{rowActions[ri] ?? null}</td> : null}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

/** Esqueleto de tabla mientras carga: mismos encabezados, filas grises. */
export const InstTableSkeleton = ({ heads, aligns, rows = 5, withActions, nameCol }: { heads: ReactNode[]; aligns?: Align[]; rows?: number; withActions?: boolean; nameCol?: number }) => (
  <div aria-busy="true" aria-label="Cargando">
    <InstTable heads={heads} aligns={aligns} nameCol={nameCol}
      rowActions={withActions ? Array.from({ length: rows }, () => null) : undefined}
      rows={Array.from({ length: rows }, () => heads.map((_, i) => (
        <span className={styles.skel} style={{ width: `${[40, 70, 55, 45, 35, 50][i % 6]}%`, marginLeft: aligns?.[i] === 'right' ? 'auto' : undefined }} />
      )))} />
  </div>
);

export const InstStats = ({ items }: { items: Array<{ label: ReactNode; value: ReactNode; sub?: ReactNode }> }) => (
  <div className={styles.stats}>
    {items.map((it, i) => (
      <div key={i} className={styles.stat}>
        <Eyebrow>{it.label}</Eyebrow>
        <div className={styles.statVal}>{it.value}</div>
        {it.sub != null ? <div className={styles.statSub}>{it.sub}</div> : null}
      </div>
    ))}
  </div>
);

export const InstSection = ({ title, right, children, id }: { title: ReactNode; right?: ReactNode; children: ReactNode; id?: string }) => (
  <section className={styles.section} aria-labelledby={id}>
    <div className={`${styles.secHead} ${right ? styles.secHeadActions : ''}`}>
      <h2 id={id} style={{ margin: 0, fontWeight: 400, lineHeight: 1 }}><Eyebrow>{title}</Eyebrow></h2>
      {right ? <span className={styles.secRight}>{right}</span> : null}
    </div>
    {children}
  </section>
);

export const InstKeyValue = ({ rows }: { rows: Array<{ k: ReactNode; v: ReactNode; action?: ReactNode }> }) => (
  <div>
    {rows.map((r, i) => (
      <div key={i} className={styles.kv}>
        <span className={styles.kvKey}>{r.k}</span>
        <span>{r.v}</span>
        <span className={styles.kvAct}>{r.action}</span>
      </div>
    ))}
  </div>
);

export const InstPageHeader = ({ title, sub, actions }: { title: ReactNode; sub?: ReactNode; actions?: ReactNode }) => (
  <div className={styles.pageHead}>
    <div>
      <h1 className={styles.h1}>{title}</h1>
      {sub ? <p className={styles.pageSub}>{sub}</p> : null}
    </div>
    <div className={styles.pageActions}>{actions}</div>
  </div>
);

/** Una línea de la página separada por un filete (selector de mes, estado general…). */
export const InstBand = ({ children }: { children: ReactNode }) => <div className={styles.bandLine}>{children}</div>;

/** Vacío, sin datos o error: una línea con el mismo lenguaje, nunca una tarjeta. */
export const InstNote = ({ children, error, onRetry }: { children: ReactNode; error?: boolean; onRetry?: () => void }) => (
  <p className={`${styles.note} ${error ? styles.noteBad : ''}`} role={error ? 'alert' : undefined}>
    {children}
    {onRetry ? <InstButton className={styles.retry} onClick={onRetry}>Reintentar</InstButton> : null}
  </p>
);
