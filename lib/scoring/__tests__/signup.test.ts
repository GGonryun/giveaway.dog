import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { computeSignupUserScore } from '../signup';
import { prismaMock, asPrismaClient } from '@/test/prisma';

const NOW = new Date('2026-06-15T12:00:00.000Z');
const DAY_MS = 24 * 60 * 60 * 1000;
const USER_ID = 'user-1';

const SCORE = {
  banned: 10,
  suspicious: 45,
  neutral: 55,
  good: 75,
  trusted: 95
};

type Geo = {
  regionCode: string | null;
  countryCode: string | null;
  continentCode: string | null;
};

type Scenario = {
  emailVerified: Date | null;
  ageInDays: number;
  providers: string[];
  completions: number;
  completionTaskIds?: string[];
  fingerprintCounts: number[];
  fingerprintUsers: string[];
  ipCount: number;
  ipUsers: string[];
  geo?: Geo[];
  turnstile: { success: boolean; score: number | null } | null;
};

const trustedScenario = (): Scenario => ({
  emailVerified: new Date('2026-01-01T00:00:00.000Z'),
  ageInDays: 30,
  providers: ['google', 'discord'],
  completions: 3,
  fingerprintCounts: [10],
  fingerprintUsers: [USER_ID],
  ipCount: 1,
  ipUsers: [USER_ID],
  turnstile: { success: true, score: 1 }
});

const sixPassingScenario = (): Scenario => ({
  ...trustedScenario(),
  turnstile: null
});

const defaultGeo: Geo = {
  regionCode: 'ON',
  countryCode: 'CA',
  continentCode: 'NA'
};

const arrange = (scenario: Scenario) => {
  prismaMock.user.findUnique.mockResolvedValue({
    id: USER_ID,
    emailVerified: scenario.emailVerified,
    createdAt: new Date(NOW.getTime() - scenario.ageInDays * DAY_MS),
    accounts: scenario.providers.map((provider) => ({ provider }))
  });
  prismaMock.taskCompletion.findMany.mockResolvedValue(
    Array.from({ length: scenario.completions }, (_, i) => ({
      id: `completion-${i}`,
      taskId: scenario.completionTaskIds?.[i] ?? `task-${i}`
    }))
  );
  prismaMock.userIpAddress.findMany.mockResolvedValue(
    Array.from({ length: scenario.ipCount }, (_, i) => ({
      ip: {
        ...(scenario.geo?.[i] ?? defaultGeo),
        users: scenario.ipUsers.map((userId) => ({ userId }))
      }
    }))
  );
  prismaMock.userFingerprint.findMany.mockResolvedValue(
    scenario.fingerprintCounts.map((count, i) => ({
      count,
      fingerprint: {
        fingerprint: `fp-${i}`,
        users: scenario.fingerprintUsers.map((userId) => ({ userId }))
      }
    }))
  );
  prismaMock.userTurnstile.findUnique.mockResolvedValue(scenario.turnstile);
};

const scoreFor = async (scenario: Scenario) => {
  arrange(scenario);
  await computeSignupUserScore(asPrismaClient(), USER_ID);
  expect(prismaMock.userQuality.create).toHaveBeenCalledTimes(1);
  return prismaMock.userQuality.create.mock.calls[0][0].data.score as number;
};

describe('computeSignupUserScore', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('when the user does not exist', () => {
    it('returns without querying signals or writing a score', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const result = await computeSignupUserScore(asPrismaClient(), USER_ID);

      expect(result).toBeUndefined();
      expect(prismaMock.taskCompletion.findMany).not.toHaveBeenCalled();
      expect(prismaMock.userIpAddress.findMany).not.toHaveBeenCalled();
      expect(prismaMock.userFingerprint.findMany).not.toHaveBeenCalled();
      expect(prismaMock.userTurnstile.findUnique).not.toHaveBeenCalled();
      expect(prismaMock.userQuality.create).not.toHaveBeenCalled();
    });
  });

  describe('queries', () => {
    beforeEach(() => {
      arrange(trustedScenario());
    });

    it('loads the user with their accounts', async () => {
      await computeSignupUserScore(asPrismaClient(), USER_ID);

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: USER_ID },
        include: { accounts: true }
      });
    });

    it('loads up to 100 task completions from the last 30 days', async () => {
      await computeSignupUserScore(asPrismaClient(), USER_ID);

      expect(prismaMock.taskCompletion.findMany).toHaveBeenCalledWith({
        where: {
          participant: { userId: USER_ID },
          completedAt: { gte: new Date(NOW.getTime() - 30 * DAY_MS) }
        },
        orderBy: { completedAt: 'desc' },
        take: 100
      });
    });

    it('loads IP addresses used in the last 30 days with geo and users', async () => {
      await computeSignupUserScore(asPrismaClient(), USER_ID);

      expect(prismaMock.userIpAddress.findMany).toHaveBeenCalledWith({
        where: {
          userId: USER_ID,
          updatedAt: { gte: new Date(NOW.getTime() - 30 * DAY_MS) }
        },
        orderBy: { updatedAt: 'desc' },
        select: {
          ip: {
            select: {
              regionCode: true,
              countryCode: true,
              continentCode: true,
              users: { select: { userId: true } }
            }
          }
        }
      });
    });

    it('loads every fingerprint with its users and session count', async () => {
      await computeSignupUserScore(asPrismaClient(), USER_ID);

      expect(prismaMock.userFingerprint.findMany).toHaveBeenCalledWith({
        where: { userId: USER_ID },
        orderBy: { updatedAt: 'desc' },
        select: {
          fingerprint: {
            select: {
              fingerprint: true,
              users: { select: { userId: true } }
            }
          },
          count: true
        }
      });
    });

    it('loads the turnstile entry for the user', async () => {
      await computeSignupUserScore(asPrismaClient(), USER_ID);

      expect(prismaMock.userTurnstile.findUnique).toHaveBeenCalledWith({
        where: { userId: USER_ID }
      });
    });

    it('writes the bucket score for the user and resolves to undefined', async () => {
      const result = await computeSignupUserScore(asPrismaClient(), USER_ID);

      expect(result).toBeUndefined();
      expect(prismaMock.userQuality.create).toHaveBeenCalledWith({
        data: { userId: USER_ID, score: SCORE.trusted }
      });
    });
  });

  describe('bucket thresholds', () => {
    it('scores a user passing all seven checks as trusted', async () => {
      expect(await scoreFor(trustedScenario())).toBe(SCORE.trusted);
    });

    it('scores a user passing six checks as trusted', async () => {
      expect(await scoreFor(sixPassingScenario())).toBe(SCORE.trusted);
    });

    it('scores a user passing five checks as good', async () => {
      expect(
        await scoreFor({ ...sixPassingScenario(), emailVerified: null })
      ).toBe(SCORE.good);
    });

    it('scores a user passing four checks as neutral', async () => {
      expect(
        await scoreFor({
          ...sixPassingScenario(),
          emailVerified: null,
          completions: 0
        })
      ).toBe(SCORE.neutral);
    });

    it('scores a user with no signals at all as neutral', async () => {
      expect(
        await scoreFor({
          emailVerified: null,
          ageInDays: 0,
          providers: [],
          completions: 0,
          fingerprintCounts: [],
          fingerprintUsers: [],
          ipCount: 0,
          ipUsers: [],
          turnstile: null
        })
      ).toBe(SCORE.neutral);
    });
  });

  describe('email verification check', () => {
    it('fails when emailVerified is null', async () => {
      expect(
        await scoreFor({ ...sixPassingScenario(), emailVerified: null })
      ).toBe(SCORE.good);
    });
  });

  describe('account age check', () => {
    it('passes at 14 days old', async () => {
      expect(await scoreFor({ ...sixPassingScenario(), ageInDays: 14 })).toBe(
        SCORE.trusted
      );
    });

    it('fails at 13 days old because the first extra week is incomplete', async () => {
      expect(await scoreFor({ ...sixPassingScenario(), ageInDays: 13 })).toBe(
        SCORE.good
      );
    });

    it('fails one hour short of 14 days because partial days are floored', async () => {
      expect(
        await scoreFor({ ...sixPassingScenario(), ageInDays: 14 - 1 / 24 })
      ).toBe(SCORE.good);
    });

    it('fails at exactly 7 days old', async () => {
      expect(await scoreFor({ ...sixPassingScenario(), ageInDays: 7 })).toBe(
        SCORE.good
      );
    });

    it('still passes for a very old account', async () => {
      expect(await scoreFor({ ...sixPassingScenario(), ageInDays: 900 })).toBe(
        SCORE.trusted
      );
    });
  });

  describe('providers connected check', () => {
    it('passes with two distinct providers', async () => {
      expect(
        await scoreFor({
          ...sixPassingScenario(),
          providers: ['google', 'discord']
        })
      ).toBe(SCORE.trusted);
    });

    it('fails with a single provider', async () => {
      expect(
        await scoreFor({ ...sixPassingScenario(), providers: ['google'] })
      ).toBe(SCORE.good);
    });

    it('counts duplicate providers once', async () => {
      expect(
        await scoreFor({
          ...sixPassingScenario(),
          providers: ['google', 'google', 'google']
        })
      ).toBe(SCORE.good);
    });

    it('passes with many providers', async () => {
      expect(
        await scoreFor({
          ...sixPassingScenario(),
          providers: ['google', 'discord', 'twitter', 'twitch', 'kick', 'steam']
        })
      ).toBe(SCORE.trusted);
    });
  });

  describe('task activity check', () => {
    it('passes with three completions', async () => {
      expect(await scoreFor({ ...sixPassingScenario(), completions: 3 })).toBe(
        SCORE.trusted
      );
    });

    it('fails with two completions', async () => {
      expect(await scoreFor({ ...sixPassingScenario(), completions: 2 })).toBe(
        SCORE.good
      );
    });

    it('passes with far more completions than the cap', async () => {
      expect(await scoreFor({ ...sixPassingScenario(), completions: 60 })).toBe(
        SCORE.trusted
      );
    });
  });

  describe('task diversity signal', () => {
    it('does not affect the bucket', async () => {
      const repeated = await scoreFor({
        ...sixPassingScenario(),
        emailVerified: null,
        completions: 3,
        completionTaskIds: ['task-a', 'task-a', 'task-a']
      });
      prismaMock.userQuality.create.mockClear();
      const varied = await scoreFor({
        ...sixPassingScenario(),
        emailVerified: null,
        completions: 12
      });

      expect(repeated).toBe(SCORE.good);
      expect(varied).toBe(SCORE.good);
    });
  });

  describe('device stability check', () => {
    it('passes when one fingerprint accounts for half the sessions', async () => {
      expect(
        await scoreFor({ ...sixPassingScenario(), fingerprintCounts: [5, 5] })
      ).toBe(SCORE.trusted);
    });

    it('measures stability from the most-used fingerprint', async () => {
      expect(
        await scoreFor({ ...sixPassingScenario(), fingerprintCounts: [1, 9] })
      ).toBe(SCORE.trusted);
    });

    it('fails when the top fingerprint covers 49% of sessions because each 10% step is floored', async () => {
      expect(
        await scoreFor({
          ...sixPassingScenario(),
          fingerprintCounts: [49, 26, 25]
        })
      ).toBe(SCORE.good);
    });

    it('fails when the top fingerprint is below half the sessions', async () => {
      expect(
        await scoreFor({
          ...sixPassingScenario(),
          fingerprintCounts: [1, 1, 1]
        })
      ).toBe(SCORE.good);
    });

    it('fails when there are no fingerprints', async () => {
      expect(
        await scoreFor({
          ...sixPassingScenario(),
          fingerprintCounts: [],
          fingerprintUsers: []
        })
      ).toBe(SCORE.good);
    });

    it('fails when every fingerprint has zero sessions', async () => {
      expect(
        await scoreFor({ ...sixPassingScenario(), fingerprintCounts: [0, 0] })
      ).toBe(SCORE.good);
    });
  });

  describe('IP consistency check', () => {
    it.each([1, 2, 3])('passes with %i IP addresses', async (ipCount) => {
      expect(await scoreFor({ ...sixPassingScenario(), ipCount })).toBe(
        SCORE.trusted
      );
    });

    it.each([0, 4, 5, 8])('fails with %i IP addresses', async (ipCount) => {
      expect(await scoreFor({ ...sixPassingScenario(), ipCount })).toBe(
        SCORE.good
      );
    });
  });

  describe('geo consistency signal', () => {
    const geoScenario = (geo: Geo[]): Scenario => ({
      ...sixPassingScenario(),
      emailVerified: null,
      ipCount: geo.length,
      geo
    });

    it.each([
      ['same region', [defaultGeo, defaultGeo]],
      ['same country only', [defaultGeo, { ...defaultGeo, regionCode: 'QC' }]],
      [
        'same continent only',
        [
          defaultGeo,
          { regionCode: 'CA', countryCode: 'US', continentCode: 'NA' }
        ]
      ],
      [
        'different continents',
        [
          defaultGeo,
          { regionCode: 'BE', countryCode: 'DE', continentCode: 'EU' }
        ]
      ]
    ])('does not affect the bucket for %s', async (_label, geo) => {
      expect(await scoreFor(geoScenario(geo))).toBe(SCORE.good);
    });
  });

  describe('turnstile trust', () => {
    const withoutEmail = (): Scenario => ({
      ...trustedScenario(),
      emailVerified: null
    });

    it('passes when the score maps above zero', async () => {
      expect(
        await scoreFor({
          ...withoutEmail(),
          turnstile: { success: true, score: 0.55 }
        })
      ).toBe(SCORE.trusted);
    });

    it('fails when the score maps to exactly zero', async () => {
      expect(
        await scoreFor({
          ...withoutEmail(),
          turnstile: { success: true, score: 0.5 }
        })
      ).toBe(SCORE.good);
    });

    it('is ignored when the verification was unsuccessful', async () => {
      expect(
        await scoreFor({
          ...withoutEmail(),
          turnstile: { success: false, score: 0 }
        })
      ).toBe(SCORE.good);
    });

    it('is ignored when the score is null', async () => {
      expect(
        await scoreFor({
          ...withoutEmail(),
          turnstile: { success: true, score: null }
        })
      ).toBe(SCORE.good);
    });

    it('is ignored when there is no turnstile entry', async () => {
      expect(await scoreFor({ ...withoutEmail(), turnstile: null })).toBe(
        SCORE.good
      );
    });

    it('bans a user whose score maps below -5', async () => {
      expect(
        await scoreFor({
          ...trustedScenario(),
          turnstile: { success: true, score: 0.24 }
        })
      ).toBe(SCORE.banned);
    });

    it('does not ban a user whose score maps to exactly -5', async () => {
      expect(
        await scoreFor({
          ...trustedScenario(),
          turnstile: { success: true, score: 0.25 }
        })
      ).toBe(SCORE.trusted);
    });

    it('bans a user with a score of zero', async () => {
      expect(
        await scoreFor({
          ...trustedScenario(),
          turnstile: { success: true, score: 0 }
        })
      ).toBe(SCORE.banned);
    });

    it('clamps an out-of-range negative score and still bans', async () => {
      expect(
        await scoreFor({
          ...trustedScenario(),
          turnstile: { success: true, score: -3 }
        })
      ).toBe(SCORE.banned);
    });

    it('clamps an out-of-range positive score and still passes', async () => {
      expect(
        await scoreFor({
          ...withoutEmail(),
          turnstile: { success: true, score: 7 }
        })
      ).toBe(SCORE.trusted);
    });
  });

  describe('shared infrastructure', () => {
    it('marks a user sharing an IP with another account as suspicious', async () => {
      expect(
        await scoreFor({ ...trustedScenario(), ipUsers: [USER_ID, 'user-2'] })
      ).toBe(SCORE.suspicious);
    });

    it('marks a user sharing a fingerprint with another account as suspicious', async () => {
      expect(
        await scoreFor({
          ...trustedScenario(),
          fingerprintUsers: [USER_ID, 'user-2']
        })
      ).toBe(SCORE.suspicious);
    });

    it('does not treat the user themselves as an overlap', async () => {
      expect(
        await scoreFor({
          ...trustedScenario(),
          ipUsers: [USER_ID, USER_ID],
          fingerprintUsers: [USER_ID]
        })
      ).toBe(SCORE.trusted);
    });

    it('prefers banned over suspicious when the user is also bot-like', async () => {
      expect(
        await scoreFor({
          ...trustedScenario(),
          ipUsers: ['user-2'],
          fingerprintUsers: ['user-3'],
          turnstile: { success: true, score: 0 }
        })
      ).toBe(SCORE.banned);
    });

    it('marks a shared-infrastructure user suspicious even with no other signals', async () => {
      expect(
        await scoreFor({
          emailVerified: null,
          ageInDays: 0,
          providers: [],
          completions: 0,
          fingerprintCounts: [1],
          fingerprintUsers: ['user-2'],
          ipCount: 0,
          ipUsers: [],
          turnstile: null
        })
      ).toBe(SCORE.suspicious);
    });
  });
});
