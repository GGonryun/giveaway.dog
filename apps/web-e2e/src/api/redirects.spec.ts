import type { APIRequestContext } from '@playwright/test';
import { expect, test } from '../fixtures/test';
import { E2E_SECRET, personaState } from '../env';
import { expectSameOrigin, noRedirect } from '../helpers/http';
import { knownBug } from '../helpers/known-bug';

const OFF_SITE = 'https://example.org';

const OPEN_REDIRECTS = [
  `/portal?redirectTo=${OFF_SITE}`,
  '/portal?redirectTo=//example.org',
  `/api/instagram/user/link?redirectTo=${OFF_SITE}`,
  `/api/facebook/user/link?redirectTo=${OFF_SITE}`,
  `/api/bluesky/team/authorize?returnTo=${OFF_SITE}`,
  `/api/bluesky/user/authorize?handle=e2e.invalid&returnTo=${OFF_SITE}`
];

const OAUTH_CALLBACKS = [
  '/api/auth/steam-callback?openid.mode=cancel',
  '/api/auth/twitter-callback',
  '/api/auth/twitter-callback?state=a:b&code=e2e',
  '/api/twitch/callback',
  '/api/twitch/callback?state=a:b&code=e2e'
];

const expectRedirectOnOrigin = async (
  request: APIRequestContext,
  path: string
) => {
  const response = await request.get(path, noRedirect);

  expect(response.status(), `GET ${path}`).toBeGreaterThanOrEqual(300);
  expect(response.status(), `GET ${path}`).toBeLessThan(400);
  expectSameOrigin(response.headers().location);
};

test.describe('redirect parameters', { tag: '@security' }, () => {
  for (const path of OPEN_REDIRECTS) {
    test(
      `GET ${path} stays on the origin`,
      knownBug(347, { tag: '@prod-safe' }),
      async ({ request }) => {
        await expectRedirectOnOrigin(request, path);
      }
    );
  }

  test(
    'Auth.js keeps a callbackUrl on the origin',
    { tag: '@prod-safe' },
    async ({ request }) => {
      const response = await request.get(
        `/api/auth/signin?callbackUrl=${OFF_SITE}`,
        noRedirect
      );

      expectSameOrigin(response.headers().location);
      expect(response.headers().location).not.toContain('example.org');
    }
  );

  test.describe('signed in', () => {
    test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to sign in the personas');
    test.use({ storageState: personaState('participant') });

    for (const redirectTo of [OFF_SITE, '//example.org']) {
      test(
        `GET /portal?redirectTo=${redirectTo} stays on the origin`,
        knownBug(347),
        async ({ request }) => {
          await expectRedirectOnOrigin(
            request,
            `/portal?redirectTo=${redirectTo}`
          );
        }
      );
    }
  });
});

test.describe('OAuth callbacks', { tag: ['@security', '@prod-safe'] }, () => {
  for (const path of OAUTH_CALLBACKS) {
    test(`GET ${path} redirects on the origin`, async ({ request }) => {
      await expectRedirectOnOrigin(request, path);
    });
  }
});
