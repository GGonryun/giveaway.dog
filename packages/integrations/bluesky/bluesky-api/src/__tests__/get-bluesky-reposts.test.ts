import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Agent } from '@atproto/api';
import { getBlueskyReposts } from '../get-bluesky-reposts';
import { ApplicationError } from '@giveaway/util-errors';
import { asPrismaClient } from '@giveaway/testing-server/prisma';
import {
  blueskyProfileResponse,
  blueskyRepostedByResponse,
  xrpcResponse
} from '../testing/fixtures-bluesky';

const POST_URL = 'https://bsky.app/profile/acme.bsky.social/post/3kpost';

const tx = asPrismaClient();

const createAgent = () => {
  const getProfile = vi.fn();
  const getRepostedBy = vi.fn();
  const agent = {
    getProfile,
    api: { app: { bsky: { feed: { getRepostedBy } } } }
  } as unknown as Agent;
  return { agent, getProfile, getRepostedBy };
};

const actor = (did: string, extra: Record<string, unknown> = {}) => ({
  ...blueskyRepostedByResponse.repostedBy[0],
  did,
  handle: `${did}.bsky.social`,
  displayName: `User ${did}`,
  avatar: `https://cdn.bsky.app/${did}.jpg`,
  indexedAt: '2026-01-01T00:00:00.000Z',
  ...extra
});

describe('getBlueskyReposts', () => {
  let mocks: ReturnType<typeof createAgent>;

  beforeEach(() => {
    mocks = createAgent();
    mocks.getProfile.mockResolvedValue(
      xrpcResponse({ ...blueskyProfileResponse, did: 'did:plc:acme' })
    );
    mocks.getRepostedBy.mockResolvedValue({ data: { repostedBy: [] } });
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('when the post url is invalid', () => {
    it('throws BAD_REQUEST without contacting bluesky', async () => {
      const error = await getBlueskyReposts(tx, {
        agent: mocks.agent,
        postUrl: 'https://bsky.app/profile/acme.bsky.social/feed/xyz'
      }).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error).toMatchObject({
        code: 'BAD_REQUEST',
        message: 'Invalid Bluesky post URL'
      });
      expect(mocks.getProfile).not.toHaveBeenCalled();
    });

    it('throws BAD_REQUEST for a non-bluesky url', async () => {
      await expect(
        getBlueskyReposts(tx, {
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
      await getBlueskyReposts(tx, { agent: mocks.agent, postUrl: POST_URL });

      expect(mocks.getProfile).toHaveBeenCalledWith({
        actor: 'acme.bsky.social'
      });
    });

    it('accepts any url that contains the bsky.app profile post path', async () => {
      await getBlueskyReposts(tx, {
        agent: mocks.agent,
        postUrl: 'https://evil-bsky.app/profile/acme/post/3kpost'
      });

      expect(mocks.getProfile).toHaveBeenCalledWith({ actor: 'acme' });
    });

    it('takes the first path segment after profile as the handle', async () => {
      await getBlueskyReposts(tx, {
        agent: mocks.agent,
        postUrl: 'https://bsky.app/profile/acme/post/3kpost/post/other'
      });

      expect(mocks.getProfile).toHaveBeenCalledWith({ actor: 'acme' });
      expect(mocks.getRepostedBy.mock.calls[0][0].uri).toBe(
        'at://did:plc:acme/app.bsky.feed.post/3kpost'
      );
    });

    it('throws NOT_FOUND when the profile lookup is unsuccessful', async () => {
      mocks.getProfile.mockResolvedValue({ success: false, data: {} });

      await expect(
        getBlueskyReposts(tx, { agent: mocks.agent, postUrl: POST_URL })
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'Profile not found'
      });
      expect(mocks.getRepostedBy).not.toHaveBeenCalled();
    });

    it('propagates a profile lookup error without wrapping it', async () => {
      const failure = new Error('profile service down');
      mocks.getProfile.mockRejectedValue(failure);

      await expect(
        getBlueskyReposts(tx, { agent: mocks.agent, postUrl: POST_URL })
      ).rejects.toBe(failure);
    });
  });

  describe('when fetching reposts', () => {
    it('requests up to 100 reposters for the at-uri of the post', async () => {
      await getBlueskyReposts(tx, { agent: mocks.agent, postUrl: POST_URL });

      expect(mocks.getRepostedBy).toHaveBeenCalledWith({
        uri: 'at://did:plc:acme/app.bsky.feed.post/3kpost',
        limit: 100,
        cursor: undefined
      });
    });

    it('stops the record key at a query string', async () => {
      await getBlueskyReposts(tx, {
        agent: mocks.agent,
        postUrl: `${POST_URL}?utm=1`
      });

      expect(mocks.getRepostedBy.mock.calls[0][0].uri).toBe(
        'at://did:plc:acme/app.bsky.feed.post/3kpost'
      );
    });

    it('stops the record key at a trailing path segment', async () => {
      await getBlueskyReposts(tx, {
        agent: mocks.agent,
        postUrl: `${POST_URL}/reposted-by`
      });

      expect(mocks.getRepostedBy.mock.calls[0][0].uri).toBe(
        'at://did:plc:acme/app.bsky.feed.post/3kpost'
      );
    });

    it('forwards the cursor', async () => {
      await getBlueskyReposts(tx, {
        agent: mocks.agent,
        postUrl: POST_URL,
        cursor: 'cursor-2'
      });

      expect(mocks.getRepostedBy.mock.calls[0][0].cursor).toBe('cursor-2');
    });

    it('maps each reposter to the identity fields', async () => {
      mocks.getRepostedBy.mockResolvedValue({
        data: {
          repostedBy: [actor('alice'), actor('bob', { avatar: undefined })],
          cursor: 'next'
        }
      });

      const result = await getBlueskyReposts(tx, {
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
            displayName: 'User bob',
            avatar: undefined
          }
        ],
        cursor: 'next'
      });
    });

    it('returns an empty list and undefined cursor when nobody reposted', async () => {
      const result = await getBlueskyReposts(tx, {
        agent: mocks.agent,
        postUrl: POST_URL
      });

      expect(result).toEqual({ data: [], cursor: undefined });
    });

    it('wraps a reposts request failure in INTERNAL_SERVER_ERROR with the cause', async () => {
      const failure = new Error('xrpc failed');
      mocks.getRepostedBy.mockRejectedValue(failure);

      const error = await getBlueskyReposts(tx, {
        agent: mocks.agent,
        postUrl: POST_URL
      }).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error).toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch Bluesky reposts',
        cause: failure
      });
      expect(console.error).toHaveBeenCalledWith(
        'Error fetching Bluesky reposts:',
        failure
      );
    });

    it('wraps the BAD_GATEWAY error of a malformed reposts response', async () => {
      mocks.getRepostedBy.mockResolvedValue({ data: {} });

      await expect(
        getBlueskyReposts(tx, { agent: mocks.agent, postUrl: POST_URL })
      ).rejects.toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch Bluesky reposts',
        cause: {
          code: 'BAD_GATEWAY',
          data: { provider: 'bluesky', call: 'app.bsky.feed.getRepostedBy' }
        }
      });
    });
  });
});
