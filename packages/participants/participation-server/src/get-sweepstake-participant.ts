'use server';

import { procedure } from '@giveaway/rpc-server/procedures';
import {
  findOrCreateSweepstakesParticipant,
  findSweepstakesParticipant
} from '@giveaway/participant-model/db';
import { sweepstakesParticipantSchema } from '@giveaway/participant-model/schemas';
import { SweepstakesStatus } from '@giveaway/db-model';

import z from 'zod';
import { canViewSweepstakes } from './visibility';
import { findSweepstakesAccess } from './access';

export const getOrCreateSweepstakesParticipant = procedure()
  .authorization({ required: false })
  .input(z.object({ sweepstakesId: z.string() }))
  .output(sweepstakesParticipantSchema.optional())
  .handler(async ({ db, user, input }) => {
    if (!user?.id) return undefined;

    const sweepstakes = await findSweepstakesAccess({
      db,
      sweepstakesId: input.sweepstakesId
    });

    if (!sweepstakes) {
      return undefined;
    }

    if (!(await canViewSweepstakes({ db, userId: user.id, sweepstakes }))) {
      return undefined;
    }

    const options = { db, userId: user.id, sweepstakesId: sweepstakes.id };

    if (!isAcceptingEntries(sweepstakes)) {
      return (await findSweepstakesParticipant(options)) ?? undefined;
    }

    return await findOrCreateSweepstakesParticipant(options);
  });

const isAcceptingEntries = ({
  status,
  timing
}: {
  status: SweepstakesStatus;
  timing: { startDate: Date | null; endDate: Date | null } | null;
}) => {
  if (status !== SweepstakesStatus.ACTIVE) return false;
  if (!timing?.startDate || !timing.endDate) return false;

  const now = new Date();
  return timing.startDate <= now && now <= timing.endDate;
};
