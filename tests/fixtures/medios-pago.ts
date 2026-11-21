// TCW-27: Medio de pago como control segmentado con texto. Los valores son los PaymentSource reales de la API;
// las etiquetas son las del ticket (Tarjeta, Cuenta, Efectivo). Lo verifica TransactionComposer.test.tsx (CA6).
export const MEDIOS_PAGO = [
  { value: 'credit_card', label: 'Tarjeta' },
  { value: 'debit', label: 'Cuenta' },
  { value: 'cash', label: 'Efectivo' },
] as const;
