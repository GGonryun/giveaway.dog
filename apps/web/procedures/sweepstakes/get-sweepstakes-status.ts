'use server';

import { procedure } from '@giveaway/rpc-server/procedures';
import z from 'zod';
import { findUserSweepstakesQuery } from './shared';
import { ApplicationError } from '@giveaway/util-errors';

import {
  derivedSweepstakesStatusSchema,
  toDerivedSweepstakeStatus
} from '@/schemas/sweepstakes';

const getSweepstakesStatus = procedure()
  .authorization({ required: true })
  .input(z.object({ id: z.string() }))
  .output(
    z.object({
      id: z.string(),
      status: derivedSweepstakesStatusSchema
    })
  )
  .handler(async ({ db, user, input }) => {
    const data = await db.sweepstakes.findUnique({
      where: findUserSweepstakesQuery({
        id: input.id,
        userId: user.id
      }),
      include: {
        timing: true
      }
    });

    if (!data || !data.timing) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: `Sweepstakes with ID ${input.id} not found`
      });
    }

    return {
      id: data.id,
      status: toDerivedSweepstakeStatus(data)
    };
  });

export default getSweepstakesStatus;
