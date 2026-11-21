// TCW-27 CA6: monto mono con punto de miles al escribir y al mostrar (78.000), nunca coma.
//
// CONTRATO: NumberInput con format="currency" muestra value con formatThousands (src/utils/formatInput.ts), usa la fuente
// mono (clase `mono` en NumberInput.module.css) y, al escribir, reformatea con puntos y llama onChange(número entero).
import { useState } from 'react';
import { readSrc } from '../../../../tests/helpers/readSrc';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockMedia } from '../../../../tests/helpers/media';

// Escritorio = useDesktopLayout(): >= 1024 px y no Capacitor. Móvil y nativo conservan el comportamiento de siempre.
let native = false;
vi.mock('@ionic/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@ionic/react')>();
  return { ...actual, isPlatform: (p: string) => (p === 'capacitor' ? native : actual.isPlatform(p as never)) };
});

import { NumberInput } from './NumberInput';

beforeEach(() => { native = false; mockMedia({ desktop: true }); });

const css = readSrc('src/components/atoms/NumberInput/NumberInput.module.css');

const Harness = ({ initial = '' as number | '', onChange = () => {} }: { initial?: number | ''; onChange?: (v: number | '') => void }) => {
  const [v, setV] = useState<number | ''>(initial);
  return <NumberInput name="amount" label="Monto" format="currency" value={v} onChange={(x) => { setV(x); onChange(x); }} />;
};

// GUARDIA CA12: en móvil (< 1024 px) y en Capacitor el NumberInput currency sigue mostrando como antes
// (Intl.NumberFormat() por defecto, sin puntos forzados) y al escribir solo quita comas.
describe.each([
  ['móvil (< 1024 px)', () => { native = false; mockMedia({ desktop: false }); }],
  ['Capacitor (>= 1024 px nativo)', () => { native = true; mockMedia({ desktop: true }); }],
])('NumberInput monto sin cambios en %s', (_n, setup) => {
  it('TCW-27 CA12: muestra 78000 con el formato de siempre (Intl por defecto)', () => {
    setup();
    render(<Harness initial={78000} />);
    expect(screen.getByRole('textbox', { name: 'Monto' })).toHaveValue(new Intl.NumberFormat().format(78000));
  });

  it('TCW-27 CA12: al escribir "1,234" (con coma) el valor es el número 1234 como antes', async () => {
    setup();
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    await user.type(screen.getByRole('textbox', { name: 'Monto' }), '1,234');
    expect(onChange).toHaveBeenLastCalledWith(1234);
  });
});

describe('NumberInput monto (escritorio)', () => {
  it('TCW-27 CA6: al mostrar 78000 se ve "78.000" y no "78,000"', () => {
    render(<Harness initial={78000} />);
    const input = screen.getByRole('textbox', { name: 'Monto' });
    expect(input).toHaveValue('78.000');
    expect((input as HTMLInputElement).value).not.toContain(',');
  });

  it('TCW-27 CA6: al escribir 1234567 el campo muestra 1.234.567 y el valor es el número 1234567', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const input = screen.getByRole('textbox', { name: 'Monto' });
    await user.type(input, '1234567');
    expect(input).toHaveValue('1.234.567');
    expect(onChange).toHaveBeenLastCalledWith(1234567);
  });

  it('TCW-27 CA6: al escribir 78000 dígito a dígito termina en "78.000" (nunca coma)', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByRole('textbox', { name: 'Monto' });
    await user.type(input, '78000');
    expect(input).toHaveValue('78.000');
  });

  it('TCW-27 CA6: borrar hasta vaciar devuelve ""', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness initial={78000} onChange={onChange} />);
    await user.clear(screen.getByRole('textbox', { name: 'Monto' }));
    expect(onChange).toHaveBeenLastCalledWith('');
  });

  it('TCW-27 CA6: el monto usa la fuente mono (token --tcw-font-mono)', () => {
    expect(css).toMatch(/--tcw-font-mono/);
  });
});
