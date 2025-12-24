import {
  CompletionStatus,
  PrizeDrawResult,
  RegionalRestrictionFilter,
  VisibilityType
} from '@prisma/client';
import { assertNever } from '@/lib/errors';
import z from 'zod';
import { userProfileSchema, userSchema } from '../user';
import { derivedSweepstakesStatusSchema } from '../sweepstakes';
import { MAX_SWEEPSTAKE_DURATION_DAYS } from '@/lib/settings';
import { timingSchema } from '../timing';
import { taskSchema, baseTaskSchema } from '@/lib/task/schemas';
import { allowedUserSourcesSchema } from '@/lib/user-source/schemas';
import { refineSweepstakeTasks } from '@/lib/task/validation/form';
import { providerTypeSchema } from '@/lib/integrations/schemas/providers';
import { aspectRatioSchema } from '@/lib/aspect-ratio/data';
import { sweepstakesFormFieldSchema } from '@/lib/custom-fields/schemas';
import { DEFAULT_MINIMUM_AGE } from '@/lib/custom-fields/defaults';
import { taskCompletionSchema } from '@/lib/task/completions';

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
  sponsorAddress: z.string().optional(),
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
  maxEntriesPerUser: z.number().int().positive().optional(),
  governingLawCountry: z.string().min(1, 'Governing law country is required'),
  privacyPolicyUrl: z
    .string()
    .url('Privacy policy must be a valid URL')
    .or(z.literal(''))
    .optional(),
  additionalTerms: z.string().optional()
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
  .optional();

export type RegionalRestrictionSchema = z.infer<
  typeof regionalRestrictionSchema
>;

export const minimumAgeRestrictionSchema = z
  .object({
    format: z.literal('CHECKBOX'),
    value: z
      .number()
      .min(DEFAULT_MINIMUM_AGE, `Minimum age is ${DEFAULT_MINIMUM_AGE}`),
    label: z.string().min(1, 'Label is required'),
    required: z.boolean()
  })
  .optional()
  .nullable();

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
    .optional()
});

export type SweepstakesVisibilitySchema = z.infer<
  typeof sweepstakesVisibilitySchema
>;

const sweepstakesWinnerCriteriaSchema = z.object({
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
  externalPlatforms: allowedUserSourcesSchema.nullable().optional()
});

export type SweepstakesWinnerCriteriaSchema = z.infer<
  typeof sweepstakesWinnerCriteriaSchema
>;

const giveawayAudienceSchema = z.object({
  allowedIdentities: providerTypeSchema
    .array()
    .min(1, 'At least one allowed identity is required'),
  regionalRestriction: regionalRestrictionSchema,
  requirePreEntryLogin: z.boolean().optional().default(false),
  formFields: z.array(sweepstakesFormFieldSchema).default([])
});

export type GiveawayFormAudience = z.infer<typeof giveawayAudienceSchema>;

export const giveawayFormTaskSchema = z
  .array(taskSchema)
  .min(1, 'At least one entry method is required')
  .max(25, 'Maximum of 25 entry methods are allowed');

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
    refineSweepstakeTasks({ maxLoyalty, form, ctx });
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
  status: z.nativeEnum(CompletionStatus)
});

export type UserTaskSubmissionSchema = z.infer<typeof userTaskSubmissionSchema>;

export const userParticipationSchema = z.object({
  entries: z.number().int().min(0),
  submissions: z.array(userTaskSubmissionSchema)
});

export type UserParticipationSchema = z.infer<typeof userParticipationSchema>;

// Host Schema
export const giveawayHostSchema = z.object({
  id: z.string().optional(),
  slug: z.string(),
  name: z.string(),
  logo: z.string().optional(),
  links: z.any().optional()
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
      createdAt: z.date(),
      updatedAt: z.date(),
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
  | 'closed' // Giveaway is closed
  | 'canceled' // Giveaway is cancelled
  | 'error'; // An error state

export const PREVIEW_GIVEAWAY_STATES: GiveawayState[] = [
  'active',
  'not-logged-in',
  'profile-incomplete',
  'not-eligible',
  'winners-announced'
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
    case 'profile-incomplete':
      return 'Profile Incomplete';
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

export const participantSweepstakeSchema = z.object({
  sweepstakes: giveawaySchema,
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
      updatedAt: z.date(),
      createdAt: z.date(),
      result: z.enum(['WINNER', 'DISQUALIFIED']),
      disqualificationReason: z.string().nullable(),
      participant: userProfileSchema,
      taskCompletion: taskCompletionSchema
    })
    .array()
});

export type SweepstakesPrizeSchema = z.infer<typeof sweepstakesPrizeSchema>;
