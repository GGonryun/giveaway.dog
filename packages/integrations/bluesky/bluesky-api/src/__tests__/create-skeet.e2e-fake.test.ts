import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  E2E_CLOSED_GATES,
  stubE2eFakeEnvironment
} from '@giveaway/e2e-fakes/testing/env';
import {
  clearMemoryOutbox,
  memoryOutbox,
  readE2eOutbox
} from '@giveaway/e2e-fakes/testing/outbox';
import { asPrismaClient } from '@giveaway/testing-server/prisma';
import { createSkeet } from '../create-skeet';
import { getLatestTeamBlueskyCredentials } from '../bluesky/get-latest-team-bluesky-agent';

vi.mock('../bluesky/get-latest-team-bluesky-agent', () => ({
  getLatestTeamBlueskyCredentials: vi.fn()
}));
vi.mock(
  '@giveaway/e2e-fakes/outbox',
  () => import('@giveaway/e2e-fakes/testing/outbox')
);

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  clearMemoryOutbox();
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  vi.mocked(getLatestTeamBlueskyCredentials).mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('createSkeet with the bluesky fake', () => {
  it('records the post in the outbox of the team and returns its fake id', async () => {
    stubE2eFakeEnvironment('preview', 'bluesky');

    const result = await createSkeet(asPrismaClient(), {
      teamId: 'team-1',
      text: 'Giveaway is live!',
      imageUrl: 'https://cdn.giveaway.test/prize.png'
    });

    const [entry] = await readE2eOutbox({
      channel: 'bluesky',
      target: 'team-1'
    });
    expect(entry.payload).toEqual({
      text: 'Giveaway is live!',
      imageUrl: 'https://cdn.giveaway.test/prize.png'
    });
    expect(result).toEqual({
      uri: `at://${entry.id}/app.bsky.feed.post/${entry.id}`,
      cid: entry.id
    });
  });

  it('reads no credentials and fetches nothing', async () => {
    stubE2eFakeEnvironment('preview', 'bluesky');

    await createSkeet(asPrismaClient(), { teamId: 'team-1', text: 'Hi' });

    expect(getLatestTeamBlueskyCredentials).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(E2E_CLOSED_GATES)(
    'reads the credentials of the team on %s',
    async (environment) => {
      stubE2eFakeEnvironment(environment, 'bluesky');
      vi.mocked(getLatestTeamBlueskyCredentials).mockRejectedValue(
        new Error('no credentials')
      );

      await expect(
        createSkeet(asPrismaClient(), { teamId: 'team-1', text: 'Hi' })
      ).rejects.toThrow('no credentials');
      expect(memoryOutbox.redis.rpush).not.toHaveBeenCalled();
    }
  );
});
