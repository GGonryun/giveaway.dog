import { Prisma } from '@prisma/client';

import { SweepstakesPrizeSchema } from './giveaway/schemas';
import { ApplicationError } from '@/lib/errors';

import {
  TASK_COMPLETIONS_SELECT_QUERY,
  toTaskCompletion
} from '@/lib/task/completions';
import { toUserSchema, USER_SCHEMA_SELECT_QUERY } from './user';

export const PRIZE_WINNERS_INCLUDE_QUERY = {
  draws: {
    include: {
      taskCompletion: {
        select: {
          ...TASK_COMPLETIONS_SELECT_QUERY,
          participant: {
            include: {
              user: {
                select: USER_SCHEMA_SELECT_QUERY
              }
            }
          }
        }
      }
    }
  }
} satisfies Prisma.PrizeInclude;

export const toSweepstakesPrizes = (
  prizes: Prisma.PrizeGetPayload<{
    include: typeof PRIZE_WINNERS_INCLUDE_QUERY;
  }>[]
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
        participant: toUserSchema(draw.taskCompletion.participant.user)
      }))
    };
  });
};
