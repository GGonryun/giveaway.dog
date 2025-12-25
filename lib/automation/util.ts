import { GiveawaySchema } from '@/schemas/giveaway/schemas';
import { date } from '../date';

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
💬 Comment

👇 Get bonus entries
${liveUrl}`;
};
