import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import getParticipantSweepstake from '../get-participant-sweepstake';
import { PARTICIPANT_SWEEPSTAKES_PAYLOAD } from '@/schemas/giveaway/db';
import { ELIGIBLE_TASK_COMPLETION_INCLUDE_QUERY } from '@/lib/task/queries';
import { DEFAULT_TEAM_LOGO } from '@/lib/team/data';
import { prismaMock } from '@/test/prisma';
import { signIn } from '@/test/session';
import { nextCacheMock } from '@/test/next-cache';
import { expectFailure, expectOk } from '@/test/result';
import {
  FIXED_NOW,
  buildSelectedUser,
  daysFromFixedNow
} from './fixtures-procedures-browse-marketing-pickers';

type Input = Parameters<typeof getParticipantSweepstake>[0];

const START = daysFromFixedNow(-2);
const END = daysFromFixedNow(5);
const CREATED_AT = daysFromFixedNow(-10);

const bonusConfig = (title: string, value: number) => ({
  type: 'BONUS_TASK',
  title,
  value,
  mandatory: false,
  tasksRequired: 0
});

const taskRow = (id: string, config: unknown) => ({
  id,
  sweepstakesId: 'sw-1',
  index: 0,
  config
});

const drawRow = (
  id: string,
  task: ReturnType<typeof taskRow>,
  winnerId = 'winner-1'
) => ({
  id,
  prizeId: 'prize-1',
  taskCompletionId: `tc-${id}`,
  result: 'WINNER',
  disqualificationReason: null,
  previousDrawId: null,
  createdAt: daysFromFixedNow(-1),
  updatedAt: daysFromFixedNow(-1),
  taskCompletion: {
    id: `tc-${id}`,
    participantId: `participant-${winnerId}`,
    taskId: task.id,
    status: 'COMPLETED',
    proof: null,
    reason: null,
    completedAt: daysFromFixedNow(-1),
    task,
    participant: {
      id: `participant-${winnerId}`,
      userId: winnerId,
      sweepstakesId: 'sw-1',
      user: buildSelectedUser({ id: winnerId, name: 'Winner' })
    }
  }
});

type PrizeRow = {
  id: string;
  sweepstakesId: string;
  name: string | null;
  index: number;
  quota: number | null;
  draws: ReturnType<typeof drawRow>[];
};

const prizeRow = (overrides: Partial<PrizeRow> = {}): PrizeRow => ({
  id: 'prize-1',
  sweepstakesId: 'sw-1',
  name: 'Gift Card',
  index: 0,
  quota: 2,
  draws: [],
  ...overrides
});

const sweepstakesRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'sw-1',
  status: 'ACTIVE',
  teamId: 'team-1',
  createdAt: CREATED_AT,
  updatedAt: CREATED_AT,
  team: {
    id: 'team-1',
    name: 'Acme',
    slug: 'acme',
    logo: 'https://example.com/logo.png',
    links: null,
    tier: 'FREE',
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT
  },
  details: {
    id: 'details-1',
    sweepstakesId: 'sw-1',
    name: 'Great Giveaway',
    description: 'Win something nice',
    banner: 'https://example.com/banner.png'
  },
  timing: {
    id: 'timing-1',
    sweepstakesId: 'sw-1',
    startDate: START,
    endDate: END,
    timeZone: 'UTC'
  },
  terms: {
    id: 'terms-1',
    sweepstakesId: 'sw-1',
    type: 'CUSTOM',
    text: 'Official rules',
    sponsorName: null,
    sponsorAddress: null,
    winnerSelectionMethod: null,
    notificationTimeframeDays: null,
    maxEntriesPerUser: null,
    claimDeadlineDays: null,
    governingLawCountry: null,
    privacyPolicyUrl: null,
    additionalTerms: null
  },
  audience: {
    id: 'audience-1',
    sweepstakesId: 'sw-1',
    allowedIdentities: ['TWITTER', 'EMAIL'],
    requirePreEntryLogin: false,
    requireEmail: null,
    regionalRestriction: null,
    minimumAgeRestriction: null,
    formFields: []
  },
  design: {
    id: 'design-1',
    sweepstakesId: 'sw-1',
    data: {
      aspectRatio: 'NONE',
      displayName: true,
      displayDescription: false,
      background: { type: 'color', color: '#ffffff' }
    }
  },
  visibility: {
    id: 'visibility-1',
    sweepstakesId: 'sw-1',
    visibility: 'PUBLIC',
    slug: 'great-giveaway',
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT
  },
  criteria: {
    id: 'criteria-1',
    sweepstakesId: 'sw-1',
    minTasksCompleted: 2,
    minQualityScore: 60,
    allowMultipleWins: true,
    allowUserSelection: false,
    externalPlatforms: null
  },
  prizes: [prizeRow()],
  tasks: [taskRow('task-1', bonusConfig('Say hi', 2))],
  ...overrides
});

const completionRow = (
  id: string,
  userId: string,
  task: ReturnType<typeof taskRow>,
  status: 'COMPLETED' | 'PENDING' | 'REJECTED' = 'COMPLETED',
  proof: unknown = null
) => ({
  id,
  participantId: `participant-${userId}`,
  taskId: task.id,
  status,
  proof,
  reason: null,
  completedAt: daysFromFixedNow(-1),
  task,
  participant: {
    id: `participant-${userId}`,
    userId,
    sweepstakesId: 'sw-1',
    user: { id: userId, quality: [] }
  }
});

const givenSweepstakes = (
  sweepstakes: unknown,
  completions: unknown[] = []
) => {
  prismaMock.sweepstakes.findFirst.mockResolvedValue(sweepstakes);
  prismaMock.taskCompletion.findMany.mockResolvedValue(completions);
};

describe('getParticipantSweepstake', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(FIXED_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('query shape', () => {
    it('looks the sweepstakes up by id or slug with the participant payload', async () => {
      givenSweepstakes(sweepstakesRow());

      await getParticipantSweepstake({ sweepstakesId: 'great-giveaway' });

      expect(prismaMock.sweepstakes.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { id: 'great-giveaway' },
            { visibility: { slug: 'great-giveaway' } }
          ]
        },
        include: PARTICIPANT_SWEEPSTAKES_PAYLOAD
      });
    });

    it('loads task completions using the resolved sweepstakes id', async () => {
      givenSweepstakes(sweepstakesRow({ id: 'sw-resolved' }));

      await getParticipantSweepstake({ sweepstakesId: 'great-giveaway' });

      expect(prismaMock.taskCompletion.findMany).toHaveBeenCalledWith({
        where: { task: { sweepstakesId: 'sw-resolved' } },
        include: ELIGIBLE_TASK_COMPLETION_INCLUDE_QUERY
      });
    });

    it('caches per sweepstakes id for ten minutes with sweepstakes tags', async () => {
      givenSweepstakes(sweepstakesRow());

      await getParticipantSweepstake({ sweepstakesId: 'sw-1' });

      expect(nextCacheMock.unstable_cache).toHaveBeenCalledWith(
        expect.any(Function),
        ['participant-sweepstake-sw-1'],
        {
          tags: ['sweepstakes-sw-1', 'participant-sweepstake'],
          revalidate: 600
        }
      );
    });
  });

  describe('when the sweepstakes cannot be shown', () => {
    it('returns NOT_FOUND when the sweepstakes does not exist', async () => {
      prismaMock.sweepstakes.findFirst.mockResolvedValue(null);

      const result = await getParticipantSweepstake({
        sweepstakesId: 'missing'
      });

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'Sweepstakes with ID missing not found'
      );
      expect(prismaMock.taskCompletion.findMany).not.toHaveBeenCalled();
    });

    it('returns NOT_FOUND when the sweepstakes has no team', async () => {
      prismaMock.sweepstakes.findFirst.mockResolvedValue(
        sweepstakesRow({ team: null, teamId: null })
      );

      const result = await getParticipantSweepstake({ sweepstakesId: 'sw-1' });

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'Sweepstakes with ID sw-1 not found'
      );
      expect(prismaMock.taskCompletion.findMany).not.toHaveBeenCalled();
    });
  });

  describe('when the sweepstakes is valid', () => {
    it('returns the sweepstakes, host, prizes and empty participation', async () => {
      givenSweepstakes(sweepstakesRow());

      const result = await getParticipantSweepstake({ sweepstakesId: 'sw-1' });

      expect(expectOk(result)).toEqual({
        sweepstakes: {
          id: 'sw-1',
          status: 'RUNNING',
          setup: {
            name: 'Great Giveaway',
            description: 'Win something nice',
            banner: 'https://example.com/banner.png'
          },
          terms: { type: 'CUSTOM', text: 'Official rules' },
          timing: { startDate: START, endDate: END, timeZone: 'UTC' },
          audience: {
            allowedIdentities: ['TWITTER', 'EMAIL'],
            requirePreEntryLogin: false,
            formFields: []
          },
          tasks: [
            {
              id: 'task-1',
              type: 'BONUS_TASK',
              title: 'Say hi',
              value: 2,
              mandatory: false,
              tasksRequired: 0
            }
          ],
          prizes: [{ id: 'prize-1', name: 'Gift Card', quota: 2 }],
          design: {
            aspectRatio: 'NONE',
            displayName: true,
            displayDescription: false,
            background: { type: 'color', color: '#ffffff' }
          },
          visibility: { visibility: 'PUBLIC', slug: 'great-giveaway' },
          criteria: {
            minTasksCompleted: 2,
            minQualityScore: 60,
            allowMultipleWins: true,
            allowUserSelection: false,
            externalPlatforms: null
          }
        },
        host: {
          id: 'team-1',
          slug: 'acme',
          name: 'Acme',
          logo: 'https://example.com/logo.png',
          links: []
        },
        prizes: [
          { prizeId: 'prize-1', prizeName: 'Gift Card', quota: 2, draws: [] }
        ],
        participation: { totalUsers: 0, usersByTask: {}, totalEntries: 0 }
      });
    });

    it('derives a SCHEDULED status before the start date', async () => {
      givenSweepstakes(
        sweepstakesRow({
          timing: {
            startDate: daysFromFixedNow(1),
            endDate: daysFromFixedNow(8),
            timeZone: 'UTC'
          }
        })
      );

      const result = await getParticipantSweepstake({ sweepstakesId: 'sw-1' });

      expect(expectOk(result).sweepstakes.status).toBe('SCHEDULED');
    });

    it('derives an EXPIRED status after the end date', async () => {
      givenSweepstakes(
        sweepstakesRow({
          timing: {
            startDate: daysFromFixedNow(-8),
            endDate: daysFromFixedNow(-1),
            timeZone: 'UTC'
          }
        })
      );

      const result = await getParticipantSweepstake({ sweepstakesId: 'sw-1' });

      expect(expectOk(result).sweepstakes.status).toBe('EXPIRED');
    });

    it('reports a DRAFT status for draft sweepstakes', async () => {
      givenSweepstakes(sweepstakesRow({ status: 'DRAFT' }));

      const result = await getParticipantSweepstake({ sweepstakesId: 'sw-1' });

      expect(expectOk(result).sweepstakes.status).toBe('DRAFT');
    });

    it('falls back to the default team logo and drops every link when any link is invalid', async () => {
      givenSweepstakes(
        sweepstakesRow({
          team: {
            id: 'team-1',
            name: 'Acme',
            slug: 'acme',
            logo: '',
            links: [
              { platform: 'x', url: 'https://x.com/acme' },
              { platform: 'myspace', url: 'https://myspace.com/acme' }
            ]
          }
        })
      );

      const result = await getParticipantSweepstake({ sweepstakesId: 'sw-1' });

      expect(expectOk(result).host).toEqual({
        id: 'team-1',
        slug: 'acme',
        name: 'Acme',
        logo: DEFAULT_TEAM_LOGO,
        links: []
      });
    });

    it('keeps social links when every link is valid', async () => {
      givenSweepstakes(
        sweepstakesRow({
          team: {
            id: 'team-1',
            name: 'Acme',
            slug: 'acme',
            logo: 'https://example.com/logo.png',
            links: [{ platform: 'x', url: 'https://x.com/acme' }]
          }
        })
      );

      const result = await getParticipantSweepstake({ sweepstakesId: 'sw-1' });

      expect(expectOk(result).host.links).toEqual([
        { platform: 'x', url: 'https://x.com/acme' }
      ]);
    });
  });

  describe('participation stats', () => {
    const task1 = taskRow('task-1', bonusConfig('One', 2));
    const task2 = taskRow('task-2', bonusConfig('Two', 5));

    it('counts unique users, completions per task and the summed entry value', async () => {
      givenSweepstakes(sweepstakesRow({ tasks: [task1, task2] }), [
        completionRow('c-1', 'user-a', task1),
        completionRow('c-2', 'user-a', task2),
        completionRow('c-3', 'user-b', task1)
      ]);

      const result = await getParticipantSweepstake({ sweepstakesId: 'sw-1' });

      expect(expectOk(result).participation).toEqual({
        totalUsers: 2,
        usersByTask: { 'task-1': 2, 'task-2': 1 },
        totalEntries: 9
      });
    });

    it('counts pending and rejected completions in every statistic', async () => {
      givenSweepstakes(sweepstakesRow({ tasks: [task1] }), [
        completionRow('c-1', 'user-a', task1, 'PENDING'),
        completionRow('c-2', 'user-b', task1, 'REJECTED')
      ]);

      const result = await getParticipantSweepstake({ sweepstakesId: 'sw-1' });

      expect(expectOk(result).participation).toEqual({
        totalUsers: 2,
        usersByTask: { 'task-1': 2 },
        totalEntries: 4
      });
    });

    it('adds the verified bonus for verified twitter import completions', async () => {
      const likeImport = taskRow('task-like', {
        type: 'TWITTER_LIKE_IMPORT',
        title: 'Like the post',
        value: 1,
        mandatory: false,
        tasksRequired: 0,
        tweetId: 'https://x.com/acme/status/123',
        importingAccount: 'acme',
        verifiedBonus: 4
      });
      const verifiedProof = {
        source: 'twitter_import',
        twitterUserId: '42',
        twitterUsername: 'fan',
        twitterVerified: true,
        importedAt: '2026-06-01T00:00:00.000Z',
        validatedBy: 'system'
      };
      givenSweepstakes(sweepstakesRow(), [
        completionRow('c-1', 'user-a', likeImport, 'COMPLETED', verifiedProof),
        completionRow('c-2', 'user-b', likeImport, 'COMPLETED', {
          ...verifiedProof,
          twitterVerified: false
        })
      ]);

      const result = await getParticipantSweepstake({ sweepstakesId: 'sw-1' });

      expect(expectOk(result).participation.totalEntries).toBe(6);
    });

    it('returns INTERNAL_SERVER_ERROR when a completion task config is invalid', async () => {
      givenSweepstakes(sweepstakesRow(), [
        completionRow('c-1', 'user-a', taskRow('task-x', { type: 'NOPE' }))
      ]);

      const result = await getParticipantSweepstake({ sweepstakesId: 'sw-1' });

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'Failed to parse task config'
      );
    });
  });

  describe('prize draws', () => {
    it('maps each draw with its task summary and the winner profile', async () => {
      const task = taskRow('task-1', bonusConfig('Say hi', 2));
      givenSweepstakes(
        sweepstakesRow({
          prizes: [prizeRow({ draws: [drawRow('draw-1', task, 'winner-1')] })]
        })
      );

      const result = await getParticipantSweepstake({ sweepstakesId: 'sw-1' });

      expect(expectOk(result).prizes[0].draws).toEqual([
        {
          id: 'draw-1',
          result: 'WINNER',
          disqualificationReason: null,
          createdAt: daysFromFixedNow(-1),
          updatedAt: daysFromFixedNow(-1),
          task: { id: 'task-1', type: 'BONUS_TASK', title: 'Say hi' },
          user: {
            id: 'winner-1',
            name: 'Winner',
            email: 'test@example.com',
            emailVerified: false,
            image: 'https://example.com/avatar.png',
            countryCode: 'XX',
            userAgent: 'unknown',
            birthday: null,
            qualityScore: 0,
            providers: [],
            source: 'SIGNUP',
            username: null,
            onboarded: true,
            accountType: 'PARTICIPANT',
            preferredContactMethod: null
          }
        }
      ]);
    });

    it('returns VALIDATION_ERROR naming the task when a draw task config is invalid', async () => {
      const badTask = taskRow('task-bad', { type: 'BONUS_TASK', title: '' });
      givenSweepstakes(
        sweepstakesRow({
          prizes: [prizeRow({ draws: [drawRow('draw-1', badTask)] })]
        })
      );

      const result = await getParticipantSweepstake({ sweepstakesId: 'sw-1' });

      expect(expectFailure(result, 'VALIDATION_ERROR').message).toBe(
        'Invalid task data for task ID task-bad'
      );
    });
  });

  describe('when the stored data does not satisfy the participant schema', () => {
    it.each([
      ['a prize has no name', { prizes: [prizeRow({ name: null })] }],
      ['a prize quota is above 10', { prizes: [prizeRow({ quota: 11 })] }],
      ['there are no prizes', { prizes: [] }],
      ['there are no tasks', { tasks: [] }],
      [
        'the banner is missing',
        {
          details: {
            name: 'Great Giveaway',
            description: 'Win something nice',
            banner: null
          }
        }
      ],
      [
        'the name is shorter than three characters',
        {
          details: {
            name: 'Hi',
            description: 'Win something nice',
            banner: 'https://example.com/banner.png'
          }
        }
      ],
      ['the terms are missing', { terms: null }],
      ['the design row is missing', { design: null }],
      [
        'the slug contains invalid characters',
        { visibility: { visibility: 'PUBLIC', slug: 'bad slug!' } }
      ]
    ])(
      'returns VALIDATION_ERROR when %s',
      async (_label, overrides: Record<string, unknown>) => {
        givenSweepstakes(sweepstakesRow(overrides));

        const result = await getParticipantSweepstake({
          sweepstakesId: 'sw-1'
        });

        const failure = expectFailure(result, 'VALIDATION_ERROR');
        expect(failure.message).toBe('Sweepstakes data is invalid');
        expect(failure.cause).toMatchObject({ name: 'ZodError' });
      }
    );

    it('fills defaults for missing visibility and criteria rows', async () => {
      givenSweepstakes(sweepstakesRow({ visibility: null, criteria: null }));

      const result = await getParticipantSweepstake({ sweepstakesId: 'sw-1' });

      const { sweepstakes } = expectOk(result);
      expect(sweepstakes.visibility).toEqual({
        visibility: 'PRIVATE',
        slug: null
      });
      expect(sweepstakes.criteria).toEqual({
        minQualityScore: 50,
        minTasksCompleted: 1,
        allowMultipleWins: false,
        allowUserSelection: false,
        externalPlatforms: null
      });
    });
  });

  describe('authorization', () => {
    it('serves signed in callers the same data', async () => {
      signIn();
      givenSweepstakes(sweepstakesRow());

      const result = await getParticipantSweepstake({ sweepstakesId: 'sw-1' });

      expect(expectOk(result).sweepstakes.id).toBe('sw-1');
    });
  });

  describe('input validation', () => {
    it('returns UNPROCESSABLE_CONTENT when sweepstakesId is missing', async () => {
      const result = await getParticipantSweepstake({} as unknown as Input);

      expectFailure(result, 'UNPROCESSABLE_CONTENT');
      expect(prismaMock.sweepstakes.findFirst).not.toHaveBeenCalled();
    });
  });
});
