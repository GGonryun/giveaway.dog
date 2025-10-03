import { Prisma } from '@prisma/client';
import {
  TASK_COMPLETION_INCLUDE_QUERY,
  toTaskCompletion,
  toUserParticipationSchema,
  USER_PARTICIPATION_INCLUDE_QUERY
} from './participants';
import { SweepstakesPrizeSchema } from './giveaway/schemas';
import { ApplicationError } from '@/lib/errors';

export const PRIZE_WINNER_INCLUDE_QUERY = (sweepstakesId?: string) =>
  ({
    winners: {
      include: {
        taskCompletion: {
          include: {
            ...TASK_COMPLETION_INCLUDE_QUERY,
            user: {
              include: USER_PARTICIPATION_INCLUDE_QUERY(sweepstakesId)
            }
          }
        }
      }
    }
  }) satisfies Prisma.PrizeInclude;

export const toSweepstakesPrizes = (
  prizes: Prisma.PrizeGetPayload<{
    include: ReturnType<typeof PRIZE_WINNER_INCLUDE_QUERY>;
  }>[],
  totalTasks: number
): SweepstakesPrizeSchema[] => {
  let index = 0;
  const mapped: SweepstakesPrizeSchema[] = [];
  for (const prize of prizes) {
    if (!prize.quota)
      throw new ApplicationError({
        code: 'VALIDATION_ERROR',
        message: `Prize with ID ${prize.id} has invalid quota`
      });

    if (!prize.name) {
      throw new ApplicationError({
        code: 'VALIDATION_ERROR',
        message: `Prize with ID ${prize.id} has no name`
      });
    }

    for (let i = 0; i < prize.quota; i++) {
      index++;
      const winner = prize.winners.at(i);
      mapped.push({
        id: prize.id,
        name: prize.name,
        position: index,
        winner: winner
          ? {
              id: winner.id,
              createdAt: winner.createdAt,
              updatedAt: winner.updatedAt,
              taskCompletion: toTaskCompletion(winner.taskCompletion),
              participant: toUserParticipationSchema(
                winner.taskCompletion.user,
                totalTasks
              )
            }
          : undefined
      });
    }
  }

  return mapped;
};
