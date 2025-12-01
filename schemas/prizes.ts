import { Prisma } from '@prisma/client';
import {
  toUserParticipationSchema,
  USER_PARTICIPATION_INCLUDE_QUERY
} from './participants';
import { SweepstakesPrizeSchema } from './giveaway/schemas';
import { ApplicationError } from '@/lib/errors';
import {
  TASK_COMPLETION_INCLUDE_QUERY,
  toTaskCompletion
} from '@/lib/task/queries';

export const PRIZE_WINNERS_INCLUDE_QUERY = (input: {
  sweepstakesId?: string;
  slug: string;
  userId: string;
}) =>
  ({
    draws: {
      include: {
        taskCompletion: {
          include: {
            ...TASK_COMPLETION_INCLUDE_QUERY,
            user: {
              include: USER_PARTICIPATION_INCLUDE_QUERY(input)
            }
          }
        }
      }
    }
  }) satisfies Prisma.PrizeInclude;

export const toSweepstakesPrizes = (
  prizes: Prisma.PrizeGetPayload<{
    include: ReturnType<typeof PRIZE_WINNERS_INCLUDE_QUERY>;
  }>[],
  totalTasks: number
): SweepstakesPrizeSchema[] => {
  return prizes.map((prize) => {
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

    if (prize.index == null) {
      throw new ApplicationError({
        code: 'VALIDATION_ERROR',
        message: `Prize with ID ${prize.id} has no index`
      });
    }

    return {
      id: prize.id,
      name: prize.name,
      position: prize.index,
      quota: prize.quota,
      draws: prize.draws.map((draw) => ({
        id: draw.id,
        createdAt: draw.createdAt,
        updatedAt: draw.updatedAt,
        result: draw.result,
        disqualificationReason: draw.disqualificationReason,
        taskCompletion: toTaskCompletion(draw.taskCompletion),
        participant: toUserParticipationSchema(
          draw.taskCompletion.user,
          totalTasks
        )
      }))
    };
  });
};
