import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { getDisqualificationReason, selectRandomUnique } from '../picker-utils';

describe('selectRandomUnique', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('with a deterministic random source', () => {
    it('keeps the original order when random always picks the current index', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.9999);

      expect(selectRandomUnique(['a', 'b', 'c', 'd'], 4)).toEqual([
        'a',
        'b',
        'c',
        'd'
      ]);
    });

    it('rotates elements when random always picks the first index', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0);

      expect(selectRandomUnique(['a', 'b', 'c'], 3)).toEqual(['b', 'c', 'a']);
    });

    it('draws one random number per element after the first', () => {
      const random = vi.spyOn(Math, 'random').mockReturnValue(0.5);

      selectRandomUnique([1, 2, 3, 4, 5], 2);

      expect(random).toHaveBeenCalledTimes(4);
    });

    it('returns the first count elements of the shuffle', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.9999);

      expect(selectRandomUnique(['a', 'b', 'c', 'd'], 2)).toEqual(['a', 'b']);
    });
  });

  describe('with a real random source', () => {
    it('returns unique elements taken from the input', () => {
      const input = Array.from({ length: 50 }, (_, i) => i);

      const result = selectRandomUnique(input, 10);

      expect(result).toHaveLength(10);
      expect(new Set(result).size).toBe(10);
      for (const value of result) {
        expect(input).toContain(value);
      }
    });

    it('does not mutate the input array', () => {
      const input = [1, 2, 3, 4, 5];

      selectRandomUnique(input, 3);

      expect(input).toEqual([1, 2, 3, 4, 5]);
    });

    it('returns every element when count exceeds the array length', () => {
      const result = selectRandomUnique([1, 2, 3], 10);

      expect([...result].sort()).toEqual([1, 2, 3]);
    });
  });

  describe('at the boundaries', () => {
    it('returns an empty array for an empty input', () => {
      expect(selectRandomUnique([], 3)).toEqual([]);
    });

    it('returns an empty array for a count of zero', () => {
      expect(selectRandomUnique([1, 2, 3], 0)).toEqual([]);
    });

    it('drops the last shuffled element for a count of -1', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.9999);

      expect(selectRandomUnique([1, 2, 3], -1)).toEqual([1, 2]);
    });

    it('does not call random for a single element', () => {
      const random = vi.spyOn(Math, 'random');

      expect(selectRandomUnique(['only'], 1)).toEqual(['only']);
      expect(random).not.toHaveBeenCalled();
    });
  });
});

describe('getDisqualificationReason', () => {
  const NOW = new Date('2025-06-15T12:00:00.000Z');
  const daysAgo = (days: number) =>
    new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000);

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('when the picker has no requirements', () => {
    it('returns undefined for an empty user', () => {
      expect(getDisqualificationReason({}, {})).toBeUndefined();
    });

    it('returns undefined when every requirement is null', () => {
      expect(
        getDisqualificationReason(
          {},
          {
            minPostCount: null,
            minFollowersCount: null,
            minFollowingCount: null,
            minAccountAgeDays: null,
            requireProfileImage: null,
            requireBannerImage: null,
            requireLocation: null,
            requireBio: null
          }
        )
      ).toBeUndefined();
    });
  });

  describe('minimum post count', () => {
    it('disqualifies a user below the minimum', () => {
      expect(
        getDisqualificationReason({ tweetCount: 9 }, { minPostCount: 10 })
      ).toBe('Minimum 10 posts required');
    });

    it('accepts a user exactly at the minimum', () => {
      expect(
        getDisqualificationReason({ tweetCount: 10 }, { minPostCount: 10 })
      ).toBeUndefined();
    });

    it('treats a missing post count as zero', () => {
      expect(getDisqualificationReason({}, { minPostCount: 1 })).toBe(
        'Minimum 1 posts required'
      );
    });

    it('treats a null post count as zero', () => {
      expect(
        getDisqualificationReason({ tweetCount: null }, { minPostCount: 1 })
      ).toBe('Minimum 1 posts required');
    });

    it('accepts a missing post count when the minimum is zero', () => {
      expect(
        getDisqualificationReason({}, { minPostCount: 0 })
      ).toBeUndefined();
    });
  });

  describe('minimum followers', () => {
    it('disqualifies a user below the minimum', () => {
      expect(
        getDisqualificationReason(
          { followersCount: 49 },
          { minFollowersCount: 50 }
        )
      ).toBe('Minimum 50 followers required');
    });

    it('accepts a user exactly at the minimum', () => {
      expect(
        getDisqualificationReason(
          { followersCount: 50 },
          { minFollowersCount: 50 }
        )
      ).toBeUndefined();
    });

    it('treats a missing followers count as zero', () => {
      expect(getDisqualificationReason({}, { minFollowersCount: 1 })).toBe(
        'Minimum 1 followers required'
      );
    });
  });

  describe('minimum following', () => {
    it('disqualifies a user below the minimum', () => {
      expect(
        getDisqualificationReason(
          { followingCount: 19 },
          { minFollowingCount: 20 }
        )
      ).toBe('Minimum 20 following required');
    });

    it('accepts a user exactly at the minimum', () => {
      expect(
        getDisqualificationReason(
          { followingCount: 20 },
          { minFollowingCount: 20 }
        )
      ).toBeUndefined();
    });

    it('treats a missing following count as zero', () => {
      expect(getDisqualificationReason({}, { minFollowingCount: 1 })).toBe(
        'Minimum 1 following required'
      );
    });
  });

  describe('minimum account age', () => {
    it('disqualifies an account younger than the minimum', () => {
      expect(
        getDisqualificationReason(
          { createdAt: daysAgo(29) },
          { minAccountAgeDays: 30 }
        )
      ).toBe('Account must be at least 30 days old');
    });

    it('accepts an account exactly the minimum age', () => {
      expect(
        getDisqualificationReason(
          { createdAt: daysAgo(30) },
          { minAccountAgeDays: 30 }
        )
      ).toBeUndefined();
    });

    it('rounds partial days down', () => {
      expect(
        getDisqualificationReason(
          { createdAt: daysAgo(29.99) },
          { minAccountAgeDays: 30 }
        )
      ).toBe('Account must be at least 30 days old');
    });

    it('parses an ISO string creation date', () => {
      expect(
        getDisqualificationReason(
          { createdAt: daysAgo(5).toISOString() },
          { minAccountAgeDays: 30 }
        )
      ).toBe('Account must be at least 30 days old');
    });

    it('accepts an old enough ISO string creation date', () => {
      expect(
        getDisqualificationReason(
          { createdAt: daysAgo(45).toISOString() },
          { minAccountAgeDays: 30 }
        )
      ).toBeUndefined();
    });

    it('skips the check when the creation date is missing', () => {
      expect(
        getDisqualificationReason({}, { minAccountAgeDays: 30 })
      ).toBeUndefined();
    });

    it('skips the check when the creation date is null', () => {
      expect(
        getDisqualificationReason(
          { createdAt: null },
          { minAccountAgeDays: 30 }
        )
      ).toBeUndefined();
    });

    it('skips the check when the creation date is an empty string', () => {
      expect(
        getDisqualificationReason({ createdAt: '' }, { minAccountAgeDays: 30 })
      ).toBeUndefined();
    });

    it('accepts an unparseable creation date string', () => {
      expect(
        getDisqualificationReason(
          { createdAt: 'not-a-date' },
          { minAccountAgeDays: 30 }
        )
      ).toBeUndefined();
    });

    it('disqualifies an account created in the future even when the minimum is zero', () => {
      expect(
        getDisqualificationReason(
          { createdAt: daysAgo(-2) },
          { minAccountAgeDays: 0 }
        )
      ).toBe('Account must be at least 0 days old');
    });
  });

  describe('profile requirements', () => {
    it('requires a profile image', () => {
      expect(
        getDisqualificationReason(
          { profileImageUrl: null },
          { requireProfileImage: true }
        )
      ).toBe('Profile image required');
    });

    it('treats an empty profile image url as missing', () => {
      expect(
        getDisqualificationReason(
          { profileImageUrl: '' },
          { requireProfileImage: true }
        )
      ).toBe('Profile image required');
    });

    it('requires a banner image', () => {
      expect(getDisqualificationReason({}, { requireBannerImage: true })).toBe(
        'Banner image required'
      );
    });

    it('requires a location', () => {
      expect(getDisqualificationReason({}, { requireLocation: true })).toBe(
        'Location required'
      );
    });

    it('requires a bio', () => {
      expect(getDisqualificationReason({}, { requireBio: true })).toBe(
        'Bio required'
      );
    });

    it('treats an empty banner image url as missing', () => {
      expect(
        getDisqualificationReason(
          { bannerImageUrl: '' },
          { requireBannerImage: true }
        )
      ).toBe('Banner image required');
    });

    it('treats an empty location as missing', () => {
      expect(
        getDisqualificationReason({ location: '' }, { requireLocation: true })
      ).toBe('Location required');
    });

    it('treats an empty bio as missing', () => {
      expect(
        getDisqualificationReason({ description: '' }, { requireBio: true })
      ).toBe('Bio required');
    });

    it('accepts a user with every profile field when all are required', () => {
      expect(
        getDisqualificationReason(
          {
            profileImageUrl: 'https://img/p.png',
            bannerImageUrl: 'https://img/b.png',
            location: 'Dogtown',
            description: 'Woof'
          },
          {
            requireProfileImage: true,
            requireBannerImage: true,
            requireLocation: true,
            requireBio: true
          }
        )
      ).toBeUndefined();
    });

    it('ignores missing fields when the requirements are false', () => {
      expect(
        getDisqualificationReason(
          {},
          {
            requireProfileImage: false,
            requireBannerImage: false,
            requireLocation: false,
            requireBio: false
          }
        )
      ).toBeUndefined();
    });
  });

  describe('rule precedence', () => {
    const failsEverything = {
      tweetCount: 0,
      followersCount: 0,
      followingCount: 0,
      createdAt: daysAgo(0),
      profileImageUrl: null,
      bannerImageUrl: null,
      location: null,
      description: null
    };
    const allRules = {
      minPostCount: 1,
      minFollowersCount: 1,
      minFollowingCount: 1,
      minAccountAgeDays: 1,
      requireProfileImage: true,
      requireBannerImage: true,
      requireLocation: true,
      requireBio: true
    };

    it.each([
      [{}, 'Minimum 1 posts required'],
      [{ minPostCount: null }, 'Minimum 1 followers required'],
      [
        { minPostCount: null, minFollowersCount: null },
        'Minimum 1 following required'
      ],
      [
        {
          minPostCount: null,
          minFollowersCount: null,
          minFollowingCount: null
        },
        'Account must be at least 1 days old'
      ],
      [
        {
          minPostCount: null,
          minFollowersCount: null,
          minFollowingCount: null,
          minAccountAgeDays: null
        },
        'Profile image required'
      ],
      [
        {
          minPostCount: null,
          minFollowersCount: null,
          minFollowingCount: null,
          minAccountAgeDays: null,
          requireProfileImage: false
        },
        'Banner image required'
      ],
      [
        {
          minPostCount: null,
          minFollowersCount: null,
          minFollowingCount: null,
          minAccountAgeDays: null,
          requireProfileImage: false,
          requireBannerImage: false
        },
        'Location required'
      ],
      [
        {
          minPostCount: null,
          minFollowersCount: null,
          minFollowingCount: null,
          minAccountAgeDays: null,
          requireProfileImage: false,
          requireBannerImage: false,
          requireLocation: false
        },
        'Bio required'
      ]
    ])(
      'reports the first failing rule (disabled: %j)',
      (disabled, expected) => {
        expect(
          getDisqualificationReason(failsEverything, {
            ...allRules,
            ...disabled
          })
        ).toBe(expected);
      }
    );
  });
});
