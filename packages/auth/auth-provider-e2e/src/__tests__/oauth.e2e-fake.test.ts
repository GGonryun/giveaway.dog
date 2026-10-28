import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { customFetch } from 'next-auth';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import {
  E2E_CLOSED_GATES,
  E2E_TEST_SECRET,
  stubE2eFakeEnvironment
} from '@giveaway/e2e-fakes/testing/env';
import {
  toE2eOAuthProfileCookieValue,
  type E2eDiscordProfile
} from '@giveaway/e2e-model/oauth';
import {
  E2E_OAUTH_TOKEN_URL,
  E2E_OAUTH_USERINFO_URL,
  readE2eOAuthProfiles,
  withE2eOAuth
} from '../oauth';

vi.mock('next-auth', () => ({ customFetch: Symbol('customFetch') }));
vi.mock('next/headers', () => ({ cookies: vi.fn() }));

const PROFILE: E2eDiscordProfile = {
  id: '1234567890',
  username: 'e2e_user',
  email: 'e2e-newbie-abc123@example.com'
};

const PARSED_PROFILE = {
  ...PROFILE,
  global_name: null,
  verified: true,
  avatar: null,
  discriminator: '0'
};

const toJar = (values: Record<string, string>) => ({
  get: (name: string) =>
    name in values ? { name, value: values[name] } : undefined
});

const mockCookies = (values: Record<string, string | undefined>) =>
  Object.fromEntries(
    Object.entries(values).filter(
      (entry): entry is [string, string] => entry[1] !== undefined
    )
  );

const requestWith = (values: Record<string, string | undefined>) =>
  ({ cookies: toJar(mockCookies(values)) }) as unknown as NextRequest;

const OPTED_IN = {
  'e2e-oauth': E2E_TEST_SECRET,
  'e2e-oauth-discord': toE2eOAuthProfileCookieValue(PROFILE)
};

beforeEach(() => {
  vi.mocked(cookies).mockReset();
  stubE2eFakeEnvironment('preview');
  vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://preview.giveaway.dog');
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('readE2eOAuthProfiles', () => {
  it('reads the profile from the cookies of a request', async () => {
    expect(await readE2eOAuthProfiles(requestWith(OPTED_IN))).toEqual({
      discord: PARSED_PROFILE
    });
    expect(cookies).not.toHaveBeenCalled();
  });

  it('reads the cookies of a server action, which has no request', async () => {
    vi.mocked(cookies).mockResolvedValue(
      toJar(OPTED_IN) as unknown as Awaited<ReturnType<typeof cookies>>
    );

    expect(await readE2eOAuthProfiles(undefined)).toEqual({
      discord: PARSED_PROFILE
    });
  });

  it('reads the local development server', async () => {
    stubE2eFakeEnvironment('development');

    expect(await readE2eOAuthProfiles(requestWith(OPTED_IN))).toEqual({
      discord: PARSED_PROFILE
    });
  });

  it.each(E2E_CLOSED_GATES)('reads no cookie on %s', async (environment) => {
    stubE2eFakeEnvironment(environment);

    expect(await readE2eOAuthProfiles(undefined)).toEqual({});
    expect(cookies).not.toHaveBeenCalled();
  });

  it.each([
    ['without the secret cookie', { 'e2e-oauth': undefined }],
    ['with a wrong secret', { 'e2e-oauth': `${E2E_TEST_SECRET}x` }]
  ])('returns no profile %s', async (_, change) => {
    expect(
      await readE2eOAuthProfiles(requestWith({ ...OPTED_IN, ...change }))
    ).toEqual({});
  });

  it('reads the profile of each provider that has a cookie', async () => {
    const tiktok = {
      open_id: 'e2e-newbie-abc123',
      username: 'e2e_tiktok'
    };

    expect(
      await readE2eOAuthProfiles(
        requestWith({
          ...OPTED_IN,
          'e2e-oauth-tiktok': toE2eOAuthProfileCookieValue(tiktok)
        })
      )
    ).toEqual({
      discord: PARSED_PROFILE,
      tiktok: {
        data: {
          user: { ...tiktok, display_name: null, avatar_url: null }
        }
      }
    });
  });

  it('returns no profile without the profile cookie', async () => {
    expect(
      await readE2eOAuthProfiles(
        requestWith({ ...OPTED_IN, 'e2e-oauth-discord': undefined })
      )
    ).toEqual({});
  });

  it('returns no profile when the profile cookie is not valid', async () => {
    expect(
      await readE2eOAuthProfiles(
        requestWith({
          ...OPTED_IN,
          'e2e-oauth-discord': toE2eOAuthProfileCookieValue({
            ...PROFILE,
            email: 'someone@gmail.com'
          })
        })
      )
    ).toEqual({});
  });

  it('returns no profile when the cookies cannot be read', async () => {
    vi.mocked(cookies).mockRejectedValue(
      new Error('cookies was called outside a request scope')
    );

    expect(await readE2eOAuthProfiles(undefined)).toEqual({});
  });

  it('rethrows the errors that Next.js uses to render a page dynamically', async () => {
    const dynamic = Object.assign(new Error('Dynamic server usage'), {
      digest: 'DYNAMIC_SERVER_USAGE'
    });
    vi.mocked(cookies).mockRejectedValue(dynamic);

    await expect(readE2eOAuthProfiles(undefined)).rejects.toBe(dynamic);
  });
});

type MockedProvider = Record<string | symbol, unknown> & {
  id: string;
  options: Record<string | symbol, unknown>;
};

const discord = () => ({
  id: 'discord',
  name: 'Discord',
  type: 'oauth' as const,
  authorization: 'https://discord.com/api/oauth2/authorize',
  token: 'https://discord.com/api/oauth2/token',
  userinfo: 'https://discord.com/api/users/@me',
  options: {
    clientId: 'real-client',
    clientSecret: 'real-secret',
    allowDangerousEmailAccountLinking: true,
    authorization: 'https://discord.com/api/oauth2/authorize?scope=identify'
  }
});

const google = () => ({
  id: 'google',
  name: 'Google',
  type: 'oidc' as const,
  options: { clientId: 'google' }
});

const mockedDiscord = () => {
  const [provider] = withE2eOAuth([discord()], {
    discord: PARSED_PROFILE
  }) as unknown as MockedProvider[];
  return provider;
};

const AUTHORIZE =
  'https://preview.giveaway.dog/api/e2e/oauth/authorize?scope=identify+email';

describe('withE2eOAuth', () => {
  it('leaves the providers as they are without a profile', () => {
    const providers = [discord(), google()];

    expect(withE2eOAuth(providers, {})).toEqual(providers);
  });

  it('leaves the providers that the mock does not replace', () => {
    const provider = google();
    const factory = Object.assign(() => discord(), { id: 'discord' });

    const result = withE2eOAuth([provider, factory], {
      discord: PARSED_PROFILE
    });

    expect(result[0]).toBe(provider);
    expect(result[1]).toBe(factory);
  });

  it('points the endpoints of the provider and of its options at the mock', () => {
    const provider = mockedDiscord();
    const endpoints = {
      clientId: 'e2e',
      clientSecret: 'e2e',
      authorization: AUTHORIZE,
      token: 'https://e2e-oauth.invalid/token',
      userinfo: 'https://e2e-oauth.invalid/userinfo'
    };

    expect(provider).toMatchObject({
      id: 'discord',
      name: 'Discord',
      ...endpoints,
      options: { ...endpoints, allowDangerousEmailAccountLinking: true }
    });
    expect(provider[customFetch]).toBe(provider.options[customFetch]);
  });

  it('replaces a provider that has no options', () => {
    const { options: _, ...rest } = discord();

    const [provider] = withE2eOAuth([rest], {
      discord: PARSED_PROFILE
    }) as unknown as MockedProvider[];

    expect(provider.options).toMatchObject({ authorization: AUTHORIZE });
  });

  it('replaces the token and userinfo requests of TikTok with the mock', () => {
    const tiktok = {
      id: 'tiktok',
      name: 'TikTok',
      type: 'oauth' as const,
      authorization: {
        url: 'https://www.tiktok.com/v2/auth/authorize',
        params: { client_key: 'real-client', scope: 'user.info.profile' }
      },
      token: {
        url: 'https://open.tiktokapis.com/v2/oauth/token/',
        request: vi.fn()
      },
      userinfo: {
        url: 'https://open.tiktokapis.com/v2/user/info/',
        request: vi.fn()
      },
      options: { clientId: 'real-client', clientSecret: 'real-secret' }
    };

    const [provider] = withE2eOAuth([tiktok], {
      tiktok: { data: { user: { open_id: 'e2e-newbie-abc123' } } }
    }) as unknown as MockedProvider[];
    const endpoints = {
      clientId: 'e2e',
      clientSecret: 'e2e',
      authorization:
        'https://preview.giveaway.dog/api/e2e/oauth/authorize?scope=user.info.profile',
      token: 'https://e2e-oauth.invalid/token',
      userinfo: 'https://e2e-oauth.invalid/userinfo'
    };

    expect(provider).toMatchObject({
      id: 'tiktok',
      ...endpoints,
      options: endpoints
    });
  });

  describe('the fetch of the mocked provider', () => {
    const mockFetch = () =>
      mockedDiscord()[customFetch] as (
        ...args: Parameters<typeof fetch>
      ) => Promise<Response>;

    it('answers the token request without the network', async () => {
      const network = vi.fn();
      vi.stubGlobal('fetch', network);

      const response = await mockFetch()(E2E_OAUTH_TOKEN_URL, {
        method: 'POST'
      });

      expect(await response.json()).toEqual({
        access_token: 'e2e-oauth-access-token',
        token_type: 'bearer',
        expires_in: 604800,
        refresh_token: 'e2e-oauth-access-token-refresh',
        scope: 'identify email'
      });
      expect(network).not.toHaveBeenCalled();
    });

    it('answers the userinfo request with the profile', async () => {
      const network = vi.fn();
      vi.stubGlobal('fetch', network);

      const response = await mockFetch()(new Request(E2E_OAUTH_USERINFO_URL));

      expect(await response.json()).toEqual(PARSED_PROFILE);
      expect(network).not.toHaveBeenCalled();
    });

    it('passes any other request to fetch', async () => {
      const answer = new Response('ok');
      const network = vi.fn().mockResolvedValue(answer);
      vi.stubGlobal('fetch', network);
      const init = { method: 'GET' };

      const response = await mockFetch()('https://example.com/other', init);

      expect(response).toBe(answer);
      expect(network).toHaveBeenCalledWith('https://example.com/other', init);
    });
  });
});
