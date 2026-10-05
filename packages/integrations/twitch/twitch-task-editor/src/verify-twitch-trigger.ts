'use server';

import { procedure } from '@giveaway/rpc-server/procedures';
import z from 'zod';
import { toTaskSchema } from '@giveaway/task-model/schemas';
import { findUserTeam } from '@giveaway/team-server/find-user-team';
import { TeamPermission } from '@giveaway/team-permissions';
import { TeamTier } from '@giveaway/db-model';

const verifyTwitchTrigger = procedure()
  .authorization({ required: true })
  .input(
    z.object({
      trigger: z.string(),
      sweepstakesId: z.string().optional(),
      taskId: z.string().optional(),
      teamId: z.string()
    })
  )
  .output(
    z.object({
      available: z.boolean(),
      conflictingSweepstakesId: z.string().optional(),
      conflictingSweepstakesName: z.string().optional()
    })
  )
  .handler(async ({ db, user, input }) => {
    const { trigger, sweepstakesId, taskId, teamId } = input;

    // Verify user is a member of this team
    await findUserTeam({
      db,
      user,
      id: teamId,
      permission: TeamPermission.VIEW_SWEEPSTAKES,
      tier: TeamTier.FREE
    });

    // Find all tasks for active sweepstakes in this team
    const tasks = await db.task.findMany({
      where: {
        sweepstakes: {
          teamId,
          status: 'ACTIVE',
          // Exclude current sweepstakes if editing
          ...(sweepstakesId ? { NOT: { id: sweepstakesId } } : {})
        }
      },
      include: {
        sweepstakes: {
          include: {
            details: true
          }
        }
      }
    });

    // Check all tasks for trigger conflicts
    for (const task of tasks) {
      // Skip the current task if editing
      if (taskId && task.id === taskId) continue;

      try {
        const taskConfig = toTaskSchema(task);
        if (
          taskConfig.type === 'TWITCH_CHAT_IMPORT' &&
          taskConfig.trigger.toLowerCase() === trigger.toLowerCase()
        ) {
          return {
            available: false,
            conflictingSweepstakesId: task.sweepstakes.id,
            conflictingSweepstakesName:
              task.sweepstakes.details?.name || 'Untitled Giveaway'
          };
        }
      } catch (error) {
        // Skip tasks that can't be parsed
        continue;
      }
    }

    return {
      available: true
    };
  });

export default verifyTwitchTrigger;
