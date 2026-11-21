// TCW-27: el movimiento del ticket (monto 78.000, fecha 20 nov 2026). La API manda la fecha como dd/mm/yyyy.
import type { Transaction } from '../../src/types/finance.types';

export const TX_78000: Transaction = {
  id: '27',
  type: 'transaction',
  attributes: {
    date: '20/11/2026',
    concept: 'Netflix',
    product: '',
    amount: 78000,
    transaction_type: 'expense',
    status: 'confirmed',
    payment_source: 'debit',
    category_id: null,
    subcategory_id: null,
  },
};
