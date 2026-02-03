'use client';

import {
  ParticipantSweepstakeSchema,
  SweepstakesAllocationSchema
} from '@/schemas/giveaway/schemas';
import { SweepstakesParticipantSchema } from '@/lib/participant/schemas';
import { UserHostRelationshipSchema } from '@/lib/loyalty/schemas';
import { UserReferralSchema } from '@/lib/referrals/schemas';
import { SweepstakesParticipationPage } from './sweepstakes-participation-page-content';
import { AllocationStatisticsSchema } from '@/lib/allocation/schemas';

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
