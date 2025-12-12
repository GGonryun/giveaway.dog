import {
  GiveawayState,
  ParticipantSweepstakeSchema
} from '@/schemas/giveaway/schemas';
import { assertNever } from './errors';
import { RequiredFields } from './types';
import { expandCountries, includesCountryCode } from './countries';
import {
  isProfileIncomplete,
  SweepstakesParticipantSchema,
  toParticipantForm
} from '@/schemas/giveaway/participant';

type ComputeStateOptions = Pick<
  ParticipantSweepstakeSchema,
  'prizes' | 'sweepstakes'
> & {
  participant?: SweepstakesParticipantSchema;
};

export const toSweepstakesState = (
  args: ComputeStateOptions
): GiveawayState => {
  const { sweepstakes, participant } = args;

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
      if (!participant) return 'not-logged-in';
      if (isProfileIncomplete(sweepstakes.audience.formFields, participant))
        return 'profile-incomplete';
      if (!isEligible({ ...args, participant })) return 'not-eligible';
      return 'active';
    }
    default:
      throw assertNever(sweepstakes.status);
  }
};

const isEligible = ({
  sweepstakes,
  participant
}: RequiredFields<ComputeStateOptions, 'participant'>) => {
  if (sweepstakes.audience.regionalRestriction) {
    if (!participant.user.countryCode) return false;

    const countries = expandCountries(
      sweepstakes.audience.regionalRestriction.regions
    );
    const hasRegion = includesCountryCode(
      countries,
      participant.user.countryCode
    );

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
