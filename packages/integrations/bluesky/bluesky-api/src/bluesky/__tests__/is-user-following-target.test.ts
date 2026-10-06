import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { asPrismaClient, prismaMock } from '@giveaway/testing-server/prisma';
import { ApplicationError } from '@giveaway/util-errors';
import { isUserFollowingTarget } from '../is-user-following-target';

const m = vi.hoisted(() => ({
  agent: {
    getProfile: vi.fn()
  },
  restore: vi.fn(),
  NodeOAuthClient: vi.fn(),
  Agent: vi.fn()
}));

vi.mock('@atproto/oauth-client-node', () => ({
  NodeOAuthClient: m.NodeOAuthClient,
  requestLocalLock: vi.fn()
}));

vi.mock('@atproto/jwk-jose', () => ({
  JoseKey: { fromImportable: vi.fn(async () => ({ kid: 'key1' })) }
}));

vi.mock('@atproto/api', () => ({
  Agent: m.Agent
}));

const captureError = async (promise: Promise<unknown>) => {
  try {
    await promise;
  } catch (error) {
    return error as ApplicationError;
  }
  throw new Error('Expected the promise to reject');
};

const expectWrappedFailure = (error: ApplicationError) => {
  expect(error).toBeInstanceOf(ApplicationError);
  expect(error.code).toBe('INTERNAL_SERVER_ERROR');
  expect(error.message).toBe('Failed to check Bluesky follow status');
  return error.cause as ApplicationError;
};

describe('isUserFollowingTarget', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    m.agent.getProfile.mockReset();
    m.restore.mockResolvedValue({ did: 'did:plc:viewer' });
    m.NodeOAuthClient.mockImplementation(function (this: {
      restore: typeof m.restore;
    }) {
      this.restore = m.restore;
    });
    m.Agent.mockImplementation(function () {
      return m.agent;
    });
    vi.stubEnv('BLUESKY_PRIVATE_KEY', JSON.stringify({ kty: 'EC' }));
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://giveaway.test');
    prismaMock.account.findFirst.mockResolvedValue({
      providerAccountId: 'did:plc:viewer',
      session_state: '{}',
      label: 'viewer.bsky.social'
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe('when the profile lookup succeeds', () => {
    it('loads the bluesky credentials of the given user', async () => {
      m.agent.getProfile.mockResolvedValue({ data: { viewer: {} } });

      await isUserFollowingTarget(asPrismaClient(), {
        userId: 'user-7',
        targetHandle: 'host.bsky.social'
      });

      expect(prismaMock.account.findFirst).toHaveBeenCalledWith({
        where: { userId: 'user-7', provider: 'bluesky' }
      });
    });

    it('requests the profile of the target handle', async () => {
      m.agent.getProfile.mockResolvedValue({ data: { viewer: {} } });

      await isUserFollowingTarget(asPrismaClient(), {
        userId: 'user-1',
        targetHandle: 'host.bsky.social'
      });

      expect(m.agent.getProfile).toHaveBeenCalledWith({
        actor: 'host.bsky.social'
      });
    });

    it('returns true when the viewer follows the target', async () => {
      m.agent.getProfile.mockResolvedValue({
        data: { viewer: { following: 'at://did:plc:viewer/follow/1' } }
      });

      const result = await isUserFollowingTarget(asPrismaClient(), {
        userId: 'user-1',
        targetHandle: 'host.bsky.social'
      });

      expect(result).toBe(true);
    });

    it('returns true when the following reference is null', async () => {
      m.agent.getProfile.mockResolvedValue({
        data: { viewer: { following: null } }
      });

      const result = await isUserFollowingTarget(asPrismaClient(), {
        userId: 'user-1',
        targetHandle: 'host.bsky.social'
      });

      expect(result).toBe(true);
    });

    it('returns false when the viewer does not follow the target', async () => {
      m.agent.getProfile.mockResolvedValue({
        data: { viewer: { followedBy: 'at://follow' } }
      });

      const result = await isUserFollowingTarget(asPrismaClient(), {
        userId: 'user-1',
        targetHandle: 'host.bsky.social'
      });

      expect(result).toBe(false);
    });

    it('returns false when the profile has no viewer state', async () => {
      m.agent.getProfile.mockResolvedValue({ data: {} });

      const result = await isUserFollowingTarget(asPrismaClient(), {
        userId: 'user-1',
        targetHandle: 'host.bsky.social'
      });

      expect(result).toBe(false);
    });
  });

  describe('when the check fails', () => {
    it('wraps errors thrown by the profile API', async () => {
      const apiError = new Error('profile not found');
      m.agent.getProfile.mockRejectedValue(apiError);

      const error = await captureError(
        isUserFollowingTarget(asPrismaClient(), {
          userId: 'user-1',
          targetHandle: 'host.bsky.social'
        })
      );

      expect(expectWrappedFailure(error)).toBe(apiError);
    });

    it('wraps missing bluesky credentials', async () => {
      prismaMock.account.findFirst.mockResolvedValue(null);

      const error = await captureError(
        isUserFollowingTarget(asPrismaClient(), {
          userId: 'user-1',
          targetHandle: 'host.bsky.social'
        })
      );

      const cause = expectWrappedFailure(error);
      expect(cause).toBeInstanceOf(ApplicationError);
      expect(cause.code).toBe('FORBIDDEN');
      expect(cause.message).toBe(
        'User does not have a connected Bluesky account'
      );
      expect(m.agent.getProfile).not.toHaveBeenCalled();
    });

    it('wraps a response without data', async () => {
      m.agent.getProfile.mockResolvedValue({});

      const error = await captureError(
        isUserFollowingTarget(asPrismaClient(), {
          userId: 'user-1',
          targetHandle: 'host.bsky.social'
        })
      );

      expect(expectWrappedFailure(error)).toBeInstanceOf(TypeError);
    });

    it('logs the underlying error', async () => {
      const apiError = new Error('profile not found');
      m.agent.getProfile.mockRejectedValue(apiError);

      await captureError(
        isUserFollowingTarget(asPrismaClient(), {
          userId: 'user-1',
          targetHandle: 'host.bsky.social'
        })
      );

      expect(console.error).toHaveBeenCalledWith(
        'Error checking Bluesky follow status:',
        apiError
      );
    });
  });
});
