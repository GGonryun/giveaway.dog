import { GiveawaySchema } from '@giveaway/sweepstakes-model/schemas';
import { useBrowseSweepstakesPage } from './use-browse-sweepstakes-page';

export const useLiveSweepstakesUrl = (sweepstakes: GiveawaySchema) => {
  const browse = useBrowseSweepstakesPage();
  return browse.url({
    sweepstakesId: sweepstakes.id,
    slug: sweepstakes.visibility.slug
  });
};
