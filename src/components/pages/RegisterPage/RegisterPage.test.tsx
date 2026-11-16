import { fireEvent, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.hoisted(async () => (await import('../../../test/stubMatchMedia')).stubMatchMedia());
const { startCyborgWayLogin } = vi.hoisted(() => ({ startCyborgWayLogin: vi.fn(() => Promise.resolve()) }));
vi.mock('../../../services/cyborgWayAuth', () => ({ startCyborgWayLogin }));

import { RegisterPage } from './RegisterPage';

test('renders login link', () => {
  const view = render(<MemoryRouter><RegisterPage /></MemoryRouter>);
  expect(view.getByRole('link', { name: '¿Ya tienes cuenta? Inicia sesión' })).toHaveAttribute('href', '/login');
});

// TCW-2 fase 3: "Continuar con The Cyborg Way" es la acción principal del registro, como en el login.
test('offers "Continuar con The Cyborg Way" first and starts the TCW login', () => {
  const view = render(<MemoryRouter><RegisterPage /></MemoryRouter>);
  const tcw = view.getByRole('button', { name: /Continuar con The Cyborg Way/ });
  const google = view.getByRole('button', { name: /Google/ });
  expect(tcw.compareDocumentPosition(google) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  fireEvent.click(tcw);
  expect(startCyborgWayLogin).toHaveBeenCalledTimes(1);
});
