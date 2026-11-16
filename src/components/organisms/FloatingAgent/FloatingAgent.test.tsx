import { render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const { fetchLatestInsight } = vi.hoisted(() => ({ fetchLatestInsight: vi.fn() }));
vi.mock('../../../services/financeService', () => ({ financeService: { fetchLatestInsight } }));
vi.mock('../../../store/authStore', () => ({
  useAuthStore: (select: (s: { isAuthenticated: boolean }) => unknown) => select({ isAuthenticated: true }),
}));
vi.mock('../../pages/ChatPage/ChatPage', () => ({ ChatPortal: () => null }));

import { FloatingAgent } from './FloatingAgent';

const climber = () => document.body.querySelector('button[aria-label="Abrir asistente"] [data-climber]');

describe('FloatingAgent (TCW-2: el ánimo del escalador)', () => {
  beforeEach(() => {
    fetchLatestInsight.mockReset();
    sessionStorage.clear();
  });

  it('asks for the latest insight and cheers when it is new', async () => {
    fetchLatestInsight.mockResolvedValue({ id: 1, status: 'new' });
    render(<MemoryRouter><FloatingAgent /></MemoryRouter>);
    await waitFor(() => expect(climber()).toHaveAttribute('data-emotion', 'cheer'), { timeout: 2000 });
    expect(climber()!.className).toMatch(/cheer/);
    expect(fetchLatestInsight).toHaveBeenCalledTimes(1);
  });

  it('stays calm when the latest insight was already seen, or there is none', async () => {
    fetchLatestInsight.mockResolvedValue({ id: 1, status: 'seen' });
    render(<MemoryRouter><FloatingAgent /></MemoryRouter>);
    await waitFor(() => expect(climber()).not.toBeNull(), { timeout: 2000 });
    await waitFor(() => expect(fetchLatestInsight).toHaveBeenCalled());
    expect(climber()).toHaveAttribute('data-emotion', 'calm');
  });

  it('stays calm when the query fails', async () => {
    fetchLatestInsight.mockRejectedValue(new Error('offline'));
    render(<MemoryRouter><FloatingAgent /></MemoryRouter>);
    await waitFor(() => expect(climber()).not.toBeNull(), { timeout: 2000 });
    expect(climber()).toHaveAttribute('data-emotion', 'calm');
  });
});
