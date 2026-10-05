import { z } from 'zod';
import { derivedSweepstakesStatusSchema } from '@giveaway/sweepstakes-model/sweepstakes';

export const participationHistoryItemSchema = z.object({
  sweepstakesId: z.string(),
  sweepstakesName: z.string(),
  sweepstakesStartDate: z.coerce.date(),
  sweepstakesEndDate: z.coerce.date(),
  engagement: z.number(),
  totalTasks: z.number(),
  completedTasks: z.number(),
  lastParticipatedAt: z.string(),
  banner: z.string().nullable(),
  sweepstakesStatus: derivedSweepstakesStatusSchema,
  hasWon: z.boolean()
});

export type ParticipationHistoryItem = z.infer<
  typeof participationHistoryItemSchema
>;

export const participationHistorySchema = z.array(
  participationHistoryItemSchema
);

export type ParticipationHistory = z.infer<typeof participationHistorySchema>;
