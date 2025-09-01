import { DeepPartial } from '@/lib/types';
import { GiveawayFormSchema as SweepstakesFormSchema } from '../giveaway';
import z from 'zod';
import { Prisma } from '@prisma/client';

export const FULL_SWEEPSTAKES_PAYLOAD = {
  tasks: true,
  prizes: true,
  audience: {
    include: {
      regionalRestriction: true,
      minimumAgeRestriction: true
    }
  },
  terms: true,
  timing: true,
  details: true
} satisfies Prisma.SweepstakesInclude;

export type FullSweepstakesGetPayload = Prisma.SweepstakesGetPayload<{
  include: typeof FULL_SWEEPSTAKES_PAYLOAD;
}>;

export const TEAM_SWEEPSTAKES_PAYLOAD: Prisma.SweepstakesInclude = {
  team: true
} as const;

export type TeamSweepstakesGetPayload = Prisma.SweepstakesGetPayload<{
  include: typeof TEAM_SWEEPSTAKES_PAYLOAD;
}>;

// input schema doesn't need validation as users are allowed to provide invalid or partial data.
export type SweepstakesInputSchema = DeepPartial<SweepstakesFormSchema>;
export const sweepstakesInputSchema = z.custom<
  SweepstakesInputSchema & { id: string }
>(
  (data): data is SweepstakesInputSchema =>
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    typeof (data as any).id === 'string'
);

export type SweepstakesInputTaskSchema = DeepPartial<
  SweepstakesFormSchema['tasks'][number]
>;
export type SweepstakesInputPrizeSchema = DeepPartial<
  SweepstakesFormSchema['prizes'][number]
>;
