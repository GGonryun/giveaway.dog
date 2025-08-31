'use server';

import { procedure } from '@/lib/mrpc/procedures';
import {
  GiveawayAudience,
  giveawayFormSchema,
  minimumAgeRestrictionSchema,
  regionalRestrictionSchema
} from '@/schemas/giveaway';
import z from 'zod';
import { findUserSweepstakesQuery } from './shared';
import { ApplicationError } from '@/lib/errors';
import { Prisma } from '@prisma/client';

const include = {
  tasks: true,
  prizes: true,
  regionRestriction: true,
  minimumAgeRestriction: true,
  terms: true
} as const;
type SweepstakesPayload = Prisma.SweepstakesGetPayload<{
  include: typeof include;
}>;

const getSweepstakesForm = procedure
  .authorization({ required: true })
  .input(z.object({ id: z.string() }))
  .output(giveawayFormSchema.extend({ id: z.string() }))
  .handler(async ({ db, user, input }) => {
    const data = await db.sweepstakes.findUnique({
      where: findUserSweepstakesQuery({
        id: input.id,
        userId: user.id
      }),
      include
    });

    if (!data) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: `Sweepstakes with ID ${input.id} not found`
      });
    }

    console.log('findUserSweepstakes', data);

    return {
      id: input.id,
      setup: {
        name: data.name ?? undefined,
        description: data.description ?? undefined,
        banner: data.banner ?? undefined
      },
      terms:
        data.terms && data.terms.type
          ? {
              ...data.terms,
              type: data.terms.type,
              sponsorName: data.terms.sponsorName ?? undefined,
              sponsorAddress: data.terms.sponsorAddress ?? undefined,
              winnerSelectionMethod:
                data.terms.winnerSelectionMethod ?? undefined,
              notificationTimeframeDays:
                data.terms.notificationTimeframeDays ?? undefined,
              claimDeadlineDays: data.terms.claimDeadlineDays ?? undefined,
              maxEntriesPerUser: data.terms.maxEntriesPerUser ?? undefined,
              governingLawCountry: data.terms.governingLawCountry ?? undefined,
              privacyPolicyUrl: data.terms.privacyPolicyUrl ?? undefined,
              additionalTerms: data.terms.additionalTerms ?? undefined,
              text: data.terms.text ?? undefined
            }
          : undefined,
      timing: {
        startDate: data.startDate ?? undefined,
        endDate: data.endDate ?? undefined,
        timeZone: data.timeZone ?? undefined
      },
      audience: parseAudience(data),
      tasks: [],
      prizes: []
    };
  });

const parseAudience = (data: SweepstakesPayload): GiveawayAudience => {
  return {
    regionalRestriction: parseRegionalRestriction(data.regionRestriction),
    minimumAgeRestriction: parseMinimumAgeRestriction(
      data.minimumAgeRestriction
    ),
    requireEmail: data.requireEmail ?? false
  };
};

const parseRegionalRestriction = (
  data: SweepstakesPayload['regionRestriction']
): GiveawayAudience['regionalRestriction'] => {
  if (!data) {
    return null;
  }
  return regionalRestrictionSchema.parse(data);
};

const parseMinimumAgeRestriction = (
  data: SweepstakesPayload['minimumAgeRestriction']
): GiveawayAudience['minimumAgeRestriction'] => {
  if (!data) {
    return null;
  }
  return minimumAgeRestrictionSchema.parse(data);
};

export default getSweepstakesForm;
