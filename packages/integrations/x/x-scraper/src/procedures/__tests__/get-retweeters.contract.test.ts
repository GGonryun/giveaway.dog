import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeNetwork } from '@giveaway/testing-server/faults';
import { getAllRetweeters, getRetweeters } from '../get-retweeters';
import { scrapeBadgerRetweetersSchema } from '../../schemas';
import { toTwitterPickerUsers } from '../../utils';
import {
  scrapeBadgerLastRetweetersFixture,
  scrapeBadgerRetweetersFixture
} from '../../testing/fixtures-scrapebadger-retweeters';

const TWEET_ID = '1900000000000000001';

const URL = `https://scrapebadger.com/v1/twitter/tweets/tweet/${TWEET_ID}/retweeters`;

describe('ScrapeBadger retweeters contract', () => {
  beforeEach(() => {
    vi.stubEnv('SCRAPEBADGER_API_KEY', 'sb-key');
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('parses the recorded pages with the schema of the app', () => {
    for (const page of [
      scrapeBadgerRetweetersFixture,
      scrapeBadgerLastRetweetersFixture
    ]) {
      expect(scrapeBadgerRetweetersSchema.safeParse(page)).toEqual(
        expect.objectContaining({ success: true })
      );
    }
  });

  it('reads the users and the cursor of a recorded page', async () => {
    const network = fakeNetwork();
    network.json(URL, scrapeBadgerRetweetersFixture);

    const page = await getRetweeters({ tweetId: TWEET_ID });

    expect(
      page.data.map((user: { username: string }) => user.username)
    ).toEqual(['retweeter_1', 'retweeter_2', 'retweeter_3']);
    expect(page.nextCursor).toBe('DAABCgABGcretweeters0001');
    expect(page.hasMore).toBe(true);
  });

  it('follows the cursor and turns every recorded retweeter into a picker user', async () => {
    const network = fakeNetwork();
    network.json(URL, scrapeBadgerRetweetersFixture);
    network.json(
      `${URL}?cursor=${scrapeBadgerRetweetersFixture.next_cursor}`,
      scrapeBadgerLastRetweetersFixture
    );

    const users = await getAllRetweeters({ tweetId: TWEET_ID });
    const rows = toTwitterPickerUsers({ pickerId: 'picker-1', users });

    expect(rows.map((row) => row.username)).toEqual([
      'retweeter_1',
      'retweeter_2',
      'retweeter_3',
      'retweeter_4'
    ]);
    expect(rows[0]).toEqual({
      pickerId: 'picker-1',
      userId: '1600000000000000001',
      username: 'retweeter_1',
      name: 'Retweeter 1',
      description: '',
      url: null,
      location: null,
      profileImageUrl:
        'https://pbs.twimg.com/profile_images/1600000000000000001/avatar_normal.jpg',
      bannerImageUrl: null,
      createdAt: new Date('2021-06-15T08:00:00.000Z'),
      canDm: false,
      followersCount: 10,
      followingCount: 5,
      tweetCount: 20,
      verified: false
    });
    expect(rows[2].profileImageUrl).toBeNull();
  });

  it('rejects a page whose users changed shape', async () => {
    const network = fakeNetwork();
    network.json(URL, {
      ...scrapeBadgerRetweetersFixture,
      data: [
        { ...scrapeBadgerRetweetersFixture.data[0], followers_count: null }
      ]
    });

    await expect(getRetweeters({ tweetId: TWEET_ID })).rejects.toMatchObject({
      code: 'BAD_GATEWAY',
      message: 'Invalid ScrapeBadger retweeters response'
    });
  });
});
