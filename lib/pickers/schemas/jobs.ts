import { z } from 'zod';
import { twitterActionsSchema } from './data';
import { ApplicationError } from '@/lib/errors';

const twitterSyncJob = z.object({
  type: z.literal('TWITTER_SYNC'),
  lastRunAt: z.date().nullable().default(null),
  nextRunAt: z.date().nullable().default(null),
  tweetId: z.string(),
  actions: z.array(twitterActionsSchema),
  error: z.string().nullable().default(null)
});

const twitterPauseJob = z.object({
  type: z.literal('PAUSE')
});

export const pickerJobSchema = z.discriminatedUnion('type', [
  twitterSyncJob,
  twitterPauseJob
]);

export type PickerJobSchema = z.infer<typeof pickerJobSchema>;

export const parsePickerJobSchema = (data: unknown): PickerJobSchema => {
  const result = pickerJobSchema.safeParse(data);

  if (!result.success) {
    console.error('Picker job schema validation error:', result.error);
    throw new ApplicationError({
      code: 'VALIDATION_ERROR',
      cause: result.error,
      message: 'Invalid picker job schema'
    });
  }

  return result.data;
};
