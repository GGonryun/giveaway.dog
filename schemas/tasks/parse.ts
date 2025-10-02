import { Prisma, Task } from '@prisma/client';
import { taskSchema, TaskSchema } from './schemas';
import { ApplicationError } from '@/lib/errors';
import { toJsonObject } from '@/lib/json';
import { ParticipantEntrySchema } from '../teams';
import { toTaskInput } from '../giveaway/input';
import { DEFAULT_SWEEPSTAKES_NAME } from '../giveaway/defaults';

export const toTaskSchema = (stored: Task): TaskSchema => {
  const json = toJsonObject(stored.config);
  const parsed = taskSchema.safeParse({
    ...json,
    id: stored.id
  });
  if (parsed.success) {
    return parsed.data;
  } else {
    throw new ApplicationError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to parse task config',
      cause: parsed.error
    });
  }
};

export const toParticipantEntry = (
  entry: Prisma.TaskCompletionGetPayload<{
    include: {
      task: {
        include: {
          sweepstakes: {
            include: {
              details: true;
            };
          };
        };
      };
    };
  }>
): ParticipantEntrySchema => {
  const raw = toTaskInput(entry.task);
  const task = taskSchema.safeParse(raw);
  if (!task.success) {
    throw new Error('Invalid task config in entry');
  }
  return {
    completionId: entry.id,
    completedAt: entry.completedAt,
    taskId: entry.taskId,
    taskName: task.data.title,
    sweepstakeId: entry.task.sweepstakes.id,
    sweepstakeName:
      entry.task.sweepstakes.details?.name ?? DEFAULT_SWEEPSTAKES_NAME
  };
};
