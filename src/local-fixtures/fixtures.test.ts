// TCW-5 T1 y T5: la API simulada en memoria (adaptador de axios) responde con fixtures en forma JSON:API.
import axios from 'axios';
import { installLocalFixtures } from './install';

const makeApi = () => {
  const api = axios.create({ baseURL: 'http://127.0.0.1:1' });
  installLocalFixtures(api);
  return api;
};
type Res = { id: string; type?: string; attributes: Record<string, any> };
const list = async (path: string) => {
  const r = await makeApi().get(path);
  expect(r.status).toBe(200);
  expect(Array.isArray(r.data.data)).toBe(true);
  return r.data.data as Res[];
};

const COLLECTIONS = [
  '/api/v1/transactions', '/api/v1/transactions/pending', '/api/v1/categories', '/api/v1/subcategories',
  '/api/v1/debts', '/api/v1/budgets', '/api/v1/income_sources', '/api/v1/recurring_obligations',
  '/api/v1/planned_expenses', '/api/v1/sinking_funds', '/api/v1/savings_goals', '/api/v1/milestones',
];
const SINGLES = [
  '/api/v1/summary', '/api/v1/financial_context', '/api/v1/completeness', '/api/v1/monthly_plans/current',
  '/api/v1/auth/me', '/api/v1/me/progress', '/api/v1/me/email_connection',
];

describe('TCW-5 T1: fixtures de la API simulada', () => {
  it.each(COLLECTIONS)('TCW-5 T1: GET %s responde 200 con data[] no vacío de {id,attributes}', async (path) => {
    const rows = await list(path);
    expect(rows.length).toBeGreaterThan(0);
    rows.forEach((r) => {
      expect(typeof r.id).toBe('string');
      expect(typeof r.attributes).toBe('object');
    });
  });

  it.each(SINGLES)('TCW-5 T1: GET %s responde 200 con cuerpo no vacío', async (path) => {
    const r = await makeApi().get(path);
    expect(r.status).toBe(200);
    expect(Object.keys(r.data).length).toBeGreaterThan(0);
  });

  it('TCW-5 T1: las transacciones cubren las cinco gavetas (committed, necessary, discretionary, income, unknown)', async () => {
    const cats = await list('/api/v1/categories');
    const typeById = new Map(cats.map((c) => [String(c.id), c.attributes.category_type]));
    const tx = await list('/api/v1/transactions');
    const gavetas = new Set(tx.map((t) => (t.attributes.category_id == null ? 'unknown' : typeById.get(String(t.attributes.category_id)))));
    expect([...gavetas].sort()).toEqual(['committed', 'discretionary', 'income', 'necessary', 'unknown']);
  });

  it('TCW-5 T1: hay al menos 2 transacciones pending y /transactions/pending devuelve solo pending', async () => {
    const tx = await list('/api/v1/transactions');
    expect(tx.filter((t) => t.attributes.status === 'pending').length).toBeGreaterThanOrEqual(2);
    const pending = await list('/api/v1/transactions/pending');
    expect(pending.length).toBeGreaterThanOrEqual(2);
    pending.forEach((t) => expect(t.attributes.status).toBe('pending'));
  });

  it('TCW-5 T1: categorías con icono y color; subcategorías no vacías', async () => {
    const cats = await list('/api/v1/categories');
    cats.forEach((c) => {
      expect(c.attributes.icon).toBeTruthy();
      expect(c.attributes.color).toBeTruthy();
    });
    expect((await list('/api/v1/subcategories')).length).toBeGreaterThan(0);
  });

  it('TCW-5 T1: importes enteros en COP (sin decimales) en transacciones y deudas', async () => {
    const tx = await list('/api/v1/transactions');
    tx.forEach((t) => expect(Number.isInteger(t.attributes.amount)).toBe(true));
    const debts = await list('/api/v1/debts');
    debts.forEach((d) => {
      expect(Number.isInteger(d.attributes.current_balance)).toBe(true);
      expect(Number.isInteger(d.attributes.monthly_payment)).toBe(true);
    });
  });

  it('TCW-5 T1: usuario fijo ejemplo@ascent.local (Camila Ejemplo) y ningún correo fuera de @ascent.local', async () => {
    const api = makeApi();
    const me = await api.get('/api/v1/auth/me');
    expect(me.data.data.attributes.email).toBe('ejemplo@ascent.local');
    expect(me.data.data.attributes.name).toBe('Camila Ejemplo');
    const bodies = await Promise.all(COLLECTIONS.concat(SINGLES).map(async (p) => JSON.stringify((await api.get(p)).data)));
    const emails = bodies.join('\n').match(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g) ?? [];
    expect(emails.length).toBeGreaterThan(0);
    emails.forEach((e) => expect(e.endsWith('@ascent.local')).toBe(true));
  });

  it('TCW-5 T1: PATCH de una transacción muta la copia en memoria sin red', async () => {
    const api = makeApi();
    const first = ((await api.get('/api/v1/transactions')).data.data as Res[])[0];
    const r = await api.patch(`/api/v1/transactions/${first.id}`, { transaction: { concept: 'Editado en local' } });
    expect(r.status).toBe(200);
    const after = (await api.get(`/api/v1/transactions/${first.id}`)).data.data as Res;
    expect(after.attributes.concept).toBe('Editado en local');
  });
});

describe('TCW-5 T5: ruta desconocida', () => {
  it('TCW-5 T5: una ruta sin fixture responde 404 fixture_missing con la ruta y avisa con console.warn', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const err = await makeApi().get('/api/v1/no_existe').then(() => null, (e) => e);
    expect(err?.response?.status).toBe(404);
    expect(err.response.data).toEqual({ error: 'fixture_missing', path: '/api/v1/no_existe' });
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
