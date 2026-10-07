import { expect, type APIRequestContext } from '@playwright/test';
import type { E2ePersona } from '@giveaway/e2e-model/personas';
import { E2E_SECRET, RUN_ID } from '../env';

export const PERSONAS = Object.keys({
  host: true,
  host2: true,
  admin: true,
  member: true,
  guest: true,
  blocked: true,
  participant: true,
  participant2: true,
  newbie: true
} satisfies Record<E2ePersona, true>) as E2ePersona[];

export type SignedInPersona = {
  persona: E2ePersona;
  ns: string;
  id: string;
  email: string;
};

export const toPersonaEmail = (persona: E2ePersona, ns: string) =>
  `e2e-${persona}-${ns}@example.com`;

export const signInAs = async (
  request: APIRequestContext,
  persona: E2ePersona,
  ns = RUN_ID
): Promise<SignedInPersona> => {
  const csrf = await request.get('/api/auth/csrf');
  expect(csrf.ok(), `GET /api/auth/csrf returned ${csrf.status()}`).toBe(true);
  const { csrfToken } = await csrf.json();

  const signIn = await request.post('/api/auth/callback/e2e', {
    form: { csrfToken, secret: E2E_SECRET, persona, ns, callbackUrl: '/' },
    maxRedirects: 0
  });

  expect(signIn.status()).toBe(302);
  expect(
    signIn.headers().location,
    `Signing in ${persona} failed. The deployment needs the same E2E_LOGIN_SECRET.`
  ).not.toContain('error');

  const session = await request.get('/api/auth/session');
  const { user } = await session.json();
  const email = toPersonaEmail(persona, ns);

  expect(user?.email, `The session is not ${email}`).toBe(email);
  expect(user.id).toEqual(expect.any(String));

  return { persona, ns, id: user.id, email };
};
