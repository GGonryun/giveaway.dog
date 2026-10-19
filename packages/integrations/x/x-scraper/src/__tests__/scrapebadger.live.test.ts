import { expect, it } from 'vitest';
import {
  describeLive,
  expectLiveResponse,
  liveVariable,
  recordResponses
} from '@giveaway/testing-server/live';
import { getTweet } from '../procedures/get-tweet';
import { getRetweeters } from '../procedures/get-retweeters';
import { getUser } from '../procedures/get-user';
import {
  scrapeBadgerRetweetersSchema,
  scrapeBadgerTweetSchema,
  scrapeBadgerUserSchema
} from '../schemas';

const API = 'https://scrapebadger.com/v1/twitter';

const target = () => {
  const match = liveVariable('LIVE_X_TWEET_URL').match(
    /(?:x|twitter)\.com\/(\w+)\/status\/(\d+)/
  );
  if (!match) {
    throw new Error('LIVE_X_TWEET_URL is not the URL of a post');
  }
  return { username: match[1], tweetId: match[2] };
};

describeLive(
  'ScrapeBadger',
  ['SCRAPEBADGER_API_KEY', 'LIVE_X_TWEET_URL'],
  () => {
    it('loads a known tweet', async () => {
      const call = { provider: 'ScrapeBadger', call: 'get tweet' };
      const { tweetId } = target();
      const recorder = recordResponses();

      const tweet = await getTweet({ tweetId });

      expectLiveResponse(
        scrapeBadgerTweetSchema,
        recorder.body(`${API}/tweets/tweet/${tweetId}`, call),
        call
      );
      expect(tweet.id).toBe(tweetId);
    });

    it('loads the first page of the retweeters of a known tweet', async () => {
      const call = { provider: 'ScrapeBadger', call: 'get retweeters' };
      const { tweetId } = target();
      const recorder = recordResponses();

      const page = await getRetweeters({ tweetId });

      const body = expectLiveResponse(
        scrapeBadgerRetweetersSchema,
        recorder.body(`${API}/tweets/tweet/${tweetId}/retweeters`, call),
        call
      );
      expect(page.data).toHaveLength(body.data.length);
    });

    it('loads the author of a known tweet', async () => {
      const call = { provider: 'ScrapeBadger', call: 'get user by username' };
      const { username } = target();
      const recorder = recordResponses();

      const user = await getUser({ username });

      expectLiveResponse(
        scrapeBadgerUserSchema,
        recorder.body(`${API}/users/${username}/by_username`, call),
        call
      );
      expect(user.username.toLowerCase()).toBe(username.toLowerCase());
    });
  }
);
