import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTweetResponseSchema } from '@giveaway/integration-model/api';
import { prismaMock, asPrismaClient } from '@giveaway/testing-server/prisma';
import {
  NOW,
  buildIntegration,
  fetchCall,
  jsonResponse
} from '@giveaway/testing-server/fixtures-integrations-utils';
import createTweetResponse from '../testing/fixtures-x-create-tweet.json';
import { createTweet } from '../create-tweet';

vi.hoisted(() => {
  vi.stubEnv('TWITTER_TEAM_APP_CLIENT_ID', 'twitter-client-id');
  vi.stubEnv('TWITTER_TEAM_APP_CLIENT_SECRET', 'twitter-client-secret');
});

const fetchMock = vi.fn<typeof fetch>();

describe('X POST /2/tweets contract', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(jsonResponse(createTweetResponse.body));
    prismaMock.integration.findFirst.mockResolvedValue(
      buildIntegration({ access_token: 'stored-access-token' })
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('parses the recorded response with the schema that createTweet uses', () => {
    expect(() =>
      createTweetResponseSchema.parse(createTweetResponse.body)
    ).not.toThrow();
  });

  it('posts the text to X with the token of the team', async () => {
    await createTweet(asPrismaClient(), {
      teamId: 'team-1',
      integrationId: 'integration-1',
      text: 'Giveaway time!'
    });

    const { url, init } = fetchCall(fetchMock);
    expect(url).toBe('https://api.x.com/2/tweets');
    expect(init.method).toBe('POST');
    expect(init.headers).toMatchObject({
      Authorization: 'Bearer stored-access-token'
    });
    expect(JSON.parse(String(init.body))).toEqual({ text: 'Giveaway time!' });
  });

  it('returns the created tweet from the recorded response', async () => {
    const result = await createTweet(asPrismaClient(), {
      teamId: 'team-1',
      integrationId: 'integration-1',
      text: 'Giveaway time!'
    });

    expect(result).toEqual({
      data: {
        id: '1975236458112819456',
        text: 'Giveaway time! Retweet this post for a chance to win a year of dog treats #giveaway https://t.co/AbCdEf1234',
        edit_history_tweet_ids: ['1975236458112819456']
      }
    });
  });
});
