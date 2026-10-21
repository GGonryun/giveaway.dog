import 'server-only';

import { procedure } from '@giveaway/rpc-server/procedures';
import {
  TASK_COMPLETIONS_SELECT_QUERY,
  taskCompletionSchema,
  toTaskCompletion
} from '@giveaway/task-model/completions';
import { findUserTeam } from '@giveaway/team-server/find-user-team';
import { TeamPermission } from '@giveaway/team-permissions';
import { TeamTier } from '@giveaway/db-model';

import z from 'zod';

export const getTaskCompletions = procedure()
  .authorization({
    required: true
  })
  .input(
    z.object({
      slug: z.string(),
      userId: z.string()
    })
  )
  .output(taskCompletionSchema.array())
  .handler(async ({ input, db, user }) => {
    const { team } = await findUserTeam({
      db,
      user,
      slug: input.slug,
      permission: TeamPermission.VIEW_SWEEPSTAKES,
      tier: TeamTier.FREE
    });

    const tasks = await db.taskCompletion.findMany({
      where: {
        participant: {
          user: { id: input.userId }
        },
        task: {
          sweepstakes: {
            teamId: team.id
          }
        }
      },
      select: TASK_COMPLETIONS_SELECT_QUERY
    });

    return tasks.map(toTaskCompletion);
  });
