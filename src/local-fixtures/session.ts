// TCW-5: sesión de ejemplo. El JWT NO tiene firma real: solo la forma que `jwtDecode` necesita en authStore.
import { EXAMPLE_EMAIL, EXAMPLE_NAME, EXAMPLE_USER_ID } from './data';

export const EXAMPLE_PERMISSIONS = [
  'dashboard.view', 'transactions.view', 'debts.view', 'budgets.view', 'plans.view', 'goals.view', 'recurring.view',
];

const b64url = (value: object) => btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

export const makeExampleToken = (): string => {
  const header = b64url({ alg: 'none', typ: 'JWT' });
  const payload = b64url({
    user_id: EXAMPLE_USER_ID, email: EXAMPLE_EMAIL, super_admin: false, permissions: EXAMPLE_PERMISSIONS,
    jti: 'local-fixtures', exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365 * 10,
  });
  return `${header}.${payload}.sin-firma`;
};

const userAttributes = () => ({
  name: EXAMPLE_NAME, email: EXAMPLE_EMAIL, city: 'Medellín', avatar_url: null, auth_provider: 'local_fixtures',
  super_admin: false, permissions: EXAMPLE_PERMISSIONS, demo: false,
});

/** Respuesta de /auth/login, /auth/refresh y /demo/session: la misma forma que la API. */
export const exampleAuthEnvelope = () => ({
  data: { id: EXAMPLE_USER_ID, type: 'user', attributes: userAttributes() },
  meta: { access_token: makeExampleToken(), refresh_token: 'refresh-de-ejemplo' },
});

/** Respuesta de /auth/me. */
export const exampleMe = () => ({ data: { id: EXAMPLE_USER_ID, type: 'user', attributes: userAttributes() } });
