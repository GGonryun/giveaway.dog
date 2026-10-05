import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { auth, handlers, signIn, signOut } from '../config';
import {
  createAuthConfig,
  type GetSession
} from '@giveaway/auth-core/config-runtime';
import { createHash } from 'crypto';
import { knownRequestError, prismaMock } from '@giveaway/testing-server/prisma';

type ProviderOptions = Record<string, unknown> & {
  id?: string;
  profile?: (profile: unknown, tokens: unknown) => unknown;
  authorize?: (credentials: unknown, request?: unknown) => Promise<unknown>;
};

type RawProvider = Record<string, unknown> & {
  id: string;
  options?: ProviderOptions;
  sendVerificationRequest?: (args: {
    identifier: string;
    url: string;
  }) => Promise<void>;
  token?: { conform: () => Promise<Response> };
};

type AuthConfig = ReturnType<typeof createAuthConfig>;

type BuiltConfig = Omit<AuthConfig, 'providers'> & {
  providers: RawProvider[];
};

type ConfigFactory = (request: Request | undefined) => BuiltConfig;

const mocks = vi.hoisted(() => {
  const instance = {
    handlers: { GET: vi.fn(), POST: vi.fn() },
    signIn: vi.fn(),
    signOut: vi.fn(),
    auth: vi.fn()
  };
  const send = vi.fn();
  return {
    instance,
    NextAuth: vi.fn<(config: unknown) => typeof instance>(() => instance),
    createId: vi.fn<() => string>(),
    send,
    Inbound: vi.fn(function () {
      return { emails: { send } };
    })
  };
});

vi.mock('next-auth', () => ({ default: mocks.NextAuth }));

vi.mock('@giveaway/auth-core/config-runtime', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@giveaway/auth-core/config-runtime')>();
  return { ...actual, createAuthConfig: vi.fn(actual.createAuthConfig) };
});

vi.mock('@paralleldrive/cuid2', () => ({ createId: mocks.createId }));

vi.mock('inboundemail', () => ({ default: mocks.Inbound }));

const ENV = {
  TIKTOK_CLIENT_ID: 'tiktok-id',
  TIKTOK_CLIENT_SECRET: 'tiktok-secret',
  STEAM_SECRET: 'steam-secret',
  NEXTAUTH_URL: 'https://giveaway.dog',
  TWITTER_LOGIN_APP_CLIENT_ID: 'twitter-id',
  TWITTER_LOGIN_APP_CLIENT_SECRET: 'twitter-secret',
  GOOGLE_ID: 'google-id',
  GOOGLE_SECRET: 'google-secret',
  DISCORD_ID: 'discord-id',
  DISCORD_SECRET: 'discord-secret',
  TWITCH_CLIENT_ID: 'twitch-id',
  TWITCH_CLIENT_SECRET: 'twitch-secret',
  KICK_CLIENT_ID: 'kick-id',
  KICK_CLIENT_SECRET: 'kick-secret',
  VELORA_CLIENT_ID: 'velora-id',
  VELORA_CLIENT_SECRET: 'velora-secret',
  INBOUND_SECRET: 'inbound-secret',
  LINKEDIN_CLIENT_ID: 'linkedin-id',
  LINKEDIN_CLIENT_SECRET: 'linkedin-secret'
};

const factory = () => mocks.NextAuth.mock.calls[0][0] as ConfigFactory;

const createAuthConfigMock = vi.mocked(createAuthConfig);

const authConfig = () =>
  createAuthConfigMock.mock.results[0].value as AuthConfig;

const getSession = () => createAuthConfigMock.mock.calls[0][0] as GetSession;

const buildConfig = (request?: Request) => factory()(request);

const providerId = (provider: RawProvider) =>
  provider.options?.id ?? provider.id;

const findProvider = (id: string, request?: Request) => {
  const provider = buildConfig(request).providers.find(
    (p) => providerId(p) === id
  );
  if (!provider) throw new Error(`Provider ${id} not found`);
  return provider;
};

const optionsOf = (id: string) => findProvider(id).options as ProviderOptions;

const fetchMock = vi.fn();

beforeEach(() => {
  for (const [key, value] of Object.entries(ENV)) {
    vi.stubEnv(key, value);
  }
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  mocks.createId.mockReset();
  mocks.send.mockReset();
  mocks.Inbound.mockClear();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'info').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('auth config', () => {
  describe('NextAuth instance', () => {
    it('is created once with a per-request config factory', () => {
      expect(mocks.NextAuth).toHaveBeenCalledTimes(1);
      expect(factory()).toEqual(expect.any(Function));
    });

    it('exports the handlers, signIn, signOut and auth of the instance', () => {
      expect(handlers).toBe(mocks.instance.handlers);
      expect(signIn).toBe(mocks.instance.signIn);
      expect(signOut).toBe(mocks.instance.signOut);
      expect(auth).toBe(mocks.instance.auth);
    });
  });

  describe('config factory', () => {
    it('spreads the runtime config', () => {
      const config = buildConfig();

      expect(config.callbacks).toBe(authConfig().callbacks);
      expect(config.events).toBe(authConfig().events);
      expect(config.adapter).toBe(authConfig().adapter);
      expect(config.pages).toBe(authConfig().pages);
      expect(config.session).toBe(authConfig().session);
    });

    it('builds the runtime config once', () => {
      buildConfig();
      buildConfig();

      expect(createAuthConfigMock).toHaveBeenCalledTimes(1);
    });

    it('gives the runtime config a session getter that reads the current session', async () => {
      const session = { user: { id: 'u-1' }, expires: '2026-12-31' };
      mocks.instance.auth.mockResolvedValue(session);

      await expect(getSession()()).resolves.toBe(session);
      expect(mocks.instance.auth).toHaveBeenCalledWith();
    });

    it('registers the providers in order', () => {
      expect(buildConfig().providers.map(providerId)).toEqual([
        'tiktok',
        'anonymous',
        'bluesky-direct',
        'steam',
        'twitter',
        'google',
        'discord',
        'twitch',
        'kick',
        'velora',
        'email',
        'linkedin'
      ]);
    });

    it('registers the e2e provider last when an e2e login secret is set', () => {
      vi.stubEnv('E2E_LOGIN_SECRET', 'e2e-secret-with-at-least-32-chars');
      vi.stubEnv('VERCEL_ENV', 'preview');

      expect(buildConfig().providers.map(providerId).at(-1)).toBe('e2e');
    });

    it('throws when the steam secret is missing', () => {
      vi.stubEnv('STEAM_SECRET', '');

      expect(() => buildConfig()).toThrow('Missing `clientSecret` parameter');
    });

    it('throws when NEXTAUTH_URL is missing', () => {
      vi.stubEnv('NEXTAUTH_URL', undefined);

      expect(() => buildConfig()).toThrow(TypeError);
    });
  });

  describe('oauth providers', () => {
    it.each([
      ['tiktok', 'tiktok-id', 'tiktok-secret'],
      ['twitter', 'twitter-id', 'twitter-secret'],
      ['google', 'google-id', 'google-secret'],
      ['discord', 'discord-id', 'discord-secret'],
      ['twitch', 'twitch-id', 'twitch-secret'],
      ['kick', 'kick-id', 'kick-secret'],
      ['velora', 'velora-id', 'velora-secret'],
      ['linkedin', 'linkedin-id', 'linkedin-secret']
    ])(
      'configures %s with env credentials and dangerous email linking',
      (id, clientId, clientSecret) => {
        expect(optionsOf(id)).toMatchObject({
          allowDangerousEmailAccountLinking: true,
          clientId,
          clientSecret
        });
      }
    );

    it('asks google for offline consent', () => {
      expect(optionsOf('google').authorization).toEqual({
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code'
        }
      });
    });

    it('requests the discord scopes joined with plus signs', () => {
      expect(optionsOf('discord').authorization).toBe(
        'https://discord.com/api/oauth2/authorize?scope=identify+email+guilds+guilds.members.read'
      );
    });

    it('requests the twitch scopes and id token claims', () => {
      expect(optionsOf('twitch').authorization).toEqual({
        params: {
          scope: 'openid user:read:email user:read:follows',
          claims: {
            id_token: { email: null, picture: null, preferred_username: null }
          }
        }
      });
    });

    it.each(['kick', 'velora'])('requests the user:read scope for %s', (id) => {
      expect(optionsOf(id).authorization).toEqual({
        params: { scope: 'user:read' }
      });
    });

    it('requests the linkedin scopes', () => {
      expect(optionsOf('linkedin').authorization).toEqual({
        params: { scope: 'openid profile email r_profile_basicinfo' }
      });
    });
  });

  describe('tiktok profile', () => {
    const tiktokUser = (user: Record<string, unknown>) => ({
      data: {
        user: {
          open_id: 'open-1',
          avatar_url: 'https://tiktok.com/a.png',
          ...user
        }
      }
    });

    const mapProfile = (user: Record<string, unknown>) =>
      optionsOf('tiktok').profile?.(tiktokUser(user), {});

    it('maps the tiktok user with display name and email', () => {
      expect(
        mapProfile({
          display_name: 'Display',
          username: 'user',
          email: 't@example.com'
        })
      ).toEqual({
        id: 'open-1',
        name: 'Display',
        image: 'https://tiktok.com/a.png',
        email: 't@example.com'
      });
    });

    it('falls back to the username for the name and email', () => {
      expect(mapProfile({ username: 'user' })).toMatchObject({
        name: 'user',
        email: 'user'
      });
    });

    it('returns a null email when there is no email or username', () => {
      expect(mapProfile({ display_name: 'Display' })).toMatchObject({
        name: 'Display',
        email: null
      });
    });
  });

  describe('twitter profile', () => {
    const mapProfile = (profile: Record<string, unknown>) =>
      optionsOf('twitter').profile?.(profile, {});

    it('reads the fields from the nested data object', () => {
      expect(
        mapProfile({
          data: {
            id: 'tw-1',
            name: 'Jack',
            email: 'j@example.com',
            profile_image_url: 'https://x.com/j.png',
            username: 'jack'
          }
        })
      ).toEqual({
        id: 'tw-1',
        name: 'Jack',
        email: 'j@example.com',
        image: 'https://x.com/j.png',
        username: 'jack'
      });
    });

    it('falls back to the top level fields when there is no data object', () => {
      expect(
        mapProfile({
          id: 'tw-2',
          name: 'Top',
          email: 'top@example.com',
          profile_image_url: 'https://x.com/top.png',
          username: 'top'
        })
      ).toEqual({
        id: 'tw-2',
        name: 'Top',
        email: 'top@example.com',
        image: 'https://x.com/top.png',
        username: 'top'
      });
    });

    it('falls back field by field when the data object is partial', () => {
      expect(
        mapProfile({ data: { id: 'nested' }, name: 'Outer', username: 'outer' })
      ).toEqual({
        id: 'nested',
        name: 'Outer',
        email: undefined,
        image: undefined,
        username: 'outer'
      });
    });
  });

  describe('anonymous credentials provider', () => {
    it('is named Anonymous and takes no credentials', () => {
      expect(optionsOf('anonymous')).toMatchObject({
        id: 'anonymous',
        name: 'Anonymous',
        credentials: {}
      });
    });

    it('creates an anonymous user with a generated id', async () => {
      mocks.createId.mockReturnValue('cuid-1');
      const created = { id: 'cuid-1', name: 'Anonymous', source: 'ANONYMOUS' };
      prismaMock.user.create.mockResolvedValue(created);

      const user = await optionsOf('anonymous').authorize?.({});

      expect(user).toBe(created);
      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: { id: 'cuid-1', name: 'Anonymous', source: 'ANONYMOUS' }
      });
    });

    it('logs and rethrows when the user cannot be created', async () => {
      const error = new Error('db down');
      prismaMock.user.create.mockRejectedValue(error);

      await expect(optionsOf('anonymous').authorize?.({})).rejects.toBe(error);
      expect(console.error).toHaveBeenCalledWith(
        'Error creating anonymous user:',
        error
      );
    });
  });

  describe('bluesky direct credentials provider', () => {
    const authorize = (credentials: unknown) =>
      optionsOf('bluesky-direct').authorize?.(credentials);

    const storedToken = (token: string, expires: Date) => ({
      identifier: 'bluesky-direct:u-1',
      token: createHash('sha256').update(token).digest('hex'),
      expires
    });

    const FUTURE = new Date(Date.now() + 60_000);

    it('accepts only a login token credential', () => {
      expect(optionsOf('bluesky-direct')).toMatchObject({
        id: 'bluesky-direct',
        name: 'Bluesky Direct',
        credentials: { token: { label: 'Login Token', type: 'text' } }
      });
      expect(optionsOf('bluesky-direct').credentials).not.toHaveProperty(
        'userId'
      );
    });

    it('returns null for a bare user id without a valid token', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 'u-1' });

      expect(await authorize({ userId: 'u-1' })).toBeNull();
      expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    });

    it('returns null for a user id sent as the token', async () => {
      prismaMock.verificationToken.findFirst.mockResolvedValue(null);
      prismaMock.user.findUnique.mockResolvedValue({ id: 'u-1' });

      expect(await authorize({ token: 'u-1' })).toBeNull();
      expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    });

    it('returns null when no credentials are provided', async () => {
      expect(await authorize(undefined)).toBeNull();
      expect(await authorize({})).toBeNull();
      expect(prismaMock.verificationToken.findFirst).not.toHaveBeenCalled();
    });

    it('accepts a token one time and rejects it the second time', async () => {
      const found = { id: 'u-1', name: 'Blue' };
      const row = storedToken('login-token', FUTURE);
      prismaMock.verificationToken.findFirst.mockResolvedValue(row);
      prismaMock.verificationToken.delete
        .mockResolvedValueOnce(row)
        .mockRejectedValueOnce(knownRequestError('P2025'));
      prismaMock.user.findUnique.mockResolvedValue(found);

      expect(await authorize({ token: 'login-token' })).toBe(found);
      expect(await authorize({ token: 'login-token' })).toBeNull();
      expect(prismaMock.user.findUnique).toHaveBeenCalledTimes(1);
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'u-1' }
      });
    });

    it('rejects an expired token', async () => {
      const row = storedToken('login-token', new Date(Date.now() - 1));
      prismaMock.verificationToken.findFirst.mockResolvedValue(row);
      prismaMock.verificationToken.delete.mockResolvedValue(row);
      prismaMock.user.findUnique.mockResolvedValue({ id: 'u-1' });

      expect(await authorize({ token: 'login-token' })).toBeNull();
      expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('steam provider', () => {
    it('uses the steam secret and the steam callback url', () => {
      const steam = findProvider('steam');

      expect(steam.clientSecret).toBe('steam-secret');
      expect(steam.authorization).toMatchObject({
        params: {
          'openid.return_to': 'https://giveaway.dog/api/auth/steam-callback',
          'openid.realm': 'https://giveaway.dog'
        }
      });
    });

    it('verifies against the request passed to the factory', async () => {
      const steam = findProvider(
        'steam',
        new Request('https://giveaway.dog/api/auth/steam-callback?x=1')
      );

      await expect(steam.token?.conform()).rejects.toThrow(
        'Authentication failed: Unable to verify Steam ID'
      );
    });

    it('fails verification when the factory receives no request', async () => {
      const steam = findProvider('steam');

      await expect(steam.token?.conform()).rejects.toThrow(
        'No URL found in request object'
      );
    });
  });

  describe('email provider', () => {
    it('sends magic links with the inbound secret', async () => {
      mocks.send.mockResolvedValue({ id: 'email-1' });

      await findProvider('email').sendVerificationRequest?.({
        identifier: 'u@example.com',
        url: 'https://giveaway.dog/magic'
      });

      expect(mocks.Inbound).toHaveBeenCalledWith({ apiKey: 'inbound-secret' });
      expect(mocks.send).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'u@example.com' })
      );
    });
  });

  describe('linkedin profile', () => {
    const linkedInProfile = {
      sub: 'li-1',
      name: 'Jane Doe',
      email: 'jane@example.com',
      picture: 'https://linkedin.com/jane.png'
    };

    const mapProfile = () =>
      optionsOf('linkedin').profile?.(linkedInProfile, {
        access_token: 'li-token'
      }) as Promise<Record<string, unknown>>;

    it('fetches the identity with the access token and api version', async () => {
      fetchMock.mockResolvedValue(Response.json({}));

      await mapProfile();

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.linkedin.com/rest/identityMe',
        {
          headers: {
            Authorization: 'Bearer li-token',
            'LinkedIn-Version': '202411'
          }
        }
      );
    });

    it('includes the public profile url from the identity response', async () => {
      fetchMock.mockResolvedValue(
        Response.json({
          basicInfo: { profileUrl: 'https://www.linkedin.com/in/jane' }
        })
      );

      expect(await mapProfile()).toEqual({
        id: 'li-1',
        name: 'Jane Doe',
        email: 'jane@example.com',
        image: 'https://linkedin.com/jane.png',
        linkedInProfileUrl: 'https://www.linkedin.com/in/jane'
      });
    });

    it('returns a null profile url when the identity has no basic info', async () => {
      fetchMock.mockResolvedValue(Response.json({}));

      expect(await mapProfile()).toMatchObject({ linkedInProfileUrl: null });
    });

    it('returns a null profile url when basic info has no url', async () => {
      fetchMock.mockResolvedValue(Response.json({ basicInfo: {} }));

      expect(await mapProfile()).toMatchObject({ linkedInProfileUrl: null });
    });

    it('logs the failed response and returns a null profile url', async () => {
      fetchMock.mockResolvedValue(
        new Response('forbidden', { status: 403, statusText: 'Forbidden' })
      );

      const user = await mapProfile();

      expect(user).toMatchObject({ id: 'li-1', linkedInProfileUrl: null });
      expect(console.error).toHaveBeenCalledWith(
        'Failed to fetch LinkedIn identity',
        { status: 403, statusText: 'Forbidden', body: 'forbidden' }
      );
    });

    it('logs a network error and returns a null profile url', async () => {
      const error = new Error('network');
      fetchMock.mockRejectedValue(error);

      const user = await mapProfile();

      expect(user).toMatchObject({ linkedInProfileUrl: null });
      expect(console.error).toHaveBeenCalledWith(
        'Failed to fetch LinkedIn identity',
        error
      );
    });
  });
});
