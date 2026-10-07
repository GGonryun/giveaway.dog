import { describe, it, expect } from 'vitest';
import { asPrismaClient } from '@giveaway/testing-server/prisma';
import { blueskyRepostedBySchema } from '../schemas';
import {
  blueskyAgent,
  blueskyProfileResponse,
  blueskyRepostedByResponse
} from '../testing/fixtures-bluesky';
import { getBlueskyReposts } from '../get-bluesky-reposts';

const POST_URL = 'https://bsky.app/profile/giveaway.dog/post/3m2jy7mls222b';

const POST_URI =
  'at://did:plc:gvdogxk4ui5q2nf3rmbz7ytc/app.bsky.feed.post/3m2jy7mls222b';

const recordedAgent = () =>
  blueskyAgent({
    'app.bsky.actor.getProfile': blueskyProfileResponse,
    'app.bsky.feed.getRepostedBy': blueskyRepostedByResponse
  });

describe('Bluesky app.bsky.feed.getRepostedBy contract', () => {
  it('parses the recorded response with the schema that getBlueskyReposts uses', () => {
    expect(() =>
      blueskyRepostedBySchema.parse(blueskyRepostedByResponse)
    ).not.toThrow();
  });

  it('requests the reposts of the post that the url names', async () => {
    const { agent, fetchMock } = recordedAgent();

    await getBlueskyReposts(asPrismaClient(), { agent, postUrl: POST_URL });

    expect(fetchMock.mock.calls.at(-1)?.[0].pathname).toBe(
      '/xrpc/app.bsky.feed.getRepostedBy'
    );
    expect(
      Object.fromEntries(fetchMock.mock.calls.at(-1)?.[0].searchParams ?? [])
    ).toEqual({ uri: POST_URI, limit: '100' });
  });

  it('returns the users of the recorded reposts and the next cursor', async () => {
    const { agent } = recordedAgent();

    const result = await getBlueskyReposts(asPrismaClient(), {
      agent,
      postUrl: POST_URL
    });

    expect(result).toEqual({
      data: [
        {
          did: 'did:plc:reposterone2222222222222',
          handle: 'reposter-one.bsky.social',
          displayName: 'Reposter One',
          avatar:
            'https://cdn.bsky.app/img/avatar/plain/did:plc:reposterone2222222222222/bafkreihbjgtfuffnkscayspqrjierepzkr6p5usyvkavwjuwdmm3gkq4bi@jpeg'
        }
      ],
      cursor:
        '1759770200000::bafyreih3i2j2bldakwo3dpiq5mvofb5qvp6m57jwuhigootvolyoyhnmxi'
    });
  });
});
