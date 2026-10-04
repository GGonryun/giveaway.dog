import { Prisma, PrismaClient } from '@prisma/client';
import { SWEEPSTAKES_DISCORD_POST_SELECT_QUERY } from '../automation/db';
import { toSweepstakesUrl } from '../sweepstakes/util';
import {
  DiscordActionRow,
  DiscordMessageComponent,
  DiscordMessageEmbed
} from '@giveaway/discord-model/schemas';
import {
  DerivedSweepstakeStatus,
  SWEEPSTAKES_STATUS_LABEL,
  toDerivedSweepstakeStatus
} from '@/schemas/sweepstakes';
import {
  DEFAULT_SWEEPSTAKES_NAME,
  UNKNOWN_USER_NAME
} from '@giveaway/app-config/settings';
import {
  DiscordMessageComponentFactory,
  toActiveSweepstakeComponents,
  toExpiredSweepstakeComponents
} from './api/util';
import { toTaskSchema } from '@giveaway/task-model/schemas';
import { PostToDiscordJobSchema } from '../automation/schemas';

export const getSweepstakesActivity = async ({
  db,
  sweepstakesId
}: {
  db: PrismaClient;
  sweepstakesId: string;
}) => {
  const participants = await db.sweepstakesParticipant.count({
    where: { sweepstakesId }
  });
  const entries = await db.taskCompletion.count({
    where: {
      task: {
        sweepstakesId
      }
    }
  });
  return { participants, entries };
};

const toAdditionalFields = (
  sweepstakes: Prisma.SweepstakesGetPayload<{
    select: typeof SWEEPSTAKES_DISCORD_POST_SELECT_QUERY;
  }>
): DiscordMessageEmbed['fields'] | undefined => {
  if (sweepstakes.status !== 'COMPLETED') return [];

  return [
    {
      name: 'Winners',
      value: sweepstakes.prizes
        .flatMap((p) =>
          p.draws
            .filter((d) => d.result === 'WINNER')
            .map(
              (d) => d.taskCompletion.participant.user.name || UNKNOWN_USER_NAME
            )
        )
        .join(', '),
      inline: false
    }
  ];
};

const SWEEPSTAKES_DISCORD_POST_TITLE: Record<DerivedSweepstakeStatus, string> =
  {
    DRAFT: 'Upcoming Giveaway!',
    SCHEDULED: 'Upcoming Giveaway!',
    RUNNING: 'New Giveaway!',
    EXPIRED: 'Giveaway Expired!',
    COMPLETED: 'Giveaway Completed!',
    ERROR: 'Invalid Giveaway!'
  };

export const toSweepstakesEmbed = async ({
  sweepstakes,
  job,
  db
}: {
  db: PrismaClient;
  job?: PostToDiscordJobSchema;
  sweepstakes: Prisma.SweepstakesGetPayload<{
    select: typeof SWEEPSTAKES_DISCORD_POST_SELECT_QUERY;
  }>;
}): Promise<DiscordMessageEmbed> => {
  const { participants, entries } = await getSweepstakesActivity({
    db,
    sweepstakesId: sweepstakes.id
  });
  const tasks = sweepstakes.tasks.map(toTaskSchema);
  // as of today we should only ever have one of these tasks in a sweepstakes.
  const task = tasks.find((t) => t.type === 'DISCORD_INTERACTION_IMPORT');
  const sweepstakesUrl = toSweepstakesUrl({ sweepstakes, forcePath: true });
  const name = sweepstakes.details?.name || DEFAULT_SWEEPSTAKES_NAME;

  const endDate = sweepstakes.timing?.endDate
    ? Math.floor(new Date(sweepstakes.timing.endDate).getTime() / 1000)
    : null;

  const prizeList = sweepstakes.prizes.map((p) => `${p.name}`).join(', ');
  const bannerUrl = sweepstakes.details?.banner;

  const teamName = sweepstakes.team?.name || 'Unknown Host';
  const teamLogo = sweepstakes.team?.logo;

  const status = toDerivedSweepstakeStatus(sweepstakes);

  const additionalFields = toAdditionalFields(sweepstakes);
  const eligibleRoles = task?.roles ?? job?.request.roles ?? [];
  const fields: DiscordMessageEmbed['fields'] = [
    {
      name: 'Name',
      value: `[${name}](${sweepstakesUrl})`,
      inline: false
    },
    {
      name: 'Hosted By',
      value: teamName,
      inline: false
    },
    {
      name: 'Ends At',
      value: endDate ? `<t:${endDate}:R>` : 'TBD',
      inline: false
    },
    {
      name: 'Prizes',
      value: prizeList || 'TBD',
      inline: false
    },
    {
      name: 'Status',
      value: SWEEPSTAKES_STATUS_LABEL[status],
      inline: false
    },
    ...(eligibleRoles.length
      ? [
          {
            name: 'Eligible Roles',
            value: eligibleRoles.map((id) => `<@&${id}>`).join(', '),
            inline: false
          }
        ]
      : []),
    {
      name: 'Participants',
      value: participants.toString(),
      inline: false
    },
    {
      name: 'Entries',
      value: entries.toString(),
      inline: false
    },
    ...(additionalFields || [])
  ];

  const description = fields
    .map((field) => `**${field.name}:** ${field.value}`)
    .join('\n');

  return {
    title: SWEEPSTAKES_DISCORD_POST_TITLE[status],
    description,
    author: {
      name: teamName,
      icon_url: teamLogo || undefined
    },
    fields: [],
    image: bannerUrl ? { url: bannerUrl } : undefined,
    color: 0x5865f2,
    timestamp: new Date().toISOString()
  };
};
