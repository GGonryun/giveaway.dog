import { describe, it, expect } from 'vitest';
import { asPrismaClient } from '@giveaway/testing-server/prisma';
import { blueskyLikesSchema, blueskyProfileSchema } from '../schemas';
import {
  blueskyAgent,
  blueskyLikesResponse,
  blueskyProfileResponse
} from '../testing/fixtures-bluesky';
import { getBlueskyLikes } from '../get-bluesky-likes';

const POST_URL = 'https://bsky.app/profile/giveaway.dog/post/3m2jy7mls222b';

const POST_URI =
  'at://did:plc:gvdogxk4ui5q2nf3rmbz7ytc/app.bsky.feed.post/3m2jy7mls222b';

const recordedAgent = () =>
  blueskyAgent({
    'app.bsky.actor.getProfile': blueskyProfileResponse,
    'app.bsky.feed.getLikes': blueskyLikesResponse
  });

describe('Bluesky app.bsky.feed.getLikes contract', () => {
  it('parses the recorded responses with the schemas that getBlueskyLikes uses', () => {
    expect(() =>
      blueskyProfileSchema.parse(blueskyProfileResponse)
    ).not.toThrow();
    expect(() => blueskyLikesSchema.parse(blueskyLikesResponse)).not.toThrow();
  });

  it('resolves the author of the post and requests its likes', async () => {
    const { agent, fetchMock } = recordedAgent();

    await getBlueskyLikes(asPrismaClient(), {
      agent,
      postUrl: POST_URL,
      cursor: 'cursor-1'
    });

    expect(
      fetchMock.mock.calls.map(([url]) => [
        url.pathname,
        Object.fromEntries(url.searchParams)
      ])
    ).toEqual([
      ['/xrpc/app.bsky.actor.getProfile', { actor: 'giveaway.dog' }],
      [
        '/xrpc/app.bsky.feed.getLikes',
        { uri: POST_URI, limit: '100', cursor: 'cursor-1' }
      ]
    ]);
  });

  it('returns the users of the recorded likes and the next cursor', async () => {
    const { agent } = recordedAgent();

    const result = await getBlueskyLikes(asPrismaClient(), {
      agent,
      postUrl: POST_URL
    });

    expect(result).toEqual({
      data: [
        {
          did: 'did:plc:likerone2222222222222222',
          handle: 'liker-one.bsky.social',
          displayName: 'Liker One',
          avatar:
            'https://cdn.bsky.app/img/avatar/plain/did:plc:likerone2222222222222222/bafkreihbjgtfuffnkscayspqrjierepzkr6p5usyvkavwjuwdmm3gkq4bi@jpeg'
        },
        {
          did: 'did:plc:likertwo2222222222222222',
          handle: 'liker-two.bsky.social'
        }
      ],
      cursor:
        '1759770123456::bafyreieyuxepfyv6j5uwhgp2dnz3rmvxssx4h66qlyqyqynuyqxpcoirxa'
    });
  });
});
