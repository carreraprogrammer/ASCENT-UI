import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.hoisted(async () => (await import('../../../test/stubMatchMedia')).stubMatchMedia());

import { LoginPage } from './LoginPage';
import { useFormStore } from '../../../store/formStore';

const renderLogin = () => {
  useFormStore.setState({ schemas: { 'login-form': { slug: 'login-form', title: 'Login', submit_endpoint: '/api/v1/auth/login', submit_method: 'POST', fields: [{ name: 'email', type: 'email', label: 'Email' }] } }, isLoading: false, error: null });
  return render(<MemoryRouter><LoginPage /></MemoryRouter>);
};

test('renders register link', () => {
  expect(renderLogin().getByRole('link', { name: '¿No tienes cuenta? Regístrate' })).toHaveAttribute('href', '/register');
});

// TCW-2 fase 3: la cabecera técnica de la tarjeta del correo lleva la clase que la oculta en el teléfono (≤ 640 px).
test('marks the email card so its schema text is hidden on phones', () => {
  const view = renderLogin();
  const head = view.getByText('Acceso con email').closest('[data-form-section-head]');
  expect(head?.parentElement?.className).toMatch(/phoneHideSchemaText/);
});
