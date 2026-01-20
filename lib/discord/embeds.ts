import { Prisma } from '@prisma/client';
import { SWEEPSTAKES_DISCORD_POST_SELECT_QUERY } from '../automation/db';
import { DEFAULT_SWEEPSTAKES_NAME } from '@/schemas/giveaway/defaults';
import { toSweepstakesUrl } from '../sweepstakes/util';

export const toGiveawayStartEmbed = (
  sweepstakes: Prisma.SweepstakesGetPayload<{
    select: typeof SWEEPSTAKES_DISCORD_POST_SELECT_QUERY;
  }>
) => {
  const sweepstakesUrl = toSweepstakesUrl(sweepstakes);
  const title = sweepstakes.details?.name || DEFAULT_SWEEPSTAKES_NAME;

  const endDate = sweepstakes.timing?.endDate
    ? Math.floor(new Date(sweepstakes.timing.endDate).getTime() / 1000)
    : null;

  const prizeList = sweepstakes.prizes.map((p) => `1x ${p.name}`).join(', ');

  const teamName = sweepstakes.team?.name || 'Unknown Host';
  const teamLogo = sweepstakes.team?.logo;

  const fields = [
    {
      name: 'Prizes',
      value: prizeList || 'TBD',
      inline: false
    },
    {
      name: 'Ends At',
      value: endDate ? `<t:${endDate}:R>` : 'TBD',
      inline: false
    },
    {
      name: 'Bonus Entries',
      value: `[Click here](${sweepstakesUrl})`,
      inline: false
    }
  ];

  const bannerUrl = sweepstakes.details?.banner;

  return {
    title: 'New Giveaway!',
    description: title,
    author: {
      name: teamName,
      icon_url: teamLogo || undefined
    },
    fields,
    image: bannerUrl ? { url: bannerUrl } : undefined,
    color: 0x5865f2,
    timestamp: new Date().toISOString(),
    url: sweepstakesUrl
  };
};

export const toGiveawayExpiredEmbed = (
  sweepstakes: Prisma.SweepstakesGetPayload<{
    select: typeof SWEEPSTAKES_DISCORD_POST_SELECT_QUERY;
  }>
) => {
  const sweepstakesUrl = toSweepstakesUrl(sweepstakes);
  const title = sweepstakes.details?.name || 'New Giveaway!';
  const endDate = sweepstakes.timing?.endDate
    ? Math.floor(new Date(sweepstakes.timing.endDate).getTime() / 1000)
    : null;

  const prizeList = sweepstakes.prizes.map((p) => `1x ${p.name}`).join(', ');

  const teamName = sweepstakes.team?.name || 'Unknown Host';
  const teamLogo = sweepstakes.team?.logo;

  const fields = [
    {
      name: 'Prizes',
      value: prizeList || 'TBD',
      inline: false
    },
    {
      name: 'Ends At',
      value: endDate ? `<t:${endDate}:R>` : 'TBD',
      inline: false
    },
    {
      name: 'Bonus Entries',
      value: `[Click here](${sweepstakesUrl})`,
      inline: false
    }
  ];

  const bannerUrl = sweepstakes.details?.banner;

  return {
    title: 'Giveaway Ended',
    description: title,
    author: {
      name: teamName,
      icon_url: teamLogo || undefined
    },
    fields,
    image: bannerUrl ? { url: bannerUrl } : undefined,
    color: 0x5865f2,
    timestamp: new Date().toISOString(),
    url: sweepstakesUrl
  };
};
