// TCW-5: adaptador de axios en memoria. Responde /api/v1/* con los datos de ejemplo, en la forma JSON:API que
// normaliza `financeService`. Lecturas: fixtures. POST/PATCH/DELETE: mutan una copia en memoria (nada sale a la red).
// Ruta sin fixture: 404 `fixture_missing` y console.warn (un hueco se ve, no se calla).
import { AxiosError, type AxiosAdapter, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import {
  LOCAL_FIXTURES_MARKER,
  buildCompleteness, buildCurrentPlan, buildInsight, buildMonthlyPlanHistory, buildNightAnalysis,
  buildProposal, buildSummary, buildWizardData, financialContext,
  type FixtureState,
} from './data';
import { exampleAuthEnvelope, exampleMe } from './session';

type Row = Record<string, any>;
type Query = Record<string, string>;
interface Ctx { m: RegExpMatchArray; query: Query; body: Row; s: FixtureState }
type Reply = [status: number, data: unknown];
type Handler = (ctx: Ctx) => Reply | Promise<Reply>;
interface Route { method: string; re: RegExp; run: Handler }

const API = '/api/v1';
const ok = (data: unknown): Reply => [200, data];
const list = (rows: Row[], meta?: Row): Reply => ok({ data: rows, ...(meta ? { meta } : {}) });
const one = (row: Row | undefined): Reply => (row ? ok({ data: row }) : [404, { error: 'not_found' }]);

const matches = (value: unknown, wanted?: string) => wanted == null || wanted === '' || String(value ?? '') === wanted;
const hasText = (row: Row, q?: string, keys: string[] = ['name', 'concept', 'product']) =>
  !q || keys.some((k) => String(row.attributes[k] ?? '').toLowerCase().includes(q.toLowerCase()));

const sortRows = (rows: Row[], by?: string, dir?: string, fallback = 'date') => {
  const key = by || fallback;
  const sign = dir === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    const x = a.attributes[key];
    const y = b.attributes[key];
    const cmp = typeof x === 'number' && typeof y === 'number' ? x - y : String(x ?? '').localeCompare(String(y ?? ''));
    return cmp !== 0 ? sign * cmp : sign * (Number(a.id) - Number(b.id));
  });
};

const maybeSort = (rows: Row[], q: Query) => (q.sort_by ? sortRows(rows, q.sort_by, q.sort_dir) : rows);

const paginate =(rows: Row[], q: Query): Reply => {
  const perPage = Number(q.per_page) || 0;
  if (!perPage) return list(rows, { total: rows.length, page: 1, per_page: rows.length, total_pages: 1, has_next_page: false });
  const page = Math.max(1, Number(q.page) || 1);
  const totalPages = Math.max(1, Math.ceil(rows.length / perPage));
  return list(rows.slice((page - 1) * perPage, page * perPage), { total: rows.length, page, per_page: perPage, total_pages: totalPages, has_next_page: page < totalPages });
};

const txFilter = (s: FixtureState, q: Query, onlyPending = false) =>
  s.transactions.filter((t) => {
    const a = t.attributes;
    if (onlyPending && a.status !== 'pending') return false;
    if (!onlyPending && q.month && (matches(a.month, q.month) === false || matches(a.year, q.year) === false)) return false;
    return hasText(t, q.q) && matches(a.status, q.status) && matches(a.transaction_type, q.transaction_type)
      && matches(a.source, q.source) && matches(a.category_id, q.category_id) && matches(a.subcategory_id, q.subcategory_id);
  });

/** Tras editar una transacción: la gaveta (category_type) y las relaciones siguen a category_id / subcategory_id. */
const syncTransaction = (s: FixtureState, row: Row) => {
  const a = row.attributes;
  const cat = s.categories.find((c) => String(c.id) === String(a.category_id));
  a.category_type = cat ? cat.attributes.category_type : null;
  a.updated_at = new Date().toISOString();
  row.relationships = {
    ...(row.relationships ?? {}),
    category: { data: a.category_id != null ? { id: String(a.category_id), type: 'category' } : null },
    subcategory: { data: a.subcategory_id != null ? { id: String(a.subcategory_id), type: 'subcategory' } : null },
  };
};

type Collection = { rows: (s: FixtureState) => Row[]; singular: string; after?: (s: FixtureState, row: Row) => void; flat?: boolean };

/** Altas, cambios y bajas en memoria para un recurso. `flat`: la API real lo devuelve plano; aquí va plano y en attributes. */
const mutations = (base: string, c: Collection): Route[] => {
  const unwrap = (body: Row) => (body && typeof body[c.singular] === 'object' && body[c.singular] !== null ? body[c.singular] : body ?? {});
  const find = (s: FixtureState, id: string) => c.rows(s).find((r) => String(r.id) === id);
  const merge = (row: Row, patch: Row) => {
    Object.assign(row.attributes, patch);
    if (c.flat) Object.assign(row, patch);
  };
  return [
    {
      method: 'post', re: new RegExp(`^${base}$`),
      run: ({ s, body }) => {
        const id = String(s.nextId++);
        const row: Row = { id, type: c.singular, attributes: {} };
        merge(row, { ...unwrap(body), ...(c.flat ? { id } : {}) });
        row.id = id;
        c.after?.(s, row);
        c.rows(s).push(row);
        return [201, { data: row }];
      },
    },
    {
      method: 'patch', re: new RegExp(`^${base}/([^/]+)$`),
      run: ({ s, m, body }) => {
        const row = find(s, m[1]);
        if (!row) return [404, { error: 'not_found' }];
        const { id: _ignored, ...patch } = unwrap(body);
        merge(row, patch);
        c.after?.(s, row);
        return ok({ data: row });
      },
    },
    {
      method: 'delete', re: new RegExp(`^${base}/([^/]+)$`),
      run: ({ s, m }) => {
        const rows = c.rows(s);
        const i = rows.findIndex((r) => String(r.id) === m[1]);
        if (i >= 0) rows.splice(i, 1);
        return [204, ''];
      },
    },
  ];
};

const get = (path: string, run: Handler): Route => ({ method: 'get', re: new RegExp(`^${API}${path}$`), run });

const routes = (): Route[] => [
  // Sesión. /auth/login acepta cualquier credencial: no hay servidor, la única cuenta es la de ejemplo.
  { method: 'post', re: new RegExp(`^${API}/auth/login$`), run: () => ok(exampleAuthEnvelope()) },
  { method: 'post', re: new RegExp(`^${API}/auth/refresh$`), run: () => ok(exampleAuthEnvelope()) },
  { method: 'post', re: new RegExp(`^${API}/demo/session$`), run: () => ok(exampleAuthEnvelope()) },
  get('/auth/me', () => ok(exampleMe())),
  get('/forms/([^/]+)', ({ m }) => ok({ data: {
    id: m[1], type: 'form',
    attributes: {
      slug: m[1], title: 'Login', submit_endpoint: '/api/v1/auth/login', submit_method: 'POST',
      fields: [{ name: 'email', type: 'email', label: 'Email' }, { name: 'password', type: 'password', label: 'Password' }],
    },
  } })),
  get('/me/progress', () => ok({ data: { xp: 420, level: 3, streak_days: 6, readiness_score: 72, avatar_seed: 'camila-ejemplo', bypass_readiness: false, next_level_xp: 600 } })),
  get('/me/email_connection', () => ok({ data: { connected: true, needs_reconnect: false, bank_senders: ['alertas@ascent.local'] } })),
  { method: 'delete', re: new RegExp(`^${API}/me/email_connection$`), run: () => ok({ data: { connected: false } }) },
  { method: 'patch', re: new RegExp(`^${API}/me/email_connection/senders$`), run: ({ body }) => ok({ data: { bank_senders: body.bank_senders ?? [] } }) },

  // Dashboard
  get('/summary', ({ s }) => ok(buildSummary(s))),
  get('/completeness', ({ s }) => ok({ data: buildCompleteness(s) })),
  get('/financial_context', () => ok({ data: financialContext() })),
  { method: 'patch', re: new RegExp(`^${API}/financial_context$`), run: ({ body }) => ok({ data: { ...financialContext(), ...body } }) },
  get('/agent_insights/latest', () => ok({ data: buildInsight() })),
  { method: 'patch', re: new RegExp(`^${API}/agent_insights/([^/]+)$`), run: ({ body }) => ok({ data: { ...buildInsight(), ...body } }) },
  get('/night_analyses', ({ s }) => {
    const d = new Date(); d.setDate(d.getDate() - 1);
    const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return ok({ data: [buildNightAnalysis(s, day)] });
  }),
  get('/night_analyses/([^/]+)', ({ s, m }) => ok({ data: buildNightAnalysis(s, m[1]) })),
  get('/agent_events/pending', () => ok({ data: [] })),
  { method: 'patch', re: new RegExp(`^${API}/agent_events/([^/]+)/consume$`), run: () => ok({ data: {} }) },
  get('/chat_messages', () => ok({ data: [] })),
  { method: 'post', re: new RegExp(`^${API}/agents/chat$`), run: () => ok({ data: { session_id: 'local-fixtures' } }) },
  get('/milestones', ({ s }) => list(s.milestones)),

  // Transacciones (el orden importa: pending y needs_review antes de :id)
  get('/transactions', ({ s, query }) => paginate(sortRows(txFilter(s, query), query.sort_by, query.sort_dir), query)),
  get('/transactions/pending', ({ s, query }) => list(sortRows(txFilter(s, query, true), query.sort_by, query.sort_dir))),
  get('/transactions/needs_review', ({ s }) => ok({
    data: s.transactions.filter((t) => t.attributes.status === 'pending').map((t) => ({
      transaction_id: Number(t.id), concept: t.attributes.concept, amount: t.attributes.amount, date: t.attributes.date,
      reason: t.attributes.category_id == null ? 'no_classification' : 'unconfirmed',
    })),
  })),
  get('/transactions/([^/]+)', ({ s, m }) => one(s.transactions.find((t) => t.id === m[1]))),
  ...mutations(`${API}/transactions`, { rows: (s) => s.transactions, singular: 'transaction', after: syncTransaction }),

  // Catálogo
  get('/categories', ({ s }) => list(s.categories)),
  get('/subcategories', ({ s }) => list(s.subcategories)),
  ...mutations(`${API}/subcategories`, { rows: (s) => s.subcategories, singular: 'subcategory' }),

  // Deudas, recurrentes, planeados, ingresos
  get('/debts', ({ s, query }) => list(maybeSort(s.debts.filter((d) => hasText(d, query.q) && matches(d.attributes.status, query.status) && matches(d.attributes.debt_type, query.debt_type)), query))),
  get('/debts/([^/]+)', ({ s, m }) => one(s.debts.find((d) => d.id === m[1]))),
  ...mutations(`${API}/debts`, { rows: (s) => s.debts, singular: 'debt' }),
  get('/recurring_obligations', ({ s, query }) => list(maybeSort(s.recurring.filter((r) => hasText(r, query.q) && matches(r.attributes.category_id, query.category_id) && (query.active == null || query.active === 'all' || matches(r.attributes.active, query.active))), query))),
  ...mutations(`${API}/recurring_obligations`, { rows: (s) => s.recurring, singular: 'recurring_obligation' }),
  get('/planned_expenses', ({ s, query }) => list(s.planned.filter((p) => hasText(p, query.q) && matches(p.attributes.status, query.status) && matches(p.attributes.planning_type, query.planning_type) && matches(p.attributes.category_id, query.category_id)))),
  ...mutations(`${API}/planned_expenses`, { rows: (s) => s.planned, singular: 'planned_expense' }),
  get('/income_sources', ({ s, query }) => list(s.incomeSources.filter((i) => hasText(i, query.q) && (query.active == null || query.active === 'all' || matches(i.attributes.active, query.active))))),
  ...mutations(`${API}/income_sources`, { rows: (s) => s.incomeSources, singular: 'income_source' }),

  // Presupuestos, planes, metas
  get('/budgets', ({ s, query }) => list(s.budgets.filter((b) => matches(b.attributes.month, query.month) && matches(b.attributes.year, query.year) && matches(b.attributes.category_id, query.category_id)))),
  ...mutations(`${API}/budgets`, { rows: (s) => s.budgets, singular: 'budget' }),
  get('/monthly_plans', ({ s }) => ok({ data: buildMonthlyPlanHistory(s), meta: { total: 1, page: 1, per_page: 20, total_pages: 1, has_next_page: false } })),
  get('/monthly_plans/current', ({ s }) => ok({ data: buildCurrentPlan(s) })),
  get('/monthly_plans/propose', ({ s }) => ok({ data: buildProposal(s) })),
  get('/monthly_plans/wizard_data', ({ s }) => ok({ data: buildWizardData(s) })),
  { method: 'post', re: new RegExp(`^${API}/monthly_plans/generate$`), run: () => ok({ data: { id: '1', status: 'draft' } }) },
  { method: 'post', re: new RegExp(`^${API}/monthly_plans/([^/]+)/(confirm|close)$`), run: ({ s }) => ok({ data: buildMonthlyPlanHistory(s)[0] }) },
  get('/savings_goals', ({ s }) => list(s.savingsGoals)),
  ...mutations(`${API}/savings_goals`, { rows: (s) => s.savingsGoals, singular: 'savings_goal', flat: true }),
  get('/sinking_funds', ({ s }) => list(s.sinkingFunds)),
  { method: 'post', re: new RegExp(`^${API}/sinking_funds/([^/]+)/withdraw$`), run: ({ s, m }) => ok({ data: { sinking_fund: s.sinkingFunds.find((f) => f.id === m[1]) } }) },
  ...mutations(`${API}/sinking_funds`, { rows: (s) => s.sinkingFunds, singular: 'sinking_fund', flat: true }),
];

const parseBody = (data: unknown): Row => {
  if (typeof data === 'string') {
    try { return JSON.parse(data) as Row; } catch { return {}; }
  }
  return (data as Row) ?? {};
};

export const createAdapter = (state: FixtureState): AxiosAdapter => {
  const table = routes();

  return (config: InternalAxiosRequestConfig) => {
    const method = String(config.method ?? 'get').toLowerCase();
    const url = new URL(String(config.url ?? ''), 'http://local.fixtures');
    const query: Query = {};
    url.searchParams.forEach((v, k) => { query[k] = v; });
    Object.entries((config.params ?? {}) as Row).forEach(([k, v]) => { if (v !== undefined && v !== null) query[k] = String(v); });

    const reply = async (): Promise<Reply> => {
      const path = url.pathname.replace(/\/+$/, '');
      for (const route of table) {
        const m = route.method === method ? path.match(route.re) : null;
        if (m) return route.run({ m, query, body: parseBody(config.data), s: state });
      }
      console.warn(`[local-fixtures] sin fixture para ${method.toUpperCase()} ${path}`);
      return [404, { error: 'fixture_missing', path }];
    };

    return reply().then(([status, data]) => {
      const response: AxiosResponse = {
        data, status, statusText: String(status), headers: { 'x-local-fixtures': LOCAL_FIXTURES_MARKER }, config, request: {},
      };
      const valid = config.validateStatus ? config.validateStatus(status) : status >= 200 && status < 300;
      if (valid) return response;
      throw new AxiosError(`Request failed with status code ${status}`, status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST, config, response.request, response);
    });
  };
};
