import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Agent } from '@atproto/api';
import { getBlueskyLikes } from '../get-bluesky-likes';
import { ApplicationError } from '@/lib/errors';
import { asPrismaClient } from '@/test/prisma';

const POST_URL = 'https://bsky.app/profile/acme.bsky.social/post/3kpost';

const tx = asPrismaClient();

const createAgent = () => {
  const getProfile = vi.fn();
  const getLikes = vi.fn();
  const agent = {
    getProfile,
    api: { app: { bsky: { feed: { getLikes } } } }
  } as unknown as Agent;
  return { agent, getProfile, getLikes };
};

const like = (did: string, extra: Record<string, unknown> = {}) => ({
  indexedAt: '2026-01-01T00:00:00.000Z',
  createdAt: '2026-01-01T00:00:00.000Z',
  actor: {
    did,
    handle: `${did}.bsky.social`,
    displayName: `User ${did}`,
    avatar: `https://cdn.bsky.app/${did}.jpg`,
    description: 'should be dropped',
    ...extra
  }
});

describe('getBlueskyLikes', () => {
  let mocks: ReturnType<typeof createAgent>;

  beforeEach(() => {
    mocks = createAgent();
    mocks.getProfile.mockResolvedValue({
      success: true,
      data: { did: 'did:plc:acme' }
    });
    mocks.getLikes.mockResolvedValue({ data: { likes: [] } });
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('when the post url is invalid', () => {
    it('throws BAD_REQUEST for a url without a profile post path', async () => {
      const error = await getBlueskyLikes(tx, {
        agent: mocks.agent,
        postUrl: 'https://bsky.app/profile/acme.bsky.social'
      }).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error).toMatchObject({
        code: 'BAD_REQUEST',
        message: 'Invalid Bluesky post URL'
      });
      expect(mocks.getProfile).not.toHaveBeenCalled();
      expect(mocks.getLikes).not.toHaveBeenCalled();
    });

    it('throws BAD_REQUEST for a non-bluesky url', async () => {
      await expect(
        getBlueskyLikes(tx, {
          agent: mocks.agent,
          postUrl: 'https://x.com/acme/status/1'
        })
      ).rejects.toMatchObject({
        code: 'BAD_REQUEST',
        message: 'Invalid Bluesky post URL'
      });
    });
  });

  describe('when resolving the post author', () => {
    it('looks up the profile for the handle in the url', async () => {
      await getBlueskyLikes(tx, { agent: mocks.agent, postUrl: POST_URL });

      expect(mocks.getProfile).toHaveBeenCalledWith({
        actor: 'acme.bsky.social'
      });
    });

    it('accepts a did in place of the handle', async () => {
      await getBlueskyLikes(tx, {
        agent: mocks.agent,
        postUrl: 'https://bsky.app/profile/did:plc:xyz/post/3kpost'
      });

      expect(mocks.getProfile).toHaveBeenCalledWith({ actor: 'did:plc:xyz' });
    });

    it('accepts any url that contains the bsky.app profile post path', async () => {
      await getBlueskyLikes(tx, {
        agent: mocks.agent,
        postUrl: 'https://evil-bsky.app/profile/acme/post/3kpost'
      });

      expect(mocks.getProfile).toHaveBeenCalledWith({ actor: 'acme' });
    });

    it('takes the first path segment after profile as the handle', async () => {
      await getBlueskyLikes(tx, {
        agent: mocks.agent,
        postUrl: 'https://bsky.app/profile/acme/post/3kpost/post/other'
      });

      expect(mocks.getProfile).toHaveBeenCalledWith({ actor: 'acme' });
      expect(mocks.getLikes.mock.calls[0][0].uri).toBe(
        'at://did:plc:acme/app.bsky.feed.post/3kpost'
      );
    });

    it('throws NOT_FOUND when the profile lookup is unsuccessful', async () => {
      mocks.getProfile.mockResolvedValue({ success: false, data: {} });

      await expect(
        getBlueskyLikes(tx, { agent: mocks.agent, postUrl: POST_URL })
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'Profile not found'
      });
      expect(mocks.getLikes).not.toHaveBeenCalled();
    });

    it('propagates a profile lookup error without wrapping it', async () => {
      const failure = new Error('profile service down');
      mocks.getProfile.mockRejectedValue(failure);

      await expect(
        getBlueskyLikes(tx, { agent: mocks.agent, postUrl: POST_URL })
      ).rejects.toBe(failure);
    });
  });

  describe('when fetching likes', () => {
    it('requests up to 100 likes for the at-uri of the post', async () => {
      await getBlueskyLikes(tx, { agent: mocks.agent, postUrl: POST_URL });

      expect(mocks.getLikes).toHaveBeenCalledWith({
        uri: 'at://did:plc:acme/app.bsky.feed.post/3kpost',
        limit: 100,
        cursor: undefined
      });
    });

    it('stops the record key at a query string', async () => {
      await getBlueskyLikes(tx, {
        agent: mocks.agent,
        postUrl: `${POST_URL}?ref=share`
      });

      expect(mocks.getLikes.mock.calls[0][0].uri).toBe(
        'at://did:plc:acme/app.bsky.feed.post/3kpost'
      );
    });

    it('stops the record key at a trailing path segment', async () => {
      await getBlueskyLikes(tx, {
        agent: mocks.agent,
        postUrl: `${POST_URL}/liked-by`
      });

      expect(mocks.getLikes.mock.calls[0][0].uri).toBe(
        'at://did:plc:acme/app.bsky.feed.post/3kpost'
      );
    });

    it('forwards the cursor', async () => {
      await getBlueskyLikes(tx, {
        agent: mocks.agent,
        postUrl: POST_URL,
        cursor: 'cursor-1'
      });

      expect(mocks.getLikes.mock.calls[0][0].cursor).toBe('cursor-1');
    });

    it('maps each like to the actor identity fields', async () => {
      mocks.getLikes.mockResolvedValue({
        data: {
          likes: [like('alice'), like('bob', { displayName: undefined })],
          cursor: 'next-cursor'
        }
      });

      const result = await getBlueskyLikes(tx, {
        agent: mocks.agent,
        postUrl: POST_URL
      });

      expect(result).toEqual({
        data: [
          {
            did: 'alice',
            handle: 'alice.bsky.social',
            displayName: 'User alice',
            avatar: 'https://cdn.bsky.app/alice.jpg'
          },
          {
            did: 'bob',
            handle: 'bob.bsky.social',
            displayName: undefined,
            avatar: 'https://cdn.bsky.app/bob.jpg'
          }
        ],
        cursor: 'next-cursor'
      });
    });

    it('returns an empty list and undefined cursor when there are no likes', async () => {
      const result = await getBlueskyLikes(tx, {
        agent: mocks.agent,
        postUrl: POST_URL
      });

      expect(result).toEqual({ data: [], cursor: undefined });
    });

    it('wraps a likes request failure in INTERNAL_SERVER_ERROR with the cause', async () => {
      const failure = new Error('xrpc failed');
      mocks.getLikes.mockRejectedValue(failure);

      const error = await getBlueskyLikes(tx, {
        agent: mocks.agent,
        postUrl: POST_URL
      }).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error).toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch Bluesky likes',
        cause: failure
      });
    });

    it('wraps a malformed likes response in INTERNAL_SERVER_ERROR', async () => {
      mocks.getLikes.mockResolvedValue({ data: {} });

      await expect(
        getBlueskyLikes(tx, { agent: mocks.agent, postUrl: POST_URL })
      ).rejects.toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch Bluesky likes'
      });
    });

    it('logs the likes request failure', async () => {
      const failure = new Error('xrpc failed');
      mocks.getLikes.mockRejectedValue(failure);

      await getBlueskyLikes(tx, {
        agent: mocks.agent,
        postUrl: POST_URL
      }).catch(() => undefined);

      expect(console.error).toHaveBeenCalledWith(
        'Error fetching Bluesky likes:',
        failure
      );
    });
  });
});
