import { GiveawaySchema } from '@/schemas/giveaway/schemas';
import { date } from '../date';
import { Prisma } from '@prisma/client';

export const generateTweetText = ({
  sweepstakes,
  liveUrl
}: {
  sweepstakes: GiveawaySchema;
  liveUrl: string;
}) => {
  // Get first prize name
  const prizeName = sweepstakes.prizes[0]?.name ?? sweepstakes.setup.name;

  // Format end date
  const endDate = sweepstakes.timing.endDate
    ? date.format(new Date(sweepstakes.timing.endDate), 'short')
    : 'TBD';

  return `🎉 GIVEAWAY TIME 🎉

🥇 Prize: ${prizeName}
⏰ Ends: ${endDate}

Rules:
🙆 Follow
🔁 Repost
❤️ Like

👇 Get bonus entries

${liveUrl}`;
};

export const generateSkeetText = ({
  sweepstakes,
  liveUrl
}: {
  sweepstakes: GiveawaySchema;
  liveUrl: string;
}) => {
  // Get first prize name
  const prizeName = sweepstakes.prizes[0]?.name ?? sweepstakes.setup.name;

  // Format end date
  const endDate = sweepstakes.timing.endDate
    ? date.format(new Date(sweepstakes.timing.endDate), 'short')
    : 'TBD';

  return `🎉 GIVEAWAY TIME 🎉

🥇 Prize: ${prizeName}
⏰ Ends: ${endDate}

Rules:
🙆 Follow
🔁 Repost
❤️ Like

👇 Get bonus entries

${liveUrl}`;
};
