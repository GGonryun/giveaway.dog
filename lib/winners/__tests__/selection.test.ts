import { describe, it, expect } from 'vitest';
import { toUniquePrizeDraw, toDuplicatePrizeDraw } from '../selection';
import type { ExpandedEligibleTaskCompletion } from '../completions';
import type { PrizeSlot, DrawInfo } from '../slots';
import type { EligibleTaskCompletion } from '@/lib/task/queries';
import type { Prisma } from '@prisma/client';

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
        quality: [
          {
            id: `quality-${userId}`,
            createdAt: baseDate,
            updatedAt: baseDate,
            userId: `user-${userId}`,
            score: 100,
            metrics: {}
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

    it('should throw error when not enough participants with allocations exist', () => {
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

      expect(() =>
        toUniquePrizeDraw({
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
        })
      ).toThrow('Not enough eligible participants');
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

    it('should throw error when a slot has no eligible participants with allocations', () => {
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

      expect(() =>
        toDuplicatePrizeDraw({
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
        })
      ).toThrow(
        'Not enough eligible participants to fill prize slot for prize prize-2'
      );
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
