import { ApplicationError } from '@/lib/errors';
import {
  BonusLimitedTaskSchema,
  BonusLoyaltyTaskSchema,
  BonusTimedTaskSchema
} from '../schemas';
import { PrismaClient } from '@prisma/client';
import { ValidateTaskInput } from './integrations';
import { getLoyalty } from '@/lib/loyalty/db';
import { isLoyal } from '@/lib/loyalty/validation';

export const checkBonusTimed = async (task: BonusTimedTaskSchema) => {
  // check to see if the current time is within the task's time window
  const now = new Date();
  if (task.startDate) {
    const startDate = new Date(task.startDate);
    if (now < startDate) {
      throw new ApplicationError({
        code: 'BAD_REQUEST',
        message: 'This bonus timed task is not active yet.'
      });
    }
  }
  if (task.endDate) {
    const endDate = new Date(task.endDate);
    if (now > endDate) {
      throw new ApplicationError({
        code: 'BAD_REQUEST',
        message: 'This bonus timed task has expired.'
      });
    }
  }
};

export const checkBonusLimited = async (
  db: PrismaClient,
  { task }: { task: BonusLimitedTaskSchema }
) => {
  // check to see if the current number of entrants is below the maxEntrants
  const max = task.maxEntrants;
  const current = await db.taskCompletion.count({
    where: { taskId: task.id }
  });

  if (current >= max) {
    throw new ApplicationError({
      code: 'BAD_REQUEST',
      message:
        'This bonus limited task has reached its maximum number of entrants.'
    });
  }

  return;
};

export const checkBonusLoyalty = async (
  db: PrismaClient,
  input: ValidateTaskInput<BonusLoyaltyTaskSchema>
) => {
  console.info(
    `Checking loyalty requirements for bonus loyalty task ${input.task.id} for user ${input.userId}`
  );
  // we need to figure out who the team is, and then find every task completion
  // owned by the user for sweepstakes owned by that team
  const loyalty = await getLoyalty(db, input);
  console.info(
    `Checking loyalty requirements for bonus loyalty task ${input.task.id} for user ${input.userId}`
  );

  console.info(
    `User ${input.userId} has loyalty ${loyalty} for bonus loyalty task ${input.task.id}`
  );

  if (isLoyal(loyalty, input.task)) {
    console.info(
      `Bonus loyalty task ${input.task.id} validation passed for user ${input.userId}`
    );

    return;
  }

  throw new ApplicationError({
    code: 'FORBIDDEN',
    message: `You need at least ${input.task.loyaltyRequired} loyalty to complete this tier.`,
    data: {
      userLoyalty: loyalty,
      requiredLoyalty: input.task.loyaltyRequired
    }
  });
};
