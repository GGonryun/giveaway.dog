import { expect, test } from '../fixtures/test';
import { BASE_URL } from '../env';
import { expectNoStackTrace } from '../helpers/http';

const METADATA_PATH = '/api/bluesky/client-metadata.json';

const PRIVATE_JWK_MEMBERS = ['d', 'p', 'q', 'dp', 'dq', 'qi', 'k'];

test.describe(
  'Bluesky OAuth client',
  { tag: ['@security', '@prod-safe'] },
  () => {
    test('publishes only the public half of its keys', async ({ request }) => {
      const response = await request.get('/api/bluesky/jwks.json');

      expect(response.status()).toBe(200);
      const body = await response.text();
      expectNoStackTrace(body);
      const { keys } = JSON.parse(body);

      expect(keys.length, 'The JWKS has no keys').toBeGreaterThan(0);
      for (const key of keys) {
        expect(key).toMatchObject({
          kty: 'EC',
          crv: 'P-256',
          x: expect.any(String),
          y: expect.any(String),
          kid: expect.any(String)
        });
        expect(
          PRIVATE_JWK_MEMBERS.filter((member) => member in key),
          `The key ${key.kid} has private members`
        ).toEqual([]);
      }
    });

    test('serves client metadata on one https origin', async ({ request }) => {
      const response = await request.get(METADATA_PATH);

      expect(response.status()).toBe(200);
      const metadata = await response.json();
      const clientId = new URL(metadata.client_id);
      const { origin } = clientId;

      expect(clientId.pathname).toBe(METADATA_PATH);
      if (new URL(BASE_URL).protocol === 'https:') {
        expect(clientId.protocol).toBe('https:');
      }
      expect(metadata).toMatchObject({
        token_endpoint_auth_method: 'private_key_jwt',
        dpop_bound_access_tokens: true,
        scope: 'atproto transition:generic'
      });
      expect(new URL(metadata.client_uri).origin).toBe(origin);
      expect(new URL(metadata.jwks_uri).origin).toBe(origin);
      expect(metadata.redirect_uris).not.toEqual([]);
      for (const uri of metadata.redirect_uris) {
        expect(new URL(uri).origin, uri).toBe(origin);
      }

      expect
        .soft(origin, 'The metadata is not on the origin of E2E_BASE_URL')
        .toBe(new URL(BASE_URL).origin);
    });
  }
);
