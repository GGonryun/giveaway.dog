import { ApplicationError } from '@giveaway/util-errors';
import { Nil } from '@giveaway/util-types/types';
import { Prisma } from '@prisma/client';

export function validateSweepstakesState(
  task: Nil<
    Prisma.TaskGetPayload<{
      include: { sweepstakes: { include: { timing: true; visibility: true } } };
    }>
  >
): asserts task is NonNullable<typeof task> {
  if (!task) {
    throw new ApplicationError({
      code: 'NOT_FOUND',
      message:
        'Task does not exist. Refresh the page and try again, or contact support if the error persists.'
    });
  }

  if (!task.sweepstakes.timing) {
    throw new ApplicationError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Giveaway timing data is missing. Please contact support.'
    });
  }

  if (!task.sweepstakes.timing.startDate || !task.sweepstakes.timing.endDate) {
    throw new ApplicationError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Giveaway timing data is incomplete. Please contact support.'
    });
  }

  // Check if giveaway is in a valid state for accepting entries
  if (task.sweepstakes.status === 'DRAFT') {
    throw new ApplicationError({
      code: 'FORBIDDEN',
      message: 'This giveaway has not been published yet.'
    });
  }

  if (task.sweepstakes.status === 'COMPLETED') {
    throw new ApplicationError({
      code: 'FORBIDDEN',
      message: 'This giveaway is no longer accepting entries.'
    });
  }

  const now = new Date();
  const startDate = new Date(task.sweepstakes.timing.startDate);
  const endDate = new Date(task.sweepstakes.timing.endDate);

  // Check if giveaway has started
  if (now < startDate) {
    throw new ApplicationError({
      code: 'FORBIDDEN',
      message: 'This giveaway has not started yet.'
    });
  }

  // Check if giveaway has ended
  if (now > endDate) {
    throw new ApplicationError({
      code: 'FORBIDDEN',
      silent: true,
      message: 'This giveaway has ended and is no longer accepting entries.'
    });
  }
}
