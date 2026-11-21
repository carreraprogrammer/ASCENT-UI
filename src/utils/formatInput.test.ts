// TCW-27 CA6. Helpers puros de formato de controles.
//
// CONTRATO PARA EL CONSTRUCTOR
//   src/utils/formatInput.ts exporta:
//     formatThousands(value: number | string): string  -> separador de miles con punto, nunca coma; '' si no hay dígitos.
//     parseThousands(text: string): number | ''        -> quita puntos/comas/espacios y devuelve el entero; '' si vacío.
//     formatDateShort(iso: string): string             -> 'YYYY-MM-DD' -> 'D mmm YYYY' en español abreviado
//                                                         (ene feb mar abr may jun jul ago sep oct nov dic), sin pasar por
//                                                         Date/zona horaria; '' si el texto no es una fecha ISO.
import { formatThousands, parseThousands, formatDateShort } from './formatInput';

describe('formatThousands', () => {
  it.each([
    [78000, '78.000'],
    ['78000', '78.000'],
    [1234567, '1.234.567'],
    [999, '999'],
    [0, '0'],
  ])('TCW-27 CA6: %s -> %s (punto de miles, nunca coma)', (input, out) => {
    expect(formatThousands(input)).toBe(out);
    expect(formatThousands(input)).not.toContain(',');
  });

  it('TCW-27 CA6: vacío o sin dígitos da cadena vacía', () => {
    expect(formatThousands('')).toBe('');
    expect(formatThousands('abc')).toBe('');
  });

  it('TCW-27 CA6: re-formatear un texto ya formateado es estable (se escribe dígito a dígito)', () => {
    expect(formatThousands('78.0000')).toBe('780.000');
    expect(formatThousands('7.800')).toBe('7.800');
  });
});

describe('parseThousands', () => {
  it.each([
    ['78.000', 78000],
    ['1.234.567', 1234567],
    ['78,000', 78000],
    ['5', 5],
  ])('TCW-27 CA6: "%s" -> %s', (text, n) => {
    expect(parseThousands(text)).toBe(n);
  });
  it('TCW-27 CA6: vacío -> ""', () => {
    expect(parseThousands('')).toBe('');
  });
});

describe('formatDateShort', () => {
  it.each([
    ['2026-11-20', '20 nov 2026'],
    ['2026-01-05', '5 ene 2026'],
    ['2026-09-30', '30 sep 2026'],
    ['2026-12-31', '31 dic 2026'],
    ['2026-08-01', '1 ago 2026'],
  ])('TCW-27 CA6: %s -> "%s"', (iso, out) => {
    expect(formatDateShort(iso)).toBe(out);
  });
  it('TCW-27 CA6: texto inválido o vacío -> ""', () => {
    expect(formatDateShort('')).toBe('');
    expect(formatDateShort('20/11/2026')).toBe('');
  });
});
