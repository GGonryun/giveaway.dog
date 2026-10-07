import { describe, it, expect, vi, beforeEach } from 'vitest';
import { findProviderResponseIssues } from '@giveaway/integration-server/provider-response';
import { asPrismaClient } from '@giveaway/testing-server/prisma';
import { blueskyPostThreadSchema } from '../../schemas';
import {
  BLUESKY_VIEWER_DID,
  blueskyAgent,
  blueskyPostThreadResponse,
  blueskyProfileResponse
} from '../../testing/fixtures-bluesky';
import { isUserLikingPost } from '../is-user-liking-post';
import { isUserRepostingPost } from '../is-user-reposting-post';

const m = vi.hoisted(() => ({ getLatestBlueskyCredentials: vi.fn() }));

vi.mock('../get-latest-bluesky-agent', () => ({
  getLatestBlueskyCredentials: m.getLatestBlueskyCredentials
}));

const POST_URL = 'https://bsky.app/profile/giveaway.dog/post/3m2jy7mls222b';

const POST_URI =
  'at://did:plc:gvdogxk4ui5q2nf3rmbz7ytc/app.bsky.feed.post/3m2jy7mls222b';

const withThread = (thread: unknown) => {
  const recorded = blueskyAgent({
    'app.bsky.actor.getProfile': blueskyProfileResponse,
    'app.bsky.feed.getPostThread': thread
  });
  m.getLatestBlueskyCredentials.mockResolvedValue({
    agent: recorded.agent,
    did: BLUESKY_VIEWER_DID,
    handle: 'viewer.bsky.social'
  });
  return recorded;
};

const threadWithoutViewerState = () => ({
  ...blueskyPostThreadResponse,
  thread: {
    ...blueskyPostThreadResponse.thread,
    post: {
      ...blueskyPostThreadResponse.thread.post,
      viewer: { threadMuted: false, embeddingDisabled: false }
    }
  }
});

describe('Bluesky app.bsky.feed.getPostThread contract', () => {
  beforeEach(() => {
    m.getLatestBlueskyCredentials.mockReset();
  });

  it('parses the recorded response with the schema that the like and repost checks use', () => {
    expect(
      findProviderResponseIssues(
        blueskyPostThreadSchema,
        blueskyPostThreadResponse
      )
    ).toEqual([]);
  });

  it('requests the thread of the post without replies', async () => {
    const { fetchMock } = withThread(blueskyPostThreadResponse);

    await isUserLikingPost(asPrismaClient(), {
      userId: 'user-1',
      postUrl: POST_URL
    });

    const [url] = fetchMock.mock.calls.at(-1) ?? [];
    expect(url?.pathname).toBe('/xrpc/app.bsky.feed.getPostThread');
    expect(Object.fromEntries(url?.searchParams ?? [])).toEqual({
      uri: POST_URI,
      depth: '0'
    });
  });

  it.each([
    ['liked', isUserLikingPost],
    ['reposted', isUserRepostingPost]
  ])('finds that the viewer %s the recorded post', async (_, check) => {
    withThread(blueskyPostThreadResponse);

    await expect(
      check(asPrismaClient(), { userId: 'user-1', postUrl: POST_URL })
    ).resolves.toBe(true);
  });

  it.each([
    ['liked', isUserLikingPost],
    ['reposted', isUserRepostingPost]
  ])(
    'finds that the viewer has not %s a post without viewer state',
    async (_, check) => {
      withThread(threadWithoutViewerState());

      await expect(
        check(asPrismaClient(), { userId: 'user-1', postUrl: POST_URL })
      ).resolves.toBe(false);
    }
  );
});
