// TCW-5 "Instrumento" (escritorio): cómo se leen en las tablas los datos que ya existen. Solo presentación: no
// cambia ningún cálculo. Lo usan Transacciones, Deudas, Recurrentes, Subcategorías y Planeados en escritorio.
import type { CategoryResource, IncomeSource, MonthExecutionStatus } from '../../../types/finance.types';
import { MINUS } from '../../../utils/instrumento';

/** Icono para CategoryCell: el de la subcategoría y, si no trae, el de la categoría (mismo criterio que móvil). */
export const categoryIconOf = (
  categories: CategoryResource[], categoryId?: number | string | null, subcategoryId?: number | string | null,
): string | undefined => {
  const cat = categories.find((c) => String(c.id) === String(categoryId));
  const sub = subcategoryId == null ? undefined
    : (cat ? [cat] : categories).flatMap((c) => c.relationships?.subcategories?.data ?? []).find((s) => String(s.id) === String(subcategoryId));
  return sub?.attributes?.icon ?? cat?.attributes.icon;
};

const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MONTHS_LONG = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/** "oct" para el mes 10. */
export const monthShort = (month: number) => MONTHS_SHORT[(month + 11) % 12];
/** "noviembre 2026". */
export const monthLong = (period: { month: number; year: number }) => `${MONTHS_LONG[period.month - 1]} ${period.year}`;

/** Tasa mensual guardada (1.85) → "1,85 %"; 0 o vacía → "—". */
export const fmtRate = (rate: number | null | undefined): string => {
  if (rate == null || !Number.isFinite(rate) || rate === 0) return '—';
  return `${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(rate)} %`.replace('-', MINUS);
};

/** Estado de una deuda en el lenguaje de la tabla. */
export const debtState = (status: string | null | undefined): string => ({
  active: 'activa', paid_off: 'pagada', paused: 'pausada', disputed: 'en disputa',
} as Record<string, string>)[status ?? ''] ?? (status ? status.replace(/_/gu, ' ') : '—');

/** Estado de un recurrente este mes: sale de summary.month_execution (lo que ya calcula la API). */
export const obligationState = (
  active: boolean,
  execution: MonthExecutionStatus | null | undefined,
): { label: string; tone?: 'ok' | 'amber' | 'muted' } => {
  if (!active) return { label: 'inactivo', tone: 'muted' };
  if (execution === 'covered') return { label: 'cubierto', tone: 'ok' };
  if (execution === 'partial') return { label: 'parcial', tone: 'amber' };
  if (execution === 'pending') return { label: 'por cubrir', tone: 'muted' };
  return { label: '—', tone: 'muted' };
};

const dayRange = (from?: number | null, to?: number | null) => {
  if (!from) return null;
  return to && to !== from ? `${from}–${to}` : String(from);
};

/** Día esperado de un ingreso: "15 y 30", "1–5", "variable". */
export const incomeDayLabel = (attrs: IncomeSource['attributes']): string => {
  if (attrs.is_variable) return 'variable';
  const schedules = attrs.schedules ?? [];
  const days = (schedules.length ? schedules.map((s) => dayRange(s.expected_day_from, s.expected_day_to)) : [dayRange(attrs.expected_day_from, attrs.expected_day_to)])
    .filter((d): d is string => Boolean(d));
  if (!days.length) return '—';
  if (days.length === 1) return days[0];
  return `${days.slice(0, -1).join(', ')} y ${days[days.length - 1]}`;
};

/** Ordenar desde el encabezado: misma columna invierte la dirección; otra columna arranca con su dirección natural. */
export const nextSort = (
  current: { sort_by?: string; sort_dir?: 'asc' | 'desc' },
  column: string,
  naturalDir: 'asc' | 'desc' = 'asc',
): { sort_by: string; sort_dir: 'asc' | 'desc' } => (
  current.sort_by === column
    ? { sort_by: column, sort_dir: current.sort_dir === 'asc' ? 'desc' : 'asc' }
    : { sort_by: column, sort_dir: naturalDir }
);

/** Filtro de tipo activo en Transacciones: Todo / Ingresos / Gastos / Por revisar. */
export type TxQuick = 'all' | 'income' | 'expense' | 'pending';
export const txQuickOf = (f: { transaction_type?: string; status?: string }): TxQuick | null => {
  if (f.status === 'pending' && !f.transaction_type) return 'pending';
  if (f.status) return null;
  if (f.transaction_type === 'income') return 'income';
  if (f.transaction_type === 'expense') return 'expense';
  if (!f.transaction_type) return 'all';
  return null;
};
export const txQuickFilters = (q: TxQuick): { transaction_type: string; status: string } => ({
  transaction_type: q === 'income' || q === 'expense' ? q : '',
  status: q === 'pending' ? 'pending' : '',
});

/** Origen filtrable por la API (`source`). "regla" sale de metadata y no se puede pedir al servidor. */
export const SOURCE_OPTIONS = [
  { value: 'gmail', label: 'correo del banco' },
  { value: 'telegram', label: 'agente · chat' },
  { value: 'brain', label: 'agente · cromo' },
  { value: 'manual', label: 'tú' },
];
