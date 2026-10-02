import { GiveawaySchema } from '@/schemas/giveaway/schemas';
import { useBrowseSweepstakesPage } from './use-browse-sweepstakes-page';

export const useLiveSweepstakesUrl = (sweepstakes: GiveawaySchema) => {
  const browse = useBrowseSweepstakesPage();
  return browse.url({
    sweepstakesId: sweepstakes.id,
    slug: sweepstakes.visibility.slug
  });
};
