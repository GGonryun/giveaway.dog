import { CompletionStatus, Prisma } from '@prisma/client';
import z from 'zod';
import { taskSchema, toTaskSchemaSafe } from './schemas';
import { DEFAULT_SWEEPSTAKES_NAME } from '@/lib/settings';

export const taskCompletionSchema = z.object({
  id: z.string(),
  completedAt: z.coerce.date(),
  status: z.nativeEnum(CompletionStatus),
  proof: z.unknown(),
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
  proof: true,
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
  task: toTaskSchemaSafe(completion.task),
  proof: completion.proof,
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
