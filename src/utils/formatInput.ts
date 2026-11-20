// Helpers puros de formato de controles (TCW-27 CA6).
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** Separador de miles con punto, nunca coma. '' si no hay dígitos. */
export const formatThousands = (value: number | string): string => {
  const digits = String(value).replace(/\D/g, '');
  if (!digits) return '';
  const clean = digits.replace(/^0+(?=\d)/, '');
  return clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

/** Quita puntos, comas y espacios y devuelve el entero; '' si vacío. */
export const parseThousands = (text: string): number | '' => {
  const digits = text.replace(/\D/g, '');
  return digits ? Number(digits) : '';
};

/** 'YYYY-MM-DD' -> 'D mmm YYYY' sin pasar por Date. '' si no es ISO. */
export const formatDateShort = (iso: string): string => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return '';
  const month = Number(m[2]);
  if (month < 1 || month > 12) return '';
  return `${Number(m[3])} ${MONTHS[month - 1]} ${m[1]}`;
};
