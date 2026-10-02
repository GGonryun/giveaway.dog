import { describe, it, expect, vi, afterEach } from 'vitest';
import { toUniquePrizeDraw, toDuplicatePrizeDraw } from '../selection';
import type { ExpandedEligibleTaskCompletion } from '../completions';
import type { PrizeSlot, DrawInfo } from '../slots';
import type { EligibleTaskCompletion } from '@/lib/task/queries';
import type { Prisma } from '@prisma/client';
import { buildAllocation } from './fixtures-winners-model';
import { buildExpandedCompletion } from './fixtures-sweepstakes-winners-email';

const createMockCompletion = (
  userId: number,
  compIdx: number
): ExpandedEligibleTaskCompletion => {
  const baseDate = new Date('2024-01-01');
  const mockCompletion: EligibleTaskCompletion = {
    id: `completion-${userId}-${compIdx}`,
    taskId: `task-${compIdx}`,
    participantId: `participant-${userId}`,
    completedAt: baseDate,
    proof: { entries: 1 },
    status: 'COMPLETED' as const,
    reason: null,
    participant: {
      id: `participant-${userId}`,
      userId: `user-${userId}`,
      sweepstakesId: 'sweepstakes-1',
      createdAt: baseDate,
      updatedAt: baseDate,
      user: {
        id: `user-${userId}`,
        name: `User ${userId}`,
        email: null,
        emailVerified: null,
        image: null,
        emoji: null,
        birthday: null,
        createdAt: baseDate,
        updatedAt: baseDate,
        source: 'SIGNUP' as const,
        username: `user${userId}`,
        onboarded: true,
        accountType: 'PARTICIPANT' as const,
        preferredContactMethod: null,
        quality: [
          {
            id: `quality-${userId}`,
            createdAt: baseDate,
            updatedAt: baseDate,
            userId: `user-${userId}`,
            score: 100
          }
        ]
      }
    },
    task: {
      id: `task-${compIdx}`,
      sweepstakesId: 'sweepstakes-1',
      index: compIdx,
      config: {
        name: `Task ${compIdx}`,
        type: 'TWITTER_FOLLOW'
      }
    }
  };

  return {
    ...mockCompletion,
    value: 1
  };
};

const createMockAllocation = (
  participantId: string,
  prizeId: string
): Prisma.SweepstakesAllocationGetPayload<{}> => {
  const baseDate = new Date('2024-01-01');
  return {
    id: `allocation-${participantId}-${prizeId}`,
    participantId,
    prizeId,
    createdAt: baseDate,
    updatedAt: baseDate
  };
};

describe('toUniquePrizeDraw', () => {
  it('should prevent the same user from winning multiple prizes', () => {
    const userCount = 100;
    const completionsPerUser = 2;
    const prizeCount = 100;

    const completions: ExpandedEligibleTaskCompletion[] = [];
    for (let userId = 0; userId < userCount; userId++) {
      for (let compIdx = 0; compIdx < completionsPerUser; compIdx++) {
        completions.push(createMockCompletion(userId, compIdx));
      }
    }

    const slots: PrizeSlot[] = Array.from({ length: prizeCount }, (_, i) => ({
      prizeId: `prize-${i}`
    }));

    const draws: DrawInfo[] = [];

    const result = toUniquePrizeDraw({
      slots,
      draws,
      completions,
      criteria: {
        minQualityScore: 0,
        minTasksCompleted: 0,
        allowMultipleWins: false,
        allowUserSelection: false,
        externalPlatforms: null
      },
      allocations: []
    });

    expect(result).toHaveLength(prizeCount);

    const winnerUserIds = result.map((draw) => {
      const completion = completions.find(
        (c) => c.id === draw.taskCompletionId
      );
      return completion?.participant.userId;
    });

    const uniqueUserIds = new Set(winnerUserIds);

    expect(uniqueUserIds.size).toBe(prizeCount);
    expect(winnerUserIds).toHaveLength(prizeCount);

    for (let i = 0; i < winnerUserIds.length; i++) {
      for (let j = i + 1; j < winnerUserIds.length; j++) {
        expect(winnerUserIds[i]).not.toBe(winnerUserIds[j]);
      }
    }
  });

  describe('with allocation enforcement', () => {
    it('should only select users with allocations for specific prizes when allowUserSelection is true', () => {
      const completions: ExpandedEligibleTaskCompletion[] = [];
      for (let userId = 0; userId < 10; userId++) {
        completions.push(createMockCompletion(userId, 0));
      }

      const slots: PrizeSlot[] = [
        { prizeId: 'prize-1' },
        { prizeId: 'prize-2' },
        { prizeId: 'prize-3' }
      ];

      const allocations: Prisma.SweepstakesAllocationGetPayload<{}>[] = [
        createMockAllocation('participant-0', 'prize-1'),
        createMockAllocation('participant-1', 'prize-1'),
        createMockAllocation('participant-2', 'prize-2'),
        createMockAllocation('participant-3', 'prize-2'),
        createMockAllocation('participant-4', 'prize-3'),
        createMockAllocation('participant-5', 'prize-3')
      ];

      const draws: DrawInfo[] = [];

      const result = toUniquePrizeDraw({
        slots,
        draws,
        completions,
        criteria: {
          minQualityScore: 0,
          minTasksCompleted: 0,
          allowMultipleWins: false,
          allowUserSelection: true,
          externalPlatforms: null
        },
        allocations
      });

      expect(result).toHaveLength(3);

      const prize1Winners = result
        .filter((r) => r.prizeId === 'prize-1')
        .map((r) => {
          const comp = completions.find((c) => c.id === r.taskCompletionId);
          return comp?.participant.id;
        });

      const prize2Winners = result
        .filter((r) => r.prizeId === 'prize-2')
        .map((r) => {
          const comp = completions.find((c) => c.id === r.taskCompletionId);
          return comp?.participant.id;
        });

      const prize3Winners = result
        .filter((r) => r.prizeId === 'prize-3')
        .map((r) => {
          const comp = completions.find((c) => c.id === r.taskCompletionId);
          return comp?.participant.id;
        });

      expect(['participant-0', 'participant-1']).toContain(prize1Winners[0]);
      expect(['participant-2', 'participant-3']).toContain(prize2Winners[0]);
      expect(['participant-4', 'participant-5']).toContain(prize3Winners[0]);
    });

    it('should leave slots empty when not enough participants with allocations exist', () => {
      const completions: ExpandedEligibleTaskCompletion[] = [];
      for (let userId = 0; userId < 5; userId++) {
        completions.push(createMockCompletion(userId, 0));
      }

      const slots: PrizeSlot[] = [
        { prizeId: 'prize-1' },
        { prizeId: 'prize-1' },
        { prizeId: 'prize-1' }
      ];

      const allocations: Prisma.SweepstakesAllocationGetPayload<{}>[] = [
        createMockAllocation('participant-0', 'prize-1'),
        createMockAllocation('participant-1', 'prize-1')
      ];

      const draws: DrawInfo[] = [];

      const result = toUniquePrizeDraw({
        slots,
        draws,
        completions,
        criteria: {
          minQualityScore: 0,
          minTasksCompleted: 0,
          allowMultipleWins: false,
          allowUserSelection: true,
          externalPlatforms: null
        },
        allocations
      });

      expect(result).toHaveLength(2);

      const winnerParticipantIds = result.map((r) => {
        const comp = completions.find((c) => c.id === r.taskCompletionId);
        return comp?.participant.id;
      });

      expect(new Set(winnerParticipantIds)).toEqual(
        new Set(['participant-0', 'participant-1'])
      );
    });

    it('should respect both allocations and previously drawn users', () => {
      const completions: ExpandedEligibleTaskCompletion[] = [];
      for (let userId = 0; userId < 6; userId++) {
        completions.push(createMockCompletion(userId, 0));
      }

      const slots: PrizeSlot[] = [
        { prizeId: 'prize-1' },
        { prizeId: 'prize-2' }
      ];

      const allocations: Prisma.SweepstakesAllocationGetPayload<{}>[] = [
        createMockAllocation('participant-0', 'prize-1'),
        createMockAllocation('participant-1', 'prize-1'),
        createMockAllocation('participant-2', 'prize-2'),
        createMockAllocation('participant-3', 'prize-2')
      ];

      const draws: DrawInfo[] = [{ drawId: 'draw-1', userId: 'user-0' }];

      const result = toUniquePrizeDraw({
        slots,
        draws,
        completions,
        criteria: {
          minQualityScore: 0,
          minTasksCompleted: 0,
          allowMultipleWins: false,
          allowUserSelection: true,
          externalPlatforms: null
        },
        allocations
      });

      expect(result).toHaveLength(2);

      const winnerParticipantIds = result.map((r) => {
        const comp = completions.find((c) => c.id === r.taskCompletionId);
        return comp?.participant.id;
      });

      expect(winnerParticipantIds).not.toContain('participant-0');
    });

    it('should exclude users without allocations in the pool when picking', () => {
      const completions: ExpandedEligibleTaskCompletion[] = [];
      for (let userId = 0; userId < 20; userId++) {
        completions.push(createMockCompletion(userId, 0));
      }

      const slots: PrizeSlot[] = [
        { prizeId: 'prize-1' },
        { prizeId: 'prize-1' },
        { prizeId: 'prize-1' }
      ];

      const allocations: Prisma.SweepstakesAllocationGetPayload<{}>[] = [
        createMockAllocation('participant-10', 'prize-1'),
        createMockAllocation('participant-11', 'prize-1'),
        createMockAllocation('participant-12', 'prize-1')
      ];

      const draws: DrawInfo[] = [];

      const result = toUniquePrizeDraw({
        slots,
        draws,
        completions,
        criteria: {
          minQualityScore: 0,
          minTasksCompleted: 0,
          allowMultipleWins: false,
          allowUserSelection: true,
          externalPlatforms: null
        },
        allocations
      });

      expect(result).toHaveLength(3);

      const winnerParticipantIds = result.map((r) => {
        const comp = completions.find((c) => c.id === r.taskCompletionId);
        return comp?.participant.id;
      });

      expect(winnerParticipantIds).toContain('participant-10');
      expect(winnerParticipantIds).toContain('participant-11');
      expect(winnerParticipantIds).toContain('participant-12');
    });

    it('should work correctly with multiple prizes and different allocations', () => {
      const completions: ExpandedEligibleTaskCompletion[] = [];
      for (let userId = 0; userId < 10; userId++) {
        completions.push(createMockCompletion(userId, 0));
      }

      const slots: PrizeSlot[] = [
        { prizeId: 'prize-1' },
        { prizeId: 'prize-1' },
        { prizeId: 'prize-2' },
        { prizeId: 'prize-2' },
        { prizeId: 'prize-3' }
      ];

      const allocations: Prisma.SweepstakesAllocationGetPayload<{}>[] = [
        createMockAllocation('participant-0', 'prize-1'),
        createMockAllocation('participant-1', 'prize-1'),
        createMockAllocation('participant-2', 'prize-1'),
        createMockAllocation('participant-3', 'prize-2'),
        createMockAllocation('participant-4', 'prize-2'),
        createMockAllocation('participant-5', 'prize-2'),
        createMockAllocation('participant-6', 'prize-3'),
        createMockAllocation('participant-7', 'prize-3')
      ];

      const draws: DrawInfo[] = [];

      const result = toUniquePrizeDraw({
        slots,
        draws,
        completions,
        criteria: {
          minQualityScore: 0,
          minTasksCompleted: 0,
          allowMultipleWins: false,
          allowUserSelection: true,
          externalPlatforms: null
        },
        allocations
      });

      expect(result).toHaveLength(5);

      const uniqueWinners = new Set(
        result.map((r) => {
          const comp = completions.find((c) => c.id === r.taskCompletionId);
          return comp?.participant.userId;
        })
      );

      expect(uniqueWinners.size).toBe(5);

      const prize1Count = result.filter((r) => r.prizeId === 'prize-1').length;
      const prize2Count = result.filter((r) => r.prizeId === 'prize-2').length;
      const prize3Count = result.filter((r) => r.prizeId === 'prize-3').length;

      expect(prize1Count).toBe(2);
      expect(prize2Count).toBe(2);
      expect(prize3Count).toBe(1);
    });
  });
});

describe('toDuplicatePrizeDraw', () => {
  it('should allow duplicate winners across different prizes', () => {
    const completions: ExpandedEligibleTaskCompletion[] = [];
    for (let userId = 0; userId < 5; userId++) {
      completions.push(createMockCompletion(userId, 0));
    }

    const slots: PrizeSlot[] = [
      { prizeId: 'prize-1' },
      { prizeId: 'prize-2' },
      { prizeId: 'prize-3' }
    ];

    const draws: DrawInfo[] = [];

    const result = toDuplicatePrizeDraw({
      slots,
      draws,
      completions,
      criteria: {
        minQualityScore: 0,
        minTasksCompleted: 0,
        allowMultipleWins: true,
        allowUserSelection: false,
        externalPlatforms: null
      },
      allocations: []
    });

    expect(result).toHaveLength(3);
  });

  describe('with allocation enforcement', () => {
    it('should only select users with allocations per prize slot when allowUserSelection is true', () => {
      const completions: ExpandedEligibleTaskCompletion[] = [];
      for (let userId = 0; userId < 10; userId++) {
        completions.push(createMockCompletion(userId, 0));
      }

      const slots: PrizeSlot[] = [
        { prizeId: 'prize-1' },
        { prizeId: 'prize-2' },
        { prizeId: 'prize-3' }
      ];

      const allocations: Prisma.SweepstakesAllocationGetPayload<{}>[] = [
        createMockAllocation('participant-0', 'prize-1'),
        createMockAllocation('participant-1', 'prize-1'),
        createMockAllocation('participant-2', 'prize-2'),
        createMockAllocation('participant-3', 'prize-2'),
        createMockAllocation('participant-4', 'prize-3'),
        createMockAllocation('participant-5', 'prize-3')
      ];

      const draws: DrawInfo[] = [];

      const result = toDuplicatePrizeDraw({
        slots,
        draws,
        completions,
        criteria: {
          minQualityScore: 0,
          minTasksCompleted: 0,
          allowMultipleWins: true,
          allowUserSelection: true,
          externalPlatforms: null
        },
        allocations
      });

      expect(result).toHaveLength(3);

      const prize1Winners = result
        .filter((r) => r.prizeId === 'prize-1')
        .map((r) => {
          const comp = completions.find((c) => c.id === r.taskCompletionId);
          return comp?.participant.id;
        });

      const prize2Winners = result
        .filter((r) => r.prizeId === 'prize-2')
        .map((r) => {
          const comp = completions.find((c) => c.id === r.taskCompletionId);
          return comp?.participant.id;
        });

      const prize3Winners = result
        .filter((r) => r.prizeId === 'prize-3')
        .map((r) => {
          const comp = completions.find((c) => c.id === r.taskCompletionId);
          return comp?.participant.id;
        });

      expect(['participant-0', 'participant-1']).toContain(prize1Winners[0]);
      expect(['participant-2', 'participant-3']).toContain(prize2Winners[0]);
      expect(['participant-4', 'participant-5']).toContain(prize3Winners[0]);
    });

    it('should allow same user to win multiple prizes when allowMultipleWins is true', () => {
      const completions: ExpandedEligibleTaskCompletion[] = [];
      for (let userId = 0; userId < 3; userId++) {
        completions.push(createMockCompletion(userId, 0));
      }

      const slots: PrizeSlot[] = [
        { prizeId: 'prize-1' },
        { prizeId: 'prize-2' },
        { prizeId: 'prize-3' }
      ];

      const allocations: Prisma.SweepstakesAllocationGetPayload<{}>[] = [
        createMockAllocation('participant-0', 'prize-1'),
        createMockAllocation('participant-0', 'prize-2'),
        createMockAllocation('participant-0', 'prize-3')
      ];

      const draws: DrawInfo[] = [];

      const result = toDuplicatePrizeDraw({
        slots,
        draws,
        completions,
        criteria: {
          minQualityScore: 0,
          minTasksCompleted: 0,
          allowMultipleWins: true,
          allowUserSelection: true,
          externalPlatforms: null
        },
        allocations
      });

      expect(result).toHaveLength(3);

      const winnerParticipantIds = result.map((r) => {
        const comp = completions.find((c) => c.id === r.taskCompletionId);
        return comp?.participant.id;
      });

      expect(
        winnerParticipantIds.filter((id) => id === 'participant-0').length
      ).toBe(3);
    });

    it('should leave a slot empty when it has no eligible participants with allocations', () => {
      const completions: ExpandedEligibleTaskCompletion[] = [];
      for (let userId = 0; userId < 5; userId++) {
        completions.push(createMockCompletion(userId, 0));
      }

      const slots: PrizeSlot[] = [
        { prizeId: 'prize-1' },
        { prizeId: 'prize-2' }
      ];

      const allocations: Prisma.SweepstakesAllocationGetPayload<{}>[] = [
        createMockAllocation('participant-0', 'prize-1')
      ];

      const draws: DrawInfo[] = [];

      const result = toDuplicatePrizeDraw({
        slots,
        draws,
        completions,
        criteria: {
          minQualityScore: 0,
          minTasksCompleted: 0,
          allowMultipleWins: true,
          allowUserSelection: true,
          externalPlatforms: null
        },
        allocations
      });

      expect(result).toHaveLength(1);
      expect(result[0].prizeId).toBe('prize-1');

      const winner = completions.find(
        (c) => c.id === result[0].taskCompletionId
      );

      expect(winner?.participant.id).toBe('participant-0');
    });

    it('should handle multiple slots for same prize with allocations', () => {
      const completions: ExpandedEligibleTaskCompletion[] = [];
      for (let userId = 0; userId < 10; userId++) {
        completions.push(createMockCompletion(userId, 0));
      }

      const slots: PrizeSlot[] = [
        { prizeId: 'prize-1' },
        { prizeId: 'prize-1' },
        { prizeId: 'prize-1' }
      ];

      const allocations: Prisma.SweepstakesAllocationGetPayload<{}>[] = [
        createMockAllocation('participant-0', 'prize-1'),
        createMockAllocation('participant-1', 'prize-1'),
        createMockAllocation('participant-2', 'prize-1')
      ];

      const draws: DrawInfo[] = [];

      const result = toDuplicatePrizeDraw({
        slots,
        draws,
        completions,
        criteria: {
          minQualityScore: 0,
          minTasksCompleted: 0,
          allowMultipleWins: true,
          allowUserSelection: true,
          externalPlatforms: null
        },
        allocations
      });

      expect(result).toHaveLength(3);

      const winnerParticipantIds = result.map((r) => {
        const comp = completions.find((c) => c.id === r.taskCompletionId);
        return comp?.participant.id;
      });

      for (const participantId of winnerParticipantIds) {
        expect(['participant-0', 'participant-1', 'participant-2']).toContain(
          participantId
        );
      }
    });

    it('should respect allocation filtering for each slot independently', () => {
      const completions: ExpandedEligibleTaskCompletion[] = [];
      for (let userId = 0; userId < 6; userId++) {
        completions.push(createMockCompletion(userId, 0));
      }

      const slots: PrizeSlot[] = [
        { prizeId: 'prize-1' },
        { prizeId: 'prize-2' },
        { prizeId: 'prize-1' }
      ];

      const allocations: Prisma.SweepstakesAllocationGetPayload<{}>[] = [
        createMockAllocation('participant-0', 'prize-1'),
        createMockAllocation('participant-1', 'prize-1'),
        createMockAllocation('participant-2', 'prize-2'),
        createMockAllocation('participant-3', 'prize-2')
      ];

      const draws: DrawInfo[] = [];

      const result = toDuplicatePrizeDraw({
        slots,
        draws,
        completions,
        criteria: {
          minQualityScore: 0,
          minTasksCompleted: 0,
          allowMultipleWins: true,
          allowUserSelection: true,
          externalPlatforms: null
        },
        allocations
      });

      expect(result).toHaveLength(3);

      const prize1Winners = result
        .filter((r) => r.prizeId === 'prize-1')
        .map((r) => {
          const comp = completions.find((c) => c.id === r.taskCompletionId);
          return comp?.participant.id;
        });

      const prize2Winners = result
        .filter((r) => r.prizeId === 'prize-2')
        .map((r) => {
          const comp = completions.find((c) => c.id === r.taskCompletionId);
          return comp?.participant.id;
        });

      expect(prize1Winners).toHaveLength(2);
      expect(prize2Winners).toHaveLength(1);

      for (const participantId of prize1Winners) {
        expect(['participant-0', 'participant-1']).toContain(participantId);
      }

      for (const participantId of prize2Winners) {
        expect(['participant-2', 'participant-3']).toContain(participantId);
      }
    });
  });
});

describe('prize draw characterization', () => {
  const criteria = (
    overrides: Partial<Parameters<typeof toUniquePrizeDraw>[0]['criteria']> = {}
  ) => ({
    minQualityScore: 0,
    minTasksCompleted: 0,
    allowMultipleWins: false,
    allowUserSelection: false,
    externalPlatforms: null,
    ...overrides
  });

  const alice = buildExpandedCompletion({ id: 'c-alice', userId: 'alice' });
  const alice2 = buildExpandedCompletion({ id: 'c-alice-2', userId: 'alice' });
  const bob = buildExpandedCompletion({ id: 'c-bob', userId: 'bob' });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('toUniquePrizeDraw', () => {
    it('returns no draws when there are no slots', () => {
      expect(
        toUniquePrizeDraw({
          slots: [],
          draws: [],
          criteria: criteria(),
          completions: [alice],
          allocations: []
        })
      ).toEqual([]);
    });

    it('builds a winner create input with a generated id for each slot', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0);

      const result = toUniquePrizeDraw({
        slots: [{ prizeId: 'p-1' }],
        draws: [],
        criteria: criteria(),
        completions: [alice, bob],
        allocations: []
      });

      expect(result).toEqual([
        {
          id: expect.any(String),
          prizeId: 'p-1',
          result: 'WINNER',
          taskCompletionId: 'c-alice'
        }
      ]);
    });

    it('excludes every completion of a user that already won in the same call', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0);

      const result = toUniquePrizeDraw({
        slots: [{ prizeId: 'p-1' }, { prizeId: 'p-2' }],
        draws: [],
        criteria: criteria(),
        completions: [alice, alice2, bob],
        allocations: []
      });

      expect(result.map((d) => d.taskCompletionId)).toEqual([
        'c-alice',
        'c-bob'
      ]);
    });

    it('returns no draws when every user was already drawn before', () => {
      expect(
        toUniquePrizeDraw({
          slots: [{ prizeId: 'p-1' }],
          draws: [
            { drawId: 'd-1', userId: 'alice' },
            { drawId: 'd-2', userId: 'bob' }
          ],
          criteria: criteria(),
          completions: [alice, bob],
          allocations: []
        })
      ).toEqual([]);
    });

    it('weights the pick by completion value', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const light = buildExpandedCompletion({ id: 'c-light', userId: 'u1' });
      const heavy = buildExpandedCompletion({
        id: 'c-heavy',
        userId: 'u2',
        value: 4
      });

      const result = toUniquePrizeDraw({
        slots: [{ prizeId: 'p-1' }],
        draws: [],
        criteria: criteria(),
        completions: [light, heavy],
        allocations: []
      });

      expect(result[0].taskCompletionId).toBe('c-heavy');
    });

    it('skips a slot without allocated participants and still fills later slots', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0);

      const result = toUniquePrizeDraw({
        slots: [{ prizeId: 'p-1' }, { prizeId: 'p-2' }],
        draws: [],
        criteria: criteria({ allowUserSelection: true }),
        completions: [alice, bob],
        allocations: [buildAllocation('participant-bob', 'p-2')]
      });

      expect(result).toEqual([
        {
          id: expect.any(String),
          prizeId: 'p-2',
          result: 'WINNER',
          taskCompletionId: 'c-bob'
        }
      ]);
    });

    it('generates a distinct nanoid for each draw', () => {
      const result = toUniquePrizeDraw({
        slots: [{ prizeId: 'p-1' }, { prizeId: 'p-2' }],
        draws: [],
        criteria: criteria(),
        completions: [alice, bob],
        allocations: []
      });

      const ids = result.map((d) => d.id);
      expect(ids).toHaveLength(2);
      expect(new Set(ids).size).toBe(2);
      for (const id of ids) {
        expect(id).toMatch(/^[A-Za-z0-9_-]{21}$/);
      }
    });

    it('ignores allocations when user selection is disabled', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0);

      const result = toUniquePrizeDraw({
        slots: [{ prizeId: 'p-1' }],
        draws: [],
        criteria: criteria({ allowUserSelection: false }),
        completions: [alice],
        allocations: [buildAllocation('participant-alice', 'p-other')]
      });

      expect(result).toHaveLength(1);
    });

    it('throws when every remaining completion has zero value', () => {
      expect(() =>
        toUniquePrizeDraw({
          slots: [{ prizeId: 'p-1' }],
          draws: [],
          criteria: criteria(),
          completions: [
            buildExpandedCompletion({ id: 'c-zero', userId: 'u', value: 0 })
          ],
          allocations: []
        })
      ).toThrow('Total weight must be greater than 0');
    });

    it('can pick a zero value completion that precedes a positive one', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0);
      const zero = buildExpandedCompletion({
        id: 'c-zero',
        userId: 'u-zero',
        value: 0
      });
      const positive = buildExpandedCompletion({
        id: 'c-positive',
        userId: 'u-positive',
        value: 1
      });

      const result = toUniquePrizeDraw({
        slots: [{ prizeId: 'p-1' }],
        draws: [],
        criteria: criteria(),
        completions: [zero, positive],
        allocations: []
      });

      expect(result[0].taskCompletionId).toBe('c-zero');
    });
  });

  describe('toDuplicatePrizeDraw', () => {
    it('returns no draws when there are no slots', () => {
      expect(
        toDuplicatePrizeDraw({
          slots: [],
          draws: [],
          criteria: criteria({ allowMultipleWins: true }),
          completions: [alice],
          allocations: []
        })
      ).toEqual([]);
    });

    it('lets the same completion win every slot', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0);

      const result = toDuplicatePrizeDraw({
        slots: [{ prizeId: 'p-1' }, { prizeId: 'p-2' }],
        draws: [],
        criteria: criteria({ allowMultipleWins: true }),
        completions: [alice, bob],
        allocations: []
      });

      expect(result).toEqual([
        {
          id: expect.any(String),
          prizeId: 'p-1',
          result: 'WINNER',
          taskCompletionId: 'c-alice'
        },
        {
          id: expect.any(String),
          prizeId: 'p-2',
          result: 'WINNER',
          taskCompletionId: 'c-alice'
        }
      ]);
    });

    it('generates a distinct nanoid for each draw', () => {
      const result = toDuplicatePrizeDraw({
        slots: [{ prizeId: 'p-1' }, { prizeId: 'p-1' }],
        draws: [],
        criteria: criteria({ allowMultipleWins: true }),
        completions: [alice],
        allocations: []
      });

      const ids = result.map((d) => d.id);
      expect(ids).toHaveLength(2);
      expect(new Set(ids).size).toBe(2);
      for (const id of ids) {
        expect(id).toMatch(/^[A-Za-z0-9_-]{21}$/);
      }
    });

    it('weights the pick by completion value', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const light = buildExpandedCompletion({ id: 'c-light', userId: 'u1' });
      const heavy = buildExpandedCompletion({
        id: 'c-heavy',
        userId: 'u2',
        value: 4
      });

      const result = toDuplicatePrizeDraw({
        slots: [{ prizeId: 'p-1' }],
        draws: [],
        criteria: criteria({ allowMultipleWins: true }),
        completions: [light, heavy],
        allocations: []
      });

      expect(result[0].taskCompletionId).toBe('c-heavy');
    });

    it('does not exclude users that were previously drawn', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0);

      const result = toDuplicatePrizeDraw({
        slots: [{ prizeId: 'p-1' }],
        draws: [{ drawId: 'd-1', userId: 'alice' }],
        criteria: criteria({ allowMultipleWins: true }),
        completions: [alice],
        allocations: []
      });

      expect(result[0].taskCompletionId).toBe('c-alice');
    });

    it('only considers allocated participants for each slot when user selection is enabled', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0);

      const result = toDuplicatePrizeDraw({
        slots: [{ prizeId: 'p-1' }, { prizeId: 'p-2' }],
        draws: [],
        criteria: criteria({ allowUserSelection: true }),
        completions: [alice, bob],
        allocations: [buildAllocation('participant-bob', 'p-2')]
      });

      expect(result).toEqual([
        {
          id: expect.any(String),
          prizeId: 'p-2',
          result: 'WINNER',
          taskCompletionId: 'c-bob'
        }
      ]);
    });

    it('throws when every eligible completion has zero value', () => {
      expect(() =>
        toDuplicatePrizeDraw({
          slots: [{ prizeId: 'p-1' }],
          draws: [],
          criteria: criteria({ allowMultipleWins: true }),
          completions: [
            buildExpandedCompletion({ id: 'c-zero', userId: 'u', value: 0 })
          ],
          allocations: []
        })
      ).toThrow('Total weight must be greater than 0');
    });
  });
});
