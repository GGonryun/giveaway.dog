import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  AUTHORIZATION_URL,
  CommunityVisibilityState,
  PROVIDER_ID,
  PersonaState,
  SteamProvider,
  type SteamProfile
} from '../steam';

const openid = vi.hoisted(() => {
  const verifyAssertion = vi.fn();
  const RelyingParty = vi.fn(function () {
    return { verifyAssertion };
  });
  return { verifyAssertion, RelyingParty };
});

vi.mock('openid', () => ({ RelyingParty: openid.RelyingParty }));

const CALLBACK_URL = 'https://giveaway.dog/api/auth/steam-callback';
const STEAM_ID = '76561198000000000';
const CLAIMED_ID = `https://steamcommunity.com/openid/id/${STEAM_ID}`;
const UUID = '00000000-0000-4000-8000-000000000000';

type AssertionCallback = (
  error: unknown,
  result?: { authenticated: boolean; claimedIdentifier?: string }
) => void;

type TokenEndpoint = { url: string; conform: () => Promise<Response> };

type UserinfoEndpoint = {
  url: string;
  request: (ctx: unknown) => Promise<unknown>;
};

const validQuery = (): Record<string, string> => ({
  'openid.op_endpoint': AUTHORIZATION_URL,
  'openid.ns': 'http://specs.openid.net/auth/2.0',
  'openid.claimed_id': CLAIMED_ID,
  'openid.identity': CLAIMED_ID
});

const callbackRequest = (query: Record<string, string> = validQuery()) =>
  new Request(`${CALLBACK_URL}?${new URLSearchParams(query).toString()}`);

const provider = (request?: Request) =>
  SteamProvider({
    request,
    callbackUrl: CALLBACK_URL,
    clientSecret: 'steam-key'
  });

const tokenEndpoint = (request?: Request) =>
  provider(request).token as unknown as TokenEndpoint;

const userinfoEndpoint = () =>
  provider().userinfo as unknown as UserinfoEndpoint;

const assertionResolves = (result: {
  authenticated: boolean;
  claimedIdentifier?: string;
}) => {
  openid.verifyAssertion.mockImplementation(
    (_req: Request, cb: AssertionCallback) => cb(null, result)
  );
};

const steamProfile = (overrides: Partial<SteamProfile> = {}): SteamProfile => ({
  steamid: STEAM_ID,
  communityvisibilitystate: CommunityVisibilityState.Public,
  profilestate: 1,
  personaname: 'Gabe',
  profileurl: 'https://steamcommunity.com/id/gabe/',
  avatar: 'small.jpg',
  avatarmedium: 'medium.jpg',
  avatarfull: 'full.jpg',
  avatarhash: 'hash',
  lastlogoff: 0,
  personastate: PersonaState.Online,
  primaryclanid: 'clan',
  timecreated: 0,
  personastateflags: 0,
  commentpermission: true,
  ...overrides
});

const fetchMock = vi.fn();

beforeEach(() => {
  openid.verifyAssertion.mockReset();
  openid.RelyingParty.mockClear();
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  vi.spyOn(crypto, 'randomUUID').mockReturnValue(UUID);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('steam enums and constants', () => {
  it('exposes the steam provider id', () => {
    expect(PROVIDER_ID).toBe('steam');
  });

  it('exposes the steam openid login url', () => {
    expect(AUTHORIZATION_URL).toBe('https://steamcommunity.com/openid/login');
  });

  it('maps community visibility states to steam api values', () => {
    expect(CommunityVisibilityState.Private).toBe(1);
    expect(CommunityVisibilityState.Public).toBe(3);
  });

  it('maps persona states to steam api values', () => {
    expect([
      PersonaState.Offline,
      PersonaState.Online,
      PersonaState.Busy,
      PersonaState.Away,
      PersonaState.Snooze,
      PersonaState.LookingToTrade,
      PersonaState.LookingToPlay
    ]).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });
});

describe('SteamProvider', () => {
  describe('configuration', () => {
    it('throws when the client secret is missing', () => {
      expect(() =>
        SteamProvider({
          request: undefined,
          callbackUrl: CALLBACK_URL,
          clientSecret: ''
        })
      ).toThrow(
        'Missing `clientSecret` parameter. Get one at https://steamcommunity.com/dev/apikey'
      );
    });

    it('throws when the callback url is not a valid url', () => {
      expect(() =>
        SteamProvider({
          request: undefined,
          callbackUrl: 'undefined/api/auth/steam-callback',
          clientSecret: 'steam-key'
        })
      ).toThrow(TypeError);
    });

    it('identifies itself as the steam oauth provider', () => {
      expect(provider()).toMatchObject({
        clientId: 'steam',
        clientSecret: 'steam-key',
        id: 'steam',
        name: 'steam',
        type: 'oauth',
        style: { bg: '#000', text: '#fff' },
        checks: ['none']
      });
    });

    it('builds openid authorization params from the callback url', () => {
      expect(provider().authorization).toEqual({
        url: 'https://steamcommunity.com/openid/login',
        params: {
          'openid.mode': 'checkid_setup',
          'openid.ns': 'http://specs.openid.net/auth/2.0',
          'openid.identity':
            'http://specs.openid.net/auth/2.0/identifier_select',
          'openid.claimed_id':
            'http://specs.openid.net/auth/2.0/identifier_select',
          'openid.return_to': CALLBACK_URL,
          'openid.realm': 'https://giveaway.dog'
        }
      });
    });

    it('accepts a URL instance as the callback url', () => {
      const config = SteamProvider({
        request: undefined,
        callbackUrl: new URL('http://localhost:3000/cb'),
        clientSecret: 'steam-key'
      });

      expect(config.authorization).toMatchObject({
        params: {
          'openid.return_to': 'http://localhost:3000/cb',
          'openid.realm': 'http://localhost:3000'
        }
      });
    });

    it('uses the callback url for the token and userinfo endpoints', () => {
      expect(tokenEndpoint().url).toBe(CALLBACK_URL);
      expect(userinfoEndpoint().url).toBe(CALLBACK_URL);
    });
  });

  describe('token conform', () => {
    it('throws when there is no request', async () => {
      await expect(tokenEndpoint(undefined).conform()).rejects.toThrow(
        'No URL found in request object'
      );
    });

    it('throws when the request has an empty url', async () => {
      const request = { url: '' } as unknown as Request;

      await expect(tokenEndpoint(request).conform()).rejects.toThrow(
        'No URL found in request object'
      );
    });

    it('returns a bearer token response carrying the verified steam id', async () => {
      assertionResolves({ authenticated: true, claimedIdentifier: CLAIMED_ID });

      const response = await tokenEndpoint(callbackRequest()).conform();

      expect(await response.json()).toEqual({
        access_token: UUID,
        steamId: STEAM_ID,
        token_type: 'Bearer'
      });
    });

    it('creates a stateless relying party for the callback url and realm', async () => {
      assertionResolves({ authenticated: true, claimedIdentifier: CLAIMED_ID });

      await tokenEndpoint(callbackRequest()).conform();

      expect(openid.RelyingParty).toHaveBeenCalledWith(
        CALLBACK_URL,
        'https://giveaway.dog',
        true,
        false,
        []
      );
    });

    it('verifies the assertion against the incoming request', async () => {
      assertionResolves({ authenticated: true, claimedIdentifier: CLAIMED_ID });
      const request = callbackRequest();

      await tokenEndpoint(request).conform();

      expect(openid.verifyAssertion).toHaveBeenCalledWith(
        request,
        expect.any(Function)
      );
    });

    it('accepts an http claimed identifier from the assertion', async () => {
      assertionResolves({
        authenticated: true,
        claimedIdentifier: `http://steamcommunity.com/openid/id/${STEAM_ID}`
      });

      const response = await tokenEndpoint(callbackRequest()).conform();

      expect(await response.json()).toMatchObject({ steamId: STEAM_ID });
    });

    describe('when the callback query is not a steam assertion', () => {
      it.each([
        ['openid.op_endpoint', 'https://evil.example.com/openid/login'],
        ['openid.ns', 'http://specs.openid.net/auth/1.0'],
        ['openid.claimed_id', 'http://steamcommunity.com/openid/id/1'],
        ['openid.identity', 'https://evil.example.com/openid/id/1']
      ])('rejects a mismatched %s', async (key, value) => {
        const request = callbackRequest({ ...validQuery(), [key]: value });

        await expect(tokenEndpoint(request).conform()).rejects.toThrow(
          'Authentication failed: Unable to verify Steam ID'
        );
        expect(openid.RelyingParty).not.toHaveBeenCalled();
      });

      it.each(['openid.claimed_id', 'openid.identity', 'openid.op_endpoint'])(
        'rejects a missing %s',
        async (key) => {
          const query = validQuery();
          delete query[key];

          await expect(
            tokenEndpoint(callbackRequest(query)).conform()
          ).rejects.toThrow('Authentication failed: Unable to verify Steam ID');
          expect(openid.RelyingParty).not.toHaveBeenCalled();
        }
      );
    });

    describe('when the assertion cannot be verified', () => {
      it('fails when verification reports an error', async () => {
        const error = new Error('nonce reused');
        openid.verifyAssertion.mockImplementation(
          (_req: Request, cb: AssertionCallback) => cb(error)
        );

        await expect(
          tokenEndpoint(callbackRequest()).conform()
        ).rejects.toThrow('Authentication failed: Unable to verify Steam ID');
        expect(console.error).toHaveBeenCalledWith(
          'Error verifying OpenID assertion:',
          error
        );
      });

      it('fails when the assertion is not authenticated', async () => {
        assertionResolves({
          authenticated: false,
          claimedIdentifier: CLAIMED_ID
        });

        await expect(
          tokenEndpoint(callbackRequest()).conform()
        ).rejects.toThrow('Authentication failed: Unable to verify Steam ID');
      });

      it('fails when the assertion has no claimed identifier', async () => {
        assertionResolves({ authenticated: true });

        await expect(
          tokenEndpoint(callbackRequest()).conform()
        ).rejects.toThrow('Authentication failed: Unable to verify Steam ID');
      });

      it('fails when the claimed identifier is not a numeric steam id', async () => {
        assertionResolves({
          authenticated: true,
          claimedIdentifier: 'https://steamcommunity.com/openid/id/gabe'
        });

        await expect(
          tokenEndpoint(callbackRequest()).conform()
        ).rejects.toThrow('Authentication failed: Unable to verify Steam ID');
      });

      it('fails when the claimed identifier has characters after the steam id', async () => {
        assertionResolves({
          authenticated: true,
          claimedIdentifier: `${CLAIMED_ID}/extra`
        });

        await expect(
          tokenEndpoint(callbackRequest()).conform()
        ).rejects.toThrow('Authentication failed: Unable to verify Steam ID');
      });

      it('fails when the claimed identifier is on another host', async () => {
        assertionResolves({
          authenticated: true,
          claimedIdentifier: `https://evil.example.com/openid/id/${STEAM_ID}`
        });

        await expect(
          tokenEndpoint(callbackRequest()).conform()
        ).rejects.toThrow('Authentication failed: Unable to verify Steam ID');
      });
    });
  });

  describe('userinfo request', () => {
    const ctx = {
      provider: { clientSecret: 'steam-key' },
      tokens: { steamId: STEAM_ID }
    };

    it('requests the player summary with the api key and steam id', async () => {
      fetchMock.mockResolvedValue(
        Response.json({ response: { players: [steamProfile()] } })
      );

      await userinfoEndpoint().request(ctx);

      const [url] = fetchMock.mock.calls[0] as [URL];
      expect(url.toString()).toBe(
        `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002?key=steam-key&steamids=${STEAM_ID}`
      );
    });

    it('returns the first player in the response', async () => {
      const player = steamProfile();
      fetchMock.mockResolvedValue(
        Response.json({
          response: { players: [player, steamProfile({ steamid: '2' })] }
        })
      );

      expect(await userinfoEndpoint().request(ctx)).toEqual(player);
    });

    it('returns null when there are no players', async () => {
      fetchMock.mockResolvedValue(Response.json({ response: { players: [] } }));

      expect(await userinfoEndpoint().request(ctx)).toBeNull();
    });

    it('throws when the steam api responds with an error status', async () => {
      fetchMock.mockResolvedValue(new Response('nope', { status: 403 }));

      await expect(userinfoEndpoint().request(ctx)).rejects.toThrow(
        'Failed to fetch Steam profile'
      );
    });
  });

  describe('profile', () => {
    const mapProfile = (profile: SteamProfile) =>
      provider().profile?.(profile, {});

    it('maps the steam profile to a user with the full avatar', async () => {
      expect(await mapProfile(steamProfile())).toEqual({
        id: STEAM_ID,
        name: 'Gabe',
        image: 'full.jpg',
        email: null,
        emailVerified: null
      });
    });

    it('falls back to the medium avatar', async () => {
      const user = await mapProfile(steamProfile({ avatarfull: '' }));

      expect(user?.image).toBe('medium.jpg');
    });

    it('falls back to the small avatar', async () => {
      const user = await mapProfile(
        steamProfile({ avatarfull: '', avatarmedium: '' })
      );

      expect(user?.image).toBe('small.jpg');
    });
  });
});
