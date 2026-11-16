import { act, render } from '@testing-library/react';
import { MemoryRouter, Route } from 'react-router-dom';
import { vi } from 'vitest';
vi.hoisted(async () => (await import('../../../test/stubMatchMedia')).stubMatchMedia());
import { GmailCallbackPage } from './GmailCallbackPage';

const renderAt = (search: string) => {
  let path = '';
  const view = render(
    <MemoryRouter initialEntries={[`/auth/gmail/callback${search}`]}>
      <Route path="/auth/gmail/callback" component={GmailCallbackPage} />
      <Route path="*" render={({ location }) => { path = location.pathname; return null; }} />
    </MemoryRouter>,
  );
  return { view, path: () => path };
};

describe('GmailCallbackPage', () => {
  afterEach(() => vi.useRealTimers());

  it('connected: says Gmail is connected, that the agent only reads, and links back with a real <a href>', () => {
    const { view } = renderAt('?status=connected');
    expect(view.getByRole('heading', { name: 'Gmail conectado' })).toBeInTheDocument();
    expect(view.getByText(/Solo lee: nunca envía ni borra/)).toBeInTheDocument();
    const back = view.getByRole('link', { name: 'Volver a Ascent' });
    expect(back.tagName).toBe('A');
    expect(back).toHaveAttribute('href', '/profile');
  });

  it('error: offers going back to the profile and trying again', () => {
    const { view } = renderAt('?status=error');
    expect(view.getByRole('heading', { name: 'No pudimos conectar Gmail' })).toBeInTheDocument();
    expect(view.getByRole('link', { name: 'Volver a Mi perfil' })).toHaveAttribute('href', '/profile');
    expect(view.getByText('Intentar de nuevo')).toBeInTheDocument();
    expect(view.getByText(/solo lee tus correos/)).toBeInTheDocument();
  });

  it('returns to /profile by itself after 3 s', () => {
    vi.useFakeTimers();
    const { path } = renderAt('?status=connected');
    act(() => { vi.advanceTimersByTime(2900); });
    expect(path()).toBe('/auth/gmail/callback');
    act(() => { vi.advanceTimersByTime(200); });
    expect(path()).toBe('/profile');
  });
});
