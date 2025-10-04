import {
  GiveawayState,
  ParticipantSweepstakeSchema
} from '@/schemas/giveaway/schemas';
import { AgeVerificationSchema, UserProfileSchema } from '@/schemas/user';
import { date } from './date';
import { assertNever } from './errors';
import { RequiredFields } from './types';
import { expandCountries, includesCountryCode } from './countries';

type ComputeStateOptions = {
  sweepstakes: ParticipantSweepstakeSchema['sweepstakes'];
  userProfile?: UserProfileSchema;
  ageVerification?: AgeVerificationSchema | null;
};

export const computeState = ({
  sweepstakes,
  userProfile,
  ageVerification
}: ComputeStateOptions): GiveawayState => {
  if (!userProfile) return 'not-logged-in';
  if (requiresEmail({ sweepstakes, userProfile })) return 'email-required';
  if (needsAgeVerification({ sweepstakes, userProfile, ageVerification }))
    return 'age-verification-required';
  if (!isEligible({ sweepstakes, userProfile, ageVerification }))
    return 'not-eligible';

  switch (sweepstakes.status) {
    case 'DRAFT':
      return 'closed';
    case 'ACTIVE': {
      if (date.hasExpired(sweepstakes.timing.endDate)) return 'winners-pending';
      return 'active';
    }
    case 'COMPLETED':
      return 'winners-announced';
    default:
      throw assertNever(sweepstakes.status);
  }
};

const requiresEmail = ({ sweepstakes, userProfile }: ComputeStateOptions) => {
  return (
    sweepstakes.audience.requireEmail &&
    (!userProfile?.email || !userProfile?.emailVerified)
  );
};

const needsAgeVerification = ({
  sweepstakes,
  ageVerification
}: RequiredFields<ComputeStateOptions, 'userProfile'>) => {
  if (sweepstakes.audience.minimumAgeRestriction) {
    return !ageVerification;
  }
  return false;
};

const isEligible = ({
  sweepstakes,
  userProfile,
  ageVerification
}: RequiredFields<ComputeStateOptions, 'userProfile'>) => {
  if (sweepstakes.audience.minimumAgeRestriction) {
    if (!ageVerification) return false;
  }

  // check if region requirement is met
  if (sweepstakes.audience.regionalRestriction) {
    if (!userProfile.countryCode) return false;

    const countries = expandCountries(
      sweepstakes.audience.regionalRestriction.regions
    );
    const hasRegion = includesCountryCode(countries, userProfile.countryCode);

    switch (sweepstakes.audience.regionalRestriction.filter) {
      case 'INCLUDE':
        return hasRegion;
      case 'EXCLUDE':
        return !hasRegion;
      default:
        throw assertNever(sweepstakes.audience.regionalRestriction.filter);
    }
  }
  return true;
};
