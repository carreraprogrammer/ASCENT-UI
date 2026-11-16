import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route } from 'react-router-dom';
import type { ReactNode } from 'react';

const media = vi.hoisted(() => {
  const state = { desktop: true };
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      matches: query.includes('min-width: 1024px') ? state.desktop : false, media: query, onchange: null,
      addListener: () => {}, removeListener: () => {}, addEventListener: () => {}, removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
  return state;
});
vi.mock('../../../services/financeService', () => ({
  financeService: { fetchSummary: vi.fn(() => Promise.resolve(null)), fetchMilestones: vi.fn(() => Promise.resolve([])) },
}));
vi.mock('../../templates/AppLayout', () => ({ AppLayout: ({ children }: { children: ReactNode }) => <div>{children}</div> }));

import { MonthlyInsightDetailPage } from './MonthlyInsightDetailPage';

const renderPlanes = () => render(
  <MemoryRouter initialEntries={['/planes/2026/11']}>
    <Route path="/planes/:year/:month" component={MonthlyInsightDetailPage} />
  </MemoryRouter>,
);

describe('Planes (TCW-2: enlace a Gastos planeados)', () => {
  it('shows a visible "Gastos planeados" link to /planned-expenses on desktop', async () => {
    media.desktop = true;
    renderPlanes();
    const link = await screen.findByRole('link', { name: /Gastos planeados/ });
    expect(link).toHaveAttribute('href', '/planned-expenses');
  });

  it('does not change the mobile view', async () => {
    media.desktop = false;
    renderPlanes();
    await waitFor(() => expect(screen.getByText(/Noviembre 2026/)).toBeInTheDocument());
    expect(screen.queryByRole('link', { name: /Gastos planeados/ })).toBeNull();
  });
});
