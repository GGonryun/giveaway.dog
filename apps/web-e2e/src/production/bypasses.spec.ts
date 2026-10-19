import { randomBytes } from 'crypto';
import { expect, test } from '../fixtures/test';
import { BASE_URL } from '../env';
import { postCredentials, sessionCookies } from '../helpers/credentials';
import { expectSameOrigin } from '../helpers/http';

const PRODUCTION_PROVIDERS = [
  'anonymous',
  'bluesky-direct',
  'discord',
  'email',
  'google',
  'kick',
  'linkedin',
  'steam',
  'tiktok',
  'twitch',
  'twitter',
  'velora'
];

const SEED_PATHS = [
  'health',
  'teams',
  'sweepstakes',
  'rows',
  'runs/abc123',
  'janitor',
  'does-not-exist'
];

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

const SITE_KEY = /["'`]([0-3]x[0-9A-Za-z_-]{20,})["'`]/g;

const madeUpSecret = () => randomBytes(20).toString('hex');

test.describe(
  'e2e bypasses on production',
  { tag: ['@prod-safe', '@security'] },
  () => {
    test('offers only the production sign-in providers', async ({
      request
    }) => {
      const response = await request.get('/api/auth/providers');

      expect(response.status()).toBe(200);
      const providers = Object.keys(await response.json()).sort();
      expect(providers, 'The e2e provider is on').not.toContain('e2e');
      expect(
        providers,
        'Add a new production provider to PRODUCTION_PROVIDERS on purpose'
      ).toEqual(PRODUCTION_PROVIDERS);
    });

    test('refuses an e2e sign-in before any provider runs', async ({
      request
    }) => {
      const signIn = await postCredentials(request, 'e2e', {
        secret: madeUpSecret()
      });

      expect(signIn.status()).toBe(302);
      const { location } = signIn.headers();
      expectSameOrigin(location);
      const error = new URL(location, BASE_URL).searchParams.get('error');
      expect(error, 'The redirect names no error').toBeTruthy();
      expect(
        error,
        'The e2e provider exists: it ran and refused the made-up secret'
      ).not.toBe('CredentialsSignin');
      expect(sessionCookies(signIn), 'The response sets a session').toEqual([]);

      const session = await request.get('/api/auth/session');
      expect(await session.json()).toBeNull();
    });

    for (const [secret, label] of [
      [undefined, 'without a secret'],
      [madeUpSecret(), 'with a made-up secret']
    ] as const) {
      test(`hides every seed API path from a caller ${label}`, async ({
        request
      }) => {
        await Promise.all(
          SEED_PATHS.flatMap((path) =>
            METHODS.map(async (method) => {
              const response = await request.fetch(`/api/e2e/${path}`, {
                method,
                headers: secret ? { 'x-e2e-secret': secret } : {},
                data: method === 'GET' ? undefined : {}
              });

              expect(response.status(), `${method} ${path}`).toBe(404);
              expect(await response.text(), `${method} ${path}`).toBe('');
            })
          )
        );
      });
    }

    test('serves a production Turnstile site key on a giveaway page', async ({
      request
    }) => {
      const browse = await request.get('/browse');
      expect(browse.status()).toBe(200);
      const id = (await browse.text()).match(
        /href="\/browse\/([^"/?#]+)"/
      )?.[1];
      if (!id) {
        test.info().annotations.push({
          type: 'warning',
          description:
            '/browse has no public giveaway, so the Turnstile check did not run'
        });
      }
      test.skip(!id, '/browse has no public giveaway');

      const page = await request.get(`/browse/${id}`);
      expect(page.status(), `GET /browse/${id}`).toBe(200);
      const html = await page.text();
      const scripts = [
        ...new Set(html.match(/\/_next\/static\/chunks\/[^"'\s\\]+\.js/g))
      ];
      expect(scripts, 'The giveaway page loads no script').not.toEqual([]);

      const sources = await Promise.all(
        scripts.map(async (script) => {
          const response = await request.get(script);
          expect(response.status(), `GET ${script}`).toBe(200);
          return response.text();
        })
      );
      const keys = [
        ...new Set(
          [html, ...sources].flatMap((source) =>
            [...source.matchAll(SITE_KEY)].map(([, key]) => key)
          )
        )
      ];

      expect(
        keys.filter((key) => !key.startsWith('0x')),
        'The page has a Turnstile test site key'
      ).toEqual([]);
      expect(
        keys,
        'The page has no production Turnstile site key, so the security check is off'
      ).not.toEqual([]);
    });
  }
);
