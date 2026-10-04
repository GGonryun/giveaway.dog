import { SWEEPSTAKES_DISCORD_POST_SELECT_QUERY } from '@giveaway/automation-model/db';
import { Prisma } from '@prisma/client';
import { toSweepstakesUrl } from '@giveaway/sweepstakes-model/util';
import { DiscordActionRow } from '@giveaway/discord-model/schemas';

export type DiscordMessageComponentFactory = (args: {
  taskId?: string;
  sweepstakes: Prisma.SweepstakesGetPayload<{
    select: typeof SWEEPSTAKES_DISCORD_POST_SELECT_QUERY;
  }>;
}) => DiscordActionRow[];

export const toActiveSweepstakeComponents: DiscordMessageComponentFactory = ({
  taskId,
  sweepstakes
}) => {
  return [
    {
      type: 1,
      components: [
        ...(taskId
          ? [
              {
                type: 2,
                style: 3,
                label: 'Join Giveaway',
                custom_id: `task:enter:${taskId}`
              }
            ]
          : []),
        {
          type: 2,
          style: 5,
          label: taskId ? 'Bonus Entries' : 'View Details',
          url: toSweepstakesUrl({ sweepstakes, forcePath: true })
        }
      ]
    }
  ];
};

export const toExpiredSweepstakeComponents: DiscordMessageComponentFactory = ({
  sweepstakes
}) => {
  return [
    {
      type: 1,
      components: [
        {
          type: 2,
          style: 5,
          label: 'View Details',
          url: toSweepstakesUrl({ sweepstakes, forcePath: true })
        },
        {
          type: 2,
          style: 5,
          label: 'Browse Giveaways',
          url: 'https://giveaway.dog/browse'
        }
      ]
    }
  ];
};
