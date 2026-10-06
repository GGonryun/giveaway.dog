import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { asPrismaClient, prismaMock } from '@giveaway/testing-server/prisma';
import { ApplicationError } from '@giveaway/util-errors';
import { getLatestTeamBlueskyCredentials } from '../get-latest-team-bluesky-agent';

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

const integration = (overrides: Record<string, unknown> = {}) => ({
  id: 'integration-1',
  teamId: 'team-1',
  provider: 'BLUESKY',
  status: 'ACTIVE',
  account_id: 'did:plc:team',
  session_state: '{"tokenSet":{}}',
  label: 'team.bsky.social',
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

describe('getLatestTeamBlueskyCredentials', () => {
  const session = { did: 'did:plc:team', sessionId: 'session-1' };

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
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://giveaway.test');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe('when the team has an active bluesky integration', () => {
    it('looks up the active bluesky integration for the team', async () => {
      prismaMock.integration.findFirst.mockResolvedValue(integration());

      await getLatestTeamBlueskyCredentials(asPrismaClient(), 'team-1');

      expect(prismaMock.integration.findFirst).toHaveBeenCalledWith({
        where: { teamId: 'team-1', provider: 'BLUESKY', status: 'ACTIVE' }
      });
    });

    it('restores the oauth session using the integration account id', async () => {
      prismaMock.integration.findFirst.mockResolvedValue(integration());

      await getLatestTeamBlueskyCredentials(asPrismaClient(), 'team-1');

      expect(m.restore).toHaveBeenCalledWith('did:plc:team');
    });

    it('returns an agent built from the restored session with the DID and handle', async () => {
      prismaMock.integration.findFirst.mockResolvedValue(integration());

      const credentials = await getLatestTeamBlueskyCredentials(
        asPrismaClient(),
        'team-1'
      );

      expect(m.Agent).toHaveBeenCalledWith(session);
      expect(credentials.agent).toBe(m.Agent.mock.instances[0]);
      expect(credentials).toEqual({
        agent: { session },
        did: 'did:plc:team',
        handle: 'team.bsky.social'
      });
    });

    it('returns a null handle when the integration has no label', async () => {
      prismaMock.integration.findFirst.mockResolvedValue(
        integration({ label: null })
      );

      const credentials = await getLatestTeamBlueskyCredentials(
        asPrismaClient(),
        'team-1'
      );

      expect(credentials.handle).toBeNull();
    });

    it('returns a null handle when the integration label is undefined', async () => {
      prismaMock.integration.findFirst.mockResolvedValue(
        integration({ label: undefined })
      );

      const credentials = await getLatestTeamBlueskyCredentials(
        asPrismaClient(),
        'team-1'
      );

      expect(credentials.handle).toBeNull();
    });

    it('keeps an empty integration label as the handle', async () => {
      prismaMock.integration.findFirst.mockResolvedValue(
        integration({ label: '' })
      );

      const credentials = await getLatestTeamBlueskyCredentials(
        asPrismaClient(),
        'team-1'
      );

      expect(credentials.handle).toBe('');
    });

    it('does not change the integration status on success', async () => {
      prismaMock.integration.findFirst.mockResolvedValue(integration());

      await getLatestTeamBlueskyCredentials(asPrismaClient(), 'team-1');

      expect(prismaMock.integration.update).not.toHaveBeenCalled();
    });
  });

  describe('when the team has no active bluesky integration', () => {
    it('throws FORBIDDEN without restoring a session', async () => {
      prismaMock.integration.findFirst.mockResolvedValue(null);

      const error = await captureError(
        getLatestTeamBlueskyCredentials(asPrismaClient(), 'team-1')
      );

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error.code).toBe('FORBIDDEN');
      expect(error.message).toBe(
        'Team does not have a connected Bluesky integration'
      );
      expect(m.restore).not.toHaveBeenCalled();
    });
  });

  describe('when the integration is incomplete', () => {
    it.each([null, ''])(
      'throws UNAUTHORIZED when session_state is %j',
      async (sessionState) => {
        prismaMock.integration.findFirst.mockResolvedValue(
          integration({ session_state: sessionState })
        );

        const error = await captureError(
          getLatestTeamBlueskyCredentials(asPrismaClient(), 'team-1')
        );

        expect(error).toBeInstanceOf(ApplicationError);
        expect(error.code).toBe('UNAUTHORIZED');
        expect(error.message).toBe(
          'Bluesky session data not found. Please reconnect your Bluesky integration.'
        );
        expect(m.restore).not.toHaveBeenCalled();
      }
    );

    it.each([null, ''])(
      'throws UNAUTHORIZED when account_id is %j',
      async (accountId) => {
        prismaMock.integration.findFirst.mockResolvedValue(
          integration({ account_id: accountId })
        );

        const error = await captureError(
          getLatestTeamBlueskyCredentials(asPrismaClient(), 'team-1')
        );

        expect(error).toBeInstanceOf(ApplicationError);
        expect(error.code).toBe('UNAUTHORIZED');
        expect(error.message).toBe(
          'Bluesky account ID not found. Please reconnect your Bluesky integration.'
        );
        expect(m.restore).not.toHaveBeenCalled();
      }
    );

    it('reports the missing session before the missing account id', async () => {
      prismaMock.integration.findFirst.mockResolvedValue(
        integration({ session_state: null, account_id: null })
      );

      const error = await captureError(
        getLatestTeamBlueskyCredentials(asPrismaClient(), 'team-1')
      );

      expect(error.message).toBe(
        'Bluesky session data not found. Please reconnect your Bluesky integration.'
      );
    });
  });

  describe('when restoring the session fails', () => {
    it('marks the integration as errored', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      prismaMock.integration.findFirst.mockResolvedValue(integration());
      m.restore.mockRejectedValue(new Error('token revoked'));

      await captureError(
        getLatestTeamBlueskyCredentials(asPrismaClient(), 'team-1')
      );

      expect(prismaMock.integration.update).toHaveBeenCalledWith({
        where: { id: 'integration-1' },
        data: { status: 'ERROR' }
      });
    });

    it('throws UNAUTHORIZED with the restore error as the cause', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const restoreError = new Error('token revoked');
      prismaMock.integration.findFirst.mockResolvedValue(integration());
      m.restore.mockRejectedValue(restoreError);

      const error = await captureError(
        getLatestTeamBlueskyCredentials(asPrismaClient(), 'team-1')
      );

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error.code).toBe('UNAUTHORIZED');
      expect(error.message).toBe(
        'Failed to restore Bluesky session. Please reconnect your Bluesky integration.'
      );
      expect(error.cause).toBe(restoreError);
    });

    it('logs the restore error', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const restoreError = new Error('token revoked');
      prismaMock.integration.findFirst.mockResolvedValue(integration());
      m.restore.mockRejectedValue(restoreError);

      await captureError(
        getLatestTeamBlueskyCredentials(asPrismaClient(), 'team-1')
      );

      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to restore Bluesky team session:',
        restoreError
      );
    });

    it('propagates the database error when marking the integration fails', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const dbError = new Error('db down');
      prismaMock.integration.findFirst.mockResolvedValue(integration());
      m.restore.mockRejectedValue(new Error('token revoked'));
      prismaMock.integration.update.mockRejectedValue(dbError);

      const error = await captureError(
        getLatestTeamBlueskyCredentials(asPrismaClient(), 'team-1')
      );

      expect(error).toBe(dbError);
    });

    it('marks the integration as errored when creating the agent fails', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const agentError = new Error('bad session');
      prismaMock.integration.findFirst.mockResolvedValue(integration());
      m.Agent.mockImplementation(function () {
        throw agentError;
      });

      const error = await captureError(
        getLatestTeamBlueskyCredentials(asPrismaClient(), 'team-1')
      );

      expect(error.cause).toBe(agentError);
      expect(prismaMock.integration.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('when the oauth client cannot be created', () => {
    it('propagates the configuration error without touching the integration', async () => {
      vi.resetModules();
      const { getLatestTeamBlueskyCredentials: freshGetCredentials } =
        await import('../get-latest-team-bluesky-agent');
      vi.stubEnv('BLUESKY_PRIVATE_KEY', undefined);
      prismaMock.integration.findFirst.mockResolvedValue(integration());

      const error = await captureError(
        freshGetCredentials(asPrismaClient(), 'team-1')
      );

      expect(error.message).toBe(
        'BLUESKY_PRIVATE_KEY environment variable is required'
      );
      expect(error.name).toBe('Error');
      expect(prismaMock.integration.update).not.toHaveBeenCalled();
    });
  });
});
