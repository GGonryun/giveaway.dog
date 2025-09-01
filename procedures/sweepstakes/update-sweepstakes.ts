'use server';

import { ApplicationError } from '@/lib/errors';
import { procedure } from '@/lib/mrpc/procedures';
import { findUserSweepstakesQuery } from './shared';
import z from 'zod';
import {
  sweepstakesInputSchema,
  TEAM_SWEEPSTAKES_PAYLOAD
} from '@/schemas/giveaway/db';
import { toStorableSweepstakes } from '@/schemas/giveaway/storable';

const updateSweepstakes = procedure
  .authorization({ required: true })
  .input(sweepstakesInputSchema)
  .output(z.object({ slug: z.string() }))
  .invalidate(async ({ output }) => [`sweepstakes-list-${output.slug}`])
  .handler(async ({ db, user, input }) => {
    const existingSweepstakes = await db.sweepstakes.findUnique({
      where: findUserSweepstakesQuery({
        id: input.id,
        userId: user.id
      }),
      include: TEAM_SWEEPSTAKES_PAYLOAD
    });

    if (!existingSweepstakes || !existingSweepstakes.team) {
      console.error(
        `Sweepstakes with ID ${input.id} not found for user ${user.id}`
      );

      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'Sweepstakes not found'
      });
    }

    // WARNING: sweepstakes objects are too complex to update directly, instead we delete
    // the individual nested properties and recreate them. While it would be easier to
    // delete the sweepstakes this might have catastrophic effects on down-stream data.
    //
    // This would leave a potential foot-gun for future developers who might unknowingly
    // trigger cascade deletes. For example, if we are to cascade on delete remove task
    // participation, then changing the name would accidentally reset participation data.
    await db.$transaction(async (tx) => {
      await tx.sweepstakes.delete({
        where: { id: existingSweepstakes.id }
      });

      await tx.sweepstakes.create({
        data: toStorableSweepstakes(existingSweepstakes, input)
      });
    });

    return { slug: existingSweepstakes.team.slug };
  });

export default updateSweepstakes;
