import { ApplicationError } from '@/lib/errors';
import { BonusLimitedTaskSchema, BonusTimedTaskSchema } from '../schemas';
import { PrismaClient } from '@prisma/client';

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
