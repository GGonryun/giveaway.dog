import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { asPrismaClient, prismaMock } from '@giveaway/testing-server/prisma';
import { ApplicationError } from '@giveaway/util-errors';
import { isUserRepostingPost } from '../is-user-reposting-post';

const m = vi.hoisted(() => ({
  agent: {
    getProfile: vi.fn(),
    getPostThread: vi.fn()
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

const POST_URL = 'https://bsky.app/profile/alice.bsky.social/post/3kabc';
const POST_URI = 'at://did:plc:alice/app.bsky.feed.post/3kabc';

const profileResponse = (overrides: Record<string, unknown> = {}) => ({
  success: true,
  data: { did: 'did:plc:alice', handle: 'alice.bsky.social' },
  ...overrides
});

const threadResponse = (
  post: Record<string, unknown> | undefined,
  success = true
) => ({
  success,
  data: { thread: { post } }
});

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
  expect(error.message).toBe('Failed to check Bluesky repost status');
  return error.cause as ApplicationError;
};

describe('isUserRepostingPost', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    m.agent.getProfile.mockReset();
    m.agent.getProfile.mockResolvedValue(profileResponse());
    m.agent.getPostThread.mockReset();
    m.agent.getPostThread.mockResolvedValue(
      threadResponse({ uri: POST_URI, viewer: {} })
    );
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
    vi.stubEnv('NEXTAUTH_URL', 'https://giveaway.test');
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

  describe('when the post can be resolved', () => {
    it('loads the bluesky credentials of the given user', async () => {
      await isUserRepostingPost(asPrismaClient(), {
        userId: 'user-9',
        postUrl: POST_URL
      });

      expect(prismaMock.account.findFirst).toHaveBeenCalledWith({
        where: { userId: 'user-9', provider: 'bluesky' }
      });
    });

    it('resolves the profile handle from the post URL', async () => {
      await isUserRepostingPost(asPrismaClient(), {
        userId: 'user-1',
        postUrl: POST_URL
      });

      expect(m.agent.getProfile).toHaveBeenCalledWith({
        actor: 'alice.bsky.social'
      });
    });

    it('fetches the thread for the AT URI with depth 0', async () => {
      await isUserRepostingPost(asPrismaClient(), {
        userId: 'user-1',
        postUrl: POST_URL
      });

      expect(m.agent.getPostThread).toHaveBeenCalledWith({
        uri: POST_URI,
        depth: 0
      });
    });

    it('returns true when the viewer has reposted the post', async () => {
      m.agent.getPostThread.mockResolvedValue(
        threadResponse({ viewer: { repost: 'at://did:plc:viewer/repost/1' } })
      );

      const result = await isUserRepostingPost(asPrismaClient(), {
        userId: 'user-1',
        postUrl: POST_URL
      });

      expect(result).toBe(true);
    });

    it('returns true when the repost reference is an empty string', async () => {
      m.agent.getPostThread.mockResolvedValue(
        threadResponse({ viewer: { repost: '' } })
      );

      const result = await isUserRepostingPost(asPrismaClient(), {
        userId: 'user-1',
        postUrl: POST_URL
      });

      expect(result).toBe(true);
    });

    it('returns false when the viewer has only liked the post', async () => {
      m.agent.getPostThread.mockResolvedValue(
        threadResponse({ viewer: { like: 'at://like' } })
      );

      const result = await isUserRepostingPost(asPrismaClient(), {
        userId: 'user-1',
        postUrl: POST_URL
      });

      expect(result).toBe(false);
    });

    it('returns false when the post has no viewer state', async () => {
      m.agent.getPostThread.mockResolvedValue(threadResponse({}));

      const result = await isUserRepostingPost(asPrismaClient(), {
        userId: 'user-1',
        postUrl: POST_URL
      });

      expect(result).toBe(false);
    });

    it('drops the query string from the record key', async () => {
      await isUserRepostingPost(asPrismaClient(), {
        userId: 'user-1',
        postUrl: `${POST_URL}?ref_src=share`
      });

      expect(m.agent.getPostThread).toHaveBeenCalledWith({
        uri: POST_URI,
        depth: 0
      });
    });

    it('accepts profile URLs that use a DID instead of a handle', async () => {
      await isUserRepostingPost(asPrismaClient(), {
        userId: 'user-1',
        postUrl: 'https://bsky.app/profile/did:plc:alice/post/3kabc'
      });

      expect(m.agent.getProfile).toHaveBeenCalledWith({
        actor: 'did:plc:alice'
      });
    });

    it('accepts post URLs without a protocol', async () => {
      await isUserRepostingPost(asPrismaClient(), {
        userId: 'user-1',
        postUrl: 'bsky.app/profile/alice.bsky.social/post/3kabc/'
      });

      expect(m.agent.getPostThread).toHaveBeenCalledWith({
        uri: POST_URI,
        depth: 0
      });
    });

    it('keeps a hash fragment in the record key', async () => {
      await isUserRepostingPost(asPrismaClient(), {
        userId: 'user-1',
        postUrl: `${POST_URL}#reply`
      });

      expect(m.agent.getPostThread).toHaveBeenCalledWith({
        uri: `${POST_URI}#reply`,
        depth: 0
      });
    });

    it('accepts any host name that ends in bsky.app', async () => {
      await isUserRepostingPost(asPrismaClient(), {
        userId: 'user-1',
        postUrl: 'https://notbsky.app/profile/alice.bsky.social/post/3kabc'
      });

      expect(m.agent.getPostThread).toHaveBeenCalledWith({
        uri: POST_URI,
        depth: 0
      });
    });
  });

  describe('when the check fails', () => {
    it('wraps an invalid post URL error without calling the API', async () => {
      const error = await captureError(
        isUserRepostingPost(asPrismaClient(), {
          userId: 'user-1',
          postUrl: 'https://twitter.com/alice/status/1'
        })
      );

      const cause = expectWrappedFailure(error);
      expect(cause).toBeInstanceOf(ApplicationError);
      expect(cause.code).toBe('BAD_REQUEST');
      expect(cause.message).toBe('Invalid Bluesky post URL');
      expect(m.agent.getProfile).not.toHaveBeenCalled();
    });

    it('wraps a profile URL without a post segment as an invalid URL', async () => {
      const error = await captureError(
        isUserRepostingPost(asPrismaClient(), {
          userId: 'user-1',
          postUrl: 'https://bsky.app/profile/alice.bsky.social'
        })
      );

      const cause = expectWrappedFailure(error);
      expect(cause.code).toBe('BAD_REQUEST');
      expect(cause.message).toBe('Invalid Bluesky post URL');
      expect(m.agent.getProfile).not.toHaveBeenCalled();
    });

    it('wraps a profile lookup that is not successful', async () => {
      m.agent.getProfile.mockResolvedValue(profileResponse({ success: false }));

      const error = await captureError(
        isUserRepostingPost(asPrismaClient(), {
          userId: 'user-1',
          postUrl: POST_URL
        })
      );

      const cause = expectWrappedFailure(error);
      expect(cause.code).toBe('NOT_FOUND');
      expect(cause.message).toBe('Profile not found');
      expect(m.agent.getPostThread).not.toHaveBeenCalled();
    });

    it('wraps a thread that is not a post view', async () => {
      m.agent.getPostThread.mockResolvedValue({
        success: true,
        data: { thread: { uri: POST_URI, notFound: true } }
      });

      const error = await captureError(
        isUserRepostingPost(asPrismaClient(), {
          userId: 'user-1',
          postUrl: POST_URL
        })
      );

      const cause = expectWrappedFailure(error);
      expect(cause.code).toBe('NOT_FOUND');
      expect(cause.message).toBe('Post not found');
    });

    it('wraps a thread response that is not successful', async () => {
      m.agent.getPostThread.mockResolvedValue(
        threadResponse({ viewer: { repost: 'at://repost' } }, false)
      );

      const error = await captureError(
        isUserRepostingPost(asPrismaClient(), {
          userId: 'user-1',
          postUrl: POST_URL
        })
      );

      const cause = expectWrappedFailure(error);
      expect(cause.code).toBe('NOT_FOUND');
      expect(cause.message).toBe('Post not found');
    });

    it('wraps a thread whose post is undefined', async () => {
      m.agent.getPostThread.mockResolvedValue(threadResponse(undefined));

      const error = await captureError(
        isUserRepostingPost(asPrismaClient(), {
          userId: 'user-1',
          postUrl: POST_URL
        })
      );

      const cause = expectWrappedFailure(error);
      expect(cause.code).toBe('NOT_FOUND');
      expect(cause.message).toBe('Post not found');
    });

    it('wraps errors thrown by the thread API', async () => {
      const apiError = new Error('rate limited');
      m.agent.getPostThread.mockRejectedValue(apiError);

      const error = await captureError(
        isUserRepostingPost(asPrismaClient(), {
          userId: 'user-1',
          postUrl: POST_URL
        })
      );

      expect(expectWrappedFailure(error)).toBe(apiError);
    });

    it('wraps missing bluesky credentials', async () => {
      prismaMock.account.findFirst.mockResolvedValue(null);

      const error = await captureError(
        isUserRepostingPost(asPrismaClient(), {
          userId: 'user-1',
          postUrl: POST_URL
        })
      );

      const cause = expectWrappedFailure(error);
      expect(cause.code).toBe('FORBIDDEN');
      expect(m.agent.getProfile).not.toHaveBeenCalled();
    });

    it('logs the underlying error', async () => {
      const apiError = new Error('rate limited');
      m.agent.getPostThread.mockRejectedValue(apiError);

      await captureError(
        isUserRepostingPost(asPrismaClient(), {
          userId: 'user-1',
          postUrl: POST_URL
        })
      );

      expect(console.error).toHaveBeenCalledWith(
        'Error checking Bluesky repost status:',
        apiError
      );
    });
  });
});
