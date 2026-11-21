import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { ORIGIN_LABEL, type Origin } from '../../../utils/instrumento';
import styles from './Inst.module.css';

// TCW-5 "Instrumento": átomos del lenguaje de escritorio (ver projects/the-cyborg-way/procedural/design/instrumento).

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

export const Eyebrow = ({ children, as: Tag = 'span' }: { children: ReactNode; as?: 'span' | 'h2' | 'h3' }) =>
  <Tag className={styles.eyebrow} style={Tag === 'span' ? undefined : { margin: 0, fontWeight: 400 }}>{children}</Tag>;

export type Tone = 'ok' | 'amber' | 'rose' | 'violet' | 'muted';

export const Num = ({ children, strong, tone, className }: { children: ReactNode; strong?: boolean; tone?: Tone; className?: string }) =>
  <span className={cx(styles.num, strong && styles.strong, tone && styles[tone], className)}>{children}</span>;

export const OriginTag = ({ origin }: { origin: Origin }) => {
  const o = ORIGIN_LABEL[origin];
  return (
    <span className={styles.tag}>
      <span aria-hidden="true" className={cx(styles.tagIcon, origin === 'agente' && styles.tagIconAgent)}>{o.icon}</span>{o.label}
    </span>
  );
};

const STATE_TONE: Record<string, Tone> = {
  confirmado: 'ok', pendiente: 'amber', pagada: 'ok', activa: 'violet', cubierto: 'ok', 'por cubrir': 'muted',
  borrador: 'amber', ejecutado: 'ok', planeado: 'muted', activo: 'violet', disponible: 'ok', vencida: 'rose',
  'en curso': 'violet', cumplida: 'ok', cerrado: 'muted',
};

export const StateTag = ({ state, tone }: { state: string; tone?: Tone }) =>
  <span className={cx(styles.tag, styles[tone ?? STATE_TONE[state] ?? 'muted'])}>{state}</span>;

export const Bar = ({ pct, width = '100%', label }: { pct: number; width?: string; label?: string }) => {
  const safe = Number.isFinite(pct) ? Math.max(0, pct) : 0;
  return (
    <span className={styles.bar} style={{ width }} role="progressbar" aria-valuemin={0} aria-valuemax={100}
      aria-valuenow={Math.round(Math.min(safe, 100))} aria-label={label}>
      <span className={cx(styles.barFill, safe > 100 && styles.barOver)} style={{ width: `${Math.min(safe, 100)}%` }} />
    </span>
  );
};

/** Barra + porcentaje, como en las tablas de avance. */
export const BarPct = ({ pct, width = '160px', label }: { pct: number; width?: string; label?: string }) => (
  <span style={{ whiteSpace: 'nowrap' }}>
    <Bar pct={pct} width={width} label={label} />
    <span className={cx(styles.pct, pct > 100 && styles.rose)}>{Math.round(pct)} %</span>
  </span>
);

export const InstButton = ({ primary, className, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { primary?: boolean }) =>
  <button type="button" className={cx(styles.btn, primary && styles.btnPrimary, className)} {...rest}>{children}</button>;

export const InstLink = ({ children, onClick, href }: { children: ReactNode; onClick?: () => void; href?: string }) =>
  href ? <a className={styles.link} href={href} onClick={onClick}>{children} ›</a>
    : <button type="button" className={styles.link} onClick={onClick}>{children} ›</button>;

/** Nombre del movimiento: una sola línea, con puntos suspensivos si no cabe y el texto completo en title. */
export const NameCell = ({ children }: { children: string }) => <span className={styles.nameCell} title={children}>{children}</span>;
export const DateCell = ({ children }: { children: ReactNode }) => <span className={styles.date}>{children}</span>;
export const Sub = ({ children }: { children: ReactNode }) => <span className={styles.sub}>{children}</span>;
export const Two = ({ a, b }: { a: ReactNode; b?: ReactNode }) => (
  <><div className={styles.two1}>{a}</div>{b ? <div className={styles.two2}>{b}</div> : null}</>
);
