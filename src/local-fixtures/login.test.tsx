// TCW-5 T2: entrar con la sesión de ejemplo sin credenciales, solo con VITE_LOCAL_FIXTURES=1.
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.hoisted(async () => (await import('../test/stubMatchMedia')).stubMatchMedia());

import { LoginPage } from '../components/pages/LoginPage/LoginPage';
import { useFormStore } from '../store/formStore';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';

const renderLogin = () => {
  useFormStore.setState({ schemas: { 'login-form': { slug: 'login-form', title: 'Login', submit_endpoint: '/api/v1/auth/login', submit_method: 'POST', fields: [{ name: 'email', type: 'email', label: 'Email' }] } }, isLoading: false, error: null });
  return render(<MemoryRouter><LoginPage /></MemoryRouter>);
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  useAuthStore.getState().clearSession();
  localStorage.clear();
});

describe('TCW-5 T2: login de ejemplo', () => {
  it('TCW-5 T2: con VITE_LOCAL_FIXTURES=1 el botón "Entrar con la sesión de ejemplo" autentica sin credenciales', async () => {
    vi.stubEnv('VITE_LOCAL_FIXTURES', '1');
    renderLogin();
    const btn = await screen.findByTestId('local-fixtures-login');
    expect(btn).toHaveTextContent('Entrar con la sesión de ejemplo');
    fireEvent.click(btn);
    await waitFor(() => expect(useAuthStore.getState().isAuthenticated).toBe(true));
    const s = useAuthStore.getState();
    expect(s.user?.email).toBe('ejemplo@ascent.local');
    expect(s.user?.name).toBe('Camila Ejemplo');
    expect(s.user?.superAdmin).toBe(false);
    expect(s.accessToken).toBeTruthy();
  });

  it('TCW-5 T2: sin la variable el LoginPage no contiene local-fixtures-login', () => {
    const view = renderLogin();
    expect(view.container.querySelector('[data-testid="local-fixtures-login"]')).toBeNull();
    expect(view.container.textContent ?? '').not.toContain('sesión de ejemplo');
  });

  it('TCW-5 T2: el login real sigue llamando POST /api/v1/auth/login', async () => {
    const post = vi.spyOn(api, 'post').mockRejectedValue(new Error('sin red'));
    await expect(useAuthStore.getState().login({ email: 'a@b.co', password: 'x' } as never)).rejects.toThrow();
    expect(post).toHaveBeenCalledWith('/api/v1/auth/login', { email: 'a@b.co', password: 'x' });
  });
});
