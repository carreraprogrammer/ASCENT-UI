import type { KeyboardEvent, MouseEvent, ReactNode } from 'react';
import styles from './instDesk.module.css';

// TCW-5 "Instrumento" (escritorio): controles de página que no están en los átomos compartidos. Viven aquí y los
// importan Deudas, Recurrentes, Subcategorías y Planeados para no tocar src/components/{atoms,molecules}/Inst.

export { styles as instDeskStyles };

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

export const Chip = ({ on, onClick, children }: { on?: boolean; onClick: () => void; children: ReactNode }) => (
  <button type="button" className={cx(styles.chip, on && styles.chipOn)} aria-pressed={Boolean(on)} onClick={onClick}>{children}</button>
);

/** Selector con forma de chip ("Gaveta ▾"): la primera opción es el nombre del filtro y significa "todas". */
export const ChipSelect = ({ label, value, options, onChange }: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) => {
  const current = options.find((o) => o.value === value)?.label;
  // El chip muestra el texto; el <select> nativo, transparente, va encima (teclado y lectores de pantalla intactos).
  return (
    <span className={cx(styles.chip, styles.selChip, value && styles.chipOn)}>
      <span aria-hidden="true">{current ?? label} ▾</span>
      <select className={styles.selNative} value={value} aria-label={label} onChange={(e) => onChange(e.target.value)}>
        <option value="">{label}: todas</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </span>
  );
};

export const PlainButton = ({ onClick, disabled, children, label }: { onClick: () => void; disabled?: boolean; children: ReactNode; label?: string }) => (
  <button type="button" className={styles.plain} onClick={onClick} disabled={disabled} aria-label={label}>{children}</button>
);

/** Encabezado de columna que ordena. Sin flecha mientras el orden es el de siempre (como en el mockup). */
export const SortHead = ({ label, column, sortBy, sortDir, isDefault, onSort }: {
  label: string;
  column: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  isDefault: boolean;
  onSort: (column: string) => void;
}) => {
  const active = sortBy === column;
  const arrow = active && !isDefault ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';
  return (
    <button type="button" className={styles.sortBtn} onClick={() => onSort(column)}
      aria-label={`Ordenar por ${label}${active ? (sortDir === 'asc' ? ', ascendente' : ', descendente') : ''}`}>
      {label}{arrow}
    </button>
  );
};

export interface RowAction { label: string; onClick: () => void; danger?: boolean; disabled?: boolean }

const stop = (e: MouseEvent | KeyboardEvent) => e.stopPropagation();

/** Última celda de una fila: el valor y, al pasar el puntero o enfocar la fila, sus acciones (las mismas del deslizar en móvil). */
export const CellWithActions = ({ children, actions }: { children: ReactNode; actions: RowAction[] }) => (
  <span className={styles.cellEnd}>
    {actions.length ? (
      <span className={styles.acts} onClick={stop} onKeyDown={stop}>
        {actions.map((a) => (
          <button key={a.label} type="button" className={cx(styles.act, a.danger && styles.actDanger)}
            disabled={a.disabled} onClick={a.onClick}>{a.label}</button>
        ))}
      </span>
    ) : null}
    {children}
  </span>
);
