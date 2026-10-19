import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeNetwork } from '@giveaway/testing-server/faults';
import { getUser } from '../get-user';
import { scrapeBadgerUserSchema } from '../../schemas';
import { toTwitterUserSchema } from '../../utils';
import { scrapeBadgerUserFixture } from '../../testing/fixtures-scrapebadger-user';

const URL = `https://scrapebadger.com/v1/twitter/users/${scrapeBadgerUserFixture.username}/by_username`;

describe('ScrapeBadger user contract', () => {
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

  it('parses the recorded user with the schema of the app', () => {
    expect(scrapeBadgerUserSchema.safeParse(scrapeBadgerUserFixture)).toEqual(
      expect.objectContaining({ success: true })
    );
  });

  it('turns the recorded user into the X user of the app', async () => {
    const network = fakeNetwork();
    network.json(URL, scrapeBadgerUserFixture);

    const user = await getUser({ username: scrapeBadgerUserFixture.username });

    expect(toTwitterUserSchema(user)).toEqual(
      expect.objectContaining({
        id: '1500000000000000001',
        name: 'Acme Giveaways',
        username: 'acme_giveaways',
        created_at: new Date('2022-03-01T12:00:00.000Z'),
        description: 'Weekly giveaways for the Acme community',
        profile_image_url:
          'https://pbs.twimg.com/profile_images/1500000000000000001/acme_normal.jpg',
        verified: false,
        public_metrics: {
          followers_count: 1520,
          following_count: 310,
          tweet_count: 842
        }
      })
    );
  });

  it('rejects a user without a username', async () => {
    const { username, ...rest } = scrapeBadgerUserFixture;
    const network = fakeNetwork();
    network.json(URL, rest);

    await expect(getUser({ username })).rejects.toMatchObject({
      code: 'BAD_GATEWAY',
      message: 'Invalid ScrapeBadger user response'
    });
  });
});
