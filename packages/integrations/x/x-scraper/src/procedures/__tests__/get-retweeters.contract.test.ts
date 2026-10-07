import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';
import { jsonResponse } from '@giveaway/testing-server/fixtures-integrations-utils';
import { scrapeBadgerUserSchema } from '../../schemas';
import { scrapeBadgerRetweetersResponse } from '../../testing/fixtures-scrapebadger';
import { toTwitterPickerUsers, toTwitterUserSchema } from '../../utils';
import { getRetweeters, getRetweetersUntil } from '../get-retweeters';

const fetchMock = vi.fn();

const RECORDED_CURSOR = 'DAABCgABG7TBuVb__-sKAAIbtMG5Vv__6wgAAwAAAAEAAA';

const RETWEETERS = [
  {
    id: '1000000000000000001',
    username: 'retweeter_1',
    name: 'Retweeter 1',
    description: 'Bio of retweeter 1',
    location: 'Location 1',
    url: 'https://example.com/retweeter_1',
    profile_image_url: 'https://example.com/retweeter_1/profile.jpg',
    profile_banner_url: 'https://example.com/retweeter_1/banner.jpg',
    followers_count: 523,
    following_count: 311,
    tweet_count: 4120,
    verified: false,
    verified_type: null,
    is_blue_verified: false,
    created_at: '2019-04-02T08:15:00Z',
    can_dm: false
  },
  {
    id: '1000000000000000002',
    username: 'retweeter_2',
    name: 'Retweeter 2',
    description: '',
    location: '',
    url: null,
    profile_image_url: 'https://example.com/retweeter_2/profile.jpg',
    profile_banner_url: null,
    followers_count: 12,
    following_count: 98,
    tweet_count: 37,
    verified: false,
    verified_type: null,
    is_blue_verified: false,
    created_at: '2025-12-30T21:04:00Z',
    can_dm: true
  },
  {
    id: '1000000000000000003',
    username: 'retweeter_3',
    name: 'Retweeter 3',
    description: null,
    location: null,
    url: null,
    profile_image_url: null,
    profile_banner_url: null,
    followers_count: null,
    following_count: null,
    tweet_count: null,
    verified: true,
    verified_type: 'Business',
    is_blue_verified: null,
    created_at: null,
    can_dm: null
  }
];

const requestedUrls = () =>
  fetchMock.mock.calls.map(([url]) => decodeURIComponent(String(url)));

describe('ScrapeBadger tweets.getRetweeters contract', () => {
  beforeEach(() => {
    vi.stubEnv('SCRAPEBADGER_API_KEY', 'sb-key');
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(console, 'info').mockImplementation(() => {});
    fetchMock.mockReset();
    fetchMock.mockImplementation(async () =>
      jsonResponse(scrapeBadgerRetweetersResponse)
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('parses each recorded retweeter with the schema that the retweeter procedures use', () => {
    expect(() =>
      z.array(scrapeBadgerUserSchema).parse(scrapeBadgerRetweetersResponse.data)
    ).not.toThrow();
  });

  it('returns a page of the recorded retweeters with the cursor of the next page', async () => {
    const page = await getRetweeters({ tweetId: '1975236458112819456' });

    expect(requestedUrls()).toEqual([
      'https://scrapebadger.com/v1/twitter/tweets/tweet/1975236458112819456/retweeters'
    ]);
    expect(page).toEqual({
      data: RETWEETERS,
      nextCursor: RECORDED_CURSOR,
      hasMore: true
    });
  });

  it('follows the recorded cursor until a page has none', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(scrapeBadgerRetweetersResponse))
      .mockResolvedValueOnce(
        jsonResponse({ ...scrapeBadgerRetweetersResponse, next_cursor: null })
      );

    const result = await getRetweetersUntil({
      tweetId: '1975236458112819456'
    });

    expect(requestedUrls()).toEqual([
      'https://scrapebadger.com/v1/twitter/tweets/tweet/1975236458112819456/retweeters',
      `https://scrapebadger.com/v1/twitter/tweets/tweet/1975236458112819456/retweeters?cursor=${RECORDED_CURSOR}`
    ]);
    expect(result).toEqual({
      users: [...RETWEETERS, ...RETWEETERS],
      nextCursor: undefined,
      hasMore: false
    });
  });

  it('maps the recorded retweeters to picker users', async () => {
    const { data } = await getRetweeters({ tweetId: '1975236458112819456' });

    expect(
      toTwitterPickerUsers({ pickerId: 'picker-1', users: data.slice(0, 2) })
    ).toEqual([
      {
        pickerId: 'picker-1',
        userId: '1000000000000000001',
        username: 'retweeter_1',
        name: 'Retweeter 1',
        description: 'Bio of retweeter 1',
        url: 'https://example.com/retweeter_1',
        location: 'Location 1',
        profileImageUrl: 'https://example.com/retweeter_1/profile.jpg',
        bannerImageUrl: 'https://example.com/retweeter_1/banner.jpg',
        createdAt: new Date('2019-04-02T08:15:00Z'),
        canDm: false,
        followersCount: 523,
        followingCount: 311,
        tweetCount: 4120,
        verified: false
      },
      {
        pickerId: 'picker-1',
        userId: '1000000000000000002',
        username: 'retweeter_2',
        name: 'Retweeter 2',
        description: '',
        url: null,
        location: '',
        profileImageUrl: 'https://example.com/retweeter_2/profile.jpg',
        bannerImageUrl: null,
        createdAt: new Date('2025-12-30T21:04:00Z'),
        canDm: true,
        followersCount: 12,
        followingCount: 98,
        tweetCount: 37,
        verified: false
      }
    ]);
  });

  it('maps the recorded retweeters to imported X users', async () => {
    const { data } = await getRetweeters({ tweetId: '1975236458112819456' });

    expect(toTwitterUserSchema(data[0])).toEqual({
      id: '1000000000000000001',
      name: 'Retweeter 1',
      username: 'retweeter_1',
      created_at: new Date('2019-04-02T08:15:00Z'),
      description: 'Bio of retweeter 1',
      location: 'Location 1',
      profile_image_url: 'https://example.com/retweeter_1/profile.jpg',
      profile_banner_url: 'https://example.com/retweeter_1/banner.jpg',
      protected: false,
      verified: false,
      verified_type: undefined,
      public_metrics: {
        followers_count: 523,
        following_count: 311,
        tweet_count: 4120
      }
    });
  });
});
