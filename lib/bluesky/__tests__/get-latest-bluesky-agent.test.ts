import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { asPrismaClient, prismaMock } from '@/test/prisma';
import { ApplicationError } from '@/lib/errors';
import { getLatestBlueskyCredentials } from '../get-latest-bluesky-agent';

const m = vi.hoisted(() => ({
  restore: vi.fn(),
  NodeOAuthClient: vi.fn(),
  Agent: vi.fn(),
  fromImportable: vi.fn()
}));

vi.mock('@atproto/oauth-client-node', () => ({
  NodeOAuthClient: m.NodeOAuthClient,
  requestLocalLock: vi.fn()
}));

vi.mock('@atproto/jwk-jose', () => ({
  JoseKey: { fromImportable: m.fromImportable }
}));

vi.mock('@atproto/api', () => ({
  Agent: m.Agent
}));

const account = (overrides: Record<string, unknown> = {}) => ({
  userId: 'user-1',
  provider: 'bluesky',
  type: 'oauth',
  providerAccountId: 'did:plc:alice',
  session_state: '{"tokenSet":{}}',
  label: 'alice.bsky.social',
  ...overrides
});

const captureError = async (promise: Promise<unknown>) => {
  try {
    await promise;
  } catch (error) {
    return error as ApplicationError;
  }
  throw new Error('Expected the promise to reject');
};

describe('getLatestBlueskyCredentials', () => {
  const session = { did: 'did:plc:alice', sessionId: 'session-1' };

  beforeEach(() => {
    m.restore.mockReset();
    m.restore.mockResolvedValue(session);
    m.NodeOAuthClient.mockReset();
    m.NodeOAuthClient.mockImplementation(function (this: {
      restore: typeof m.restore;
    }) {
      this.restore = m.restore;
    });
    m.Agent.mockReset();
    m.Agent.mockImplementation(function (
      this: { session: unknown },
      agentSession: unknown
    ) {
      this.session = agentSession;
    });
    m.fromImportable.mockResolvedValue({ kid: 'key1' });
    vi.stubEnv('BLUESKY_PRIVATE_KEY', JSON.stringify({ kty: 'EC' }));
    vi.stubEnv('NEXTAUTH_URL', 'https://giveaway.test');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe('when the user has a stored bluesky session', () => {
    it('looks up the bluesky account for the user', async () => {
      prismaMock.account.findFirst.mockResolvedValue(account());

      await getLatestBlueskyCredentials(asPrismaClient(), 'user-1');

      expect(prismaMock.account.findFirst).toHaveBeenCalledWith({
        where: { userId: 'user-1', provider: 'bluesky' }
      });
    });

    it('restores the oauth session using the account DID', async () => {
      prismaMock.account.findFirst.mockResolvedValue(account());

      await getLatestBlueskyCredentials(asPrismaClient(), 'user-1');

      expect(m.restore).toHaveBeenCalledWith('did:plc:alice');
    });

    it('returns an agent built from the restored session with the DID and handle', async () => {
      prismaMock.account.findFirst.mockResolvedValue(account());

      const credentials = await getLatestBlueskyCredentials(
        asPrismaClient(),
        'user-1'
      );

      expect(m.Agent).toHaveBeenCalledWith(session);
      expect(credentials.agent).toBe(m.Agent.mock.instances[0]);
      expect(credentials).toEqual({
        agent: { session },
        did: 'did:plc:alice',
        handle: 'alice.bsky.social'
      });
    });

    it('returns a null handle when the account has no label', async () => {
      prismaMock.account.findFirst.mockResolvedValue(account({ label: null }));

      const credentials = await getLatestBlueskyCredentials(
        asPrismaClient(),
        'user-1'
      );

      expect(credentials.handle).toBeNull();
    });

    it('returns a null handle when the account label is undefined', async () => {
      prismaMock.account.findFirst.mockResolvedValue(
        account({ label: undefined })
      );

      const credentials = await getLatestBlueskyCredentials(
        asPrismaClient(),
        'user-1'
      );

      expect(credentials.handle).toBeNull();
    });
  });

  describe('when the user has no bluesky account', () => {
    it('throws FORBIDDEN without restoring a session', async () => {
      prismaMock.account.findFirst.mockResolvedValue(null);

      const error = await captureError(
        getLatestBlueskyCredentials(asPrismaClient(), 'user-1')
      );

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error.code).toBe('FORBIDDEN');
      expect(error.message).toBe(
        'User does not have a connected Bluesky account'
      );
      expect(m.restore).not.toHaveBeenCalled();
    });
  });

  describe('when the account has no session state', () => {
    it.each([null, ''])(
      'throws UNAUTHORIZED when session_state is %j',
      async (sessionState) => {
        prismaMock.account.findFirst.mockResolvedValue(
          account({ session_state: sessionState })
        );

        const error = await captureError(
          getLatestBlueskyCredentials(asPrismaClient(), 'user-1')
        );

        expect(error).toBeInstanceOf(ApplicationError);
        expect(error.code).toBe('UNAUTHORIZED');
        expect(error.message).toBe(
          'Bluesky session data not found. Please reconnect your Bluesky account.'
        );
        expect(m.restore).not.toHaveBeenCalled();
      }
    );
  });

  describe('when restoring the session fails', () => {
    it('throws UNAUTHORIZED with the restore error as the cause', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const restoreError = new Error('token revoked');
      prismaMock.account.findFirst.mockResolvedValue(account());
      m.restore.mockRejectedValue(restoreError);

      const error = await captureError(
        getLatestBlueskyCredentials(asPrismaClient(), 'user-1')
      );

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error.code).toBe('UNAUTHORIZED');
      expect(error.message).toBe(
        'Failed to restore Bluesky session. Please reconnect your Bluesky account.'
      );
      expect(error.cause).toBe(restoreError);
    });

    it('logs the restore error', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const restoreError = new Error('token revoked');
      prismaMock.account.findFirst.mockResolvedValue(account());
      m.restore.mockRejectedValue(restoreError);

      await captureError(
        getLatestBlueskyCredentials(asPrismaClient(), 'user-1')
      );

      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to restore Bluesky session:',
        restoreError
      );
    });

    it('throws UNAUTHORIZED when creating the agent fails', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const agentError = new Error('bad session');
      prismaMock.account.findFirst.mockResolvedValue(account());
      m.Agent.mockImplementation(function () {
        throw agentError;
      });

      const error = await captureError(
        getLatestBlueskyCredentials(asPrismaClient(), 'user-1')
      );

      expect(error.code).toBe('UNAUTHORIZED');
      expect(error.cause).toBe(agentError);
    });
  });

  describe('when the oauth client cannot be created', () => {
    it('propagates the configuration error unchanged', async () => {
      vi.resetModules();
      const { getLatestBlueskyCredentials: freshGetCredentials } =
        await import('../get-latest-bluesky-agent');
      vi.stubEnv('BLUESKY_PRIVATE_KEY', undefined);
      prismaMock.account.findFirst.mockResolvedValue(account());

      const error = await captureError(
        freshGetCredentials(asPrismaClient(), 'user-1')
      );

      expect(error.message).toBe(
        'BLUESKY_PRIVATE_KEY environment variable is required'
      );
      expect(error.name).toBe('Error');
      expect(m.restore).not.toHaveBeenCalled();
    });
  });
});
