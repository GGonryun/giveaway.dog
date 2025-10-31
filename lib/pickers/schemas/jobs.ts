import { z } from 'zod';
import { twitterActionsSchema } from './data';

const twitterSyncJob = z.object({
  type: z.literal('TWITTER_SYNC'),
  lastRunAt: z.date().nullable().default(null),
  nextRunAt: z.date().nullable().default(null),
  tweetId: z.string(),
  actions: z.array(twitterActionsSchema),
  error: z.string().nullable().default(null)
});

export const pickerJobSchema = z.discriminatedUnion('type', [twitterSyncJob]);

export type PickerJobSchema = z.infer<typeof pickerJobSchema>;
