// TCW-5: gavetas del filtro "Gaveta" de Movimientos (mismo contrato que TransactionsPage: color = var(--color-<code>)).
export const GAVETAS_FILTRO = [
  { value: 'c1', label: 'Comprometido', color: 'var(--color-committed)' },
  { value: 'c2', label: 'Necesario', color: 'var(--color-necessary)' },
  { value: 'c3', label: 'Flexible', color: 'var(--color-discretionary)' },
] as const;
