// TCW-5: office-shot --login solo abre /login (no hace clic ni escribe). Con VITE_LOCAL_FIXTURES=1 la sesión de ejemplo
// debe entrar sola al montar, persistir en localStorage y no re-autenticar si ya hay sesión.
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter, Route } from 'react-router-dom';

vi.hoisted(async () => (await import('../test/stubMatchMedia')).stubMatchMedia());

import { LoginPage } from '../components/pages/LoginPage/LoginPage';
import { useFormStore } from '../store/formStore';
import { useAuthStore } from '../store/authStore';

let pathname = '/login';
const renderLogin = () => {
  useFormStore.setState({ schemas: { 'login-form': { slug: 'login-form', title: 'Login', submit_endpoint: '/api/v1/auth/login', submit_method: 'POST', fields: [{ name: 'email', type: 'email', label: 'Email' }] } }, isLoading: false, error: null });
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <LoginPage />
      <Route path="*" render={({ location }) => { pathname = location.pathname; return null; }} />
    </MemoryRouter>,
  );
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  useAuthStore.getState().clearSession();
  localStorage.clear();
  pathname = '/login';
});

describe('TCW-5 auto-ingreso de la sesión de ejemplo', () => {
  it('con VITE_LOCAL_FIXTURES=1 entra sola, sin clic: autentica, persiste la sesión y va al dashboard', async () => {
    vi.stubEnv('VITE_LOCAL_FIXTURES', '1');
    renderLogin();
    await waitFor(() => expect(useAuthStore.getState().isAuthenticated).toBe(true));
    expect(useAuthStore.getState().user?.email).toBe('ejemplo@ascent.local');
    expect(localStorage.getItem('at')).toBeTruthy();
    expect(localStorage.getItem('auth_user')).toContain('ejemplo@ascent.local');
    await waitFor(() => expect(pathname).toBe('/dashboard'));
  });

  it('si ya hay sesión no la reemplaza al montar', async () => {
    vi.stubEnv('VITE_LOCAL_FIXTURES', '1');
    useAuthStore.setState({ isAuthenticated: true, accessToken: 'token-previo' });
    renderLogin();
    await new Promise((r) => setTimeout(r, 50));
    expect(useAuthStore.getState().accessToken).toBe('token-previo');
  });

  it('sin la variable no autentica nada', async () => {
    renderLogin();
    await new Promise((r) => setTimeout(r, 50));
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(localStorage.getItem('at')).toBeNull();
  });
});
