// ASC-4 fase 2: en web la conexión de Gmail se pide con platform=web, para que la API vuelva a /auth/gmail/callback.
import { describe, expect, it, vi } from 'vitest';
vi.hoisted(async () => (await import('../test/stubMatchMedia')).stubMatchMedia());
vi.mock('@capacitor/browser', () => ({ Browser: { open: vi.fn().mockResolvedValue(undefined) } }));
import { api } from '../services/api';
import { useEmailConnectionStore } from './emailConnectionStore';

describe('startOAuth en web', () => {
  it('envía platform: web', async () => {
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { data: { authorization_url: 'https://accounts.example.com/x' } } });
    await useEmailConnectionStore.getState().startOAuth();
    expect(post).toHaveBeenCalledWith('/api/v1/auth/gmail', { platform: 'web' });
  });
});
