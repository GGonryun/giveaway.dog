import { DEFAULT_SWEEPSTAKES_NAME } from '@/schemas/giveaway/defaults';
import { toTaskInput } from '@/schemas/giveaway/input';
import { TaskCompletionSchema } from '@/schemas/giveaway/participant';
import { Prisma } from '@prisma/client';
import { taskSchema } from './schemas';

export const TASK_COMPLETION_INCLUDE_QUERY = {
  task: {
    include: {
      sweepstakes: {
        include: {
          details: true
        }
      }
    }
  }
} satisfies Prisma.TaskCompletionInclude;

export const toTaskCompletion = (
  entry: Prisma.TaskCompletionGetPayload<{
    include: typeof TASK_COMPLETION_INCLUDE_QUERY;
  }>
): TaskCompletionSchema => {
  const raw = toTaskInput(entry.task);
  const task = taskSchema.safeParse(raw);
  if (!task.success) {
    throw new Error('Invalid task config in entry');
  }
  return {
    status: entry.status,
    completionId: entry.id,
    completedAt: entry.completedAt,
    taskId: entry.taskId,
    taskName: task.data.title,
    taskType: task.data.type,
    sweepstakeId: entry.task.sweepstakes.id,
    sweepstakeName:
      entry.task.sweepstakes.details?.name ?? DEFAULT_SWEEPSTAKES_NAME
  };
};

export const ELIGIBLE_TASK_COMPLETION_INCLUDE_QUERY = {
  participant: {
    include: {
      user: {
        include: {
          quality: {
            take: 1,
            orderBy: {
              createdAt: 'desc'
            }
          }
        }
      }
    }
  },
  task: true
} satisfies Prisma.TaskCompletionInclude;

export type EligibleTaskCompletion = Prisma.TaskCompletionGetPayload<{
  include: typeof ELIGIBLE_TASK_COMPLETION_INCLUDE_QUERY;
}>;

export const SWEEPSTAKES_TASK_WHERE_QUERY = (input: {
  sweepstakesId?: string;
  slug: string;
  userId: string;
}) => {
  if (input.sweepstakesId) {
    return {
      sweepstakesId: input.sweepstakesId
    };
  }
  return {
    sweepstakes: {
      team: {
        slug: input.slug,
        members: {
          some: { userId: input.userId }
        }
      }
    }
  } satisfies Prisma.TaskWhereInput;
};
