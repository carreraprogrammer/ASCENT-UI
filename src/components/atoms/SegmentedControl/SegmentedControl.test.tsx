// TCW-27 CA6: control segmentado con TEXTO para 2-3 valores (Medio de pago: Tarjeta, Cuenta, Efectivo).
//
// CONTRATO PARA EL CONSTRUCTOR
//   Módulo: src/components/atoms/SegmentedControl/SegmentedControl.tsx (+ index.ts que re-exporta `SegmentedControl`).
//   Props:  name: string; label: string (nombre accesible del grupo y etiqueta visible); value: string | null;
//           options: Array<{ value: string; label: string }> (2 o 3); onChange: (value: string) => void;
//           disabled?: boolean; required?: boolean.
//   DOM:    contenedor role="radiogroup" con nombre = label; cada opción es role="radio" con aria-checked, con su
//           TEXTO visible (sin depender de iconos). Flechas izquierda/derecha mueven y eligen (patrón radiogroup).
import { useState } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MEDIOS_PAGO } from '../../../../tests/fixtures/medios-pago';
import { SegmentedControl } from './SegmentedControl';

const Harness = ({ initial = null as string | null, onChange = () => {}, disabled = false }: {
  initial?: string | null; onChange?: (v: string) => void; disabled?: boolean;
}) => {
  const [v, setV] = useState<string | null>(initial);
  return <SegmentedControl name="payment" label="Medio de pago" value={v} options={[...MEDIOS_PAGO]} disabled={disabled} onChange={(x) => { setV(x); onChange(x); }} />;
};

describe('SegmentedControl', () => {
  it('TCW-27 CA6: radiogroup "Medio de pago" con tres opciones de texto: Tarjeta, Cuenta, Efectivo', () => {
    render(<Harness />);
    const group = screen.getByRole('radiogroup', { name: 'Medio de pago' });
    const radios = within(group).getAllByRole('radio');
    expect(radios.map((r) => r.textContent)).toEqual(['Tarjeta', 'Cuenta', 'Efectivo']);
  });

  it('TCW-27 CA6: la opción elegida tiene aria-checked=true y las demás false', () => {
    render(<Harness initial="debit" />);
    expect(screen.getByRole('radio', { name: 'Cuenta' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'Tarjeta' })).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('radio', { name: 'Efectivo' })).toHaveAttribute('aria-checked', 'false');
  });

  it('TCW-27 CA6: clic en "Efectivo" llama onChange("cash") y la marca', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    await user.click(screen.getByRole('radio', { name: 'Efectivo' }));
    expect(onChange).toHaveBeenCalledWith('cash');
    expect(screen.getByRole('radio', { name: 'Efectivo' })).toHaveAttribute('aria-checked', 'true');
  });

  it('TCW-27 CA6: con el foco en la opción elegida, ArrowRight elige la siguiente', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness initial="credit_card" onChange={onChange} />);
    screen.getByRole('radio', { name: 'Tarjeta' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenLastCalledWith('debit');
  });

  it('TCW-27 CA6: deshabilitado no cambia', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness disabled onChange={onChange} />);
    await user.click(screen.getByRole('radio', { name: 'Efectivo' }));
    expect(onChange).not.toHaveBeenCalled();
  });
});
