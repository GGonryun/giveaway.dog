import { describe, it, expect } from 'vitest';
import {
  calculateTwitterV2PickerStats,
  twitterPostSchema,
  twitterV2PickerDrawSchema,
  twitterV2PickerSchema,
  twitterV2PickerStatsSchema,
  twitterV2PickerUserSchema,
  type TwitterPostSchema,
  type TwitterV2PickerUserSchema
} from '../details';

const without = <T extends object>(value: T, key: keyof T): Partial<T> => {
  const copy: Partial<T> = { ...value };
  delete copy[key];
  return copy;
};

const post = (
  overrides: Partial<TwitterPostSchema> = {}
): TwitterPostSchema => ({
  id: 'post-1',
  tweetId: '1111',
  text: 'Retweet to win!',
  createdAt: new Date('2025-01-01T00:00:00.000Z'),
  userId: 'author-1',
  username: 'doglover',
  favoriteCount: 1,
  retweetCount: 100,
  replyCount: 2,
  viewCount: 3,
  quoteCount: 4,
  ...overrides
});

const user = (
  overrides: Partial<TwitterV2PickerUserSchema> = {}
): TwitterV2PickerUserSchema => ({
  id: 'pu-1',
  userId: 'x-1',
  username: 'doglover',
  name: 'Dog Lover',
  description: null,
  url: null,
  location: null,
  profileImageUrl: null,
  bannerImageUrl: null,
  createdAt: null,
  canDm: null,
  followersCount: null,
  followingCount: null,
  tweetCount: null,
  verified: null,
  ...overrides
});

const draw = {
  id: 'draw-1',
  userId: 'pu-1',
  disqualified: null,
  createdAt: '2025-02-01T00:00:00.000Z',
  updatedAt: '2025-02-02T00:00:00.000Z'
};

const picker = {
  id: 'picker-1',
  runId: null,
  teamId: 'team-1',
  tweetUrls: ['https://x.com/doglover/status/1111'],
  status: 'COMPLETE',
  winners: 1,
  minPostCount: null,
  minAccountAgeDays: null,
  minFollowersCount: null,
  minFollowingCount: null,
  requireProfileImage: null,
  requireBannerImage: null,
  requireLocation: null,
  requireBio: null,
  runAt: null,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-02T00:00:00.000Z',
  users: [],
  draws: [],
  tweets: [],
  stats: {
    totalParticipants: 0,
    sampleSize: 0,
    eligibleInSample: 0,
    estimatedEligible: 0
  }
};

describe('twitterPostSchema', () => {
  it('accepts a post with every nullable field set to null', () => {
    const result = twitterPostSchema.safeParse({
      ...post(),
      text: null,
      userId: null,
      username: null,
      favoriteCount: null,
      retweetCount: null,
      replyCount: null,
      viewCount: null,
      quoteCount: null
    });

    expect(result.success).toBe(true);
  });

  it('coerces a string creation date into a Date', () => {
    const parsed = twitterPostSchema.parse({
      ...post(),
      createdAt: '2025-01-01T00:00:00.000Z'
    });

    expect(parsed.createdAt).toEqual(new Date('2025-01-01T00:00:00.000Z'));
  });

  it('rejects a post without a tweet id', () => {
    expect(
      twitterPostSchema.safeParse(without(post(), 'tweetId')).success
    ).toBe(false);
  });

  it('rejects an invalid creation date', () => {
    expect(
      twitterPostSchema.safeParse({ ...post(), createdAt: 'not-a-date' })
        .success
    ).toBe(false);
  });

  it('rejects a string retweet count', () => {
    expect(
      twitterPostSchema.safeParse({ ...post(), retweetCount: '100' }).success
    ).toBe(false);
  });
});

describe('twitterV2PickerUserSchema', () => {
  it('accepts a user without an ineligibility reason', () => {
    const parsed = twitterV2PickerUserSchema.parse(user());

    expect(parsed.ineligible).toBeUndefined();
  });

  it('keeps an ineligibility reason', () => {
    const parsed = twitterV2PickerUserSchema.parse(
      user({ ineligible: 'Bio required' })
    );

    expect(parsed.ineligible).toBe('Bio required');
  });

  it('coerces a string creation date into a Date', () => {
    const parsed = twitterV2PickerUserSchema.parse({
      ...user(),
      createdAt: '2020-01-01T00:00:00.000Z'
    });

    expect(parsed.createdAt).toEqual(new Date('2020-01-01T00:00:00.000Z'));
  });

  it('keeps a null creation date', () => {
    expect(twitterV2PickerUserSchema.parse(user()).createdAt).toBeNull();
  });

  it('rejects a null ineligibility reason', () => {
    expect(
      twitterV2PickerUserSchema.safeParse({ ...user(), ineligible: null })
        .success
    ).toBe(false);
  });

  it('rejects a user without a userId', () => {
    expect(
      twitterV2PickerUserSchema.safeParse(without(user(), 'userId')).success
    ).toBe(false);
  });
});

describe('twitterV2PickerDrawSchema', () => {
  it('coerces the timestamps into Dates', () => {
    const parsed = twitterV2PickerDrawSchema.parse(draw);

    expect(parsed).toEqual({
      id: 'draw-1',
      userId: 'pu-1',
      disqualified: null,
      createdAt: new Date('2025-02-01T00:00:00.000Z'),
      updatedAt: new Date('2025-02-02T00:00:00.000Z')
    });
  });

  it('keeps a disqualification reason', () => {
    expect(
      twitterV2PickerDrawSchema.parse({ ...draw, disqualified: 'Bot' })
        .disqualified
    ).toBe('Bot');
  });

  it('rejects a draw without a disqualified field', () => {
    expect(
      twitterV2PickerDrawSchema.safeParse(without(draw, 'disqualified')).success
    ).toBe(false);
  });
});

describe('twitterV2PickerStatsSchema', () => {
  it('accepts numeric stats', () => {
    expect(
      twitterV2PickerStatsSchema.safeParse({
        totalParticipants: 10,
        sampleSize: 5,
        eligibleInSample: 3,
        estimatedEligible: 6
      }).success
    ).toBe(true);
  });

  it('rejects missing stats', () => {
    expect(
      twitterV2PickerStatsSchema.safeParse({ totalParticipants: 10 }).success
    ).toBe(false);
  });
});

describe('twitterV2PickerSchema', () => {
  it('accepts a complete picker and coerces its dates', () => {
    const parsed = twitterV2PickerSchema.parse(picker);

    expect(parsed.createdAt).toEqual(new Date('2025-01-01T00:00:00.000Z'));
    expect(parsed.updatedAt).toEqual(new Date('2025-01-02T00:00:00.000Z'));
  });

  it('accepts a picker without a team id', () => {
    expect(
      twitterV2PickerSchema.safeParse(without(picker, 'teamId')).success
    ).toBe(true);
  });

  it('accepts a picker with a null team id', () => {
    expect(
      twitterV2PickerSchema.safeParse({ ...picker, teamId: null }).success
    ).toBe(true);
  });

  it('coerces a scheduled run date', () => {
    const parsed = twitterV2PickerSchema.parse({
      ...picker,
      runAt: '2025-03-01T10:00:00.000Z'
    });

    expect(parsed.runAt).toEqual(new Date('2025-03-01T10:00:00.000Z'));
  });

  it('rejects an unknown status', () => {
    expect(
      twitterV2PickerSchema.safeParse({ ...picker, status: 'DONE' }).success
    ).toBe(false);
  });

  it('rejects a picker without stats', () => {
    expect(
      twitterV2PickerSchema.safeParse(without(picker, 'stats')).success
    ).toBe(false);
  });

  it('rejects a picker with an invalid nested user', () => {
    expect(
      twitterV2PickerSchema.safeParse({ ...picker, users: [{ id: 'x' }] })
        .success
    ).toBe(false);
  });
});

describe('calculateTwitterV2PickerStats', () => {
  describe('for a team picker', () => {
    it('reports actual participant and eligibility counts', () => {
      const stats = calculateTwitterV2PickerStats({
        teamId: 'team-1',
        users: [user(), user({ ineligible: 'Bio required' }), user()],
        tweets: [post({ retweetCount: 1000 })]
      });

      expect(stats).toEqual({
        totalParticipants: 3,
        sampleSize: 3,
        eligibleInSample: 2,
        estimatedEligible: 2
      });
    });

    it('reports zeros when there are no users', () => {
      expect(
        calculateTwitterV2PickerStats({
          teamId: 'team-1',
          users: [],
          tweets: []
        })
      ).toEqual({
        totalParticipants: 0,
        sampleSize: 0,
        eligibleInSample: 0,
        estimatedEligible: 0
      });
    });

    it('treats an empty ineligibility reason as eligible', () => {
      const stats = calculateTwitterV2PickerStats({
        teamId: 'team-1',
        users: [user({ ineligible: '' })],
        tweets: []
      });

      expect(stats.eligibleInSample).toBe(1);
    });
  });

  describe('for a public picker without tweets', () => {
    it('falls back to actual counts', () => {
      expect(
        calculateTwitterV2PickerStats({
          teamId: null,
          users: [user(), user({ ineligible: 'Bio required' })],
          tweets: []
        })
      ).toEqual({
        totalParticipants: 2,
        sampleSize: 2,
        eligibleInSample: 1,
        estimatedEligible: 1
      });
    });
  });

  describe('for a public picker with tweets', () => {
    it('estimates eligibility from the sample and the retweet count', () => {
      expect(
        calculateTwitterV2PickerStats({
          teamId: null,
          users: [user(), user(), user({ ineligible: 'Bio required' })],
          tweets: [post({ retweetCount: 10 })]
        })
      ).toEqual({
        totalParticipants: 10,
        sampleSize: 3,
        eligibleInSample: 2,
        estimatedEligible: 7
      });
    });

    it('rounds the estimate to the nearest whole participant', () => {
      const stats = calculateTwitterV2PickerStats({
        teamId: null,
        users: [user(), user({ ineligible: 'x' }), user({ ineligible: 'x' })],
        tweets: [post({ retweetCount: 10 })]
      });

      expect(stats.estimatedEligible).toBe(3);
    });

    it('uses only the first tweet retweet count', () => {
      const stats = calculateTwitterV2PickerStats({
        teamId: null,
        users: [user()],
        tweets: [post({ retweetCount: 40 }), post({ retweetCount: 1000 })]
      });

      expect(stats.totalParticipants).toBe(40);
      expect(stats.estimatedEligible).toBe(40);
    });

    it('treats a null retweet count as zero', () => {
      expect(
        calculateTwitterV2PickerStats({
          teamId: null,
          users: [user()],
          tweets: [post({ retweetCount: null })]
        })
      ).toEqual({
        totalParticipants: 0,
        sampleSize: 1,
        eligibleInSample: 1,
        estimatedEligible: 0
      });
    });

    it('estimates zero eligible when the sample is empty', () => {
      expect(
        calculateTwitterV2PickerStats({
          teamId: null,
          users: [],
          tweets: [post({ retweetCount: 500 })]
        })
      ).toEqual({
        totalParticipants: 500,
        sampleSize: 0,
        eligibleInSample: 0,
        estimatedEligible: 0
      });
    });

    it('treats an omitted team id as public', () => {
      const stats = calculateTwitterV2PickerStats({
        users: [user()],
        tweets: [post({ retweetCount: 25 })]
      });

      expect(stats.totalParticipants).toBe(25);
    });

    it('treats an empty team id as public', () => {
      const stats = calculateTwitterV2PickerStats({
        teamId: '',
        users: [user()],
        tweets: [post({ retweetCount: 25 })]
      });

      expect(stats.totalParticipants).toBe(25);
    });
  });
});
