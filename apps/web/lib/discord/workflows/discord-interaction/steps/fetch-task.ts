import db from '@giveaway/db-client/prisma';
import { toTaskSchema } from '@giveaway/task-model/schemas';

export type FetchTaskResult =
  | { status: 'error'; content: string }
  | { status: 'ended'; sweepstakesId: string }
  | { status: 'active'; roles: string[]; sweepstakesId: string };

export async function fetchTask({
  taskId
}: {
  taskId: string;
}): Promise<FetchTaskResult> {
  'use step';

  const data = await db.task.findUnique({
    where: { id: taskId },
    include: {
      sweepstakes: {
        select: {
          id: true,
          status: true,
          timing: true
        }
      }
    }
  });

  if (!data) {
    return { status: 'error', content: 'This giveaway task no longer exists.' };
  }

  const { sweepstakes, ...rest } = data;
  const task = toTaskSchema(rest);

  if (task.type !== 'DISCORD_INTERACTION_IMPORT') {
    return {
      status: 'error',
      content: 'This task is not a Discord interaction entry task.'
    };
  }

  if (sweepstakes.status === 'DRAFT') {
    return { status: 'error', content: 'This giveaway is not yet active.' };
  }

  const endDate = (sweepstakes.timing as { endDate?: string } | null)?.endDate;

  if (
    sweepstakes.status === 'COMPLETED' ||
    !endDate ||
    new Date(endDate) < new Date()
  ) {
    return { status: 'ended', sweepstakesId: sweepstakes.id };
  }

  return {
    status: 'active',
    roles: task.roles ?? [],
    sweepstakesId: sweepstakes.id
  };
}
