import { expect, test } from '../fixtures/test';
import { BASE_URL } from '../env';
import { noRedirect } from '../helpers/http';
import { knownBug } from '../helpers/known-bug';

const PATHS = ['/', '/browse', '/api/auth/session'];

test.describe('security headers', { tag: '@security' }, () => {
  for (const path of PATHS) {
    test(
      `GET ${path} sends the basic security headers`,
      knownBug(349, { tag: '@prod-safe' }),
      async ({ request }) => {
        const response = await request.get(path, noRedirect);
        const headers = response.headers();

        expect(response.status()).toBe(200);
        expect
          .soft(
            headers['x-frame-options'] ??
              headers['content-security-policy']?.match(/frame-ancestors/)?.[0],
            'No X-Frame-Options and no CSP frame-ancestors'
          )
          .toBeTruthy();
        expect.soft(headers['x-content-type-options']).toBe('nosniff');
        expect.soft(headers['referrer-policy']).toBeTruthy();
        if (new URL(BASE_URL).protocol === 'https:') {
          expect
            .soft(headers['strict-transport-security'])
            .toMatch(/max-age=\d+/);
        }
        expect.soft(headers['x-powered-by']).toBeUndefined();
      }
    );
  }
});
