import {
  PickerStatus,
  TeamRole,
  TeamTier,
  type TwitterPicker,
  type TwitterPickerDraw,
  type TwitterPickerUser,
  type TwitterPost
} from '@prisma/client';
import { TEST_USER } from '@giveaway/testing-server/session';

export const NOW = new Date('2025-06-15T12:00:00.000Z');

export const daysBeforeNow = (days: number) =>
  new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000);

export const buildPicker = (
  overrides: Partial<TwitterPicker> = {}
): TwitterPicker => ({
  id: 'picker-1',
  runId: null,
  teamId: 'team-1',
  tweetUrls: ['https://x.com/doglover/status/1111'],
  minPostCount: null,
  minAccountAgeDays: null,
  minFollowersCount: null,
  minFollowingCount: null,
  requireProfileImage: null,
  requireBannerImage: null,
  requireLocation: null,
  requireBio: null,
  lastPostWithin: null,
  runAt: null,
  status: PickerStatus.COMPLETE,
  winners: 1,
  createdAt: new Date('2025-01-01T00:00:00.000Z'),
  updatedAt: new Date('2025-01-02T00:00:00.000Z'),
  ...overrides
});

export const buildPickerUser = (
  overrides: Partial<TwitterPickerUser> = {}
): TwitterPickerUser => ({
  id: 'pu-1',
  pickerId: 'picker-1',
  userId: 'x-user-1',
  username: 'doglover',
  name: 'Dog Lover',
  description: 'I love dogs',
  url: null,
  location: 'Dogtown',
  profileImageUrl: 'https://pbs.twimg.com/profile.png',
  bannerImageUrl: 'https://pbs.twimg.com/banner.png',
  createdAt: new Date('2020-01-01T00:00:00.000Z'),
  canDm: true,
  followersCount: 500,
  followingCount: 300,
  tweetCount: 1000,
  verified: false,
  ...overrides
});

export const buildDraw = (
  overrides: Partial<TwitterPickerDraw> = {}
): TwitterPickerDraw => ({
  id: 'draw-1',
  pickerId: 'picker-1',
  userId: 'pu-1',
  disqualified: null,
  createdAt: new Date('2025-02-01T00:00:00.000Z'),
  updatedAt: new Date('2025-02-01T00:00:00.000Z'),
  ...overrides
});

export const buildPost = (
  overrides: Partial<TwitterPost> = {}
): TwitterPost => ({
  id: 'post-1',
  tweetId: '1111',
  text: 'Retweet to win!',
  createdAt: new Date('2025-01-01T00:00:00.000Z'),
  userId: 'author-1',
  username: 'doglover',
  favoriteCount: 10,
  retweetCount: 100,
  replyCount: 5,
  viewCount: 1000,
  quoteCount: 2,
  pickerId: 'picker-1',
  ...overrides
});

export const buildTeam = ({
  tier = TeamTier.PRO,
  role = TeamRole.OWNER,
  userId = TEST_USER.id
}: {
  tier?: TeamTier;
  role?: TeamRole;
  userId?: string;
} = {}) => ({
  id: 'team-1',
  name: 'Acme',
  slug: 'acme',
  tier,
  members: [{ id: 'membership-1', userId, teamId: 'team-1', role }]
});

export const buildFormInput = () => ({
  setup: {
    postUrls: [{ url: 'https://x.com/doglover/status/1111' }]
  },
  actions: { repost: true, reply: false },
  timing: null,
  winners: { quota: 2 },
  filters: {
    minimumPostCount: 10,
    minimumAccountAgeDays: 30,
    minimumFollowers: 50,
    minimumFollowing: 20,
    lastPostWithin: 'PAST_WEEK' as const,
    hasProfileImage: true,
    hasBanner: false,
    hasLocation: true,
    hasDescription: false
  }
});

export type DisqualificationCase = {
  name: string;
  picker: Partial<TwitterPicker>;
  user: Partial<TwitterPickerUser>;
  reason: string | undefined;
};

export const DISQUALIFICATION_CASES: DisqualificationCase[] = [
  {
    name: 'eligible when the picker has no requirements',
    picker: {},
    user: {
      tweetCount: null,
      followersCount: null,
      followingCount: null,
      profileImageUrl: null,
      bannerImageUrl: null,
      location: null,
      description: null,
      createdAt: null
    },
    reason: undefined
  },
  {
    name: 'too few posts',
    picker: { minPostCount: 100 },
    user: { tweetCount: 99 },
    reason: 'Minimum 100 posts required'
  },
  {
    name: 'a null post count counted as zero',
    picker: { minPostCount: 1 },
    user: { tweetCount: null },
    reason: 'Minimum 1 posts required'
  },
  {
    name: 'a post count equal to the minimum',
    picker: { minPostCount: 100 },
    user: { tweetCount: 100 },
    reason: undefined
  },
  {
    name: 'a minimum post count of zero with a null post count',
    picker: { minPostCount: 0 },
    user: { tweetCount: null },
    reason: undefined
  },
  {
    name: 'too few followers',
    picker: { minFollowersCount: 50 },
    user: { followersCount: 49 },
    reason: 'Minimum 50 followers required'
  },
  {
    name: 'a null followers count counted as zero',
    picker: { minFollowersCount: 1 },
    user: { followersCount: null },
    reason: 'Minimum 1 followers required'
  },
  {
    name: 'a followers count equal to the minimum',
    picker: { minFollowersCount: 50 },
    user: { followersCount: 50 },
    reason: undefined
  },
  {
    name: 'too few following',
    picker: { minFollowingCount: 20 },
    user: { followingCount: 19 },
    reason: 'Minimum 20 following required'
  },
  {
    name: 'a null following count counted as zero',
    picker: { minFollowingCount: 1 },
    user: { followingCount: null },
    reason: 'Minimum 1 following required'
  },
  {
    name: 'a following count equal to the minimum',
    picker: { minFollowingCount: 20 },
    user: { followingCount: 20 },
    reason: undefined
  },
  {
    name: 'an account younger than the minimum age',
    picker: { minAccountAgeDays: 30 },
    user: { createdAt: daysBeforeNow(29) },
    reason: 'Account must be at least 30 days old'
  },
  {
    name: 'an account exactly the minimum age',
    picker: { minAccountAgeDays: 30 },
    user: { createdAt: daysBeforeNow(30) },
    reason: undefined
  },
  {
    name: 'an account age that rounds down to below the minimum',
    picker: { minAccountAgeDays: 30 },
    user: { createdAt: daysBeforeNow(29.99) },
    reason: 'Account must be at least 30 days old'
  },
  {
    name: 'an unknown account creation date skipping the age check',
    picker: { minAccountAgeDays: 30 },
    user: { createdAt: null },
    reason: undefined
  },
  {
    name: 'a missing profile image',
    picker: { requireProfileImage: true },
    user: { profileImageUrl: null },
    reason: 'Profile image required'
  },
  {
    name: 'an empty profile image url',
    picker: { requireProfileImage: true },
    user: { profileImageUrl: '' },
    reason: 'Profile image required'
  },
  {
    name: 'a missing banner image',
    picker: { requireBannerImage: true },
    user: { bannerImageUrl: null },
    reason: 'Banner image required'
  },
  {
    name: 'an empty banner image url',
    picker: { requireBannerImage: true },
    user: { bannerImageUrl: '' },
    reason: 'Banner image required'
  },
  {
    name: 'a missing location',
    picker: { requireLocation: true },
    user: { location: null },
    reason: 'Location required'
  },
  {
    name: 'an empty location',
    picker: { requireLocation: true },
    user: { location: '' },
    reason: 'Location required'
  },
  {
    name: 'a missing bio',
    picker: { requireBio: true },
    user: { description: null },
    reason: 'Bio required'
  },
  {
    name: 'an empty bio',
    picker: { requireBio: true },
    user: { description: '' },
    reason: 'Bio required'
  },
  {
    name: 'requirements explicitly disabled',
    picker: {
      requireProfileImage: false,
      requireBannerImage: false,
      requireLocation: false,
      requireBio: false
    },
    user: {
      profileImageUrl: null,
      bannerImageUrl: null,
      location: null,
      description: null
    },
    reason: undefined
  },
  {
    name: 'the post count rule reported before the follower rule',
    picker: { minPostCount: 10, minFollowersCount: 10 },
    user: { tweetCount: 0, followersCount: 0 },
    reason: 'Minimum 10 posts required'
  },
  {
    name: 'the follower rule reported before the following rule',
    picker: { minFollowersCount: 10, minFollowingCount: 10 },
    user: { followersCount: 0, followingCount: 0 },
    reason: 'Minimum 10 followers required'
  },
  {
    name: 'the following rule reported before the account age rule',
    picker: { minFollowingCount: 10, minAccountAgeDays: 30 },
    user: { followingCount: 0, createdAt: daysBeforeNow(1) },
    reason: 'Minimum 10 following required'
  },
  {
    name: 'the account age rule reported before the profile image rule',
    picker: { minAccountAgeDays: 30, requireProfileImage: true },
    user: { createdAt: daysBeforeNow(1), profileImageUrl: null },
    reason: 'Account must be at least 30 days old'
  },
  {
    name: 'the profile image rule reported before the banner rule',
    picker: { requireProfileImage: true, requireBannerImage: true },
    user: { profileImageUrl: null, bannerImageUrl: null },
    reason: 'Profile image required'
  },
  {
    name: 'the banner rule reported before the location rule',
    picker: { requireBannerImage: true, requireLocation: true },
    user: { bannerImageUrl: null, location: null },
    reason: 'Banner image required'
  },
  {
    name: 'the location rule reported before the bio rule',
    picker: { requireLocation: true, requireBio: true },
    user: { location: null, description: null },
    reason: 'Location required'
  },
  {
    name: 'a user meeting every requirement',
    picker: {
      minPostCount: 100,
      minFollowersCount: 100,
      minFollowingCount: 100,
      minAccountAgeDays: 365,
      requireProfileImage: true,
      requireBannerImage: true,
      requireLocation: true,
      requireBio: true
    },
    user: {},
    reason: undefined
  }
];
