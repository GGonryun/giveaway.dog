import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { prismaMock } from '@giveaway/testing-server/prisma';
import { getBlueskyClient as getCachedBlueskyClient } from '../bluesky-client';

const m = vi.hoisted(() => ({
  NodeOAuthClient: vi.fn(function (
    this: { options: unknown },
    options: unknown
  ) {
    this.options = options;
  }),
  requestLocalLock: vi.fn(),
  fromImportable: vi.fn()
}));

vi.mock('@atproto/oauth-client-node', () => ({
  NodeOAuthClient: m.NodeOAuthClient,
  requestLocalLock: m.requestLocalLock
}));

vi.mock('@atproto/jwk-jose', () => ({
  JoseKey: { fromImportable: m.fromImportable }
}));

type Store = {
  set: (key: string, value: unknown) => Promise<void>;
  get: (key: string) => Promise<unknown>;
  del: (key: string) => Promise<void>;
};

type ClientOptions = {
  clientMetadata: Record<string, unknown>;
  keyset: unknown[];
  requestLock: unknown;
  stateStore: Store;
  sessionStore: Store;
};

const BASE_URL = 'https://giveaway.test';
const JWK = { kty: 'EC', crv: 'P-256', d: 'secret', kid: 'jwk-kid' };
const IMPORTED_KEY = { kid: 'imported' };
const NOW = new Date('2026-01-15T12:00:00.000Z');

const loadFreshClient = async () => {
  vi.resetModules();
  const mod = await import('../bluesky-client');
  return mod.getBlueskyClient;
};

const createFreshClientOptions = async () => {
  const getBlueskyClient = await loadFreshClient();
  const client = (await getBlueskyClient()) as unknown as {
    options: ClientOptions;
  };
  return client.options;
};

const getCachedClientOptions = async () => {
  const client = (await getCachedBlueskyClient()) as unknown as {
    options: ClientOptions;
  };
  return client.options;
};

describe('getBlueskyClient', () => {
  beforeEach(() => {
    m.NodeOAuthClient.mockClear();
    m.fromImportable.mockReset();
    m.fromImportable.mockResolvedValue(IMPORTED_KEY);
    vi.stubEnv('BLUESKY_PRIVATE_KEY', JSON.stringify(JWK));
    vi.stubEnv('NEXTAUTH_URL', BASE_URL);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('when configuration is missing', () => {
    it('throws when BLUESKY_PRIVATE_KEY is not set', async () => {
      vi.stubEnv('BLUESKY_PRIVATE_KEY', undefined);
      const getBlueskyClient = await loadFreshClient();

      await expect(getBlueskyClient()).rejects.toThrow(
        'BLUESKY_PRIVATE_KEY environment variable is required'
      );
      expect(m.NodeOAuthClient).not.toHaveBeenCalled();
    });

    it('throws when BLUESKY_PRIVATE_KEY is an empty string', async () => {
      vi.stubEnv('BLUESKY_PRIVATE_KEY', '');
      const getBlueskyClient = await loadFreshClient();

      await expect(getBlueskyClient()).rejects.toThrow(
        'BLUESKY_PRIVATE_KEY environment variable is required'
      );
    });

    it('throws when NEXTAUTH_URL is not set', async () => {
      vi.stubEnv('NEXTAUTH_URL', undefined);
      const getBlueskyClient = await loadFreshClient();

      await expect(getBlueskyClient()).rejects.toThrow(
        'NEXTAUTH_URL environment variable is required'
      );
      expect(m.fromImportable).not.toHaveBeenCalled();
    });

    it('throws a SyntaxError when BLUESKY_PRIVATE_KEY is not valid JSON', async () => {
      vi.stubEnv('BLUESKY_PRIVATE_KEY', 'not-json');
      const getBlueskyClient = await loadFreshClient();

      await expect(getBlueskyClient()).rejects.toBeInstanceOf(SyntaxError);
      expect(m.NodeOAuthClient).not.toHaveBeenCalled();
    });

    it('propagates key import failures without constructing a client', async () => {
      m.fromImportable.mockRejectedValue(new Error('bad key'));
      const getBlueskyClient = await loadFreshClient();

      await expect(getBlueskyClient()).rejects.toThrow('bad key');
      expect(m.NodeOAuthClient).not.toHaveBeenCalled();
    });

    it('does not cache a failed attempt', async () => {
      vi.stubEnv('NEXTAUTH_URL', undefined);
      const getBlueskyClient = await loadFreshClient();
      await expect(getBlueskyClient()).rejects.toThrow();

      vi.stubEnv('NEXTAUTH_URL', BASE_URL);
      const client = await getBlueskyClient();

      expect(client).toBeDefined();
      expect(m.NodeOAuthClient).toHaveBeenCalledTimes(1);
    });
  });

  describe('when configuration is present', () => {
    it('imports the private key with the kid from the JWK', async () => {
      await createFreshClientOptions();

      expect(m.fromImportable).toHaveBeenCalledWith(JWK, 'jwk-kid');
    });

    it('falls back to the kid key1 when the JWK has no kid', async () => {
      const jwkWithoutKid = { kty: 'EC', crv: 'P-256', d: 'secret' };
      vi.stubEnv('BLUESKY_PRIVATE_KEY', JSON.stringify(jwkWithoutKid));

      await createFreshClientOptions();

      expect(m.fromImportable).toHaveBeenCalledWith(jwkWithoutKid, 'key1');
    });

    it('falls back to the kid key1 when the JWK kid is empty', async () => {
      vi.stubEnv('BLUESKY_PRIVATE_KEY', JSON.stringify({ ...JWK, kid: '' }));

      await createFreshClientOptions();

      expect(m.fromImportable).toHaveBeenCalledWith(
        { ...JWK, kid: '' },
        'key1'
      );
    });

    it('builds the client metadata from NEXTAUTH_URL with the user callback', async () => {
      const options = await createFreshClientOptions();

      expect(options.clientMetadata).toEqual({
        client_id: `${BASE_URL}/api/bluesky/client-metadata.json`,
        client_name: 'Giveaway.dog',
        client_uri: BASE_URL,
        logo_uri: `${BASE_URL}/logo.png`,
        redirect_uris: [`${BASE_URL}/api/bluesky/user/callback`],
        grant_types: ['authorization_code', 'refresh_token'],
        scope: 'atproto transition:generic',
        response_types: ['code'],
        application_type: 'web',
        token_endpoint_auth_method: 'private_key_jwt',
        token_endpoint_auth_signing_alg: 'ES256',
        dpop_bound_access_tokens: true,
        jwks_uri: `${BASE_URL}/api/bluesky/jwks.json`
      });
    });

    it('passes the imported keyset and the local request lock', async () => {
      const options = await createFreshClientOptions();

      expect(options.keyset).toEqual([IMPORTED_KEY]);
      expect(options.requestLock).toBe(m.requestLocalLock);
    });

    it('returns the same instance on subsequent calls', async () => {
      const getBlueskyClient = await loadFreshClient();

      const first = await getBlueskyClient();
      const second = await getBlueskyClient();

      expect(second).toBe(first);
      expect(m.NodeOAuthClient).toHaveBeenCalledTimes(1);
      expect(m.fromImportable).toHaveBeenCalledTimes(1);
    });

    it('keeps the cached instance even after the environment is removed', async () => {
      const getBlueskyClient = await loadFreshClient();
      const first = await getBlueskyClient();
      vi.stubEnv('BLUESKY_PRIVATE_KEY', undefined);

      await expect(getBlueskyClient()).resolves.toBe(first);
    });
  });

  describe('stateStore', () => {
    it('stores state with an expiry one hour from now', async () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(NOW);
      const { stateStore } = await getCachedClientOptions();
      const state = { iss: 'https://bsky.social', verifier: 'v' };

      await stateStore.set('state-key', state);

      expect(prismaMock.state.create).toHaveBeenCalledWith({
        data: {
          id: 'state-key',
          value: state,
          expiresAt: new Date('2026-01-15T13:00:00.000Z')
        }
      });
    });

    it('looks up state by id', async () => {
      const { stateStore } = await getCachedClientOptions();
      prismaMock.state.findUnique.mockResolvedValue(null);

      await stateStore.get('state-key');

      expect(prismaMock.state.findUnique).toHaveBeenCalledWith({
        where: { id: 'state-key' }
      });
    });

    it('returns undefined when no state exists', async () => {
      const { stateStore } = await getCachedClientOptions();
      prismaMock.state.findUnique.mockResolvedValue(null);

      await expect(stateStore.get('state-key')).resolves.toBeUndefined();
    });

    it('returns undefined when the state has no expiry', async () => {
      const { stateStore } = await getCachedClientOptions();
      prismaMock.state.findUnique.mockResolvedValue({
        id: 'state-key',
        value: { a: 1 },
        expiresAt: null
      });

      await expect(stateStore.get('state-key')).resolves.toBeUndefined();
    });

    it('returns undefined when the state has expired', async () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(NOW);
      const { stateStore } = await getCachedClientOptions();
      prismaMock.state.findUnique.mockResolvedValue({
        id: 'state-key',
        value: { a: 1 },
        expiresAt: new Date(NOW.getTime() - 1)
      });

      await expect(stateStore.get('state-key')).resolves.toBeUndefined();
    });

    it('returns the stored value when the expiry equals the current time', async () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(NOW);
      const { stateStore } = await getCachedClientOptions();
      prismaMock.state.findUnique.mockResolvedValue({
        id: 'state-key',
        value: { a: 1 },
        expiresAt: new Date(NOW)
      });

      await expect(stateStore.get('state-key')).resolves.toEqual({ a: 1 });
    });

    it('returns the stored value when the state has not expired', async () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(NOW);
      const { stateStore } = await getCachedClientOptions();
      prismaMock.state.findUnique.mockResolvedValue({
        id: 'state-key',
        value: { verifier: 'v' },
        expiresAt: new Date(NOW.getTime() + 60_000)
      });

      await expect(stateStore.get('state-key')).resolves.toEqual({
        verifier: 'v'
      });
    });

    it('deletes state by id', async () => {
      const { stateStore } = await getCachedClientOptions();
      prismaMock.state.delete.mockResolvedValue({});

      await stateStore.del('state-key');

      expect(prismaMock.state.delete).toHaveBeenCalledWith({
        where: { id: 'state-key' }
      });
    });

    it('swallows errors when deleting state fails', async () => {
      const { stateStore } = await getCachedClientOptions();
      prismaMock.state.delete.mockRejectedValue(new Error('missing'));

      await expect(stateStore.del('state-key')).resolves.toBeUndefined();
    });
  });

  describe('sessionStore', () => {
    it('upserts the bluesky account keyed by DID with the serialized session', async () => {
      const { sessionStore } = await getCachedClientOptions();
      const session = { tokenSet: { sub: 'did:plc:abc' }, dpopJwk: { k: 1 } };

      await sessionStore.set('did:plc:abc', session);

      expect(prismaMock.account.upsert).toHaveBeenCalledWith({
        where: {
          provider_providerAccountId: {
            provider: 'bluesky',
            providerAccountId: 'did:plc:abc'
          }
        },
        create: {
          provider: 'bluesky',
          type: 'oauth',
          providerAccountId: 'did:plc:abc',
          session_state: JSON.stringify(session)
        },
        update: {
          session_state: JSON.stringify(session)
        }
      });
    });

    it('propagates errors when storing the session fails', async () => {
      const { sessionStore } = await getCachedClientOptions();
      prismaMock.account.upsert.mockRejectedValue(new Error('db down'));

      await expect(sessionStore.set('did:plc:abc', {})).rejects.toThrow(
        'db down'
      );
    });

    it('looks up the bluesky account by DID', async () => {
      const { sessionStore } = await getCachedClientOptions();
      prismaMock.account.findFirst.mockResolvedValue(null);

      await sessionStore.get('did:plc:abc');

      expect(prismaMock.account.findFirst).toHaveBeenCalledWith({
        where: { provider: 'bluesky', providerAccountId: 'did:plc:abc' }
      });
    });

    it('returns undefined when no account exists', async () => {
      const { sessionStore } = await getCachedClientOptions();
      prismaMock.account.findFirst.mockResolvedValue(null);

      await expect(sessionStore.get('did:plc:abc')).resolves.toBeUndefined();
    });

    it('returns undefined when the account has no session state', async () => {
      const { sessionStore } = await getCachedClientOptions();
      prismaMock.account.findFirst.mockResolvedValue({ session_state: null });

      await expect(sessionStore.get('did:plc:abc')).resolves.toBeUndefined();
    });

    it('returns undefined when the session state is an empty string', async () => {
      const { sessionStore } = await getCachedClientOptions();
      prismaMock.account.findFirst.mockResolvedValue({ session_state: '' });

      await expect(sessionStore.get('did:plc:abc')).resolves.toBeUndefined();
    });

    it('returns the parsed session state', async () => {
      const { sessionStore } = await getCachedClientOptions();
      prismaMock.account.findFirst.mockResolvedValue({
        session_state: JSON.stringify({ tokenSet: { sub: 'did:plc:abc' } })
      });

      await expect(sessionStore.get('did:plc:abc')).resolves.toEqual({
        tokenSet: { sub: 'did:plc:abc' }
      });
    });

    it('returns undefined and logs when the session state is not valid JSON', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { sessionStore } = await getCachedClientOptions();
      prismaMock.account.findFirst.mockResolvedValue({
        session_state: '{broken'
      });

      await expect(sessionStore.get('did:plc:abc')).resolves.toBeUndefined();
      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to parse session_state:',
        expect.any(SyntaxError)
      );
    });

    it('clears the session state for the DID', async () => {
      const { sessionStore } = await getCachedClientOptions();
      prismaMock.account.updateMany.mockResolvedValue({ count: 1 });

      await sessionStore.del('did:plc:abc');

      expect(prismaMock.account.updateMany).toHaveBeenCalledWith({
        where: { provider: 'bluesky', providerAccountId: 'did:plc:abc' },
        data: { session_state: null }
      });
    });

    it('swallows errors when clearing the session state fails', async () => {
      const { sessionStore } = await getCachedClientOptions();
      prismaMock.account.updateMany.mockRejectedValue(new Error('db down'));

      await expect(sessionStore.del('did:plc:abc')).resolves.toBeUndefined();
    });
  });
});
