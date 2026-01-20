import { SWEEPSTAKES_DISCORD_POST_SELECT_QUERY } from '@/lib/automation/db';
import { DiscordMessageComponent } from './schemas';
import { Prisma } from '@prisma/client';
import { toSweepstakesUrl } from '@/lib/sweepstakes/util';

export const toDiscordSweepstakesButtons = ({
  taskId,
  sweepstakes
}: {
  taskId?: string;
  sweepstakes: Prisma.SweepstakesGetPayload<{
    select: typeof SWEEPSTAKES_DISCORD_POST_SELECT_QUERY;
  }>;
}): DiscordMessageComponent[] => {
  if (!taskId) {
    return [];
  }

  return [
    {
      type: 1,
      components: [
        {
          type: 2,
          style: 3,
          label: 'Join Giveaway',
          custom_id: `task:enter:${taskId}`
        },
        {
          type: 2,
          style: 2,
          label: 'View Details',
          url: toSweepstakesUrl(sweepstakes)
        }
      ]
    }
  ];
};
