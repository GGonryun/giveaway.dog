import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SweepstakesStatus } from '@prisma/client';
import getParticipationHistory from '../get-participation-history';
import { prismaMock, knownRequestError } from '@/test/prisma';
import { signIn, TEST_USER } from '@/test/session';
import { expectFailure, expectOk } from '@/test/result';

const NOW = new Date('2026-10-01T12:00:00.000Z');
const START = new Date('2026-09-01T00:00:00.000Z');
const END = new Date('2026-12-01T00:00:00.000Z');

type Completion = { completedAt: Date; won?: boolean };

const task = (id: string, completions: Completion[] = []) => ({
  id,
  sweepstakesId: 'sweep',
  index: 0,
  config: null,
  completions: completions.map((completion, index) => ({
    id: `${id}-completion-${index}`,
    participantId: 'participant-1',
    taskId: id,
    completedAt: completion.completedAt,
    proof: null,
    reason: null,
    status: 'COMPLETED',
    draws: completion.won
      ? [{ id: `${id}-draw-${index}`, result: 'WINNER' }]
      : []
  }))
});

type SweepstakesOptions = {
  id?: string;
  status?: SweepstakesStatus;
  name?: string | null;
  banner?: string | null;
  details?: boolean;
  timing?: { startDate: Date | null; endDate: Date | null } | null;
  tasks?: ReturnType<typeof task>[];
};

const sweepstakes = ({
  id = 'sweep-1',
  status = SweepstakesStatus.ACTIVE,
  name = 'Summer Giveaway',
  banner = 'https://example.com/banner.png',
  details = true,
  timing = { startDate: START, endDate: END },
  tasks = []
}: SweepstakesOptions = {}) => ({
  id,
  status,
  teamId: 'team-1',
  createdAt: START,
  updatedAt: START,
  details: details
    ? { id: `${id}-details`, sweepstakesId: id, name, description: '', banner }
    : null,
  timing: timing && {
    id: `${id}-timing`,
    sweepstakesId: id,
    timeZone: 'UTC',
    ...timing
  },
  tasks
});

const at = (iso: string) => new Date(iso);

describe('getParticipationHistory', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('authorization', () => {
    it('rejects unauthenticated callers', async () => {
      const result = await getParticipationHistory();

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.sweepstakes.findMany).not.toHaveBeenCalled();
    });
  });

  describe('when the caller is signed in', () => {
    beforeEach(() => {
      signIn();
    });

    it('queries sweepstakes with a task completed by the caller', async () => {
      prismaMock.sweepstakes.findMany.mockResolvedValue([]);

      await getParticipationHistory();

      expect(prismaMock.sweepstakes.findMany).toHaveBeenCalledWith({
        where: {
          tasks: {
            some: {
              completions: {
                some: { participant: { userId: TEST_USER.id } }
              }
            }
          }
        },
        include: {
          details: true,
          timing: true,
          tasks: {
            include: {
              completions: {
                where: { participant: { userId: TEST_USER.id } },
                orderBy: { completedAt: 'desc' },
                take: 1,
                include: { draws: { where: { result: 'WINNER' } } }
              }
            }
          }
        },
        orderBy: { updatedAt: 'desc' }
      });
    });

    it('returns an empty list when the caller has no participation', async () => {
      prismaMock.sweepstakes.findMany.mockResolvedValue([]);

      const result = await getParticipationHistory();

      expect(expectOk(result)).toEqual([]);
    });

    it('summarizes a sweepstakes the caller took part in', async () => {
      prismaMock.sweepstakes.findMany.mockResolvedValue([
        sweepstakes({
          tasks: [
            task('task-1', [{ completedAt: at('2026-09-10T10:00:00.000Z') }]),
            task('task-2')
          ]
        })
      ]);

      const result = await getParticipationHistory();

      expect(expectOk(result)).toEqual([
        {
          sweepstakesId: 'sweep-1',
          sweepstakesName: 'Summer Giveaway',
          sweepstakesStartDate: START,
          sweepstakesEndDate: END,
          engagement: 50,
          totalTasks: 2,
          completedTasks: 1,
          lastParticipatedAt: '2026-09-10T10:00:00.000Z',
          banner: 'https://example.com/banner.png',
          sweepstakesStatus: 'RUNNING',
          hasWon: false
        }
      ]);
    });

    it('uses defaults when the sweepstakes has no details or timing', async () => {
      prismaMock.sweepstakes.findMany.mockResolvedValue([
        sweepstakes({
          details: false,
          timing: null,
          tasks: [
            task('task-1', [{ completedAt: at('2026-09-10T10:00:00.000Z') }])
          ]
        })
      ]);

      const result = await getParticipationHistory();

      expect(expectOk(result)[0]).toMatchObject({
        sweepstakesName: 'Untitled Sweepstakes',
        banner: null,
        sweepstakesStartDate: NOW,
        sweepstakesEndDate: NOW,
        sweepstakesStatus: 'DRAFT'
      });
    });

    it('uses defaults when the details have no name or banner and timing has no dates', async () => {
      prismaMock.sweepstakes.findMany.mockResolvedValue([
        sweepstakes({
          name: null,
          banner: null,
          timing: { startDate: null, endDate: null },
          tasks: [
            task('task-1', [{ completedAt: at('2026-09-10T10:00:00.000Z') }])
          ]
        })
      ]);

      const result = await getParticipationHistory();

      expect(expectOk(result)[0]).toMatchObject({
        sweepstakesName: 'Untitled Sweepstakes',
        banner: null,
        sweepstakesStartDate: NOW,
        sweepstakesEndDate: NOW,
        sweepstakesStatus: 'ERROR'
      });
    });

    it.each([
      [1, 3, 33],
      [2, 3, 67],
      [3, 3, 100]
    ])(
      'rounds engagement for %i of %i completed tasks to %i',
      async (completed, total, engagement) => {
        const tasks = Array.from({ length: total }, (_, index) =>
          task(
            `task-${index}`,
            index < completed
              ? [{ completedAt: at('2026-09-10T10:00:00.000Z') }]
              : []
          )
        );
        prismaMock.sweepstakes.findMany.mockResolvedValue([
          sweepstakes({ tasks })
        ]);

        const result = await getParticipationHistory();

        expect(expectOk(result)[0]).toMatchObject({
          engagement,
          completedTasks: completed,
          totalTasks: total
        });
      }
    );

    it('reports zero engagement and the epoch when the sweepstakes has no tasks', async () => {
      prismaMock.sweepstakes.findMany.mockResolvedValue([sweepstakes()]);

      const result = await getParticipationHistory();

      expect(expectOk(result)[0]).toMatchObject({
        engagement: 0,
        totalTasks: 0,
        completedTasks: 0,
        lastParticipatedAt: '1970-01-01T00:00:00.000Z',
        hasWon: false
      });
    });

    it('counts a task once even when it has several completions', async () => {
      prismaMock.sweepstakes.findMany.mockResolvedValue([
        sweepstakes({
          tasks: [
            task('task-1', [
              { completedAt: at('2026-09-10T10:00:00.000Z') },
              { completedAt: at('2026-09-11T10:00:00.000Z') }
            ]),
            task('task-2')
          ]
        })
      ]);

      const result = await getParticipationHistory();

      expect(expectOk(result)[0]).toMatchObject({
        completedTasks: 1,
        engagement: 50
      });
    });

    it('reports the latest completion across all tasks as the last participation', async () => {
      prismaMock.sweepstakes.findMany.mockResolvedValue([
        sweepstakes({
          tasks: [
            task('task-1', [{ completedAt: at('2026-09-12T08:00:00.000Z') }]),
            task('task-2', [{ completedAt: at('2026-09-20T09:30:00.000Z') }]),
            task('task-3', [{ completedAt: at('2026-09-15T00:00:00.000Z') }])
          ]
        })
      ]);

      const result = await getParticipationHistory();

      expect(expectOk(result)[0].lastParticipatedAt).toBe(
        '2026-09-20T09:30:00.000Z'
      );
    });

    it('flags the sweepstakes as won when any completion has a winning draw', async () => {
      prismaMock.sweepstakes.findMany.mockResolvedValue([
        sweepstakes({
          tasks: [
            task('task-1', [{ completedAt: at('2026-09-12T08:00:00.000Z') }]),
            task('task-2', [
              { completedAt: at('2026-09-13T08:00:00.000Z'), won: true }
            ])
          ]
        })
      ]);

      const result = await getParticipationHistory();

      expect(expectOk(result)[0].hasWon).toBe(true);
    });

    it('sorts by most recent participation regardless of query order', async () => {
      prismaMock.sweepstakes.findMany.mockResolvedValue([
        sweepstakes({
          id: 'older',
          tasks: [
            task('task-a', [{ completedAt: at('2026-09-01T00:00:00.000Z') }])
          ]
        }),
        sweepstakes({ id: 'never' }),
        sweepstakes({
          id: 'newest',
          tasks: [
            task('task-b', [{ completedAt: at('2026-09-25T00:00:00.000Z') }])
          ]
        })
      ]);

      const result = await getParticipationHistory();

      expect(expectOk(result).map((item) => item.sweepstakesId)).toEqual([
        'newest',
        'older',
        'never'
      ]);
    });

    it('keeps the query order for equal participation times', async () => {
      const sameTime = [{ completedAt: at('2026-09-05T00:00:00.000Z') }];
      prismaMock.sweepstakes.findMany.mockResolvedValue([
        sweepstakes({ id: 'first', tasks: [task('t1', sameTime)] }),
        sweepstakes({ id: 'second', tasks: [task('t2', sameTime)] })
      ]);

      const result = await getParticipationHistory();

      expect(expectOk(result).map((item) => item.sweepstakesId)).toEqual([
        'first',
        'second'
      ]);
    });

    it.each([
      ['COMPLETED', { status: SweepstakesStatus.COMPLETED }],
      [
        'SCHEDULED',
        {
          timing: {
            startDate: at('2026-10-05T00:00:00.000Z'),
            endDate: END
          }
        }
      ],
      [
        'EXPIRED',
        {
          timing: {
            startDate: START,
            endDate: at('2026-09-30T00:00:00.000Z')
          }
        }
      ],
      ['DRAFT', { status: SweepstakesStatus.DRAFT }]
    ] as const)(
      'derives the %s status from the sweepstakes',
      async (expected, options) => {
        prismaMock.sweepstakes.findMany.mockResolvedValue([
          sweepstakes(options)
        ]);

        const result = await getParticipationHistory();

        expect(expectOk(result)[0].sweepstakesStatus).toBe(expected);
      }
    );

    it('does not expose the internal sort key', async () => {
      prismaMock.sweepstakes.findMany.mockResolvedValue([sweepstakes()]);

      const result = await getParticipationHistory();

      expect(expectOk(result)[0]).not.toHaveProperty('_sortDate');
    });

    it('maps a P2025 database error to NOT_FOUND', async () => {
      prismaMock.sweepstakes.findMany.mockRejectedValue(
        knownRequestError('P2025')
      );

      const result = await getParticipationHistory();

      expectFailure(result, 'NOT_FOUND');
    });
  });
});
