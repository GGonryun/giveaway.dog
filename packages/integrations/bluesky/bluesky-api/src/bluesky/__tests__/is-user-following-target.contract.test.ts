import { describe, it, expect, vi } from 'vitest';
import { asPrismaClient } from '@giveaway/testing-server/prisma';
import { blueskyProfileSchema } from '../../schemas';
import {
  BLUESKY_VIEWER_DID,
  blueskyAgent,
  blueskyProfileResponse
} from '../../testing/fixtures-bluesky';
import { isUserFollowingTarget } from '../is-user-following-target';

const m = vi.hoisted(() => ({ getLatestBlueskyCredentials: vi.fn() }));

vi.mock('../get-latest-bluesky-agent', () => ({
  getLatestBlueskyCredentials: m.getLatestBlueskyCredentials
}));

const withProfile = (profile: unknown) => {
  const recorded = blueskyAgent({ 'app.bsky.actor.getProfile': profile });
  m.getLatestBlueskyCredentials.mockResolvedValue({
    agent: recorded.agent,
    did: BLUESKY_VIEWER_DID,
    handle: 'viewer.bsky.social'
  });
  return recorded;
};

describe('Bluesky app.bsky.actor.getProfile contract', () => {
  it('parses the recorded response with the schema that the follow check uses', () => {
    expect(() =>
      blueskyProfileSchema.parse(blueskyProfileResponse)
    ).not.toThrow();
  });

  it('requests the profile of the target', async () => {
    const { fetchMock } = withProfile(blueskyProfileResponse);

    await isUserFollowingTarget(asPrismaClient(), {
      userId: 'user-1',
      targetHandle: 'giveaway.dog'
    });

    const [url] = fetchMock.mock.calls[0];
    expect(url.pathname).toBe('/xrpc/app.bsky.actor.getProfile');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      actor: 'giveaway.dog'
    });
  });

  it('finds that the viewer follows the target of the recorded profile', async () => {
    withProfile(blueskyProfileResponse);

    await expect(
      isUserFollowingTarget(asPrismaClient(), {
        userId: 'user-1',
        targetHandle: 'giveaway.dog'
      })
    ).resolves.toBe(true);
  });

  it('finds that the viewer does not follow a target without a follow record', async () => {
    withProfile({
      ...blueskyProfileResponse,
      viewer: { muted: false, blockedBy: false }
    });

    await expect(
      isUserFollowingTarget(asPrismaClient(), {
        userId: 'user-1',
        targetHandle: 'giveaway.dog'
      })
    ).resolves.toBe(false);
  });
});
