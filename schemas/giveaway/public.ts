import { z } from 'zod';
import { FormSweepstakesGetPayload } from './db';

export const publicSweepstakesSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  banner: z.string().optional(),
  startDate: z.date(),
  endDate: z.date(),
  region: z.string().optional(),
  prizes: z.number(),
  participants: z.number(),
  featured: z.boolean().optional()
});

export type PublicSweepstakeSchema = z.infer<typeof publicSweepstakesSchema>;

export const tryToPublicSweepstakes = (
  sweepstakes: FormSweepstakesGetPayload
): PublicSweepstakeSchema | undefined => {
  const organized = {
    id: sweepstakes.id,
    name: sweepstakes.details?.name,
    description: sweepstakes.details?.description,
    banner: sweepstakes.details?.banner ?? undefined,
    startDate: sweepstakes.timing?.startDate,
    endDate: sweepstakes.timing?.endDate,
    region: 'Worldwide', // TODO: support rendering region selection
    prizes: sweepstakes.prizes.length ?? 0,
    participants: 0, // TODO: support showing participants
    featured: false
  };

  const parsed = publicSweepstakesSchema.safeParse(organized);
  if (parsed.success) {
    return parsed.data;
  } else {
    // someone was able to generate an invalid public sweepstakes object
    console.error('Public sweepstakes parse error:', parsed.error);
    return undefined;
  }
};
