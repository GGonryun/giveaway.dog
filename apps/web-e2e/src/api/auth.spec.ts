import { randomBytes } from 'crypto';
import { expect, test } from '../fixtures/test';
import {
  expectNoStackTrace,
  expectSameOrigin,
  noRedirect
} from '../helpers/http';

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
    const csrf = await request.get('/api/auth/csrf');
    const { csrfToken } = await csrf.json();

    const signIn = await request.post('/api/auth/callback/e2e', {
      form: {
        csrfToken,
        secret: randomBytes(20).toString('hex'),
        callbackUrl: 'https://example.org/'
      },
      ...noRedirect
    });

    expect(signIn.status()).toBe(302);
    expectSameOrigin(signIn.headers().location);
    expect(signIn.headers().location).toContain('error=');
    expectNoStackTrace(await signIn.text());

    const session = await request.get('/api/auth/session');
    expect(await session.json()).toBeNull();
  });
});
