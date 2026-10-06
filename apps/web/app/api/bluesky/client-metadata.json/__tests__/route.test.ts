import { describe, it, expect, vi, afterEach } from 'vitest';
import { GET } from '../route';

describe('bluesky client-metadata.json GET', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('when NEXT_PUBLIC_APP_URL is not configured', () => {
    it('builds the metadata from the deployment URL', async () => {
      vi.stubEnv('NEXT_PUBLIC_APP_URL', undefined);
      vi.stubEnv('NEXT_PUBLIC_VERCEL_URL', undefined);
      vi.stubEnv('VERCEL_URL', 'giveaway-abc123-team.vercel.app');

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.client_id).toBe(
        'https://giveaway-abc123-team.vercel.app/api/bluesky/client-metadata.json'
      );
      expect(body.redirect_uris).toEqual([
        'https://giveaway-abc123-team.vercel.app/api/bluesky/user/callback',
        'https://giveaway-abc123-team.vercel.app/api/bluesky/team/callback'
      ]);
    });

    it('builds the metadata from localhost when no deployment URL is set', async () => {
      vi.stubEnv('NEXT_PUBLIC_APP_URL', '');
      vi.stubEnv('NEXT_PUBLIC_VERCEL_URL', undefined);
      vi.stubEnv('VERCEL_URL', undefined);

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.client_id).toBe(
        'http://localhost:3000/api/bluesky/client-metadata.json'
      );
    });
  });

  describe('when NEXT_PUBLIC_APP_URL is configured', () => {
    it('returns the OAuth client metadata built from the base URL', async () => {
      vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://giveaway.dog');

      const res = await GET();

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({
        client_id: 'https://giveaway.dog/api/bluesky/client-metadata.json',
        client_name: 'Giveaway.dog',
        client_uri: 'https://giveaway.dog',
        logo_uri: 'https://giveaway.dog/logo.png',
        redirect_uris: [
          'https://giveaway.dog/api/bluesky/user/callback',
          'https://giveaway.dog/api/bluesky/team/callback'
        ],
        grant_types: ['authorization_code', 'refresh_token'],
        scope: 'atproto transition:generic',
        response_types: ['code'],
        application_type: 'web',
        token_endpoint_auth_method: 'private_key_jwt',
        token_endpoint_auth_signing_alg: 'ES256',
        dpop_bound_access_tokens: true,
        jwks_uri: 'https://giveaway.dog/api/bluesky/jwks.json'
      });
    });

    it('serves the metadata as JSON cacheable for one hour', async () => {
      vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://giveaway.dog');

      const res = await GET();

      expect(res.headers.get('content-type')).toBe('application/json');
      expect(res.headers.get('cache-control')).toBe('public, max-age=3600');
    });

    it('concatenates a trailing slash in the base URL verbatim', async () => {
      vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://giveaway.dog/');

      const res = await GET();
      const body = await res.json();

      expect(body.client_id).toBe(
        'https://giveaway.dog//api/bluesky/client-metadata.json'
      );
      expect(body.client_uri).toBe('https://giveaway.dog/');
    });
  });
});
