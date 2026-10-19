import { expect, it } from 'vitest';
import {
  describeLive,
  expectLiveResponse,
  liveVariable,
  recordResponses
} from '@giveaway/testing-server/live';
import { expectOk } from '@giveaway/testing-server/result';
import getTwitterOEmbed from '../get-twitter-oembed';
import { twitterOEmbedResponseSchema } from '../schemas';

describeLive('X', ['LIVE_X_TWEET_URL'], () => {
  it('loads the embed of a known post', async () => {
    const call = { provider: 'X', call: 'oEmbed' };
    const recorder = recordResponses();

    const result = await getTwitterOEmbed({
      postUrl: liveVariable('LIVE_X_TWEET_URL'),
      theme: 'dark'
    });

    expectLiveResponse(
      twitterOEmbedResponseSchema,
      recorder.body('https://publish.twitter.com/oembed', call),
      call
    );
    expect(expectOk(result).html).not.toBe('');
  });
});
