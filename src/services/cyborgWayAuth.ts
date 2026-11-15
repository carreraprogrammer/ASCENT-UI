// "Continuar con The Cyborg Way" (TCW-1): Ascent signs people in with the brain of The Cyborg Way, an OpenID
// Connect provider. Authorization code with PKCE (S256), from the browser:
//   1. start(): a random verifier and state kept in sessionStorage, then off to the brain's /authorize;
//   2. the brain sends the browser back to /auth/tcw/callback with a code;
//   3. finish(): checks the state and sends code + verifier to the Ascent API (POST /api/v1/auth/tcw), which
//      swaps the code at the brain, checks the ID token with its JWKS and answers Ascent's own session.
import { api } from './api';
import type { AuthResponse } from '../types/auth.types';

export const TCW_ISSUER = import.meta.env.VITE_TCW_ISSUER ?? 'https://thecyborgway.dev';
export const TCW_CLIENT_ID = import.meta.env.VITE_TCW_CLIENT_ID ?? 'ascent-web';
const KEY = 'tcw_login';

const base64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const random = (size = 32) => base64url(crypto.getRandomValues(new Uint8Array(size)));

export const redirectUri = () => `${window.location.origin}/auth/tcw/callback`;

export async function challengeOf(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return base64url(new Uint8Array(digest));
}

export async function authorizeUrl(): Promise<string> {
  const verifier = random(48);
  const state = random(16);
  sessionStorage.setItem(KEY, JSON.stringify({ verifier, state }));
  const params = new URLSearchParams({
    client_id: TCW_CLIENT_ID, response_type: 'code', redirect_uri: redirectUri(), scope: 'openid email profile',
    state, code_challenge: await challengeOf(verifier), code_challenge_method: 'S256',
  });
  return `${TCW_ISSUER}/authorize?${params.toString()}`;
}

export async function startCyborgWayLogin(): Promise<void> {
  window.location.assign(await authorizeUrl());
}

export async function finishCyborgWayLogin(search: string): Promise<AuthResponse | Record<string, unknown>> {
  const params = new URLSearchParams(search);
  const saved = JSON.parse(sessionStorage.getItem(KEY) ?? 'null') as { verifier: string; state: string } | null;
  sessionStorage.removeItem(KEY);
  if (params.get('error')) throw new Error(params.get('error') ?? 'access_denied');
  if (!saved || !params.get('code') || params.get('state') !== saved.state) {
    throw new Error('El inicio de sesión no coincide con este navegador. Vuelve a intentarlo.');
  }
  const { data } = await api.post('/api/v1/auth/tcw', {
    code: params.get('code'), code_verifier: saved.verifier, redirect_uri: redirectUri(),
  });
  return data as Record<string, unknown>;
}
