import {
  GiveawayState,
  ParticipantSweepstakeSchema
} from '@/schemas/giveaway/schemas';
import { AgeVerificationSchema, UserProfileSchema } from '@/schemas/user';
import { assertNever } from './errors';
import { RequiredFields } from './types';
import { expandCountries, includesCountryCode } from './countries';

type ComputeStateOptions = {
  sweepstakes: ParticipantSweepstakeSchema['sweepstakes'];
  prizes: ParticipantSweepstakeSchema['prizes'];
  userProfile?: UserProfileSchema;
  ageVerification?: AgeVerificationSchema | null;
};

export const computeState = (args: ComputeStateOptions): GiveawayState => {
  const { sweepstakes, userProfile } = args;

  switch (sweepstakes.status) {
    case 'DRAFT':
      return 'closed';
    case 'COMPLETED':
      return 'winners-announced';
    case 'EXPIRED':
      return 'winners-pending';
    case 'ERROR':
      return 'error';
    case 'SCHEDULED':
      return 'pending';
    case 'RUNNING': {
      if (!userProfile) return 'not-logged-in';
      if (requiresEmail(args)) return 'email-required';
      if (needsAgeVerification({ ...args, userProfile }))
        return 'age-verification-required';
      if (!isEligible({ ...args, userProfile })) return 'not-eligible';
      return 'active';
    }
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
