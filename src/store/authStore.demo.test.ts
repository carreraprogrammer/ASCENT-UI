// ASC-4 fase 6: el interruptor "Modo demo" guarda la sesión real aparte y la restaura al volver, sin cerrar sesión.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.hoisted(async () => (await import('../test/stubMatchMedia')).stubMatchMedia());
import { DEMO_STASH_KEY, useAuthStore } from './authStore';
import { demoService } from '../services/authService';
import type { AuthResponse } from '../types/auth.types';
import type { AuthUser } from '../types/authorization.types';

const b64 = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
const fakeJwt = (claims: object) => `${b64({ alg: 'none' })}.${b64({ exp: 4102444800, jti: 'test', permissions: [], ...claims })}.sig`;

const realUser: AuthUser = { id: 1, email: 'admin@example.com', name: 'Admin Ficticio', superAdmin: true, permissions: [], avatarUrl: 'https://example.com/a.png', authProvider: 'email', demo: false };
const demoToken = fakeJwt({ user_id: 99, email: 'demo@example.com', super_admin: false, demo: true });
const demoResponse: AuthResponse = {
  data: { id: 99, attributes: { name: 'Cuenta demo', email: 'demo@example.com', avatar_url: null, auth_provider: 'email', permissions: [], super_admin: false, demo: true } },
  tokens: { accessToken: demoToken, refreshToken: 'demo-refresh' },
};

const seedRealSession = () => {
  localStorage.setItem('at', 'real-access');
  localStorage.setItem('rft', 'real-refresh');
  localStorage.setItem('auth_user', JSON.stringify(realUser));
  useAuthStore.setState({ user: realUser, accessToken: 'real-access', isAuthenticated: true, isLoading: false, demoStash: null });
};

describe('modo demo: interruptor de ida y vuelta', () => {
  beforeEach(() => {
    localStorage.clear();
    seedRealSession();
  });
  afterEach(() => vi.restoreAllMocks());

  it('entra a la demo con el token que emite la API y guarda la sesión real aparte', async () => {
    const spy = vi.spyOn(demoService, 'switchToDemo').mockResolvedValue(demoResponse);
    await useAuthStore.getState().enterDemoMode();

    expect(spy).toHaveBeenCalledTimes(1);
    const state = useAuthStore.getState();
    expect(state.accessToken).toBe(demoToken);
    expect(state.user).toMatchObject({ id: 99, demo: true, superAdmin: false, name: 'Cuenta demo' });
    // La demo no hereda nada del usuario real (ni su avatar).
    expect(state.user?.avatarUrl).toBeNull();
    expect(localStorage.getItem('at')).toBe(demoToken);
    expect(state.demoStash).toEqual({ accessToken: 'real-access', refreshToken: 'real-refresh', user: realUser });
    expect(JSON.parse(localStorage.getItem(DEMO_STASH_KEY) ?? 'null')).toEqual(state.demoStash);
  });

  it('al volver restaura exactamente la sesión real, sin cerrar sesión', async () => {
    vi.spyOn(demoService, 'switchToDemo').mockResolvedValue(demoResponse);
    await useAuthStore.getState().enterDemoMode();
    useAuthStore.getState().exitDemoMode();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.accessToken).toBe('real-access');
    expect(state.user).toEqual(realUser);
    expect(state.demoStash).toBeNull();
    expect(localStorage.getItem('at')).toBe('real-access');
    expect(localStorage.getItem('rft')).toBe('real-refresh');
    expect(JSON.parse(localStorage.getItem('auth_user') ?? 'null')).toEqual(realUser);
    expect(localStorage.getItem(DEMO_STASH_KEY)).toBeNull();
  });

  it('si la API falla, la sesión real queda intacta', async () => {
    vi.spyOn(demoService, 'switchToDemo').mockRejectedValue(new Error('403'));
    await expect(useAuthStore.getState().enterDemoMode()).rejects.toThrow();

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe('real-access');
    expect(state.user).toEqual(realUser);
    expect(state.demoStash).toBeNull();
    expect(localStorage.getItem(DEMO_STASH_KEY)).toBeNull();
  });

  it('cerrar sesión en la demo borra también la sesión guardada', async () => {
    vi.spyOn(demoService, 'switchToDemo').mockResolvedValue(demoResponse);
    await useAuthStore.getState().enterDemoMode();
    await useAuthStore.getState().logout();

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().demoStash).toBeNull();
    expect(localStorage.getItem(DEMO_STASH_KEY)).toBeNull();
  });
});

describe('"Ver demo" del login', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false, isLoading: false, demoStash: null });
  });
  afterEach(() => vi.restoreAllMocks());

  it('guarda la sesión demo como un login normal, sin sesión real que restaurar', async () => {
    vi.spyOn(demoService, 'session').mockResolvedValue(demoResponse);
    await useAuthStore.getState().startDemo();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.demo).toBe(true);
    expect(localStorage.getItem('at')).toBe(demoToken);
    expect(localStorage.getItem('rft')).toBe('demo-refresh');
    expect(state.demoStash).toBeNull();
  });
});
