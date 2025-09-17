import { z } from 'zod';
import { PublicSweepstakesGetPayload } from './db';

export const publicSweepstakesSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  banner: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  prizes: z.number(),
  host: z.object({
    id: z.string(),
    slug: z.string(),
    name: z.string()
  }),
  participants: z.number(),
  featured: z.boolean().optional()
});

export type PublicSweepstakeSchema = z.infer<typeof publicSweepstakesSchema>;

export const tryToPublicSweepstakes = (
  sweepstakes: PublicSweepstakesGetPayload
): PublicSweepstakeSchema | undefined => {
  const organized = {
    id: sweepstakes.id,
    name: sweepstakes.details?.name,
    description: sweepstakes.details?.description,
    banner: sweepstakes.details?.banner ?? undefined,
    startDate: sweepstakes.timing?.startDate?.toISOString(),
    endDate: sweepstakes.timing?.endDate?.toISOString(),
    host: {
      id: sweepstakes.team?.id,
      slug: sweepstakes.team?.slug,
      name: sweepstakes.team?.name
    },
    prizes: sweepstakes.prizes.length ?? 0,
    participants: new Set(
      sweepstakes.tasks.flatMap((t) => t.completions.map((c) => c.userId))
    ).size,
    featured: false // TODO: support featured sweepstakes.
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
