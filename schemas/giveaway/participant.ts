import { DeepNullable } from '@/lib/types';
import { ParticipantSweepstakesGetPayload } from './db';
import { GiveawayPrizeSchema } from './schemas';
import z from 'zod';
import { toUserSchema } from '../user';
import { toTaskInput } from './input';
import { taskSchema } from '../tasks/schemas';
import { CompletionStatus, TaskType } from '@prisma/client';

export const taskCompletionSchema = z.object({
  completionId: z.string(),
  completedAt: z.date().nullable(),
  taskId: z.string(),
  taskName: z.string(),
  taskType: z.nativeEnum(TaskType),
  sweepstakeId: z.string(),
  sweepstakeName: z.string(),
  status: z.nativeEnum(CompletionStatus)
});
export type TaskCompletionSchema = z.infer<typeof taskCompletionSchema>;

export const winnerSchema = z.object({
  prizeId: z.string(),
  prizeName: z.string().nullable()
});

export const sweepstakesParticipantSchema = z.object({
  id: z.string(),
  createdAt: z.date(),
  name: z.string().nullable(),
  email: z.string().nullable(),
  country: z.string(),
  entries: taskCompletionSchema.array(),
  lastEntryAt: z.string(),
  qualityScore: z.number(),
  engagement: z.number(),
  status: z.enum(['active', 'blocked']),
  userAgent: z.string(),
  emailVerified: z.boolean()
});

export type SweepstakesParticipantSchema = z.infer<
  typeof sweepstakesParticipantSchema
>;

export const toSweepstakesPrizes = (
  prizes: ParticipantSweepstakesGetPayload['prizes']
): DeepNullable<GiveawayPrizeSchema>[] => {
  return prizes.map((p) => ({
    prizeId: p.id,
    prizeName: p.name ?? null,
    quota: p.quota,
    winners: toWinners(p.winners)
  }));
};

const toWinners = (
  winners: ParticipantSweepstakesGetPayload['prizes'][number]['winners']
): GiveawayPrizeSchema['winners'] => {
  return winners.map((w) => {
    const raw = toTaskInput(w.taskCompletion.task);
    const task = taskSchema.safeParse(raw);
    return {
      ...toUserSchema(w.taskCompletion.user),
      winningTaskName: task.success ? task.data.title : undefined
    };
  });
};
