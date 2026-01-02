import { z } from 'zod';

export const turnstileStatusSchema = z.object({
  token: z.string(),
  score: z.number().nullable(),
  lastCheckedAt: z.date()
});

export type TurnstileStatus = z.infer<typeof turnstileStatusSchema>;
