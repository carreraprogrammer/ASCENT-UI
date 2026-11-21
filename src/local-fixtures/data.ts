// TCW-5: datos de ejemplo para la API simulada. Todo inventado, en COP (enteros), nada real de nadie.
// Solo se carga con VITE_LOCAL_FIXTURES=1 (ver src/main.tsx); el build de producción no lo incluye.
export const LOCAL_FIXTURES_MARKER = '__LOCAL_FIXTURES_MARKER__';
export const EXAMPLE_EMAIL = 'ejemplo@ascent.local';
export const EXAMPLE_NAME = 'Camila Ejemplo';
export const EXAMPLE_USER_ID = 9001;

type Row = Record<string, any>;
const pad = (n: number) => String(n).padStart(2, '0');

export interface FixtureState {
  year: number;
  month: number;
  categories: Row[];
  subcategories: Row[];
  transactions: Row[];
  debts: Row[];
  budgets: Row[];
  incomeSources: Row[];
  recurring: Row[];
  planned: Row[];
  sinkingFunds: Row[];
  savingsGoals: Row[];
  milestones: Row[];
  nextId: number;
}

const CATEGORIES = [
  { id: 1, code: 'committed', name: 'Compromisos', category_type: 'committed', color: 'var(--color-committed)', icon: 'lockClosedOutline' },
  { id: 2, code: 'necessary', name: 'Necesario', category_type: 'necessary', color: 'var(--color-necessary)', icon: 'homeOutline' },
  { id: 3, code: 'discretionary', name: 'Discrecional', category_type: 'discretionary', color: 'var(--color-discretionary)', icon: 'giftOutline' },
  { id: 4, code: 'income', name: 'Ingresos', category_type: 'income', color: 'var(--color-income)', icon: 'cashOutline' },
];

const SUBCATEGORIES = [
  { id: 10, code: 'arriendo', name: 'Arriendo', icon: 'homeOutline', cat: 1 },
  { id: 11, code: 'cuota_credito', name: 'Cuota de crédito', icon: 'cardOutline', cat: 1 },
  { id: 12, code: 'internet_celular', name: 'Internet y celular', icon: 'phonePortraitOutline', cat: 1 },
  { id: 13, code: 'mercado', name: 'Mercado', icon: 'cartOutline', cat: 2 },
  { id: 14, code: 'transporte', name: 'Transporte', icon: 'busOutline', cat: 2 },
  { id: 15, code: 'servicios_publicos', name: 'Servicios públicos', icon: 'flashOutline', cat: 2 },
  { id: 16, code: 'salud', name: 'Salud', icon: 'medkitOutline', cat: 2 },
  { id: 17, code: 'restaurantes', name: 'Restaurantes', icon: 'restaurantOutline', cat: 3 },
  { id: 18, code: 'entretenimiento', name: 'Entretenimiento', icon: 'filmOutline', cat: 3 },
  { id: 19, code: 'cafe', name: 'Café', icon: 'cafeOutline', cat: 3 },
  { id: 20, code: 'ropa', name: 'Ropa', icon: 'shirtOutline', cat: 3 },
  { id: 21, code: 'salario', name: 'Salario', icon: 'briefcaseOutline', cat: 4 },
  { id: 22, code: 'freelance', name: 'Trabajos independientes', icon: 'laptopOutline', cat: 4 },
];

// día, concepto, producto, monto, tipo, estado, origen, categoría, subcategoría, extras
type TxSeed = [number, string, string, number, 'expense' | 'income', 'confirmed' | 'pending', string, number | null, number | null, Row?];
const TX_SEEDS: TxSeed[] = [
  [1, 'Nómina del mes', 'Transferencia', 3800000, 'income', 'confirmed', 'gmail', 4, 21, { income_source_id: 1 }],
  [2, 'Arriendo apartamento', 'Transferencia', 1250000, 'expense', 'confirmed', 'manual', 1, 10, { recurring_obligation_id: 1, payment_source: 'debit' }],
  [3, 'Cuota crédito de libre inversión', 'Débito automático', 420000, 'expense', 'confirmed', 'gmail', 1, 11, { debt_id: 1, recurring_obligation_id: 2, payment_source: 'debit' }],
  [3, 'Internet y celular', 'Débito automático', 145000, 'expense', 'confirmed', 'gmail', 1, 12, { recurring_obligation_id: 3, payment_source: 'debit' }],
  [4, 'Mercado semanal', 'Supermercado', 286500, 'expense', 'confirmed', 'gmail', 2, 13, { payment_source: 'debit' }],
  [5, 'Transporte público', 'Recarga tarjeta', 48000, 'expense', 'confirmed', 'manual', 2, 14, { payment_source: 'cash' }],
  [6, 'Servicios públicos', 'Pago en línea', 198300, 'expense', 'confirmed', 'gmail', 2, 15, { recurring_obligation_id: 4, payment_source: 'debit' }],
  [7, 'Consulta médica', 'Copago', 95000, 'expense', 'confirmed', 'telegram', 2, 16, { payment_source: 'debit' }],
  [8, 'Cena con amigas', 'Restaurante', 132000, 'expense', 'confirmed', 'gmail', 3, 17, { payment_source: 'credit_card', credit_card_status: 'settled' }],
  [9, 'Proyecto de diseño independiente', 'Transferencia', 650000, 'income', 'confirmed', 'manual', 4, 22, { income_source_id: 2 }],
  [10, 'Cine y crispetas', 'Cine', 54000, 'expense', 'confirmed', 'gmail', 3, 18, { payment_source: 'credit_card', credit_card_status: 'pending' }],
  [11, 'Café y panadería', 'Cafetería', 23500, 'expense', 'confirmed', 'brain', 3, 19, { payment_source: 'cash' }],
  [12, 'Mercado de la quincena', 'Supermercado', 214900, 'expense', 'pending', 'gmail', 2, 13, { payment_source: 'debit' }],
  [13, 'Compra de ropa', 'Centro comercial', 189000, 'expense', 'pending', 'gmail', 3, 20, { payment_source: 'credit_card', credit_card_status: 'pending' }],
  [14, 'Pago sin identificar', 'Comercio no reconocido', 76000, 'expense', 'pending', 'gmail', null, null, { payment_source: 'debit' }],
  [14, 'Compra en comercio sin clasificar', 'Datáfono', 31000, 'expense', 'confirmed', 'telegram', null, null, { payment_source: 'debit' }],
  [15, 'Taxi al aeropuerto', 'Aplicación de transporte', 62000, 'expense', 'confirmed', 'telegram', 2, 14, { payment_source: 'credit_card', credit_card_status: 'pending' }],
  [16, 'Domicilio del almuerzo', 'Aplicación de domicilios', 38000, 'expense', 'confirmed', 'brain', 3, 17, { payment_source: 'debit' }],
];

const catById = (id: number) => CATEGORIES.find((c) => c.id === id)!;

export const createFixtureState = (now: Date = new Date()): FixtureState => {
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const today = now.getDate();
  const iso = (day: number, hour = 9) => `${year}-${pad(month)}-${pad(Math.min(day, today))}T${pad(hour)}:15:00.000Z`;
  const dateOnly = (day: number) => `${year}-${pad(month)}-${pad(Math.min(day, today))}`;
  const monthsAhead = (n: number, day = 15) => {
    const d = new Date(year, month - 1 + n, day);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  const categories = CATEGORIES.map((c) => ({
    id: String(c.id),
    type: 'category',
    attributes: { name: c.name, code: c.code, category_type: c.category_type, color: c.color, icon: c.icon },
    relationships: {
      subcategories: {
        data: SUBCATEGORIES.filter((s) => s.cat === c.id).map((s) => ({
          id: String(s.id), type: 'subcategory', attributes: { name: s.name, code: s.code, icon: s.icon },
        })),
      },
    },
  }));

  const subcategories = SUBCATEGORIES.map((s) => ({
    id: String(s.id),
    type: 'subcategory',
    attributes: {
      name: s.name, code: s.code, icon: s.icon, is_system: true, user_id: null,
      transaction_count: TX_SEEDS.filter((t) => t[8] === s.id).length,
      description: null,
      category_id: s.cat,
      categories: [{ id: s.cat, category_type: catById(s.cat).category_type, color: catById(s.cat).color }],
    },
  }));

  const transactions = TX_SEEDS.map((t, i) => {
    const [day, concept, product, amount, transaction_type, status, source, category_id, subcategory_id, extra] = t;
    const id = String(i + 1);
    return {
      id,
      type: 'transaction',
      attributes: {
        date: dateOnly(day), concept, product, amount, transaction_type,
        category_type: category_id ? catById(category_id).category_type : null,
        status, source, category_id, subcategory_id, source_event_id: null,
        month, year, payment_source: null, credit_card_status: null, debt_id: null,
        recurring_obligation_id: null, income_source_id: null, sinking_fund_id: null,
        metadata: null, covers_period_month: null, covers_period_year: null,
        created_at: iso(day), updated_at: iso(day),
        ...(extra ?? {}),
      },
      relationships: {
        category: { data: category_id ? { id: String(category_id), type: 'category' } : null },
        subcategory: { data: subcategory_id ? { id: String(subcategory_id), type: 'subcategory' } : null },
      },
    };
  });

  const debts = [
    { id: '1', name: 'Crédito de libre inversión', debt_type: 'personal_loan', original_amount: 12000000, current_balance: 7350000, monthly_payment: 420000, interest_rate: 1.9, status: 'active', payoff_date: monthsAhead(18, 3), notes: 'Cuota por débito automático el día 3.' },
    { id: '2', name: 'Tarjeta de crédito Visa', debt_type: 'credit_card', original_amount: 5000000, current_balance: 1860000, monthly_payment: 180000, interest_rate: 2.1, status: 'active', payoff_date: monthsAhead(11, 20), notes: null },
    { id: '3', name: 'Préstamo familiar', debt_type: 'family', original_amount: 2000000, current_balance: 800000, monthly_payment: 100000, interest_rate: 0, status: 'active', payoff_date: monthsAhead(8, 28), notes: 'Sin intereses.' },
  ].map(({ id, ...attributes }) => ({ id, type: 'debt', attributes: { ...attributes, interest_last_applied_on: dateOnly(1) } }));

  const budgets = [
    { id: '1', category_id: 1, category_name: 'Compromisos', amount_limit: 2015000 },
    { id: '2', category_id: 2, category_name: 'Necesario', amount_limit: 1100000 },
    { id: '3', category_id: 3, category_name: 'Discrecional', amount_limit: 650000 },
  ].map(({ id, ...a }) => ({ id, type: 'budget', attributes: { ...a, month, year } }));

  const incomeSources = [
    { id: '1', name: 'Nómina', expected_day_from: 1, expected_day_to: 3, expected_amount: 3800000, is_variable: false, classification: 'base', cadence: 'monthly', reliability_score: 0.98, last_confirmed_at: iso(1), evidence_source: 'gmail', notes: null, schedules: [], active: true },
    { id: '2', name: 'Diseño independiente', expected_day_from: 5, expected_day_to: 25, expected_amount: 650000, is_variable: true, classification: 'variable', cadence: 'irregular', reliability_score: 0.6, last_confirmed_at: iso(9), evidence_source: 'manual', notes: null, schedules: [], active: true },
  ].map(({ id, ...attributes }) => ({ id, type: 'income_source', attributes }));

  const rec = (id: string, name: string, amount: number, due_day: number, cat: number, sub: number, extra: Row = {}) => ({
    id, type: 'recurring_obligation',
    attributes: {
      name, amount, due_day, active: true, end_date: null, temporary: false,
      category_id: cat, category_name: catById(cat).name, category_code: catById(cat).code, category_color: catById(cat).color,
      subcategory_id: sub, subcategory_code: SUBCATEGORIES.find((s) => s.id === sub)!.code,
      subcategory_name: SUBCATEGORIES.find((s) => s.id === sub)!.name, subcategory_icon: SUBCATEGORIES.find((s) => s.id === sub)!.icon,
      source_type: null, source_id: null, notes: null, ...extra,
    },
  });
  const recurring = [
    rec('1', 'Arriendo', 1250000, 2, 1, 10),
    rec('2', 'Cuota del crédito', 420000, 3, 1, 11, { source_type: 'Debt', source_id: 1 }),
    rec('3', 'Internet y celular', 145000, 3, 1, 12),
    rec('4', 'Servicios públicos', 200000, 6, 2, 15),
    rec('5', 'Cuota de la tarjeta Visa', 180000, 20, 1, 11, { source_type: 'Debt', source_id: 2 }),
  ];

  const planned = [
    { id: '1', name: 'Seguro del carro', amount_estimated: 1400000, target_date: monthsAhead(3, 10), planning_type: 'mandatory_one_off', status: 'planned', category_id: 2, category_name: 'Necesario', category_code: 'necessary', subcategory_id: 14, subcategory_name: 'Transporte', sinking_fund: null, notes: 'Renovación anual.' },
    { id: '2', name: 'Viaje a la costa', amount_estimated: 2200000, target_date: monthsAhead(5, 18), planning_type: 'wish', status: 'planned', category_id: 3, category_name: 'Discrecional', category_code: 'discretionary', subcategory_id: 18, subcategory_name: 'Entretenimiento', sinking_fund: null, notes: null },
    { id: '3', name: 'Mantenimiento de la moto', amount_estimated: 380000, target_date: monthsAhead(1, 22), planning_type: 'irregular_maintenance', status: 'planned', category_id: 2, category_name: 'Necesario', category_code: 'necessary', subcategory_id: 14, subcategory_name: 'Transporte', sinking_fund: null, notes: null },
  ].map(({ id, ...attributes }) => ({ id, type: 'planned_expense', attributes }));

  const sinkingFunds = [
    { id: 1, name: 'Fondo del seguro', monthly_contribution: 350000, target_amount: 1400000, target_date: monthsAhead(3, 10), current_balance: 700000, budget_category: 'necessary', planned_expense_id: 1, auto_debit: false, debit_day: 5, last_auto_debit_on: null, notes: null, active: true },
    { id: 2, name: 'Fondo del viaje', monthly_contribution: 400000, target_amount: 2200000, target_date: monthsAhead(5, 18), current_balance: 800000, budget_category: 'discretionary', planned_expense_id: 2, auto_debit: true, debit_day: 5, last_auto_debit_on: dateOnly(5), notes: null, active: true },
  // La API real devuelve estos recursos planos (id numérico); aquí van además en forma JSON:API (id texto, attributes).
  ].map((f) => ({ ...f, id: String(f.id), created_at: iso(1), updated_at: iso(1), type: 'sinking_fund', attributes: { ...f } }));

  const goal = (id: number, name: string, target: number, current: number, monthly: number, months: number, priority: number) => {
    const g = {
      id, user_id: EXAMPLE_USER_ID, account_id: null, name, target_amount: target, current_amount: current,
      target_date: monthsAhead(months, 28), monthly_contribution: monthly, monthly_contribution_needed: Math.round((target - current) / months),
      status: 'active', priority, created_at: iso(1), updated_at: iso(1),
    };
    return { ...g, id: String(id), type: 'savings_goal', attributes: { ...g } };
  };
  const savingsGoals = [
    goal(1, 'Fondo de emergencia', 9000000, 3600000, 450000, 12, 1),
    goal(2, 'Computador nuevo', 4500000, 1500000, 250000, 10, 2),
  ];

  const milestones = [
    { id: 1, code: 'first_transaction', achieved_at: iso(1), metadata: {} },
    { id: 2, code: 'first_budget', achieved_at: iso(2), metadata: {} },
  ].map((m) => ({ ...m, id: String(m.id), type: 'milestone', attributes: { ...m } }));

  return { year, month, categories, subcategories, transactions, debts, budgets, incomeSources, recurring, planned, sinkingFunds, savingsGoals, milestones, nextId: 1000 };
};

// ── Derivados: resumen del Dashboard, plan del mes, completitud ──────────────────────────────

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

export const buildSummary = (s: FixtureState, now: Date = new Date()) => {
  const tx = s.transactions.map((t) => t.attributes);
  const inc = (status: string) => sum(tx.filter((t) => t.transaction_type === 'income' && t.status === status).map((t) => t.amount));
  const exp = (status: string) => sum(tx.filter((t) => t.transaction_type === 'expense' && t.status === status).map((t) => t.amount));
  const debtPayments = sum(tx.filter((t) => t.debt_id != null && t.status === 'confirmed').map((t) => t.amount));
  const carry = 320000;
  const balanceConfirmed = inc('confirmed') - exp('confirmed');
  const daysInMonth = new Date(s.year, s.month, 0).getDate();
  const daysElapsed = Math.max(1, Math.min(now.getDate(), daysInMonth));

  const burn = s.budgets.map((b) => {
    const catId = b.attributes.category_id;
    const spent = sum(tx.filter((t) => t.category_id === catId && t.transaction_type === 'expense' && t.status === 'confirmed').map((t) => t.amount));
    const budget = b.attributes.amount_limit;
    const projected = Math.round((spent / daysElapsed) * daysInMonth);
    const c = catById(catId);
    return {
      category: c.name, category_type: c.category_type, category_id: catId, budget, spent, projected,
      pct: Math.round((spent / budget) * 100), on_track: projected <= budget, alert: projected > budget ? 'Vas por encima del ritmo del mes.' : null,
      subcategories: SUBCATEGORIES.filter((sc) => sc.cat === catId).map((sc) => ({
        subcategory: sc.name, subcategory_id: sc.id, budget: Math.round(budget / 4),
        spent: sum(tx.filter((t) => t.subcategory_id === sc.id && t.status === 'confirmed').map((t) => t.amount)),
      })),
    };
  });

  const totalBalance = sum(s.debts.map((d) => d.attributes.current_balance));
  const monthly = sum(s.debts.map((d) => d.attributes.monthly_payment));
  const status = (expected: number, covered: number) => (covered >= expected ? 'covered' : covered > 0 ? 'partial' : 'pending');
  const recurringItems = s.recurring.map((r) => {
    const covered = sum(tx.filter((t) => t.recurring_obligation_id === Number(r.id) && t.status === 'confirmed').map((t) => t.amount));
    const expected = r.attributes.amount;
    return {
      id: Number(r.id), name: r.attributes.name, expected_amount: expected, covered_amount: Math.min(covered, expected),
      remaining_amount: Math.max(expected - covered, 0), pct: Math.min(100, Math.round((covered / expected) * 100)),
      status: status(expected, covered), due_day: r.attributes.due_day, category_id: r.attributes.category_id,
      category_code: r.attributes.category_code, subcategory_id: r.attributes.subcategory_id,
      subcategory_code: r.attributes.subcategory_code, subcategory_icon: r.attributes.subcategory_icon,
      source_type: r.attributes.source_type, source_id: r.attributes.source_id,
    };
  });
  const incomeSources = s.incomeSources.map((i) => {
    const delivered = sum(tx.filter((t) => t.income_source_id === Number(i.id) && t.status === 'confirmed').map((t) => t.amount));
    const expected = i.attributes.expected_amount;
    return {
      id: Number(i.id), name: i.attributes.name, classification: i.attributes.classification, expected_amount: expected,
      delivered_amount: delivered, remaining_amount: Math.max(expected - delivered, 0), pct: Math.min(100, Math.round((delivered / expected) * 100)),
      status: status(expected, delivered), expected_day_from: i.attributes.expected_day_from, expected_day_to: i.attributes.expected_day_to,
    };
  });
  const bucket = (variable: boolean) => {
    const rows = incomeSources.filter((i) => (i.classification === 'variable') === variable);
    const expected = sum(rows.map((r) => r.expected_amount));
    const delivered = sum(rows.map((r) => r.delivered_amount));
    return { expected_total: expected, delivered_total: delivered, remaining_total: Math.max(expected - delivered, 0), pct: expected ? Math.round((delivered / expected) * 100) : 0 };
  };
  const expectedIncome = sum(incomeSources.map((i) => i.expected_amount));
  const deliveredIncome = sum(incomeSources.map((i) => i.delivered_amount));
  const recExpected = sum(recurringItems.map((r) => r.expected_amount));
  const recCovered = sum(recurringItems.map((r) => r.covered_amount));

  return {
    period: { month: s.month, year: s.year },
    balance: {
      income_confirmed: inc('confirmed'), income_pending: inc('pending'),
      expense_confirmed: exp('confirmed'), expense_pending: exp('pending'),
      debt_payments_confirmed: debtPayments, sinking_fund_contributions: 750000,
      balance_confirmed: balanceConfirmed, balance_total: balanceConfirmed + carry, carryover_from_previous_month: carry,
      net_balance: balanceConfirmed + carry - exp('pending'),
    },
    month_execution: {
      income: {
        expected_total: expectedIncome, delivered_expected_total: deliveredIncome, remaining_expected_total: Math.max(expectedIncome - deliveredIncome, 0),
        pct: Math.round((deliveredIncome / expectedIncome) * 100), confirmed_income_total: inc('confirmed'), unlinked_confirmed_total: 0,
        base: bucket(false), variable: bucket(true), sources: incomeSources,
      },
      recurring_obligations: {
        expected_total: recExpected, covered_total: recCovered, remaining_total: Math.max(recExpected - recCovered, 0),
        pct: Math.round((recCovered / recExpected) * 100), covered_count: recurringItems.filter((r) => r.status === 'covered').length,
        total_count: recurringItems.length, items: recurringItems,
      },
    },
    burn_rate: { days_elapsed: daysElapsed, days_in_month: daysInMonth, categories: burn },
    debts: {
      total_balance: totalBalance, original_total: sum(s.debts.map((d) => d.attributes.original_amount)), monthly_payments: monthly,
      recommended_payment: { id: 2, name: 'Tarjeta de crédito Visa', balance: 1860000, strategy: 'avalanche' },
    },
    monthly_plan: {
      id: 1, status: 'confirmed', mode: 'conservative', base_budget_income: 3800000, expected_variable_income: 650000,
      recurring_obligations_total: recExpected, debt_minimums_total: monthly, protected_buffer_amount: 300000, discretionary_limit: 650000,
      overflow_rule: 'to_debt', reward_pct: 10, debt_strategy: 'avalanche', confirmed_at: `${s.year}-${pad(s.month)}-01T10:00:00.000Z`,
    },
    overflow_status: {
      rule: 'to_debt', base_budget_income: 3800000, confirmed_income: inc('confirmed'), expected_variable_income: 650000,
      realized_expected_variable_income: 650000, realized_overflow: 0, remaining_expected_overflow: 0, status: 'waiting',
    },
    financial_context: financialContext(),
    cash_flow_runway: {
      confirmed_balance: balanceConfirmed + carry, daily_necessary_burn: 38000, days_to_next_income: 14, next_income_day: 1,
      next_income_classification: 'base', next_income_name: 'Nómina', committed_before_next_income: 380000, committed_obligations: [
        { id: 5, name: 'Cuota de la tarjeta Visa', due_day: 20, expected: 180000, paid: 0, remaining: 180000 },
      ],
      runway_days: 42, effective_runway_days: 33, buffer_days: 19, commitment_gap: 0, health_status: 'comfortable', burn_window_days: 30, has_sufficient_history: true,
    },
    savings_goals: s.savingsGoals.map((g) => ({
      name: g.attributes.name, target_amount: g.attributes.target_amount, current_amount: g.attributes.current_amount,
      monthly_contribution_needed: g.attributes.monthly_contribution_needed, target_date: g.attributes.target_date, status: g.attributes.status,
    })),
  };
};

export const financialContext = () => ({
  phase: 'estructura', strategy: 'avalanche', monthly_surplus_estimate: 410000,
  recommended_action: 'Abona el excedente a la tarjeta Visa, que cobra la tasa más alta.', monthly_goal_contribution: 700000,
});

export const buildCompleteness = (s: FixtureState) => ({
  period: { month: s.month, year: s.year },
  dimensions: {
    income: { status: 'sufficient' }, recurring_obligations: { status: 'sufficient' }, debts: { status: 'sufficient' },
    transactions: { status: 'pending_confirmation', message: 'Hay movimientos por confirmar.' },
  },
  missing: [], partial: [], stale: [], pending_confirmation: ['transactions'], conflicting: [],
});

export const buildCurrentPlan = (s: FixtureState) => {
  const summary = buildSummary(s);
  const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  return {
    id: '1', month: s.month, year: s.year, status: 'confirmed', mode: 'conservative', total_income: 4450000,
    month_label: `${monthNames[s.month - 1]} ${s.year}`, confirmed_at: `${s.year}-${pad(s.month)}-01T10:00:00.000Z`,
    categories: summary.burn_rate.categories.map((c) => {
      const ratio = c.budget ? c.spent / c.budget : 0;
      const signal = c.projected > c.budget ? 'attention' : ratio > 0.5 ? 'neutral' : 'positive';
      const cat = catById(c.category_id);
      return {
        code: cat.code, name: cat.name, color: cat.color, icon: cat.icon, budgeted: c.budget, spent: c.spent, projected: c.projected,
        signal_kind: signal,
        signal_label: signal === 'attention' ? 'Atención' : signal === 'positive' ? 'Vas bien' : 'En ritmo',
        signal_detail: signal === 'attention' ? 'A este ritmo superas el límite.' : 'Dentro del límite del mes.',
        subcategories: (c.subcategories ?? []).map((sc) => {
          const sub = SUBCATEGORIES.find((x) => x.id === sc.subcategory_id)!;
          return { id: sub.id, code: sub.code, name: sub.name, icon: sub.icon, budgeted: sc.budget, spent: sc.spent, projected: sc.spent };
        }),
      };
    }),
  };
};

export const buildMonthlyPlanHistory = (s: FixtureState) => {
  const prev = new Date(s.year, s.month - 2, 1);
  return [{
    id: 0, month: prev.getMonth() + 1, year: prev.getFullYear(), status: 'closed', mode: 'conservative', base_budget_income: 3800000,
    expected_variable_income: 600000, recurring_obligations_total: 2195000, debt_minimums_total: 700000, discretionary_limit: 600000,
    income_actual: 4350000, expense_actual: 3920000, closed_at: `${prev.getFullYear()}-${pad(prev.getMonth() + 1)}-28T20:00:00.000Z`,
    confirmed_at: `${prev.getFullYear()}-${pad(prev.getMonth() + 1)}-01T10:00:00.000Z`, assumptions: {}, execution_snapshot: {},
  }];
};

export const buildWizardData = (s: FixtureState) => ({
  income: { sources: [{ name: 'Nómina', monthly_amount: 3800000, is_variable: false }, { name: 'Diseño independiente', monthly_amount: 650000, is_variable: true }], suggested_total: 4450000, source_of_truth: 'income_sources', can_edit_in_wizard: false, needs_setup: false },
  categories: CATEGORIES.filter((c) => c.id !== 4).map((c) => ({
    id: String(c.id), code: c.code, name: c.name, color: c.color, icon: c.icon, description: '',
    subcategories: SUBCATEGORIES.filter((x) => x.cat === c.id).map((x) => ({ code: x.code, name: x.name, icon: x.icon, suggested_amount: 150000, confidence: 'medium' as const })),
    suggested_total: SUBCATEGORIES.filter((x) => x.cat === c.id).length * 150000,
  })),
  goal_contribution: { amount: 700000, label: 'Metas de ahorro', phase: 'estructura', configured: true },
  carryover_from_previous: 320000, phase: 'estructura',
  meta: { income_total: 4450000, goal_contribution: 700000, available_pool: 3750000, committed_total: 2195000, flexible_total: 1555000, assigned_total: 3750000, unassigned: 0, por_asignar: 0, overassigned: false },
  month: s.month,
});

export const buildProposal = (s: FixtureState) => ({
  income: { fixed_total: 3800000, variable_projection: 390000, planning_income: 4190000, include_variable: true, fixed_sources: [{ name: 'Nómina', amount: 3800000 }], variable_sources: [{ name: 'Diseño independiente', expected_amount: 650000, reliability_score: 0.6, conservative_projection: 390000 }] },
  committed: { obligations_total: 2195000, debt_minimums_total: 700000, sinking_funds_total: 750000, goal_contribution: 700000, total: 3645000 },
  sinking_funds: [{ id: 1, name: 'Fondo del seguro', monthly_contribution: 350000 }, { id: 2, name: 'Fondo del viaje', monthly_contribution: 400000 }],
  categories: [], available_categories: [], free_margin: 545000, has_history: true, mode: 'data_driven', warnings: [], existing_plan: null,
  month: s.month, year: s.year,
});

export const buildNightAnalysis = (s: FixtureState, date: string) => ({
  id: 1, account_id: 1, analysis_date: date, health_status: 'comfortable', commitment_gap: 0, daily_burn: 38000, days_to_next_income: 14,
  category_alerts: [], transactions_context: { matched: [], unmatched: [], needs_review: [] }, agent_reasoning: null, agent_insight: null,
  created_at: `${date}T05:00:00.000Z`,
});

export const buildInsight = () => ({
  id: 1, account_id: 1, insightable_type: 'NightAnalysis', insightable_id: 1, insight_kind: 'tip',
  title: 'Tu mes va en ritmo', body: 'Llevas el gasto flexible por debajo del límite. Si sigues así, puedes abonar el excedente a la tarjeta Visa.',
  status: 'new', agent_reasoning: null, generated_at: new Date().toISOString(), created_at: new Date().toISOString(),
});
