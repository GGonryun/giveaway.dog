import { timezone } from '@/lib/time';
import {
  MinimumAgeRestrictionFormat,
  Prisma,
  SweepstakesTermsType
} from '@prisma/client';
import * as dates from 'date-fns';
import { MinimumAgeRestrictionSchema } from './schemas';

export const DEFAULT_MINIMUM_AGE = 13;

export const DEFAULT_SWEEPSTAKES_NAME = 'Untitled Sweepstakes';
export const DEFAULT_SWEEPSTAKES_PRIZE_NAME = 'My Custom Prize';
export const DEFAULT_SWEEPSTAKES_PRIZE_QUOTA = 1;
export const DEFAULT_SWEEPSTAKES_DESCRIPTION = 'Enter to win a prize!';
export const DEFAULT_WINNER_SELECTION_METHOD = 'Random Drawing';
export const DEFAULT_NOTIFICATION_TIMEFRAME_DAYS = 7;
export const DEFAULT_CLAIM_DEADLINE_DAYS = 7;
export const DEFAULT_GOVERNING_LAW_COUNTRY_CODE = 'USA';
export const DEFAULT_SPONSOR_NAME = 'Giveaway Sponsor';

export const DEFAULT_MINIMUM_AGE_RESTRICTION: MinimumAgeRestrictionSchema = {
  value: DEFAULT_MINIMUM_AGE,
  format: MinimumAgeRestrictionFormat.CHECKBOX,
  label: `I am at least ${DEFAULT_MINIMUM_AGE} years of age (required)`,
  required: true
};

export const DEFAULT_SWEEPSTAKES_DETAILS: Prisma.SweepstakesDetailsUncheckedCreateWithoutSweepstakesInput =
  {
    name: DEFAULT_SWEEPSTAKES_NAME,
    description: DEFAULT_SWEEPSTAKES_DESCRIPTION
  };

export const DEFAULT_SWEEPSTAKES_TIMING: Prisma.SweepstakesTimingUncheckedCreateWithoutSweepstakesInput =
  {
    startDate: dates.startOfDay(dates.add(Date.now(), { days: 1 })),
    endDate: dates.startOfDay(dates.add(Date.now(), { days: 1, weeks: 1 })),
    // TODO: set to the user's timezone not the server's!
    timeZone: timezone.current()
  };

export const DEFAULT_SWEEPSTAKES_TERMS: Prisma.SweepstakesTermsUncheckedCreateWithoutSweepstakesInput =
  {
    type: SweepstakesTermsType.TEMPLATE,
    sponsorAddress: '',
    sponsorName: DEFAULT_SPONSOR_NAME,
    winnerSelectionMethod: DEFAULT_WINNER_SELECTION_METHOD,
    notificationTimeframeDays: DEFAULT_NOTIFICATION_TIMEFRAME_DAYS,
    claimDeadlineDays: DEFAULT_CLAIM_DEADLINE_DAYS,
    governingLawCountry: DEFAULT_GOVERNING_LAW_COUNTRY_CODE,
    privacyPolicyUrl: ''
  };

export const DEFAULT_SWEEPSTAKES_AUDIENCE: Prisma.SweepstakesAudienceUncheckedCreateWithoutSweepstakesInput =
  {
    requireEmail: true
  };

export const DEFAULT_SWEEPSTAKES_PRIZES: Prisma.PrizeCreateManySweepstakesInput[] =
  [];
export const DEFAULT_SWEEPSTAKES_TASKS: Prisma.TaskCreateManySweepstakesInput[] =
  [];
