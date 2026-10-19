import { Agent } from '@atproto/api';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeNetwork } from '@giveaway/testing-server/faults';
import { asPrismaClient } from '@giveaway/testing-server/prisma';
import { getBlueskyReposts } from '../get-bluesky-reposts';
import { blueskyRepostedBySchema } from '../schemas';
import { blueskyProfileFixture } from '../testing/fixtures-bluesky-profile';
import { blueskyRepostedByFixture } from '../testing/fixtures-bluesky-reposted-by';

const APPVIEW = 'https://public.api.bsky.app';

const POST_URL = `https://bsky.app/profile/${blueskyProfileFixture.handle}/post/3lacmepost222`;

const tx = asPrismaClient();

describe('Bluesky reposted by contract', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('parses the recorded reposts with the schema of the app', () => {
    expect(blueskyRepostedBySchema.safeParse(blueskyRepostedByFixture)).toEqual(
      expect.objectContaining({ success: true })
    );
  });

  it('turns the recorded reposts into the users of the app', async () => {
    const network = fakeNetwork();
    network.json(
      `${APPVIEW}/xrpc/app.bsky.actor.getProfile`,
      blueskyProfileFixture
    );
    network.json(
      `${APPVIEW}/xrpc/app.bsky.feed.getRepostedBy`,
      blueskyRepostedByFixture
    );

    const result = await getBlueskyReposts(tx, {
      agent: new Agent(APPVIEW),
      postUrl: POST_URL
    });

    expect(result).toEqual({
      data: [
        {
          did: 'did:plc:blueskyactor00000000000003',
          handle: 'actor-3.bsky.social',
          displayName: 'Actor 3',
          avatar:
            'https://cdn.bsky.app/img/avatar/plain/did:plc:blueskyactor00000000000003/bafkreiavatar3@jpeg'
        },
        {
          did: 'did:plc:blueskyactor00000000000004',
          handle: 'actor-4.bsky.social',
          displayName: undefined,
          avatar:
            'https://cdn.bsky.app/img/avatar/plain/did:plc:blueskyactor00000000000004/bafkreiavatar4@jpeg'
        }
      ],
      cursor: '3lrepostcursor'
    });
  });
});
