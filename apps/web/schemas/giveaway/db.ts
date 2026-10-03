import { DeepPartial } from '@giveaway/util-types/types';
import { GiveawayFormSchema as SweepstakesFormSchema } from './schemas';
import z from 'zod';
import { Prisma } from '@prisma/client';
import { USER_SCHEMA_SELECT_QUERY } from '../user';

export const FORM_SWEEPSTAKES_PAYLOAD = {
  tasks: true,
  prizes: true,
  audience: {
    include: {
      regionalRestriction: true,
      minimumAgeRestriction: true,
      formFields: true
    }
  },
  terms: true,
  timing: true,
  details: true,
  design: true,
  visibility: true,
  criteria: true
} satisfies Prisma.SweepstakesInclude;

export type FormSweepstakesGetPayload = Prisma.SweepstakesGetPayload<{
  include: typeof FORM_SWEEPSTAKES_PAYLOAD;
}>;

export const PARTICIPANT_SWEEPSTAKES_PAYLOAD = {
  tasks: true,
  prizes: {
    include: {
      draws: {
        include: {
          taskCompletion: {
            include: {
              task: true,
              participant: {
                include: {
                  user: { select: USER_SCHEMA_SELECT_QUERY }
                }
              }
            }
          }
        }
      }
    }
  },
  audience: {
    include: {
      regionalRestriction: true,
      minimumAgeRestriction: true,
      formFields: true
    }
  },
  terms: true,
  timing: true,
  details: true,
  team: true,
  design: true,
  visibility: true,
  criteria: true
} satisfies Prisma.SweepstakesInclude;

export type ParticipantSweepstakesGetPayload = Prisma.SweepstakesGetPayload<{
  include: typeof PARTICIPANT_SWEEPSTAKES_PAYLOAD;
}>;

export const PUBLIC_SWEEPSTAKES_PAYLOAD = {
  tasks: {
    include: {
      completions: {
        include: {
          participant: {
            include: {
              user: true
            }
          }
        },
        distinct: ['participantId']
      }
    }
  },
  prizes: {
    include: {
      draws: {
        include: {
          taskCompletion: {
            include: {
              participant: {
                include: {
                  user: true
                }
              }
            }
          }
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
  team: true,
  visibility: true
} satisfies Prisma.SweepstakesInclude;

export type PublicSweepstakesGetPayload = Prisma.SweepstakesGetPayload<{
  include: typeof PUBLIC_SWEEPSTAKES_PAYLOAD;
}>;

export const TEAM_SWEEPSTAKES_PAYLOAD = {
  team: {
    include: {
      members: {
        include: {
          user: { select: USER_SCHEMA_SELECT_QUERY }
        }
      }
    }
  }
} satisfies Prisma.SweepstakesInclude;

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
export type SweepstakesInputDesignBackgroundSchema = DeepPartial<
  SweepstakesFormSchema['design']['background']
>;
export type SweepstakesInputFormFieldSchema = DeepPartial<
  SweepstakesFormSchema['audience']['formFields'][number]
>;
