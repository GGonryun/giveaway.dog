import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchCall,
  jsonResponse
} from '@giveaway/testing-server/fixtures-integrations-utils';
import { scrapeBadgerUserSchema } from '../../schemas';
import { scrapeBadgerUserResponse } from '../../testing/fixtures-scrapebadger';
import { getUser } from '../get-user';

const fetchMock = vi.fn();

describe('ScrapeBadger users.getByUsername contract', () => {
  beforeEach(() => {
    vi.stubEnv('SCRAPEBADGER_API_KEY', 'sb-key');
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(console, 'info').mockImplementation(() => {});
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(jsonResponse(scrapeBadgerUserResponse));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('parses the recorded response with the schema that getUser uses', () => {
    expect(() =>
      scrapeBadgerUserSchema.parse(scrapeBadgerUserResponse)
    ).not.toThrow();
  });

  it('requests the user from the ScrapeBadger API with the API key', async () => {
    await getUser({ username: 'TheGiveawayDog' });

    const { url, init } = fetchCall(fetchMock);
    expect(url).toBe(
      'https://scrapebadger.com/v1/twitter/users/TheGiveawayDog/by_username'
    );
    expect(init.method).toBe('GET');
    expect(init.headers).toMatchObject({ 'X-API-Key': 'sb-key' });
  });

  it('returns the fields of the recorded user that the app reads', async () => {
    await expect(getUser({ username: 'TheGiveawayDog' })).resolves.toEqual({
      id: '1701234567890123456',
      username: 'TheGiveawayDog',
      name: 'Giveaway Dog',
      description:
        'Host giveaways and raffles on X, Discord, Twitch and Bluesky.',
      location: null,
      url: 'https://t.co/GhIjKl5678',
      profile_image_url:
        'https://pbs.twimg.com/profile_images/1701234567890123456/AbCdEfGh_normal.jpg',
      profile_banner_url:
        'https://pbs.twimg.com/profile_banners/1701234567890123456/1694543400',
      followers_count: 1204,
      following_count: 87,
      tweet_count: 342,
      verified: false,
      verified_type: null,
      is_blue_verified: true,
      created_at: '2023-09-12T18:30:00Z',
      can_dm: true
    });
  });
});
