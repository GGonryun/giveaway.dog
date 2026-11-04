'use server';

import { procedure } from '@giveaway/rpc-server/procedures';
import z from 'zod';
import { SweepstakesStatus, TeamTier } from '@giveaway/db-model';
import { findUserSweepstakesQuery } from '@giveaway/sweepstakes-access/shared';
import { toDataDeletionDate } from '@giveaway/team-model/team/limits';
import { ApplicationError } from '@giveaway/util-errors';

const getDataRetention = procedure()
  .authorization({ required: true })
  .input(z.object({ id: z.string() }))
  .output(
    z.object({
      tier: z.nativeEnum(TeamTier),
      deletesAt: z.date().nullable(),
      deletedAt: z.date().nullable()
    })
  )
  .handler(async ({ db, user, input }) => {
    const data = await db.sweepstakes.findUnique({
      where: findUserSweepstakesQuery({ id: input.id, userId: user.id }),
      select: {
        status: true,
        dataDeletedAt: true,
        timing: { select: { endDate: true } },
        team: { select: { tier: true } }
      }
    });

    if (!data) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: `Sweepstakes with ID ${input.id} not found`
      });
    }

    const tier = data.team?.tier ?? TeamTier.FREE;
    const endDate = data.timing?.endDate ?? null;
    const ended =
      data.status !== SweepstakesStatus.DRAFT &&
      endDate !== null &&
      endDate <= new Date();

    return {
      tier,
      deletedAt: data.dataDeletedAt,
      deletesAt:
        ended && !data.dataDeletedAt
          ? toDataDeletionDate({ tier, endedAt: endDate })
          : null
    };
  });

export default getDataRetention;
