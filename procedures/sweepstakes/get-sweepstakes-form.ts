'use server';

import { procedure } from '@/lib/mrpc/procedures';
import { giveawayFormSchema } from '@/schemas/giveaway';
import z from 'zod';
import { findUserSweepstakesQuery } from './shared';
import { ApplicationError } from '@/lib/errors';

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
      include: {
        tasks: true,
        prizes: true,
        regionRestriction: true,
        minimumAgeRestriction: true
      }
    });

    if (!data) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: `Sweepstakes with ID ${input.id} not found`
      });
    }

    return {
      id: input.id,
      setup: {
        name: data.name ?? undefined,
        description: data.description ?? undefined,
        terms: data.terms ?? undefined,
        banner: data.banner ?? undefined
      },
      timing: {
        startDate: data.startDate ?? undefined,
        endDate: data.endDate ?? undefined,
        timeZone: data.timeZone ?? undefined
      },
      audience: {
        regionalRestriction: undefined,
        minimumAgeRestriction: undefined,
        requireEmail: data.requireEmail ?? undefined
      },
      tasks: [],
      prizes: []
    };
  });

export default getSweepstakesForm;
