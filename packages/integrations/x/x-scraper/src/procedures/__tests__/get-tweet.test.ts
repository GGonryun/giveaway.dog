import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApplicationError } from '@giveaway/util-errors';
import {
  scrapeBadgerTweet,
  scrapeBadgerTweetResponse
} from '../../testing/fixtures-scrapebadger';
import { getTweet } from '../get-tweet';

const m = vi.hoisted(() => ({
  getById: vi.fn(),
  ScrapeBadger: vi.fn()
}));

vi.mock('scrapebadger', () => ({
  ScrapeBadger: m.ScrapeBadger
}));

describe('getTweet', () => {
  beforeEach(() => {
    vi.stubEnv('SCRAPEBADGER_API_KEY', 'sb-key');
    m.getById.mockReset();
    m.ScrapeBadger.mockReset();
    m.ScrapeBadger.mockImplementation(function () {
      return { twitter: { tweets: { getById: m.getById } } };
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('fetches the tweet by id with a client using the configured API key', async () => {
    m.getById.mockResolvedValue(scrapeBadgerTweetResponse);

    await getTweet({ tweetId: '123' });

    expect(m.ScrapeBadger).toHaveBeenCalledWith({ apiKey: 'sb-key' });
    expect(m.getById).toHaveBeenCalledWith('123');
  });

  it('returns the tweet from the API', async () => {
    m.getById.mockResolvedValue(scrapeBadgerTweetResponse);

    await expect(getTweet({ tweetId: '123' })).resolves.toEqual(
      scrapeBadgerTweet()
    );
  });

  it('fills the counts, the text and the media that the API leaves out', async () => {
    m.getById.mockResolvedValue({ id: '123' });

    await expect(getTweet({ tweetId: '123' })).resolves.toEqual({
      id: '123',
      text: '',
      favorite_count: 0,
      retweet_count: 0,
      reply_count: 0,
      quote_count: 0,
      media: []
    });
  });

  it('rejects with BAD_GATEWAY when the tweet does not match the schema', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    m.getById.mockResolvedValue({ ...scrapeBadgerTweetResponse, id: 123 });

    await expect(getTweet({ tweetId: '123' })).rejects.toMatchObject({
      code: 'BAD_GATEWAY',
      data: { provider: 'scrapebadger', call: 'tweets.getById' }
    });
  });

  it('logs the tweet being fetched', async () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    m.getById.mockResolvedValue(scrapeBadgerTweetResponse);

    await getTweet({ tweetId: '123' });

    expect(infoSpy).toHaveBeenCalledWith(
      '[ScrapeBadger] Fetching tweet details for tweet 123'
    );
  });

  it('propagates API errors', async () => {
    m.getById.mockRejectedValue(new Error('not found'));

    await expect(getTweet({ tweetId: '123' })).rejects.toThrow('not found');
  });

  it('rejects with an application error when the API key is missing', async () => {
    vi.stubEnv('SCRAPEBADGER_API_KEY', undefined);

    const promise = getTweet({ tweetId: '123' });

    await expect(promise).rejects.toBeInstanceOf(ApplicationError);
    await expect(promise).rejects.toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'SCRAPEBADGER_API_KEY environment variable not set'
    });
    expect(m.getById).not.toHaveBeenCalled();
  });
});
