import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RateLimitError } from 'scrapebadger';
import { ApplicationError } from '@giveaway/util-errors';
import { getTweet } from '../get-tweet';
import { scrapeBadgerTweetFixture } from '../../testing/fixtures-scrapebadger-tweet';

const m = vi.hoisted(() => ({
  getById: vi.fn(),
  ScrapeBadger: vi.fn()
}));

vi.mock('scrapebadger', async (importOriginal) => ({
  ...(await importOriginal<typeof import('scrapebadger')>()),
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
    m.getById.mockResolvedValue(scrapeBadgerTweetFixture);

    await getTweet({ tweetId: '123' });

    expect(m.ScrapeBadger).toHaveBeenCalledWith({ apiKey: 'sb-key' });
    expect(m.getById).toHaveBeenCalledWith('123');
  });

  it('returns the tweet from the API', async () => {
    const tweet = scrapeBadgerTweetFixture;
    m.getById.mockResolvedValue(tweet);

    await expect(getTweet({ tweetId: '123' })).resolves.toBe(tweet);
  });

  it('logs the tweet being fetched', async () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    m.getById.mockResolvedValue(scrapeBadgerTweetFixture);

    await getTweet({ tweetId: '123' });

    expect(infoSpy).toHaveBeenCalledWith(
      '[ScrapeBadger] Fetching tweet details for tweet 123'
    );
  });

  it('turns a ScrapeBadger rate limit into a retryable error at its reset time', async () => {
    m.getById.mockRejectedValue(
      new RateLimitError('Too many', { retryAfter: 1_790_000_000 })
    );

    await expect(getTweet({ tweetId: '123' })).rejects.toMatchObject({
      code: 'TOO_MANY_REQUESTS',
      message: 'ScrapeBadger rate limited the tweet request',
      data: { status: 429, retryAfter: 1_790_000_000_000 }
    });
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
      message: 'Loading posts from X is not available right now'
    });
    expect(m.getById).not.toHaveBeenCalled();
  });
});
