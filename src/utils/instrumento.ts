// TCW-5 "Instrumento": cómo se escriben los datos en escritorio. Cifras completas con separador de miles,
// signo menos real, fechas en un solo formato. Y de dónde salió cada movimiento (origen), solo con lo guardado.

const THOUSANDS = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });
export const MINUS = '−';

/** 1.600.000 · −40.000 · +3.200.000 (con sign: 'always'). Sin símbolo: la moneda va en el encabezado. */
export const fmtAmount = (value: number | null | undefined, opts: { sign?: 'auto' | 'always' } = {}): string => {
  if (value == null || Number.isNaN(value)) return '—';
  const n = Math.round(value);
  const body = THOUSANDS.format(Math.abs(n));
  if (n < 0) return `${MINUS}${body}`;
  if (opts.sign === 'always' && n > 0) return `+${body}`;
  return body;
};

/** Monto con signo según el tipo de movimiento: ingreso +, gasto −. */
export const fmtSigned = (amount: number, income: boolean): string =>
  `${income ? '+' : MINUS}${THOUSANDS.format(Math.abs(Math.round(amount)))}`;

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

const parseDay = (value: string | Date): Date | null => {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const m = /^(\d{4})-(\d{2})-(\d{2})/u.exec(value);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

/** "15 nov"; con otro año, "15 nov 2025". El único formato de fecha de las tablas. */
export const fmtDay = (value: string | Date | null | undefined, now = new Date()): string => {
  if (!value) return '—';
  const d = parseDay(value);
  if (!d) return '—';
  const base = `${d.getDate()} ${MONTHS[d.getMonth()]}`;
  return d.getFullYear() === now.getFullYear() ? base : `${base} ${d.getFullYear()}`;
};

/** "15 nov 2027": fechas objetivo, siempre con año. */
export const fmtDayYear = (value: string | Date | null | undefined): string => {
  if (!value) return '—';
  const d = parseDay(value);
  return d ? `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}` : '—';
};

/** "hace 4 min", "hace 3 h", "ayer 23:00", "15 nov 23:00". */
export const fmtAgo = (iso: string | null | undefined, now = new Date()): string | null => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const mins = Math.round((now.getTime() - d.getTime()) / 60000);
  const hhmm = `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  if (mins < 1) return 'hace un momento';
  if (mins < 60) return `hace ${mins} min`;
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return `hoy ${hhmm}`;
  const y = new Date(now); y.setDate(now.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return `ayer ${hhmm}`;
  return `${fmtDay(d, now)} ${hhmm}`;
};

// ── Origen ────────────────────────────────────────────────────────────────
// Derivado solo de lo que la API ya guarda (TCW-5, comment-01-datos):
//   metadata.classification_source = "pattern"            → regla  (el patrón de la oficina lo clasificó)
//   metadata.classification_source = "agent"              → agente
//   source = "brain" con source_event_id "auto_debit:…"   → regla  (débito automático de un bolsillo)
//   source = "gmail"                                      → correo del banco
//   source = "telegram" | "brain"                         → agente (chat o cromo)
//   source = "manual" (o vacío)                           → tú
export type Origin = 'correo' | 'agente' | 'regla' | 'tu';

export const ORIGIN_LABEL: Record<Origin, { icon: string; label: string }> = {
  correo: { icon: '✉', label: 'correo del banco' },
  agente: { icon: '◆', label: 'agente' },
  regla: { icon: '⚡', label: 'regla' },
  tu: { icon: '●', label: 'tú' },
};

export const originOf = (attrs: {
  source?: string | null;
  source_event_id?: string | null;
  metadata?: Record<string, unknown> | null;
}): Origin => {
  const classified = attrs.metadata && typeof attrs.metadata === 'object' ? attrs.metadata.classification_source : undefined;
  if (classified === 'pattern') return 'regla';
  if (classified === 'agent') return 'agente';
  const source = attrs.source ?? 'manual';
  if (source === 'brain' && (attrs.source_event_id ?? '').startsWith('auto_debit:')) return 'regla';
  if (source === 'gmail') return 'correo';
  if (source === 'telegram' || source === 'brain') return 'agente';
  return 'tu';
};
