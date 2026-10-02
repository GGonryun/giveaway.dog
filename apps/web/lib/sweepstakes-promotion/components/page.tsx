'use client';

import { ParticipantSweepstakeSchema } from '@/schemas/giveaway/schemas';
import { SocialSharingCard } from './social-sharing-card';
import { DEFAULT_SWEEPSTAKES_NAME } from '@/lib/settings';
import { ShareLinksCard } from './share-links-card';
import { useLiveSweepstakesUrl } from '@/components/sweepstakes/use-live-sweepstakes-url';

export const SweepstakesPromotionPage: React.FC<
  ParticipantSweepstakeSchema
> = ({ sweepstakes }) => {
  const liveUrl = useLiveSweepstakesUrl(sweepstakes);

  if (!sweepstakes) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <SocialSharingCard
        liveUrl={liveUrl}
        sweepstakesName={sweepstakes.setup.name ?? DEFAULT_SWEEPSTAKES_NAME}
      />

      <ShareLinksCard liveUrl={liveUrl} />
    </>
  );
};
