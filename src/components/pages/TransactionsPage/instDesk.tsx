import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react';
import { CategoryCell } from '../../atoms/Inst';
import { resolveTransactionCategory, type CategoryLookupItem } from '../../../utils/financeBehavior';
import { getCategoryDisplayName } from '../../../utils/categoryLabels';
import type { Transaction } from '../../../types/finance.types';
import styles from './instDesk.module.css';

// TCW-5 "Instrumento" (escritorio): controles de página que no están en los átomos compartidos. Viven aquí y los
// importan Deudas, Recurrentes, Subcategorías y Planeados para no tocar src/components/{atoms,molecules}/Inst.

export { styles as instDeskStyles };

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

export const Chip = ({ on, onClick, children }: { on?: boolean; onClick: () => void; children: ReactNode }) => (
  <button type="button" className={cx(styles.chip, on && styles.chipOn)} aria-pressed={Boolean(on)} onClick={onClick}>{children}</button>
);

/** `color` (p. ej. var(--color-committed)) pinta un punto junto al nombre de la opción. */
export interface ChipOption { value: string; label: string; color?: string }

/** Selector con forma de chip ("Gaveta ▾"): la primera opción es el nombre del filtro y significa "todas".
 *  Un <select> nativo no admite puntos de color: si alguna opción trae `color` se usa un menú propio (TCW-5, escritorio). */
export const ChipSelect = ({ label, value, options, onChange }: {
  label: string;
  value: string;
  options: ChipOption[];
  onChange: (value: string) => void;
}) => {
  if (options.some((o) => o.color)) return <ColorChipMenu label={label} value={value} options={options} onChange={onChange} />;
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

const Dot = ({ color }: { color: string }) => <span aria-hidden="true" className={styles.dot} style={{ '--dot': color } as CSSProperties} />;

const ColorChipMenu = ({ label, value, options, onChange }: {
  label: string; value: string; options: ChipOption[]; onChange: (value: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLSpanElement>(null);
  const current = options.find((o) => o.value === value);
  useEffect(() => {
    if (!open) return undefined;
    const away = (e: Event) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', away);
    return () => document.removeEventListener('mousedown', away);
  }, [open]);
  const items: ChipOption[] = [{ value: '', label: `${label}: todas` }, ...options];
  const onKey = (e: KeyboardEvent<HTMLSpanElement>) => {
    if (e.key === 'Escape') { setOpen(false); root.current?.querySelector('button')?.focus(); return; }
    if (!open || (e.key !== 'ArrowDown' && e.key !== 'ArrowUp')) return;
    e.preventDefault();
    const btns = Array.from(root.current?.querySelectorAll<HTMLElement>('[role="menuitemradio"]') ?? []);
    const i = btns.indexOf(document.activeElement as HTMLElement);
    btns[(i + (e.key === 'ArrowDown' ? 1 : -1) + btns.length) % btns.length]?.focus();
  };
  return (
    <span ref={root} className={cx(styles.selChip, styles.menuRoot)} onKeyDown={onKey}>
      <button type="button" className={cx(styles.chip, value && styles.chipOn)} aria-haspopup="menu" aria-expanded={open}
        aria-label={label} onClick={() => setOpen((o) => !o)}>
        {current?.color ? <Dot color={current.color} /> : null}{current?.label ?? label} ▾
      </button>
      {open ? (
        <span role="menu" aria-label={label} className={styles.menu}>
          {items.map((o) => (
            <button key={o.value || 'all'} type="button" role="menuitemradio" aria-checked={o.value === value}
              className={cx(styles.menuItem, o.value === value && styles.menuItemOn)}
              onClick={() => { setOpen(false); onChange(o.value); }}>
              {o.color ? <Dot color={o.color} /> : null}{o.label}
            </button>
          ))}
        </span>
      ) : null}
    </span>
  );
};

/** Gaveta · categoría de un movimiento, con la pieza compartida de escritorio (TCW-5). */
export const TxCategoryCell = ({ tx, lookup }: { tx: Transaction; lookup: Record<string, CategoryLookupItem> }) => {
  const income = tx.attributes.transaction_type === 'income';
  const cat = resolveTransactionCategory(tx, lookup);
  const classified = Boolean(cat.categoryId || cat.subcategoryName);
  return (
    <CategoryCell
      income={income}
      code={classified ? cat.categoryCode : null}
      gavetaName={income ? 'Ingreso' : classified ? getCategoryDisplayName({ name: cat.categoryName, code: cat.categoryCode, type: cat.categoryType }) : null}
      subcategoryName={cat.subcategoryName}
      icon={cat.subcategoryIcon ?? cat.categoryIcon}
    />
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
