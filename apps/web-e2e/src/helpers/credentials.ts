import {
  expect,
  type APIRequestContext,
  type APIResponse
} from '@playwright/test';
import { noRedirect } from './http';

const SESSION_COOKIE = /^(__Secure-)?authjs\.session-token(\.\d+)?=/;

export const postCredentials = async (
  request: APIRequestContext,
  provider: string,
  fields: Record<string, string>
) => {
  const csrf = await request.get('/api/auth/csrf');
  expect(csrf.ok(), `GET /api/auth/csrf returned ${csrf.status()}`).toBe(true);
  const { csrfToken } = await csrf.json();

  return request.post(`/api/auth/callback/${provider}`, {
    form: { csrfToken, callbackUrl: '/', ...fields },
    ...noRedirect
  });
};

export const sessionCookies = (response: APIResponse) =>
  response
    .headersArray()
    .filter(
      ({ name, value }) =>
        name.toLowerCase() === 'set-cookie' && SESSION_COOKIE.test(value)
    )
    .map(({ value }) => value);

export const expectSignInRefused = async (
  request: APIRequestContext,
  response: APIResponse
) => {
  expect(response.status()).toBe(302);
  expect(response.headers().location).toContain('error=CredentialsSignin');
  expect(sessionCookies(response), 'The response sets a session').toEqual([]);

  const session = await request.get('/api/auth/session');
  expect(await session.json()).toBeNull();
};
