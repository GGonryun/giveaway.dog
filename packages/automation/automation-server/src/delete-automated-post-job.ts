'use server';

import { procedure } from '@giveaway/rpc-server/procedures';
import { z } from 'zod';
import { ApplicationError } from '@giveaway/util-errors';
import { requirePermission, TeamPermission } from '@giveaway/team-permissions';

export const deleteAutomatedPostJob = procedure()
  .authorization({ required: true })
  .input(
    z.object({
      jobId: z.string()
    })
  )
  .handler(async ({ user, db, input }) => {
    // Get job and verify ownership
    const job = await db.automatedPostJob.findUnique({
      where: { id: input.jobId },
      include: {
        sweepstakes: {
          include: {
            team: {
              include: {
                members: {
                  where: { userId: user.id }
                }
              }
            }
          }
        }
      }
    });

    if (!job || !job.sweepstakes.team) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'Job not found'
      });
    }

    if (job.sweepstakes.team.members.length === 0) {
      throw new ApplicationError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to delete this job'
      });
    }

    requirePermission(
      job.sweepstakes.team.members[0].role,
      TeamPermission.UPDATE_SWEEPSTAKES
    );

    // Only allow deleting PENDING or FAILED jobs
    if (job.status !== 'PENDING' && job.status !== 'FAILED') {
      throw new ApplicationError({
        code: 'PRECONDITION_FAILED',
        message: 'Can only delete pending or failed jobs'
      });
    }

    // Delete the job
    await db.automatedPostJob.delete({
      where: { id: input.jobId }
    });

    return { success: true };
  });
