import {
  CompletionStatus,
  PrizeDrawResult,
  RegionalRestrictionFilter,
  VisibilityType
} from '@giveaway/db-model';
import { assertNever } from '@giveaway/util-errors';
import z from 'zod';
import { userProfileSchema, userSchema } from '@giveaway/user-model/user';
import { derivedSweepstakesStatusSchema } from './sweepstakes';
import { MAX_SWEEPSTAKE_DURATION_DAYS } from '@giveaway/app-config/settings';
import { timingSchema } from './timing';
import {
  taskSchema,
  baseTaskSchema,
  participantTaskSchema
} from '@giveaway/task-model/schemas';
import { allowedUserSourcesSchema } from '@giveaway/user-source-model/schemas';
import { refineSweepstakeTasks } from './form';
import { identityProviderSchema } from '@giveaway/integration-model/providers';
import { aspectRatioSchema } from '@giveaway/util-media/aspect-ratio/data';
import { sweepstakesFormFieldSchema } from '@giveaway/custom-fields-model/schemas';
import { DEFAULT_MINIMUM_AGE } from '@giveaway/custom-fields-model/defaults';
import { taskCompletionSchema } from '@giveaway/task-model/completions';
import countriesData from '@giveaway/util-geo/countries.json';
import continentsData from '@giveaway/util-geo/continents.json';
export type DeviceType = 'mobile' | 'desktop';

export const prizeSchema = z.object({
  id: z.string(),
  name: z.string().min(3).max(100),
  quota: z.number().min(1, 'Minimum value is 1').max(10, 'Maximum value is 10')
});

export type Prize = z.infer<typeof prizeSchema>;

export const regionalRestrictionFilterSchema = z.nativeEnum(
  RegionalRestrictionFilter
);

export type RegionalRestrictionFilterSchema = z.infer<
  typeof regionalRestrictionFilterSchema
>;

export const termsTemplateSchema = z.object({
  sponsorName: z.string().min(1, 'Sponsor name is required'),
  sponsorAddress: z.string().nullish(),
  winnerSelectionMethod: z
    .string()
    .min(1, 'Winner selection method is required'),
  notificationTimeframeDays: z
    .number()
    .int()
    .positive('Notification timeframe must be a positive integer'),
  claimDeadlineDays: z
    .number()
    .int()
    .positive('Claim deadline must be a positive integer'),
  maxEntriesPerUser: z.number().int().positive().nullish(),
  governingLawCountry: z.string().min(1, 'Governing law country is required'),
  privacyPolicyUrl: z
    .string()
    .url('Privacy policy must be a valid URL')
    .or(z.literal(''))
    .nullish(),
  additionalTerms: z.string().nullish()
});

export type TermsTemplateSchema = z.infer<typeof termsTemplateSchema>;

export const giveawayFormTermsSchema = z.discriminatedUnion('type', [
  termsTemplateSchema.extend({ type: z.literal('TEMPLATE') }),
  z.object({
    type: z.literal('CUSTOM'),
    text: z.string()
  })
]);
export type GiveawayTerms = z.infer<typeof giveawayFormTermsSchema>;

const giveawayFormSetupSchema = z.object({
  name: z.string().min(3),
  description: z.string().min(3),
  banner: z.string()
});

export const regionalRestrictionSchema = z
  .object({
    regions: z.string().array().min(1),
    filter: regionalRestrictionFilterSchema
  })
  .nullable()
  .nullish();

export type RegionalRestrictionSchema = z.infer<
  typeof regionalRestrictionSchema
>;

export const toRegionalRestrictionDescription = (
  restriction: RegionalRestrictionSchema
): string | null => {
  if (
    !restriction ||
    !restriction.regions ||
    restriction.regions.length === 0
  ) {
    return null;
  }

  const regionNames = restriction.regions.map(toRegionName);
  const regionList = regionNames.join(', ');

  if (restriction.filter === 'INCLUDE') {
    return `Only available in: ${regionList}`;
  } else {
    return `Not available in: ${regionList}`;
  }
};

const countryMap = new Map(
  countriesData.map((country) => [country['alpha-2'], country.name])
);

const continentMap = new Map(
  continentsData.map((continent) => [continent['alpha-2'], continent.name])
);

export const toRegionName = (region: string): string => {
  const [type, code] = region.split(':');

  if (type === 'country') {
    return countryMap.get(code) || code;
  } else if (type === 'continent') {
    return continentMap.get(code) || code;
  }

  return region;
};

export const minimumAgeRestrictionSchema = z
  .object({
    format: z.literal('CHECKBOX'),
    value: z
      .number()
      .min(DEFAULT_MINIMUM_AGE, `Minimum age is ${DEFAULT_MINIMUM_AGE}`),
    label: z.string().min(1, 'Label is required'),
    required: z.boolean()
  })
  .nullish();

export type MinimumAgeRestrictionSchema = z.infer<
  typeof minimumAgeRestrictionSchema
>;

const sweepstakesVisibilitySchema = z.object({
  visibility: z.nativeEnum(VisibilityType),
  slug: z
    .string()
    .min(3, 'URL slug must be at least 3 characters')
    .max(50, 'URL slug must be at most 50 characters')
    .regex(
      /^[a-zA-Z0-9-]+$/,
      'URL slug can only contain letters, numbers, and hyphens'
    )
    .nullable()
    .nullish()
});

export type SweepstakesVisibilitySchema = z.infer<
  typeof sweepstakesVisibilitySchema
>;

export const sweepstakesWinnerCriteriaSchema = z.object({
  minTasksCompleted: z
    .number()
    .int()
    .min(1, 'Minimum tasks must be at least 1')
    .default(1),
  minQualityScore: z
    .number()
    .int()
    .min(0, 'Quality score must be between 0-100')
    .max(100, 'Quality score must be between 0-100')
    .default(70),
  allowMultipleWins: z.boolean().default(false),
  allowUserSelection: z.boolean().default(false),
  externalPlatforms: allowedUserSourcesSchema.nullable().nullish()
});

export type SweepstakesWinnerCriteriaSchema = z.infer<
  typeof sweepstakesWinnerCriteriaSchema
>;

const giveawayAudienceSchema = z.object({
  allowedIdentities: identityProviderSchema
    .array()
    .min(1, 'At least one allowed identity is required'),
  regionalRestriction: regionalRestrictionSchema,
  requirePreEntryLogin: z.boolean().nullish().default(false),
  formFields: z.array(sweepstakesFormFieldSchema).default([])
});

export type GiveawayFormAudience = z.infer<typeof giveawayAudienceSchema>;

const toTaskListSchema = <T extends z.ZodTypeAny>(task: T) =>
  z
    .array(task)
    .min(1, 'At least one entry method is required')
    .max(25, 'Maximum of 25 entry methods are allowed');

export const giveawayFormTaskSchema = toTaskListSchema(taskSchema);

export type GiveawayFormTaskSchema = z.infer<typeof giveawayFormTaskSchema>;

const giveawayFormPrizeSchema = z
  .array(prizeSchema)
  .min(1, 'At least one prize is required')
  .max(200, 'Maximum of 200 prizes are allowed');

export const solidColorBackgroundSchema = z.object({
  type: z.literal('color'),
  color: z
    .string()
    .regex(/^#([0-9A-Fa-f]{3}){1,2}$/, 'Must be a valid hex color')
});

export type SolidColorBackgroundSchema = z.infer<
  typeof solidColorBackgroundSchema
>;

export const gradientBackgroundSchema = z.object({
  type: z.literal('gradient'),
  format: z.union([z.literal('linear'), z.literal('radial')]),
  angle: z.number().min(0).max(360),
  stops: z
    .object({
      color: z
        .string()
        .regex(/^#([0-9A-Fa-f]{3}){1,2}$/, 'Must be a valid hex color'),
      position: z.number().min(0).max(100)
    })
    .array()
});

export type GradientBackgroundSchema = z.infer<typeof gradientBackgroundSchema>;

export const giveawayDesignBackgroundSchema = z.discriminatedUnion('type', [
  solidColorBackgroundSchema,
  gradientBackgroundSchema
]);

export type GiveawayDesignBackgroundSchema = z.infer<
  typeof giveawayDesignBackgroundSchema
>;

export const giveawayDesignSchema = z.object({
  displayName: z.boolean(),
  displayDescription: z.boolean(),
  aspectRatio: aspectRatioSchema.default('VIDEO'),
  background: giveawayDesignBackgroundSchema
});

export type GiveawayDesignSchema = z.infer<typeof giveawayDesignSchema>;

export const baseGiveawayFormSchema = ({
  validate
}: Pick<GiveawayFormSchemaOptions, 'validate'>) =>
  z.object({
    setup: giveawayFormSetupSchema,
    terms: giveawayFormTermsSchema,
    timing: timingSchema({
      validate: validate,
      maxDurationDays: MAX_SWEEPSTAKE_DURATION_DAYS
    }),
    audience: giveawayAudienceSchema,
    tasks: giveawayFormTaskSchema,
    prizes: giveawayFormPrizeSchema,
    design: giveawayDesignSchema,
    visibility: sweepstakesVisibilitySchema,
    criteria: sweepstakesWinnerCriteriaSchema
  });

export type BaseGiveawayFormSchema = z.infer<
  ReturnType<typeof baseGiveawayFormSchema>
>;

export type GiveawayFormSchemaOptions = {
  validate: boolean;
  maxLoyalty: number;
};

export const giveawayFormSchema = ({
  validate,
  maxLoyalty
}: GiveawayFormSchemaOptions) => {
  if (!validate) {
    return baseGiveawayFormSchema({ validate });
  }

  return baseGiveawayFormSchema({ validate }).superRefine((form, ctx) => {
    refineSweepstakeTasks({
      validate,
      maxLoyalty,
      form,
      ctx
    });
  });
};

export type GiveawayFormSchema = z.infer<ReturnType<typeof giveawayFormSchema>>;

export const giveawaySchema = baseGiveawayFormSchema({
  validate: false
}).extend({
  status: derivedSweepstakesStatusSchema,
  id: z.string()
});

export type GiveawaySchema = z.infer<typeof giveawaySchema>;

export const userTaskSubmissionSchema = z.object({
  taskId: z.string(),
  status: z.nativeEnum(CompletionStatus),
  proof: z.unknown()
});

export type UserTaskSubmissionSchema = z.infer<typeof userTaskSubmissionSchema>;

export const userParticipationSchema = z.object({
  entries: z.number().int().min(0),
  submissions: z.array(userTaskSubmissionSchema)
});

export type UserParticipationSchema = z.infer<typeof userParticipationSchema>;

// Host Schema
export const giveawayHostSchema = z.object({
  id: z.string().nullish(),
  slug: z.string(),
  name: z.string(),
  logo: z.string().nullish(),
  links: z.any().nullish()
});

export type GiveawayHostSchema = z.infer<typeof giveawayHostSchema>;

// Winner Information Schema
const giveawayPrizeSchema = z.object({
  prizeId: z.string(),
  prizeName: z.string(),
  quota: z.number(),
  draws: z.array(
    z.object({
      id: z.string(),
      result: z.nativeEnum(PrizeDrawResult),
      disqualificationReason: z.string().nullable(),
      createdAt: z.coerce.date(),
      updatedAt: z.coerce.date(),
      task: baseTaskSchema.pick({
        id: true,
        type: true,
        title: true
      }),
      user: userProfileSchema
    })
  )
});

export type GiveawayPrizeSchema = z.infer<typeof giveawayPrizeSchema>;

export const giveawayParticipationSchema = z.object({
  totalEntries: z.number().int().min(0),
  usersByTask: z.record(z.string(), z.number().int().min(0)),
  totalUsers: z.number().int().min(0)
});

export type GiveawayParticipationSchema = z.infer<
  typeof giveawayParticipationSchema
>;

export type GiveawayState =
  | 'active' // Default participation view
  | 'pending' // Giveaway is not yet ready for participation
  | 'not-logged-in' // User needs to log in
  | 'not-eligible' // User not eligible (age/region restrictions)
  | 'profile-incomplete' // User needs to fill out some profile details
  | 'winners-announced' // Winners have been announced
  | 'winners-pending' // Winners are pending announcement
  | 'no-prize-allocation' // No prize allocation available
  | 'closed' // Giveaway is closed
  | 'canceled' // Giveaway is cancelled
  | 'error'; // An error state

export const PREVIEW_GIVEAWAY_STATES: GiveawayState[] = [
  'active',
  'not-logged-in',
  'profile-incomplete',
  'not-eligible',
  'winners-announced',
  'no-prize-allocation'
];

// Helper function to convert state to display label
export const getStateDisplayLabel = (state: GiveawayState): string => {
  switch (state) {
    case 'active':
      return 'Active State';
    case 'pending':
      return 'Pending';
    case 'not-logged-in':
      return 'Not Logged In';
    case 'profile-incomplete':
      return 'Profile Incomplete';
    case 'not-eligible':
      return 'Not Eligible';
    case 'winners-announced':
      return 'Winners Announced';
    case 'winners-pending':
      return 'Winners Pending';
    case 'no-prize-allocation':
      return 'No Prize Selected';
    case 'closed':
      return 'Closed';
    case 'canceled':
      return 'Canceled';
    case 'error':
      return 'Error';
    default:
      throw assertNever(state);
  }
};

export const participantGiveawaySchema = giveawaySchema.extend({
  tasks: toTaskListSchema(participantTaskSchema)
});

export type ParticipantGiveawaySchema = z.infer<
  typeof participantGiveawaySchema
>;

export const participantSweepstakeSchema = z.object({
  sweepstakes: participantGiveawaySchema,
  host: giveawayHostSchema,
  prizes: giveawayPrizeSchema.array(),
  participation: giveawayParticipationSchema
});

export type ParticipantSweepstakeSchema = z.infer<
  typeof participantSweepstakeSchema
>;

export const timeSeriesDataSchema = z.object({
  date: z.string(),
  entries: z.number()
});
export type TimeSeriesDataSchema = z.infer<typeof timeSeriesDataSchema>;

export const sweepstakesPrizeSchema = z.object({
  id: z.string(),
  name: z.string(),
  position: z.number(),
  quota: z.number(),
  draws: z
    .object({
      id: z.string(),
      updatedAt: z.coerce.date(),
      createdAt: z.coerce.date(),
      result: z.enum(['WINNER', 'DISQUALIFIED']),
      disqualificationReason: z.string().nullable(),
      participant: userProfileSchema,
      taskCompletion: taskCompletionSchema
    })
    .array()
});

export type SweepstakesPrizeSchema = z.infer<typeof sweepstakesPrizeSchema>;

export const sweepstakesAllocationSchema = z.object({
  prize: z.object({
    id: z.string(),
    name: z.string()
  })
});

export type SweepstakesAllocationSchema = z.infer<
  typeof sweepstakesAllocationSchema
>;

export const allocatePrizeRequestSchema = z.object({
  participantId: z.string(),
  prizeId: z.string()
});
