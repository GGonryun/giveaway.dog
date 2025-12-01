import { ApplicationError } from '@/lib/errors';
import { BonusTimedTaskSchema } from '../schemas';

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
