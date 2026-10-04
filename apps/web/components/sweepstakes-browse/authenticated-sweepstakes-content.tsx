'use client';

import { ParticipantSweepstakeSchema } from '@giveaway/sweepstakes-model/schemas';
import { SweepstakesParticipantSchema } from '@/lib/participant/schemas';
import { UserHostRelationshipSchema } from '@giveaway/loyalty-model/schemas';
import { UserReferralSchema } from '@giveaway/referrals-model/schemas';
import { SweepstakesParticipationPage } from './sweepstakes-participation-page-content';
import { AllocationStatisticsSchema } from '@giveaway/allocation-model/schemas';

interface AuthenticatedSweepstakesContentProps extends ParticipantSweepstakeSchema {
  participant?: SweepstakesParticipantSchema;
  relationship?: UserHostRelationshipSchema;
  referral?: UserReferralSchema;
  allocations?: AllocationStatisticsSchema;
}

export const AuthenticatedSweepstakesContent: React.FC<
  AuthenticatedSweepstakesContentProps
> = (props) => {
  // For authenticated users, render with all user-specific data
  return <SweepstakesParticipationPage {...props} />;
};
