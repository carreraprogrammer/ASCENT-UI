// TCW-27 (revisión): un monto con decimales no se corrompe al mostrarlo ni al editarlo.
import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { formatThousands } from '../../../utils/formatInput';
import { NumberInput } from './NumberInput';

const Harness = ({ initial, onChange = () => {} }: { initial: number; onChange?: (v: number | '') => void }) => {
  const [v, setV] = useState<number | ''>(initial);
  return <NumberInput name="amount" label="Monto" format="currency" value={v} onChange={(x) => { setV(x); onChange(x); }} />;
};

describe('monto con decimales', () => {
  it('formatThousands no cambia el valor de un número con decimales', () => {
    expect(formatThousands(1234.5)).toBe('1234.5');
    expect(Number(formatThousands(78000.5))).toBe(78000.5);
  });

  it('el campo muestra 78000.5 (no 780.005) y no emite cambios al mostrarlo', () => {
    const onChange = vi.fn();
    render(<Harness initial={78000.5} onChange={onChange} />);
    expect(screen.getByRole('textbox', { name: 'Monto' })).toHaveValue('78000.5');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('al editar un monto con decimales conserva el punto decimal', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness initial={78000.5} onChange={onChange} />);
    await user.type(screen.getByRole('textbox', { name: 'Monto' }), '5');
    expect(onChange).toHaveBeenLastCalledWith(78000.55);
  });
});
