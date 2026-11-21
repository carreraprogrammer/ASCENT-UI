// TCW-27: deuda para probar la cifra principal (saldo) del panel. Tipada contra Debt: si el tipo cambia, tsc lo delata.
import type { Debt } from '../../src/types/finance.types';

export const DEBT_1500000: Debt = {
  id: 'd27',
  type: 'debts',
  attributes: {
    name: 'Crédito de libre inversión',
    debt_type: 'personal_loan',
    original_amount: 3000000,
    current_balance: 1500000,
    monthly_payment: 250000,
    interest_rate: 1.8,
    status: 'active',
    payoff_date: null,
    notes: null,
  },
};
