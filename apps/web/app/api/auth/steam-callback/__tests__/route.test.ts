import { describe, it, expect, vi, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../route';

const request = (query: string) =>
  new NextRequest(`http://localhost:3000/api/auth/steam-callback${query}`);

describe('steam-callback route', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('GET', () => {
    it('redirects to the NextAuth steam callback with a fake code appended', async () => {
      vi.stubEnv('NEXTAUTH_URL', 'https://giveaway.dog');

      const res = await GET(request('?openid.mode=id_res'));

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe(
        'https://giveaway.dog/api/auth/callback/steam?openid.mode=id_res&code=123'
      );
    });

    it('overwrites an existing code parameter with the fake code in place', async () => {
      vi.stubEnv('NEXTAUTH_URL', 'https://giveaway.dog');

      const res = await GET(request('?code=real&openid.mode=id_res'));

      expect(res.headers.get('location')).toBe(
        'https://giveaway.dog/api/auth/callback/steam?code=123&openid.mode=id_res'
      );
    });

    it('re-encodes the forwarded OpenID parameters', async () => {
      vi.stubEnv('NEXTAUTH_URL', 'https://giveaway.dog');

      const res = await GET(
        request(
          '?openid.ns=http://specs.openid.net/auth/2.0&openid.claimed_id=https://steamcommunity.com/openid/id/765'
        )
      );

      expect(res.headers.get('location')).toBe(
        'https://giveaway.dog/api/auth/callback/steam?openid.ns=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0&openid.claimed_id=https%3A%2F%2Fsteamcommunity.com%2Fopenid%2Fid%2F765&code=123'
      );
    });

    it('redirects with only the fake code when no parameters are given', async () => {
      vi.stubEnv('NEXTAUTH_URL', 'http://localhost:3000');

      const res = await GET(request(''));

      expect(res.headers.get('location')).toBe(
        'http://localhost:3000/api/auth/callback/steam?code=123'
      );
    });

    it('redirects to the deployment url on a preview', async () => {
      vi.stubEnv('VERCEL_ENV', 'preview');
      vi.stubEnv('VERCEL_URL', 'giveaway-abc.vercel.app');
      vi.stubEnv('NEXTAUTH_URL', undefined);

      const res = await GET(request('?openid.mode=id_res'));

      expect(res.headers.get('location')).toBe(
        'https://giveaway-abc.vercel.app/api/auth/callback/steam?openid.mode=id_res&code=123'
      );
    });

    it('throws a malformed URL error when NEXTAUTH_URL is not configured', async () => {
      vi.stubEnv('NEXTAUTH_URL', undefined);

      await expect(GET(request('?openid.mode=id_res'))).rejects.toThrow(
        'URL is malformed "undefined/api/auth/callback/steam?openid.mode=id_res&code=123"'
      );
    });
  });

  describe('POST', () => {
    it('returns a fake token payload', async () => {
      const res = await POST();

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ token: '123' });
    });
  });
});
