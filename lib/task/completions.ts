import { CompletionStatus, Prisma } from '@prisma/client';
import z from 'zod';
import { taskSchema } from './schemas';
import { toTaskInput } from '@/schemas/giveaway/input';
import { DEFAULT_SWEEPSTAKES_NAME } from '@/schemas/giveaway/defaults';

export const taskCompletionSchema = z.object({
  id: z.string(),
  completedAt: z.date(),
  status: z.nativeEnum(CompletionStatus),
  task: taskSchema,
  sweepstake: z.object({
    id: z.string(),
    name: z.string()
  })
});

export type TaskCompletionSchema = z.infer<typeof taskCompletionSchema>;

export const TASK_COMPLETIONS_SELECT_QUERY = {
  id: true,
  completedAt: true,
  task: {
    include: {
      sweepstakes: {
        select: {
          details: {
            select: {
              name: true
            }
          }
        }
      }
    }
  },
  status: true
} satisfies Prisma.TaskCompletionSelect;

export const toTaskCompletion = (
  completion: Prisma.TaskCompletionGetPayload<{
    select: typeof TASK_COMPLETIONS_SELECT_QUERY;
  }>
): TaskCompletionSchema => ({
  id: completion.id,
  completedAt: completion.completedAt,
  status: completion.status,
  task: taskSchema.parse(toTaskInput(completion.task)),
  sweepstake: {
    id: completion.task.sweepstakesId,
    name: completion.task.sweepstakes.details?.name ?? DEFAULT_SWEEPSTAKES_NAME
  }
});

export const toMostRecentCompletion = (
  completions: TaskCompletionSchema[]
): Date | null => {
  if (completions.length === 0) {
    return null;
  }

  const sorted = completions
    .filter((c) => c.completedAt !== null)
    .sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());

  return sorted.length > 0 ? sorted[0].completedAt : null;
};
