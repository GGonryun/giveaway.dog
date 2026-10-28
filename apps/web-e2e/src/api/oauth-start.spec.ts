import type { APIRequestContext } from '@playwright/test';
import { expect, test } from '../fixtures/test';
import { APP_URL, BASE_URL, PRODUCTION_CHECKS } from '../env';
import { noRedirect } from '../helpers/http';

const OAUTH_PROVIDERS = {
  discord: 'discord.com',
  google: 'accounts.google.com',
  kick: 'id.kick.com',
  linkedin: 'www.linkedin.com',
  steam: 'steamcommunity.com',
  tiktok: 'www.tiktok.com',
  twitch: 'id.twitch.tv',
  twitter: 'x.com',
  velora: 'velora.tv'
};

const CALLBACK_PARAMS = ['redirect_uri', 'openid.return_to', 'openid.realm'];

const CLIENT_ID_PARAMS = ['client_key', 'client_id'];

const UNSET = ['', 'undefined', 'null'];

const appOrigins = () =>
  [...new Set([BASE_URL, APP_URL])].map((url) => new URL(url).origin);

const startSignIn = async (request: APIRequestContext, provider: string) => {
  const csrf = await request.get('/api/auth/csrf');
  expect(csrf.ok(), `GET /api/auth/csrf returned ${csrf.status()}`).toBe(true);
  const { csrfToken } = await csrf.json();

  const response = await request.post(`/api/auth/signin/${provider}`, {
    form: { csrfToken, callbackUrl: '/' },
    ...noRedirect
  });
  expect(response.status(), `POST /api/auth/signin/${provider}`).toBe(302);
  return new URL(response.headers().location, BASE_URL);
};

test.describe(
  'OAuth sign-in start',
  { tag: ['@prod-safe', '@security'] },
  () => {
    test('[AUTH-017] the app offers exactly the OAuth providers that this spec starts', async ({
      request
    }) => {
      const response = await request.get('/api/auth/providers');
      expect(response.status()).toBe(200);

      const providers: Record<string, { type: string }> = await response.json();
      const oauth = Object.entries(providers)
        .filter(([, { type }]) => type === 'oauth' || type === 'oidc')
        .map(([id]) => id)
        .sort();

      expect(
        oauth,
        'Add a new OAuth provider and the host of its sign-in page to OAUTH_PROVIDERS'
      ).toEqual(Object.keys(OAUTH_PROVIDERS).sort());
    });

    for (const [provider, host] of Object.entries(OAUTH_PROVIDERS)) {
      test(`[AUTH-017] a ${provider} sign-in starts on ${host} with the app's client id and a callback URL on its origin`, async ({
        request
      }) => {
        const location = await startSignIn(request, provider);

        expect(location.host, `The sign-in went to ${location.href}`).toBe(
          host
        );

        const callbacks = CALLBACK_PARAMS.flatMap(
          (param) => location.searchParams.get(param) ?? []
        );
        expect(callbacks, 'The sign-in sends no callback URL').not.toEqual([]);
        for (const callback of callbacks) {
          expect(
            appOrigins(),
            `The callback URL ${callback} leaves the app`
          ).toContain(new URL(callback).origin);
        }

        if (provider === 'steam') return;

        const clientId = CLIENT_ID_PARAMS.map((param) =>
          location.searchParams.get(param)
        ).find((value) => value !== null);
        expect(clientId, 'The sign-in sends no client id').not.toBeUndefined();

        const set = !UNSET.includes(clientId!);
        if (PRODUCTION_CHECKS) {
          expect(set, `The ${provider} client id is not set`).toBe(true);
        } else if (!set) {
          test.info().annotations.push({
            type: 'warning',
            description: `This deployment has no ${provider} client id, so a real ${provider} sign-in cannot finish here`
          });
        }
      });
    }
  }
);
