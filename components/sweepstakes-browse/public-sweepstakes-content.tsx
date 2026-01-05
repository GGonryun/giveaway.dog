'use client';

import { ParticipantSweepstakeSchema } from '@/schemas/giveaway/schemas';
import { SweepstakesParticipationPage } from './sweepstakes-participation-page-content';

export const PublicSweepstakesContent: React.FC<
  ParticipantSweepstakeSchema
> = ({ sweepstakes, host, prizes, participation }) => {
  // For anonymous users, render without user-specific data
  return (
    <SweepstakesParticipationPage
      sweepstakes={sweepstakes}
      host={host}
      prizes={prizes}
      participation={participation}
      // Omit participant, relationship, referral - anonymous users don't have these
    />
  );
};
