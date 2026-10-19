import { Agent } from '@atproto/api';
import { expect, it } from 'vitest';
import {
  describeLive,
  expectLiveResponse,
  liveVariable,
  recordResponses
} from '@giveaway/testing-server/live';
import { expectOk } from '@giveaway/testing-server/result';
import { asPrismaClient } from '@giveaway/testing-server/prisma';
import { getBlueskyLikes } from '../get-bluesky-likes';
import getBlueskyOEmbed from '../get-bluesky-oembed';
import { getBlueskyReposts } from '../get-bluesky-reposts';
import {
  blueskyLikesSchema,
  blueskyOEmbedSchema,
  blueskyProfileSchema,
  blueskyRepostedBySchema
} from '../schemas';

const APPVIEW = 'https://public.api.bsky.app';

const XRPC = `${APPVIEW}/xrpc`;

const tx = asPrismaClient();

const postUrl = () => liveVariable('LIVE_BLUESKY_POST_URL');

describeLive('Bluesky', ['LIVE_BLUESKY_POST_URL'], () => {
  it('resolves the profile of a known post and reads its likes', async () => {
    const call = { provider: 'Bluesky', call: 'get likes' };
    const recorder = recordResponses();

    const result = await getBlueskyLikes(tx, {
      agent: new Agent(APPVIEW),
      postUrl: postUrl()
    });

    expectLiveResponse(
      blueskyProfileSchema,
      recorder.body(`${XRPC}/app.bsky.actor.getProfile`, {
        provider: 'Bluesky',
        call: 'get profile'
      }),
      { provider: 'Bluesky', call: 'get profile' }
    );
    const body = expectLiveResponse(
      blueskyLikesSchema,
      recorder.body(`${XRPC}/app.bsky.feed.getLikes`, call),
      call
    );
    expect(result.data).toHaveLength(body.likes.length);
  });

  it('reads the reposts of a known post', async () => {
    const call = { provider: 'Bluesky', call: 'get reposted by' };
    const recorder = recordResponses();

    const result = await getBlueskyReposts(tx, {
      agent: new Agent(APPVIEW),
      postUrl: postUrl()
    });

    const body = expectLiveResponse(
      blueskyRepostedBySchema,
      recorder.body(`${XRPC}/app.bsky.feed.getRepostedBy`, call),
      call
    );
    expect(result.data).toHaveLength(body.repostedBy.length);
  });

  it('loads the embed of a known post', async () => {
    const call = { provider: 'Bluesky', call: 'oEmbed' };
    const recorder = recordResponses();

    const result = await getBlueskyOEmbed({ postUrl: postUrl() });

    expectLiveResponse(
      blueskyOEmbedSchema,
      recorder.body('https://embed.bsky.app/oembed', call),
      call
    );
    expect(expectOk(result).html).not.toBe('');
  });
});
