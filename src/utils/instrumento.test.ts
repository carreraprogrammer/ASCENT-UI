import { describe, expect, it } from 'vitest';
import { fmtAgo, fmtAmount, fmtDay, fmtSigned, originOf } from './instrumento';

describe('instrumento formats', () => {
  it('writes full figures with thousands and a real minus', () => {
    expect(fmtAmount(1600000)).toBe('1.600.000');
    expect(fmtAmount(-40000)).toBe('−40.000');
    expect(fmtAmount(3200000, { sign: 'always' })).toBe('+3.200.000');
    expect(fmtAmount(null)).toBe('—');
    expect(fmtSigned(17900, false)).toBe('−17.900');
    expect(fmtSigned(17900, true)).toBe('+17.900');
  });
  it('writes one date format', () => {
    const now = new Date(2026, 10, 16);
    expect(fmtDay('2026-11-15', now)).toBe('15 nov');
    expect(fmtDay('2025-03-01', now)).toBe('1 mar 2025');
  });
  it('writes relative times', () => {
    const now = new Date(2026, 10, 16, 10, 0);
    expect(fmtAgo(new Date(2026, 10, 16, 9, 56).toISOString(), now)).toBe('hace 4 min');
    expect(fmtAgo(new Date(2026, 10, 15, 23, 0).toISOString(), now)).toBe('ayer 23:00');
    expect(fmtAgo(null, now)).toBeNull();
  });
});

describe('originOf', () => {
  it('maps only what the API stores', () => {
    expect(originOf({ source: 'gmail' })).toBe('correo');
    expect(originOf({ source: 'gmail', metadata: { classification_source: 'pattern' } })).toBe('regla');
    expect(originOf({ source: 'gmail', metadata: { classification_source: 'agent' } })).toBe('agente');
    expect(originOf({ source: 'telegram' })).toBe('agente');
    expect(originOf({ source: 'brain' })).toBe('agente');
    expect(originOf({ source: 'brain', source_event_id: 'auto_debit:fund_1:2026-11' })).toBe('regla');
    expect(originOf({ source: 'manual' })).toBe('tu');
    expect(originOf({})).toBe('tu');
  });
});
