import { randomBytes } from 'crypto';
import { expect, test } from '../fixtures/test';
import { BASE_URL, E2E_SECRET, RUN_ID, personaState } from '../env';
import {
  expectSignInRefused,
  postCredentials,
  sessionCookies
} from '../helpers/credentials';
import { expectNoStackTrace, expectSameOrigin } from '../helpers/http';

const randomHex = (length: number) => randomBytes(length / 2).toString('hex');

test.describe('auth endpoints', { tag: '@security' }, () => {
  test('answers a visitor with an empty session', async ({ request }) => {
    const response = await request.get('/api/auth/session');

    expect(response.status()).toBe(200);
    const body = await response.text();
    expectNoStackTrace(body);
    expect(JSON.parse(body)).toBeNull();
  });

  test('keeps a failed e2e sign-in on the origin of the deployment', async ({
    request
  }) => {
    const signIn = await postCredentials(request, 'e2e', {
      secret: randomHex(40),
      callbackUrl: 'https://example.org/'
    });

    expect(signIn.status()).toBe(302);
    expectSameOrigin(signIn.headers().location);
    expect(signIn.headers().location).toContain('error=');
    expectNoStackTrace(await signIn.text());

    const session = await request.get('/api/auth/session');
    expect(await session.json()).toBeNull();
  });
});

test.describe('credentials sign-in', { tag: '@security' }, () => {
  test('refuses a persona with a wrong e2e secret', async ({ request }) => {
    test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET: the e2e provider needs it');

    const signIn = await postCredentials(request, 'e2e', {
      secret: randomHex(64),
      persona: 'participant',
      ns: RUN_ID
    });

    await expectSignInRefused(request, signIn);
  });

  test(
    'refuses a bluesky-direct sign-in with a made-up token',
    { tag: '@prod-safe' },
    async ({ request }) => {
      const signIn = await postCredentials(request, 'bluesky-direct', {
        token: randomHex(64)
      });

      await expectSignInRefused(request, signIn);
    }
  );

  test('refuses a bluesky-direct sign-in with only a user id', async ({
    playwright,
    request
  }) => {
    test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to sign in the personas');

    const participant = await playwright.request.newContext({
      baseURL: BASE_URL,
      storageState: personaState('participant')
    });
    const { user } = await (await participant.get('/api/auth/session')).json();
    await participant.dispose();
    expect(user?.id, 'The participant has no session').toEqual(
      expect.any(String)
    );

    const signIn = await postCredentials(request, 'bluesky-direct', {
      userId: user.id
    });

    await expectSignInRefused(request, signIn);
  });

  test('sets the session cookie HttpOnly, SameSite=Lax and Secure on https', async ({
    request
  }) => {
    test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to sign in the personas');

    const signIn = await postCredentials(request, 'e2e', {
      secret: E2E_SECRET,
      persona: 'participant',
      ns: RUN_ID
    });

    expect(signIn.status()).toBe(302);
    const cookies = sessionCookies(signIn);
    expect(cookies, 'The sign-in sets no session cookie').not.toEqual([]);

    for (const cookie of cookies) {
      const attributes = cookie.toLowerCase();
      expect(attributes).toContain('; httponly');
      expect(attributes).toContain('; samesite=lax');
      if (BASE_URL.startsWith('https:')) {
        expect(attributes).toContain('; secure');
      }
    }
  });
});
