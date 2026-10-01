import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';
import {
  VeloraCreatorSchema,
  VeloraProfileSchema,
  VeloraProvider,
  type VeloraProfile
} from '../velora';

const options = { clientId: 'velora-id', clientSecret: 'velora-secret' };

type TokenEndpoint = {
  url: string;
  conform: (response: Response) => Promise<Response>;
};

type UserinfoEndpoint = {
  url: string;
  request: (ctx: { tokens: { access_token?: string } }) => Promise<unknown>;
};

const tokenEndpoint = () =>
  VeloraProvider(options).token as unknown as TokenEndpoint;

const userinfoEndpoint = () =>
  VeloraProvider(options).userinfo as unknown as UserinfoEndpoint;

const callProfile = (profile: unknown) =>
  VeloraProvider(options).profile?.(profile as VeloraProfile, {});

const creator = {
  id: 'c-1',
  slug: 'creator',
  channelName: 'Creator Channel',
  description: null,
  bannerUrl: null,
  status: 'APPROVED',
  tier: 'BASIC',
  followerCount: 10,
  totalStreamHours: 5
};

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('VeloraCreatorSchema', () => {
  it('accepts a creator with only the required fields', () => {
    expect(VeloraCreatorSchema.parse(creator)).toEqual(creator);
  });

  it('accepts optional and nullable fields', () => {
    const full = {
      ...creator,
      totalRevenue: '100.00',
      stripeConnectAccountId: null,
      stripeOnboardingComplete: true,
      youtubeChannelId: null,
      youtubeRefreshToken: 'token',
      totalViews: 3,
      subscriptionPrice: 499,
      revenueSharePercentage: '50',
      socialLinks: { x: 'y' },
      streamSettings: null,
      emoteSlots: 5,
      channelEmoteSlots: 2,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-02',
      approvedAt: null
    };

    expect(VeloraCreatorSchema.parse(full)).toEqual(full);
  });

  it.each(['id', 'slug', 'channelName', 'status', 'tier'])(
    'requires the %s field',
    (field) => {
      const rest: Record<string, unknown> = { ...creator };
      delete rest[field];

      expect(VeloraCreatorSchema.safeParse(rest).success).toBe(false);
    }
  );

  it('requires description to be present even if null', () => {
    const rest: Record<string, unknown> = { ...creator };
    delete rest.description;

    expect(VeloraCreatorSchema.safeParse(rest).success).toBe(false);
  });

  it('rejects a string follower count', () => {
    expect(
      VeloraCreatorSchema.safeParse({ ...creator, followerCount: '10' }).success
    ).toBe(false);
  });
});

describe('VeloraProfileSchema', () => {
  it('accepts a minimal profile with id and username', () => {
    expect(VeloraProfileSchema.parse({ id: 'u-1', username: 'velo' })).toEqual({
      id: 'u-1',
      username: 'velo'
    });
  });

  it('accepts null or undefined email, display name and bio', () => {
    expect(
      VeloraProfileSchema.safeParse({
        id: 'u-1',
        username: 'velo',
        email: null,
        displayName: undefined,
        bio: null
      }).success
    ).toBe(true);
  });

  it('accepts a nested creator and profile customization', () => {
    const profile = {
      id: 'u-1',
      username: 'velo',
      creator,
      profileCustomization: { accentColor: null },
      accentColor: '#fff'
    };

    expect(VeloraProfileSchema.parse(profile)).toEqual(profile);
  });

  it('strips unknown keys', () => {
    expect(
      VeloraProfileSchema.parse({ id: 'u-1', username: 'velo', unknown: 1 })
    ).toEqual({ id: 'u-1', username: 'velo' });
  });

  it('rejects a profile without a username', () => {
    expect(VeloraProfileSchema.safeParse({ id: 'u-1' }).success).toBe(false);
  });

  it('rejects an invalid nested creator', () => {
    expect(
      VeloraProfileSchema.safeParse({
        id: 'u-1',
        username: 'velo',
        creator: { id: 'c' }
      }).success
    ).toBe(false);
  });

  it('rejects profile customization without an accent color key', () => {
    expect(
      VeloraProfileSchema.safeParse({
        id: 'u-1',
        username: 'velo',
        profileCustomization: {}
      }).success
    ).toBe(false);
  });
});

describe('VeloraProvider', () => {
  describe('configuration', () => {
    it('identifies itself as the velora oauth provider', () => {
      expect(VeloraProvider(options)).toMatchObject({
        id: 'velora',
        name: 'Velora',
        type: 'oauth'
      });
    });

    it('authenticates the token request with client_secret_post', () => {
      expect(VeloraProvider(options).client).toEqual({
        token_endpoint_auth_method: 'client_secret_post'
      });
    });

    it('authorizes against velora.tv with the user:read scope', () => {
      expect(VeloraProvider(options).authorization).toEqual({
        url: 'https://velora.tv/oauth/authorize',
        params: { response_type: 'code', scope: 'user:read' }
      });
    });

    it('uses the velora token and userinfo endpoints', () => {
      expect(tokenEndpoint().url).toBe(
        'https://api.velora.tv/api/developer/oauth/token'
      );
      expect(userinfoEndpoint().url).toBe('https://api.velora.tv/api/users/me');
    });

    it('requires pkce and state checks', () => {
      expect(VeloraProvider(options).checks).toEqual(['pkce', 'state']);
    });

    it('uses the velora brand colors', () => {
      expect(VeloraProvider(options).style).toEqual({
        bg: '#7c3aed',
        text: '#fff'
      });
    });

    it('passes the user options through unchanged', () => {
      expect(VeloraProvider(options).options).toBe(options);
    });
  });

  describe('token conform', () => {
    it('rewrites a 201 response to a 200 response with the same body', async () => {
      const original = new Response('{"access_token":"abc"}', {
        status: 201,
        headers: { 'content-type': 'application/json' }
      });

      const conformed = await tokenEndpoint().conform(original);

      expect(conformed).not.toBe(original);
      expect(conformed.status).toBe(200);
      expect(await conformed.text()).toBe('{"access_token":"abc"}');
    });

    it('keeps the headers of a rewritten 201 response', async () => {
      const original = new Response('{}', {
        status: 201,
        headers: { 'content-type': 'application/json', 'x-request': 'r-1' }
      });

      const conformed = await tokenEndpoint().conform(original);

      expect(conformed.headers.get('content-type')).toBe('application/json');
      expect(conformed.headers.get('x-request')).toBe('r-1');
    });

    it('returns a 200 response unchanged', async () => {
      const original = new Response('{}', { status: 200 });

      expect(await tokenEndpoint().conform(original)).toBe(original);
    });

    it('returns an error response unchanged', async () => {
      const original = new Response('bad', { status: 400 });

      expect(await tokenEndpoint().conform(original)).toBe(original);
    });
  });

  describe('userinfo request', () => {
    it('fetches the current user with the bearer token', async () => {
      fetchMock.mockResolvedValue(
        new Response(JSON.stringify({ id: 'u-1' }), { status: 200 })
      );

      await userinfoEndpoint().request({ tokens: { access_token: 'tok' } });

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.velora.tv/api/users/me',
        {
          headers: {
            Authorization: 'Bearer tok',
            Accept: 'application/json'
          }
        }
      );
    });

    it('returns the parsed json body', async () => {
      fetchMock.mockResolvedValue(
        new Response(JSON.stringify({ id: 'u-1', username: 'velo' }), {
          status: 200
        })
      );

      const body = await userinfoEndpoint().request({
        tokens: { access_token: 'tok' }
      });

      expect(body).toEqual({ id: 'u-1', username: 'velo' });
    });

    it('sends an undefined bearer token when no access token exists', async () => {
      fetchMock.mockResolvedValue(new Response('{}', { status: 200 }));

      await userinfoEndpoint().request({ tokens: {} });

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.velora.tv/api/users/me',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer undefined'
          })
        })
      );
    });

    it('throws with the status and body when the request fails', async () => {
      fetchMock.mockResolvedValue(
        new Response('unauthorized', { status: 401 })
      );

      await expect(
        userinfoEndpoint().request({ tokens: { access_token: 'tok' } })
      ).rejects.toThrow('Velora userinfo failed: 401 - unauthorized');
    });
  });

  describe('profile', () => {
    it('uses the display name when present', async () => {
      expect(
        await callProfile({
          id: 'u-1',
          username: 'velo',
          displayName: 'Velo Display',
          email: 'v@example.com'
        })
      ).toEqual({
        id: 'u-1',
        name: 'Velo Display',
        email: 'v@example.com',
        image: null
      });
    });

    it('falls back to the username when the display name is empty', async () => {
      const user = await callProfile({
        id: 'u-1',
        username: 'velo',
        displayName: ''
      });

      expect(user?.name).toBe('velo');
    });

    it('returns a null email when the profile has none', async () => {
      const user = await callProfile({ id: 'u-1', username: 'velo' });

      expect(user?.email).toBeNull();
    });

    it('throws a zod error for an invalid profile', () => {
      expect(() => callProfile({ id: 'u-1' })).toThrow(z.ZodError);
    });
  });
});
