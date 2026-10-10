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
import { createTweet } from '../create-tweet';
import { twitterApiRequest } from '../twitter-api-request';
import { uploadImage } from '../upload-image';

vi.mock('../twitter-api-request', () => ({ twitterApiRequest: vi.fn() }));
vi.mock('../upload-image', () => ({ uploadImage: vi.fn() }));
vi.mock(
  '@giveaway/e2e-fakes/outbox',
  () => import('@giveaway/e2e-fakes/testing/outbox')
);

const input = {
  teamId: 'team-1',
  integrationId: 'int-1',
  text: 'Giveaway is live!',
  imageUrl: 'https://cdn.giveaway.test/prize.png'
};

beforeEach(() => {
  clearMemoryOutbox();
  vi.mocked(twitterApiRequest).mockReset();
  vi.mocked(uploadImage).mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('createTweet with the x fake', () => {
  it('records the post in the outbox of the team and returns its fake id', async () => {
    stubE2eFakeEnvironment('preview', 'x');

    const result = await createTweet(asPrismaClient(), input);

    const [entry] = await readE2eOutbox({ channel: 'x', target: 'team-1' });
    expect(entry.payload).toEqual({
      integrationId: 'int-1',
      text: 'Giveaway is live!',
      imageUrl: 'https://cdn.giveaway.test/prize.png'
    });
    expect(result).toEqual({
      data: {
        id: entry.id,
        text: 'Giveaway is live!',
        edit_history_tweet_ids: [entry.id]
      }
    });
  });

  it('calls neither the X API nor the media upload', async () => {
    stubE2eFakeEnvironment('preview', 'x');

    await createTweet(asPrismaClient(), input);

    expect(twitterApiRequest).not.toHaveBeenCalled();
    expect(uploadImage).not.toHaveBeenCalled();
  });

  it.each(E2E_CLOSED_GATES)('posts to X on %s', async (environment) => {
    stubE2eFakeEnvironment(environment, 'x');
    vi.mocked(uploadImage).mockResolvedValue('media-1');

    await createTweet(asPrismaClient(), input);

    expect(twitterApiRequest).toHaveBeenCalledWith(
      expect.objectContaining({ endpoint: 'https://api.x.com/2/tweets' })
    );
    expect(memoryOutbox.redis.rpush).not.toHaveBeenCalled();
  });
});
