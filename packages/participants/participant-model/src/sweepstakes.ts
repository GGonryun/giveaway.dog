import { UNKNOWN_USER_COUNTRY_CODE } from '@giveaway/app-config/settings';
import {
  GiveawayState,
  ParticipantSweepstakeSchema,
  RegionalRestrictionSchema
} from '@giveaway/sweepstakes-model/schemas';
import { assertNever } from '@giveaway/util-errors';
import { RequiredFields } from '@giveaway/util-types/types';
import {
  expandCountries,
  includesCountryCode
} from '@giveaway/util-geo/countries';
import { isProfileComplete } from './participant';
import { SweepstakesParticipantSchema } from './schemas';

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
    case 'SCHEDULED': {
      // double check the sweepstakes start date:
      if (new Date(sweepstakes.timing.startDate) > new Date()) {
        return 'pending';
      }
      return 'active';
    }
    case 'RUNNING': {
      if (!participant) return 'not-logged-in';
      if (
        !isProfileComplete(
          sweepstakes.audience.formFields,
          participant.user,
          participant.formValues
        )
      )
        return 'profile-incomplete';
      if (!isEligible({ ...args, participant })) return 'not-eligible';
      // double check the sweepstakes end date:
      if (new Date(sweepstakes.timing.endDate) < new Date()) {
        return 'winners-pending';
      }
      return 'active';
    }
    default:
      throw assertNever(sweepstakes.status);
  }
};

const isEligible = ({
  sweepstakes,
  participant
}: RequiredFields<ComputeStateOptions, 'participant'>) =>
  isInAllowedRegion(
    sweepstakes.audience.regionalRestriction,
    participant.user.countryCode
  );

export const isInAllowedRegion = (
  restriction: RegionalRestrictionSchema,
  countryCode: string | null | undefined
) => {
  if (!restriction) return true;
  if (!countryCode || countryCode === UNKNOWN_USER_COUNTRY_CODE) return false;

  const hasRegion = includesCountryCode(
    expandCountries(restriction.regions),
    countryCode
  );

  switch (restriction.filter) {
    case 'INCLUDE':
      return hasRegion;
    case 'EXCLUDE':
      return !hasRegion;
    default:
      throw assertNever(restriction.filter);
  }
};
