import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.hoisted(async () => (await import('../../../test/stubMatchMedia')).stubMatchMedia());

import { LoginPage } from './LoginPage';
import { useFormStore } from '../../../store/formStore';

const renderLogin = () => {
  useFormStore.setState({ schemas: { 'login-form': { slug: 'login-form', title: 'Login', submit_endpoint: '/api/v1/auth/login', submit_method: 'POST', fields: [{ name: 'email', type: 'email', label: 'Email' }] } }, isLoading: false, error: null });
  return render(<MemoryRouter><LoginPage /></MemoryRouter>);
};

// TCW-8: el registro está cerrado. El login no invita a crear cuenta; ofrece pedir acceso (CONTACT_URL).
test('offers to request access instead of signing up', () => {
  const view = renderLogin();
  expect(view.getByRole('link', { name: '¿Aún sin acceso? Solicitar acceso' })).toHaveAttribute('href', 'https://calendly.com/carreraprogrammer');
  expect(view.container.textContent ?? '').not.toMatch(/regístrate|registrarse|crear cuenta|sign ?up|empezar gratis/i);
  expect(view.container.querySelector('a[href="/register"], a[href="/signup"]')).toBeNull();
});

test('still offers the demo without an account', () => {
  expect(renderLogin().getByText('Ver demo')).toBeInTheDocument();
});

// TCW-2 fase 3: la cabecera técnica de la tarjeta del correo lleva la clase que la oculta en el teléfono (≤ 640 px).
test('marks the email card so its schema text is hidden on phones', () => {
  const view = renderLogin();
  const head = view.getByText('Acceso con email').closest('[data-form-section-head]');
  expect(head?.parentElement?.className).toMatch(/phoneHideSchemaText/);
});
