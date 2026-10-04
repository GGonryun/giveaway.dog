import { GiveawaySchema } from '@giveaway/sweepstakes-model/schemas';
import { date } from '@giveaway/util-time/date';

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
