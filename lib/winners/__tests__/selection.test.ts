import { describe, it, expect } from 'vitest';
import { toUniquePrizeDraw } from '../selection';
import type { ExpandedEligibleTaskCompletion } from '../completions';
import type { PrizeSlot, DrawInfo } from '../slots';
import type { EligibleTaskCompletion } from '@/lib/task/queries';

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
      completions
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
});
