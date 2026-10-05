import { z } from 'zod';
import { twitterV2PickerFormSchema } from './form';
import { PickerStatus } from '@giveaway/db-model';

export const twitterScrapeProgress = z.object({
  current: z.number().min(0),
  max: z.number().min(0).optional(),
  progress: z.number().min(0).max(100),
  status: z.nativeEnum(PickerStatus)
});

export type TwitterScrapeProgress = z.infer<typeof twitterScrapeProgress>;

export const twitterScrapeWorkflowInput = z.object({
  tweetIds: z.array(z.string().min(1)),
  pickerId: z.string().min(1),
  runDate: z.coerce.date().optional()
});

export type TwitterScrapeWorkflowInput = z.infer<
  typeof twitterScrapeWorkflowInput
>;

export const twitterScrapeRequest = z.object({
  pickerId: z.string().min(1),
  slug: z.string().min(1),
  data: twitterV2PickerFormSchema({ validateTiming: false })
});

export type TwitterScrapeRequest = z.infer<typeof twitterScrapeRequest>;
