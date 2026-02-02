import { z } from 'zod';

export const scrapingProgressUpdate = z.object({
  current: z.number().min(0),
  max: z.number().min(0).optional(),
  progress: z.number().min(0).max(100)
});

export type ScrapingProgressUpdate = z.infer<typeof scrapingProgressUpdate>;

export const scrapingProgressRequest = z.object({
  tweetId: z.string().min(1),
  pickerId: z.string().min(1),
  runDate: z.string().min(1)
});

export type ScrapingProgressRequest = z.infer<typeof scrapingProgressRequest>;
