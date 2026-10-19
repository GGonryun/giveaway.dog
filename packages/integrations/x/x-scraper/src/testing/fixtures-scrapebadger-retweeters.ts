const retweeter = (index: number, overrides: Record<string, unknown> = {}) => ({
  id: `16000000000000000${String(index).padStart(2, '0')}`,
  username: `retweeter_${index}`,
  name: `Retweeter ${index}`,
  description: index % 2 === 0 ? `Bio of retweeter ${index}` : '',
  location: null,
  url: null,
  profile_image_url: `https://pbs.twimg.com/profile_images/16000000000000000${String(index).padStart(2, '0')}/avatar_normal.jpg`,
  profile_banner_url: null,
  followers_count: index * 10,
  following_count: index * 5,
  tweet_count: index * 20,
  listed_count: 0,
  favourites_count: index * 3,
  media_count: 0,
  verified: false,
  verified_type: null,
  is_blue_verified: false,
  created_at: '2021-06-15T08:00:00.000Z',
  default_profile: true,
  default_profile_image: false,
  protected: false,
  can_dm: false,
  ...overrides
});

export const scrapeBadgerRetweetersFixture = {
  data: [
    retweeter(1),
    retweeter(2),
    retweeter(3, { profile_image_url: null, default_profile_image: true })
  ],
  next_cursor: 'DAABCgABGcretweeters0001'
};

export const scrapeBadgerLastRetweetersFixture = {
  data: [retweeter(4)],
  next_cursor: null
};
