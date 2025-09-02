'use server';

import { procedure } from '@/lib/mrpc/procedures';
import z from 'zod';
import { findUserSweepstakesQuery } from './shared';
import { ApplicationError } from '@/lib/errors';

import { SweepstakesStatus } from '@prisma/client';

const getSweepstakesStatus = procedure
  .authorization({ required: true })
  .input(z.object({ id: z.string() }))
  .output(
    z.object({
      id: z.string(),
      status: z.nativeEnum(SweepstakesStatus)
    })
  )
  .handler(async ({ db, user, input }) => {
    const data = await db.sweepstakes.findUnique({
      where: findUserSweepstakesQuery({
        id: input.id,
        userId: user.id
      })
    });

    if (!data) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: `Sweepstakes with ID ${input.id} not found`
      });
    }

    return {
      id: data.id,
      status: data.status
    };
  });

export default getSweepstakesStatus;
