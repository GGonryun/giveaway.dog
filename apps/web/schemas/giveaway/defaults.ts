import { timezone } from '@/lib/time';
import { Prisma, SweepstakesTermsType, VisibilityType } from '@prisma/client';
import * as dates from 'date-fns';
import {
  GiveawayDesignSchema,
  GradientBackgroundSchema,
  SolidColorBackgroundSchema
} from './schemas';
import { AllowedUserSourcesSchema } from '@giveaway/user-source-model/schemas';
import {
  DEFAULT_ALLOWED_IDENTITIES,
  DEFAULT_REQUIRED_PRE_ENTRY_LOGIN,
  DEFAULT_SWEEPSTAKES_NAME
} from '@giveaway/app-config/settings';
import { DEFAULT_MINIMUM_AGE_FIELD } from '@giveaway/custom-fields-model/defaults';

export const DEFAULT_SWEEPSTAKES_PRIZE_NAME = 'My Custom Prize';
export const DEFAULT_SWEEPSTAKES_PRIZE_QUOTA = 1;
export const DEFAULT_SWEEPSTAKES_DESCRIPTION = 'Enter to win a prize!';
export const DEFAULT_WINNER_SELECTION_METHOD = 'Random Drawing';
export const DEFAULT_NOTIFICATION_TIMEFRAME_DAYS = 7;
export const DEFAULT_CLAIM_DEADLINE_DAYS = 7;
export const DEFAULT_GOVERNING_LAW_COUNTRY_CODE = 'USA';
export const DEFAULT_SPONSOR_NAME = 'Giveaway Sponsor';
export const DEFAULT_MIN_QUALITY_SCORE = 50;
export const DEFAULT_MIN_TASK_COMPLETED = 1;
export const DEFAULT_ALLOW_MULTIPLE_WINS = false;
export const DEFAULT_ALLOW_USER_SELECTION = false;

export const DEFAULT_ALLOWED_USER_SOURCES: AllowedUserSourcesSchema = [
  'TWITTER_IMPORT'
];

export const DEFAULT_SWEEPSTAKES_DETAILS: Prisma.SweepstakesDetailsUncheckedCreateWithoutSweepstakesInput =
  {
    name: DEFAULT_SWEEPSTAKES_NAME,
    description: DEFAULT_SWEEPSTAKES_DESCRIPTION
  };

export const DEFAULT_SWEEPSTAKES_TIMING: Prisma.SweepstakesTimingUncheckedCreateWithoutSweepstakesInput =
  {
    startDate: dates.startOfDay(dates.add(Date.now(), { days: 1 })),
    endDate: dates.startOfDay(dates.add(Date.now(), { days: 1, weeks: 1 })),
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
    requirePreEntryLogin: DEFAULT_REQUIRED_PRE_ENTRY_LOGIN,
    allowedIdentities: DEFAULT_ALLOWED_IDENTITIES,
    formFields: {
      createMany: {
        data: [
          {
            type: 'USERNAME',
            label: 'Username',
            required: true
          },
          {
            label: 'Email',
            type: 'EMAIL'
          },
          DEFAULT_MINIMUM_AGE_FIELD
        ]
      }
    }
  };

export const DEFAULT_SWEEPSTAKES_PRIZES: Prisma.PrizeCreateManySweepstakesInput[] =
  [];
export const DEFAULT_SWEEPSTAKES_TASKS: Prisma.TaskCreateManySweepstakesInput[] =
  [];

// TODO: same as --secondary in globals.css
const DEFAULT_BACKGROUND_COLOR = '#edf0f4';

export const DEFAULT_SOLID_COLOR_DESIGN_BACKGROUND: SolidColorBackgroundSchema =
  {
    type: 'color',
    color: DEFAULT_BACKGROUND_COLOR
  };

export const DEFAULT_GRADIENT_DESIGN_BACKGROUND: GradientBackgroundSchema = {
  type: 'gradient',
  format: 'linear',
  angle: 135,
  stops: [
    { color: '#667eea', position: 0 },
    { color: '#764ba2', position: 100 }
  ]
};

export const DEFAULT_DESIGN_DATA: GiveawayDesignSchema = {
  displayName: true,
  displayDescription: true,
  aspectRatio: 'VIDEO',
  background: DEFAULT_SOLID_COLOR_DESIGN_BACKGROUND
};

export const DEFAULT_SWEEPSTAKES_DESIGN: Prisma.SweepstakesDesignUncheckedCreateWithoutSweepstakesInput =
  {
    data: DEFAULT_DESIGN_DATA
  };

export const DEFAULT_SWEEPSTAKES_VISIBILITY: Prisma.SweepstakesVisibilityCreateWithoutSweepstakesInput =
  {
    slug: null,
    visibility: VisibilityType.UNLISTED
  };

export const DEFAULT_SWEEPSTAKES_WINNER_CRITERIA: Prisma.SweepstakesWinnerCriteriaCreateWithoutSweepstakesInput =
  {
    minQualityScore: DEFAULT_MIN_QUALITY_SCORE,
    minTasksCompleted: DEFAULT_MIN_TASK_COMPLETED,
    allowMultipleWins: DEFAULT_ALLOW_MULTIPLE_WINS
  };
