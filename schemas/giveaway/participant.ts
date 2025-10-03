import { DeepNullable, DeepPartial } from '@/lib/types';
import { ParticipantSweepstakesGetPayload } from './db';
import { GiveawayWinnerSchema } from './schemas';
import z from 'zod';
import { toUserSchema } from '../user';

export const taskCompletionSchema = z.object({
  completionId: z.string(),
  completedAt: z.date().nullable(),
  taskId: z.string(),
  taskName: z.string(),
  sweepstakeId: z.string(),
  sweepstakeName: z.string()
});
export type toTaskCompletionSchema = z.infer<typeof taskCompletionSchema>;

export const sweepstakesParticipantSchema = z.object({
  id: z.string(),
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

export const toSweepstakesWinners = (
  prizes: ParticipantSweepstakesGetPayload['prizes']
): DeepNullable<GiveawayWinnerSchema>[] => {
  return prizes.map((p) => ({
    prizeId: p.id,
    prizeName: p.name ?? null,
    winners: toWinners(p.winners)
  }));
};

const toWinners = (
  winners: ParticipantSweepstakesGetPayload['prizes'][number]['winners']
): GiveawayWinnerSchema['winners'] => {
  return winners.map((w) => toUserSchema(w.taskCompletion.user));
};
