import { z } from 'zod';

export const participationHistoryItemSchema = z.object({
  sweepstakesId: z.string(),
  sweepstakesName: z.string(),
  sweepstakesStartDate: z.date(),
  sweepstakesEndDate: z.date(),
  engagement: z.number(),
  totalTasks: z.number(),
  completedTasks: z.number(),
  lastParticipatedAt: z.string(),
  banner: z.string().nullable(),
  sweepstakesStatus: z.enum(['ACTIVE', 'DRAFT', 'COMPLETED'])
});

export const participationHistorySchema = z.object({
  items: z.array(participationHistoryItemSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  totalPages: z.number()
});

export type ParticipationHistoryItem = z.infer<
  typeof participationHistoryItemSchema
>;
export type ParticipationHistory = z.infer<typeof participationHistorySchema>;
