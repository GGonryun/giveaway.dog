import { Agent } from '@atproto/api';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeNetwork } from '@giveaway/testing-server/faults';
import { asPrismaClient } from '@giveaway/testing-server/prisma';
import { getBlueskyLikes } from '../get-bluesky-likes';
import { blueskyLikesSchema, blueskyProfileSchema } from '../schemas';
import { blueskyLikesFixture } from '../testing/fixtures-bluesky-likes';
import { blueskyProfileFixture } from '../testing/fixtures-bluesky-profile';

const APPVIEW = 'https://public.api.bsky.app';

const POST_URL = `https://bsky.app/profile/${blueskyProfileFixture.handle}/post/3lacmepost222`;

const tx = asPrismaClient();

describe('Bluesky likes contract', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('parses the recorded profile and likes with the schemas of the app', () => {
    expect(blueskyProfileSchema.safeParse(blueskyProfileFixture)).toEqual(
      expect.objectContaining({ success: true })
    );
    expect(blueskyLikesSchema.safeParse(blueskyLikesFixture)).toEqual(
      expect.objectContaining({ success: true })
    );
  });

  it('turns the recorded likes into the users of the app', async () => {
    const network = fakeNetwork();
    network.json(
      `${APPVIEW}/xrpc/app.bsky.actor.getProfile`,
      blueskyProfileFixture
    );
    network.json(`${APPVIEW}/xrpc/app.bsky.feed.getLikes`, blueskyLikesFixture);

    const result = await getBlueskyLikes(tx, {
      agent: new Agent(APPVIEW),
      postUrl: POST_URL
    });

    expect(result).toEqual({
      data: [
        {
          did: 'did:plc:blueskyactor00000000000001',
          handle: 'actor-1.bsky.social',
          displayName: undefined,
          avatar: undefined
        },
        {
          did: 'did:plc:blueskyactor00000000000002',
          handle: 'actor-2.bsky.social',
          displayName: 'Actor 2',
          avatar:
            'https://cdn.bsky.app/img/avatar/plain/did:plc:blueskyactor00000000000002/bafkreiavatar2@jpeg'
        }
      ],
      cursor: '1767225600000::bafyreilikescursor'
    });
    const [likesRequest] = network.requests(
      `${APPVIEW}/xrpc/app.bsky.feed.getLikes`
    );
    expect(new URL(likesRequest.url).searchParams.get('uri')).toBe(
      'at://did:plc:acmegiveaways000000000000/app.bsky.feed.post/3lacmepost222'
    );
  });
});
