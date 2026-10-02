import { z } from 'zod';

export const sweepstakesJobDataSchema = z.object({
  taskId: z.string(),
  tweetId: z.string(),
  tweetUrl: z.string(),
  result: z
    .object({
      totalImported: z.number(),
      newUsers: z.number(),
      existingUsers: z.number(),
      completionsValidated: z.number(),
      completionsCreated: z.number()
    })
    .optional(),
  error: z.string().optional()
});

export type SweepstakesJobData = z.infer<typeof sweepstakesJobDataSchema>;
