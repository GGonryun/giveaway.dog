import { expect, test } from '../fixtures/test';
import { expectNoStackTrace, noRedirect } from '../helpers/http';

test.describe('public endpoints', { tag: ['@prod-safe', '@smoke'] }, () => {
  test('serves the home page to a visitor', async ({ request }) => {
    const response = await request.get('/', noRedirect);

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('text/html');
  });

  test('answers the auth endpoints without a stack trace', async ({
    request
  }) => {
    for (const path of ['/api/auth/session', '/api/auth/providers']) {
      const response = await request.get(path, noRedirect);

      expect(response.status(), path).toBe(200);
      expectNoStackTrace(await response.text());
    }
  });
});

test.describe('public pages', { tag: ['@prod-safe', '@security'] }, () => {
  const EMAIL = /[\w.+-]+@(?:[a-z0-9-]+\.)+[a-z]{2,}\b/gi;

  test('/winners sends no email address', async ({ request }) => {
    for (const headers of [{}, { RSC: '1' }]) {
      const response = await request.get('/winners', {
        ...noRedirect,
        headers
      });
      expect(response.status()).toBe(200);

      const emails = (await response.text()).match(EMAIL) ?? [];
      expect(emails, JSON.stringify(headers)).toEqual([]);
    }
  });
});
