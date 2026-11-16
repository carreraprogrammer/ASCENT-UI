// ASC-4 fase 6: el interceptor global de axios avisa ante un 403 {"error":"demo_read_only"} y deja seguir el rechazo.
import { afterEach, describe, expect, it, vi } from 'vitest';
vi.hoisted(async () => (await import('../test/stubMatchMedia')).stubMatchMedia());
import { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios';
import { api } from './api';
import { DEMO_READ_ONLY_EVENT, isDemoReadOnlyError } from './demoReadOnly';

const failWith = (status: number, data: unknown): AxiosAdapter => async (config: InternalAxiosRequestConfig) => {
  throw new AxiosError('fail', 'ERR_BAD_REQUEST', config, null, { status, statusText: '', headers: {}, config, data });
};

const listen = () => {
  const handler = vi.fn();
  window.addEventListener(DEMO_READ_ONLY_EVENT, handler);
  return { handler, stop: () => window.removeEventListener(DEMO_READ_ONLY_EVENT, handler) };
};

describe('interceptor de solo lectura del modo demo', () => {
  let stop = () => {};
  afterEach(() => stop());

  it('avisa una vez y rechaza la petición con un 403 demo_read_only', async () => {
    const l = listen(); stop = l.stop;
    const request = api.post('/api/v1/transactions', {}, { adapter: failWith(403, { error: 'demo_read_only' }) });

    await expect(request).rejects.toMatchObject({ response: { status: 403 }, demoReadOnly: true });
    expect(l.handler).toHaveBeenCalledTimes(1);
  });

  it('no avisa con otros 403', async () => {
    const l = listen(); stop = l.stop;
    await expect(api.post('/api/v1/x', {}, { adapter: failWith(403, { error: 'forbidden' }) })).rejects.toBeTruthy();
    expect(l.handler).not.toHaveBeenCalled();
  });

  it('no avisa con errores que no son 403', async () => {
    const l = listen(); stop = l.stop;
    await expect(api.get('/api/v1/x', { adapter: failWith(500, { error: 'demo_read_only' }) })).rejects.toBeTruthy();
    expect(l.handler).not.toHaveBeenCalled();
  });

  it('reconoce la forma exacta del error', () => {
    expect(isDemoReadOnlyError({ response: { status: 403, data: { error: 'demo_read_only' } } })).toBe(true);
    expect(isDemoReadOnlyError({ response: { status: 403, data: null } })).toBe(false);
    expect(isDemoReadOnlyError(null)).toBe(false);
  });
});
