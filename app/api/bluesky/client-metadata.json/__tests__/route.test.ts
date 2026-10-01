import { describe, it, expect, vi, afterEach } from 'vitest';
import { GET } from '../route';

describe('bluesky client-metadata.json GET', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('when NEXTAUTH_URL is not configured', () => {
    it('returns a 500 error when the variable is unset', async () => {
      vi.stubEnv('NEXTAUTH_URL', undefined);

      const res = await GET();

      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({
        error: 'NEXTAUTH_URL not configured'
      });
    });

    it('returns a 500 error when the variable is empty', async () => {
      vi.stubEnv('NEXTAUTH_URL', '');

      const res = await GET();

      expect(res.status).toBe(500);
    });

    it('does not set the cache header on the error response', async () => {
      vi.stubEnv('NEXTAUTH_URL', undefined);

      const res = await GET();

      expect(res.headers.get('cache-control')).toBeNull();
    });
  });

  describe('when NEXTAUTH_URL is configured', () => {
    it('returns the OAuth client metadata built from the base URL', async () => {
      vi.stubEnv('NEXTAUTH_URL', 'https://giveaway.dog');

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
      vi.stubEnv('NEXTAUTH_URL', 'https://giveaway.dog');

      const res = await GET();

      expect(res.headers.get('content-type')).toBe('application/json');
      expect(res.headers.get('cache-control')).toBe('public, max-age=3600');
    });

    it('concatenates a trailing slash in the base URL verbatim', async () => {
      vi.stubEnv('NEXTAUTH_URL', 'https://giveaway.dog/');

      const res = await GET();
      const body = await res.json();

      expect(body.client_id).toBe(
        'https://giveaway.dog//api/bluesky/client-metadata.json'
      );
      expect(body.client_uri).toBe('https://giveaway.dog/');
    });
  });
});
