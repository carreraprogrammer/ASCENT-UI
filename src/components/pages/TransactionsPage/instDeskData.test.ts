import { describe, expect, it } from 'vitest';
import {
  debtState, fmtRate, incomeDayLabel, monthLong, monthShort, nextSort, obligationState, txQuickFilters, txQuickOf,
} from './instDeskData';
import type { IncomeSource } from '../../../types/finance.types';

const income = (over: Partial<IncomeSource['attributes']>): IncomeSource['attributes'] => ({
  name: 'Nómina', expected_day_from: 15, expected_day_to: 15, expected_amount: 3_200_000, is_variable: false, ...over,
});

describe('instDeskData', () => {
  it('nombra los meses como el mockup', () => {
    expect(monthShort(10)).toBe('oct');
    expect(monthShort(1)).toBe('ene');
    expect(monthLong({ month: 11, year: 2026 })).toBe('noviembre 2026');
  });

  it('escribe la tasa mensual con coma decimal y guion largo cuando no hay', () => {
    expect(fmtRate(1.85)).toBe('1,85 %');
    expect(fmtRate(1.5)).toBe('1,5 %');
    expect(fmtRate(0)).toBe('—');
    expect(fmtRate(null)).toBe('—');
  });

  it('traduce el estado de la deuda', () => {
    expect(debtState('active')).toBe('activa');
    expect(debtState('paid_off')).toBe('pagada');
    expect(debtState('otro_estado')).toBe('otro estado');
  });

  it('lee el estado del recurrente desde la ejecución del mes', () => {
    expect(obligationState(true, 'covered')).toEqual({ label: 'cubierto', tone: 'ok' });
    expect(obligationState(true, 'pending').label).toBe('por cubrir');
    expect(obligationState(true, 'partial').label).toBe('parcial');
    expect(obligationState(false, 'covered').label).toBe('inactivo');
    expect(obligationState(true, undefined).label).toBe('—');
  });

  it('arma el día esperado de un ingreso', () => {
    expect(incomeDayLabel(income({}))).toBe('15');
    expect(incomeDayLabel(income({ expected_day_from: 1, expected_day_to: 5 }))).toBe('1–5');
    expect(incomeDayLabel(income({ is_variable: true }))).toBe('variable');
    expect(incomeDayLabel(income({
      schedules: [
        { ordinal: 1, expected_day_from: 15, expected_day_to: 15 },
        { ordinal: 2, expected_day_from: 30, expected_day_to: 30 },
      ] as IncomeSource['attributes']['schedules'],
    }))).toBe('15 y 30');
  });

  it('alterna el orden desde el encabezado', () => {
    expect(nextSort({ sort_by: 'date', sort_dir: 'desc' }, 'date')).toEqual({ sort_by: 'date', sort_dir: 'asc' });
    expect(nextSort({ sort_by: 'date', sort_dir: 'asc' }, 'amount', 'desc')).toEqual({ sort_by: 'amount', sort_dir: 'desc' });
  });

  it('mapea los filtros rápidos a los filtros que ya existen', () => {
    expect(txQuickFilters('pending')).toEqual({ transaction_type: '', status: 'pending' });
    expect(txQuickFilters('income')).toEqual({ transaction_type: 'income', status: '' });
    expect(txQuickOf({ transaction_type: '', status: '' })).toBe('all');
    expect(txQuickOf({ transaction_type: 'expense', status: '' })).toBe('expense');
    expect(txQuickOf({ transaction_type: '', status: 'pending' })).toBe('pending');
    expect(txQuickOf({ transaction_type: 'income', status: 'pending' })).toBeNull();
  });
});
