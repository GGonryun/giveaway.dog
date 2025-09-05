import { DeepPartial } from '@/lib/types';
import { GiveawayFormSchema as SweepstakesFormSchema } from './schemas';
import z from 'zod';
import { Prisma } from '@prisma/client';

export const FORM_SWEEPSTAKES_PAYLOAD = {
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

export const PARTICIPANT_SWEEPSTAKES_PAYLOAD = {
  tasks: true,
  prizes: {
    include: {
      winners: {
        include: {
          user: true
        }
      }
    }
  },
  audience: {
    include: {
      regionalRestriction: true,
      minimumAgeRestriction: true
    }
  },
  terms: true,
  timing: true,
  details: true,
  team: true
} satisfies Prisma.SweepstakesInclude;

export type ParticipantSweepstakesGetPayload = Prisma.SweepstakesGetPayload<{
  include: typeof PARTICIPANT_SWEEPSTAKES_PAYLOAD;
}>;

export type FormSweepstakesGetPayload = Prisma.SweepstakesGetPayload<{
  include: typeof FORM_SWEEPSTAKES_PAYLOAD;
}>;

export const TEAM_SWEEPSTAKES_PAYLOAD: Prisma.SweepstakesInclude = {
  team: true
} as const;

export type TeamSweepstakesGetPayload = Prisma.SweepstakesGetPayload<{
  include: typeof TEAM_SWEEPSTAKES_PAYLOAD;
}>;

// input schema doesn't need validation as users are allowed to provide invalid or partial data.
export type SweepstakesInputSchema = DeepPartial<SweepstakesFormSchema> & {
  id: string;
};
export const sweepstakesInputSchema = z.custom<SweepstakesInputSchema>(
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
