import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Agent } from '@atproto/api';
import {
  getBatchBlueskyProfiles,
  getEnhancedBlueskyProfile
} from '../get-bluesky-profile';
import { ApplicationError } from '@/lib/errors';

const profileData = (actor: string) => ({
  did: `did:plc:${actor}`,
  handle: `${actor}.bsky.social`,
  displayName: `User ${actor}`,
  description: 'Dog lover',
  avatar: `https://cdn.bsky.app/${actor}/avatar.jpg`,
  banner: `https://cdn.bsky.app/${actor}/banner.jpg`,
  followersCount: 120,
  followsCount: 80,
  postsCount: 42,
  createdAt: '2024-05-01T00:00:00.000Z',
  indexedAt: '2026-01-01T00:00:00.000Z',
  viewer: { muted: false },
  labels: []
});

const enhanced = (actor: string) => ({
  did: `did:plc:${actor}`,
  handle: `${actor}.bsky.social`,
  displayName: `User ${actor}`,
  description: 'Dog lover',
  avatar: `https://cdn.bsky.app/${actor}/avatar.jpg`,
  banner: `https://cdn.bsky.app/${actor}/banner.jpg`,
  followersCount: 120,
  followsCount: 80,
  postsCount: 42,
  createdAt: '2024-05-01T00:00:00.000Z'
});

const createAgent = () => {
  const getProfile = vi.fn();
  const agent = { getProfile } as unknown as Agent;
  return { agent, getProfile };
};

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('getEnhancedBlueskyProfile', () => {
  let mocks: ReturnType<typeof createAgent>;

  beforeEach(() => {
    mocks = createAgent();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('requests the profile for the given actor', async () => {
    mocks.getProfile.mockResolvedValue({
      success: true,
      data: profileData('alice')
    });

    await getEnhancedBlueskyProfile(mocks.agent, 'alice.bsky.social');

    expect(mocks.getProfile).toHaveBeenCalledWith({
      actor: 'alice.bsky.social'
    });
  });

  it('returns the profile metrics and drops unrelated fields', async () => {
    mocks.getProfile.mockResolvedValue({
      success: true,
      data: profileData('alice')
    });

    const profile = await getEnhancedBlueskyProfile(mocks.agent, 'alice');

    expect(profile).toEqual(enhanced('alice'));
  });

  it('keeps optional fields undefined when bluesky omits them', async () => {
    mocks.getProfile.mockResolvedValue({
      success: true,
      data: { did: 'did:plc:min', handle: 'min.bsky.social' }
    });

    const profile = await getEnhancedBlueskyProfile(mocks.agent, 'min');

    expect(profile).toEqual({
      did: 'did:plc:min',
      handle: 'min.bsky.social',
      displayName: undefined,
      description: undefined,
      avatar: undefined,
      banner: undefined,
      followersCount: undefined,
      followsCount: undefined,
      postsCount: undefined,
      createdAt: undefined
    });
  });

  it('throws NOT_FOUND when the lookup is unsuccessful', async () => {
    mocks.getProfile.mockResolvedValue({ success: false, data: {} });

    const error = await getEnhancedBlueskyProfile(mocks.agent, 'ghost').catch(
      (e: unknown) => e
    );

    expect(error).toBeInstanceOf(ApplicationError);
    expect(error).toMatchObject({
      code: 'NOT_FOUND',
      message: 'Bluesky profile not found'
    });
    expect(console.error).not.toHaveBeenCalled();
  });

  it('rethrows an application error from the agent unchanged', async () => {
    const failure = new ApplicationError({
      code: 'UNAUTHORIZED',
      message: 'session expired'
    });
    mocks.getProfile.mockRejectedValue(failure);

    await expect(getEnhancedBlueskyProfile(mocks.agent, 'alice')).rejects.toBe(
      failure
    );
  });

  it('wraps other errors in INTERNAL_SERVER_ERROR with the cause', async () => {
    const failure = new Error('network down');
    mocks.getProfile.mockRejectedValue(failure);

    const error = await getEnhancedBlueskyProfile(mocks.agent, 'alice').catch(
      (e: unknown) => e
    );

    expect(error).toBeInstanceOf(ApplicationError);
    expect(error).toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to fetch Bluesky profile data',
      cause: failure
    });
    expect(console.error).toHaveBeenCalledWith(
      'Error fetching enhanced Bluesky profile:',
      failure
    );
  });
});

describe('getBatchBlueskyProfiles', () => {
  let mocks: ReturnType<typeof createAgent>;

  beforeEach(() => {
    mocks = createAgent();
    mocks.getProfile.mockImplementation(
      async ({ actor }: { actor: string }) => ({
        success: true,
        data: profileData(actor)
      })
    );
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns an empty map without requests for no actors', async () => {
    const profiles = await getBatchBlueskyProfiles(mocks.agent, []);

    expect(profiles.size).toBe(0);
    expect(mocks.getProfile).not.toHaveBeenCalled();
  });

  it('maps each requested actor to its enhanced profile', async () => {
    const profiles = await getBatchBlueskyProfiles(mocks.agent, [
      'alice',
      'bob'
    ]);

    expect([...profiles.entries()]).toEqual([
      ['alice', enhanced('alice')],
      ['bob', enhanced('bob')]
    ]);
  });

  it('omits actors whose profile could not be fetched', async () => {
    mocks.getProfile.mockImplementation(async ({ actor }: { actor: string }) =>
      actor === 'ghost'
        ? { success: false, data: {} }
        : { success: true, data: profileData(actor) }
    );

    const profiles = await getBatchBlueskyProfiles(mocks.agent, [
      'alice',
      'ghost',
      'bob'
    ]);

    expect([...profiles.keys()]).toEqual(['alice', 'bob']);
  });

  it('logs each failed actor with the rejection reason', async () => {
    mocks.getProfile.mockImplementation(async ({ actor }: { actor: string }) =>
      actor === 'ghost'
        ? { success: false, data: {} }
        : { success: true, data: profileData(actor) }
    );

    await getBatchBlueskyProfiles(mocks.agent, ['alice', 'ghost']);

    expect(console.error).toHaveBeenCalledWith(
      'Failed to fetch profile for ghost:',
      expect.objectContaining({
        code: 'NOT_FOUND',
        message: 'Bluesky profile not found'
      })
    );
  });

  it('keeps one entry per actor when an actor is repeated', async () => {
    const profiles = await getBatchBlueskyProfiles(mocks.agent, [
      'alice',
      'alice'
    ]);

    expect(profiles.size).toBe(1);
    expect(mocks.getProfile).toHaveBeenCalledTimes(2);
  });

  it('fetches profiles in sequential chunks of five', async () => {
    const pending: (() => void)[] = [];
    mocks.getProfile.mockImplementation(
      ({ actor }: { actor: string }) =>
        new Promise((resolve) => {
          pending.push(() =>
            resolve({ success: true, data: profileData(actor) })
          );
        })
    );
    const actors = Array.from({ length: 12 }, (_, i) => `actor-${i}`);
    const releaseAll = async () => {
      pending.splice(0).forEach((release) => release());
      await flush();
    };

    const promise = getBatchBlueskyProfiles(mocks.agent, actors);
    await flush();
    const afterFirstChunk = mocks.getProfile.mock.calls.length;
    await releaseAll();
    const afterSecondChunk = mocks.getProfile.mock.calls.length;
    await releaseAll();
    const afterThirdChunk = mocks.getProfile.mock.calls.length;
    await releaseAll();
    const profiles = await promise;

    expect([afterFirstChunk, afterSecondChunk, afterThirdChunk]).toEqual([
      5, 10, 12
    ]);
    expect([...profiles.keys()]).toEqual(actors);
  });
});
