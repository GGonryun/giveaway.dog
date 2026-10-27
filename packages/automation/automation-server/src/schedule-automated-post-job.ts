'use server';

import { procedure } from '@giveaway/rpc-server/procedures';
import { ApplicationError } from '@giveaway/util-errors';
import { requirePermission, TeamPermission } from '@giveaway/team-permissions';
import {
  scheduleAutomatedPostSchema,
  toAutomatedPostJobCreateInput
} from '@giveaway/automation-model/schemas';
import { validateAutomatedPostRequest } from '@giveaway/automation-model/validation';
import { requestJobRun } from '@giveaway/jobs/schedule';

export const scheduleAutomatedPostJob = procedure()
  .authorization({ required: true })
  .input(scheduleAutomatedPostSchema)
  .handler(async ({ user, db, input }) => {
    // Get sweepstakes and verify ownership
    const sweepstakes = await db.sweepstakes.findUnique({
      where: { id: input.sweepstakesId },
      include: {
        team: {
          include: {
            members: {
              where: { userId: user.id }
            }
          }
        },
        timing: true
      }
    });

    if (!sweepstakes || !sweepstakes.team) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'Sweepstakes not found'
      });
    }

    if (sweepstakes.team.members.length === 0) {
      throw new ApplicationError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to modify this sweepstakes'
      });
    }

    requirePermission(
      sweepstakes.team.members[0].role,
      TeamPermission.UPDATE_SWEEPSTAKES
    );

    if (!sweepstakes.timing?.startDate) {
      throw new ApplicationError({
        code: 'PRECONDITION_FAILED',
        message: 'Sweepstakes start date is not set'
      });
    }

    if (!sweepstakes.timing?.endDate) {
      throw new ApplicationError({
        code: 'PRECONDITION_FAILED',
        message: 'Sweepstakes end date is not set'
      });
    }

    if (sweepstakes.timing.endDate < new Date()) {
      throw new ApplicationError({
        code: 'PRECONDITION_FAILED',
        message: 'Sweepstakes has already ended'
      });
    }

    // validate request
    await validateAutomatedPostRequest({
      db,
      input,
      teamId: sweepstakes.team.id
    });

    // Create the job
    const job = await db.automatedPostJob.create({
      data: toAutomatedPostJobCreateInput({
        ...input,
        runAt: sweepstakes.timing.startDate
      })
    });

    await requestJobRun();

    return job;
  });
