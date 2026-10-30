'use server';

import { ApplicationError } from '@giveaway/util-errors';
import { procedure } from '@giveaway/rpc-server/procedures';
import z from 'zod';
import { isMembersOnly, isTeamMember } from './visibility';
import { findSweepstakesAccess } from './access';

export const getSweepstakesPrivacy = procedure()
  .authorization({
    required: false
  })
  .input(
    z.object({
      sweepstakesId: z.string()
    })
  )
  .output(z.boolean())
  .handler(async ({ input, db, user }) => {
    const sweepstakes = await findSweepstakesAccess({
      db,
      sweepstakesId: input.sweepstakesId
    });

    if (!sweepstakes?.visibility?.visibility) {
      throw new ApplicationError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Sweepstakes visibility is missing'
      });
    }

    if (!isMembersOnly(sweepstakes)) {
      return true;
    }

    if (!sweepstakes.teamId) {
      throw new ApplicationError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Sweepstakes teamId is missing'
      });
    }

    if (!user?.id)
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'User is not authorized to view this sweepstakes'
      });

    if (await isTeamMember({ db, userId: user.id, sweepstakes })) {
      return true;
    }

    throw new ApplicationError({
      code: 'FORBIDDEN',
      message: 'User is not authorized to view this sweepstakes'
    });
  });
