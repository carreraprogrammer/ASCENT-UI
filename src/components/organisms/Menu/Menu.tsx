import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import styles from './Menu.module.css';

export interface MenuOption {
  value: string;
  label: string;
  /** Punto de gaveta, p. ej. var(--color-committed). */
  color?: string;
  /** Conteo en mono a la derecha. */
  count?: number;
}

export interface MenuProps {
  label: string;
  options: MenuOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  /** Por defecto false: elegir una opción reemplaza la selección y cierra. */
  multiple?: boolean;
  clearLabel?: string;
  searchLabel?: string;
}

const SEARCH_THRESHOLD = 6;
const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

const Dot = ({ color }: { color: string }) => <span aria-hidden="true" className={styles.dot} style={{ '--dot': color } as CSSProperties} />;

/** Menú único de escritorio (filtros, orden y filtro Gaveta): pegado bajo su botón. */
export const Menu = ({ label, options, selected, onChange, multiple = false, clearLabel = 'Limpiar', searchLabel = 'Buscar' }: MenuProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const root = useRef<HTMLSpanElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const searchable = options.length > SEARCH_THRESHOLD;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
  }, [options, query]);

  // Roving tabindex: una sola opción entra en el orden de Tab (la marcada, o la primera); las flechas mueven el foco.
  const roving = visible.find((v) => selected.includes(v.value)) ?? visible[0];
  const itemRole =multiple ? 'menuitemcheckbox' : 'menuitemradio';
  const items = (): HTMLElement[] => Array.from(root.current?.querySelectorAll<HTMLElement>(`[role="${itemRole}"]`) ?? []);

  useEffect(() => {
    if (!open) return undefined;
    const away = (e: Event) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', away);
    return () => document.removeEventListener('mousedown', away);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    const list = items();
    (list.find((el) => el.getAttribute('aria-checked') === 'true') ?? list[0])?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const close = (returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) trigger.current?.focus();
  };

  const onKey = (e: KeyboardEvent<HTMLSpanElement>) => {
    if (e.key === 'Escape') {
      if (!open) return;
      e.preventDefault();
      e.stopPropagation();
      close(true);
      return;
    }
    if (!open || (e.key !== 'ArrowDown' && e.key !== 'ArrowUp')) return;
    e.preventDefault();
    const list = items();
    if (!list.length) return;
    const i = list.indexOf(document.activeElement as HTMLElement);
    const down = e.key === 'ArrowDown';
    const next = i < 0 ? (down ? 0 : list.length - 1) : (i + (down ? 1 : -1) + list.length) % list.length;
    list[next]?.focus();
  };

  const toggle = (value: string) => {
    if (multiple) {
      onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
      return;
    }
    onChange([value]);
    close(true);
  };

  const first = options.find((o) => o.value !== '' && selected.includes(o.value));
  const shown = multiple ? label : first?.label ?? label;
  const active = selected.some((v) => v !== '') && selected.length > 0;

  return (
    <span ref={root} className={styles.root} onKeyDown={onKey}
      onBlur={(e) => { if (open && !root.current?.contains(e.relatedTarget as Node | null)) setOpen(false); }}>
      <button ref={trigger} type="button" className={cx(styles.trigger, active && styles.triggerOn)} aria-haspopup="menu"
        aria-expanded={open} aria-controls={open ? menuId : undefined} onClick={() => setOpen((o) => !o)}>
        {!multiple && first?.color ? <Dot color={first.color} /> : null}
        {shown}{multiple && selected.length ? ` · ${selected.length}` : ''} ▾
      </button>
      {open ? (
        <div id={menuId} role="menu" aria-label={label} data-ui="menu" className={styles.menu}>
          {searchable ? (
            <input type="search" role="searchbox" className={styles.search} aria-label={searchLabel} placeholder={searchLabel}
              value={query} onChange={(e) => setQuery(e.target.value)} />
          ) : null}
          <div className={styles.list}>
            {visible.map((o) => {
              const on = selected.includes(o.value);
              return (
                <button key={o.value || 'all'} type="button" role={itemRole} aria-checked={on}
                  tabIndex={o === roving ? 0 : -1}
                  className={cx(styles.item, on && styles.itemOn)} onClick={() => toggle(o.value)}>
                  {on ? <span data-check className={styles.check} /> : <span className={styles.checkSpace} />}
                  {o.color ? <Dot color={o.color} /> : null}
                  <span className={styles.itemLabel}>{o.label}</span>
                  {o.count !== undefined ? <span data-count className={styles.count}>{o.count}</span> : null}
                </button>
              );
            })}
          </div>
          <div className={styles.footer}>
            <button type="button" className={styles.clear} onClick={() => { onChange([]); if (!multiple) close(true); }}>{clearLabel}</button>
          </div>
        </div>
      ) : null}
    </span>
  );
};
