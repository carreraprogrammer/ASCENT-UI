// TCW-27 CA6: la fecha se ve "20 nov 2026"; el input nativo queda por debajo.
//
// CONTRATO: DateInput (format="date") conserva su <input type="date"> con el valor ISO (la prueba existente sigue verde) y
// añade un elemento visible data-testid="date-display" con formatDateShort(value) (src/utils/formatInput.ts). Si no hay
// valor, el elemento muestra el placeholder `placeholder` (prop opcional) o queda vacío. format="datetime-local" no cambia.
import { render, screen } from '@testing-library/react';
import { mockMedia } from '../../../../tests/helpers/media';

let native = false;
vi.mock('@ionic/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@ionic/react')>();
  return { ...actual, isPlatform: (p: string) => (p === 'capacitor' ? native : actual.isPlatform(p as never)) };
});

import { DateInput } from './DateInput';

beforeEach(() => { native = false; mockMedia({ desktop: true }); });

// GUARDIA CA12: en móvil (< 1024 px) y en Capacitor el DateInput es el nativo de siempre, sin texto formateado.
describe.each([
  ['móvil (< 1024 px)', () => { native = false; mockMedia({ desktop: false }); }],
  ['Capacitor (>= 1024 px nativo)', () => { native = true; mockMedia({ desktop: true }); }],
])('DateInput sin cambios en %s', (_n, setup) => {
  it('TCW-27 CA12: solo el input nativo con valor ISO; no hay texto "20 nov 2026" ni date-display', () => {
    setup();
    render(<DateInput name="date" label="Fecha" value="2026-11-20" onChange={() => undefined} />);
    expect(screen.getByDisplayValue('2026-11-20')).toHaveAttribute('type', 'date');
    expect(screen.queryByTestId('date-display')).toBeNull();
    expect(screen.queryByText('20 nov 2026')).toBeNull();
  });
});

describe('DateInput visible (escritorio)', () => {
  it('TCW-27 CA6: con 2026-11-20 el texto visible es "20 nov 2026" y el valor nativo sigue siendo ISO', () => {
    render(<DateInput name="date" label="Fecha" value="2026-11-20" onChange={() => undefined} />);
    expect(screen.getByTestId('date-display')).toHaveTextContent('20 nov 2026');
    expect(screen.getByDisplayValue('2026-11-20')).toHaveAttribute('type', 'date');
  });

  it('TCW-27 CA6: no muestra el formato nativo 11/20/2026', () => {
    render(<DateInput name="date" label="Fecha" value="2026-11-20" onChange={() => undefined} />);
    expect(screen.queryByText('11/20/2026')).toBeNull();
    expect(screen.queryByText('20/11/2026')).toBeNull();
  });

  it('TCW-27 CA6: cambia al cambiar el valor (5 ene 2026)', () => {
    const { rerender } = render(<DateInput name="date" label="Fecha" value="2026-11-20" onChange={() => undefined} />);
    rerender(<DateInput name="date" label="Fecha" value="2026-01-05" onChange={() => undefined} />);
    expect(screen.getByTestId('date-display')).toHaveTextContent('5 ene 2026');
  });
});
