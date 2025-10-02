'use client';

import { AgeVerification } from '../age-verification';
import { useGiveawayParticipation } from '../giveaway-participation-context';
import { useRouter } from 'next/navigation';

export const AgeVerificationRequired = () => {
  const { sweepstakes, userProfile } = useGiveawayParticipation();
  const router = useRouter();

  const handleVerified = () => {
    router.refresh(); // Refresh the page to recompute state
  };

  const minimumAge = sweepstakes.audience.minimumAgeRestriction?.value || 18;
  const label = sweepstakes.audience.minimumAgeRestriction?.label;

  if (!userProfile?.id) {
    return null; // Should not happen since this state requires a logged-in user
  }

  return (
    <AgeVerification
      sweepstakesId={sweepstakes.id}
      minimumAge={minimumAge}
      label={label}
      onVerified={handleVerified}
      isVerified={false}
      userId={userProfile.id}
    />
  );
};
