import { RegionalRestrictionFilter, SweepstakesStatus } from '@prisma/client';
import { assertNever } from '@/lib/errors';
import z from 'zod';
import { DEFAULT_MINIMUM_AGE } from './defaults';
import { userProfileSchema } from '../user';
import { taskSchema } from '../tasks/schemas';
import {
  taskCompletionSchema,
  sweepstakesParticipantSchema
} from './participant';

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
  banner: z.string().url()
});

export const regionalRestrictionSchema = z
  .object({
    regions: z.string().array().min(1),
    filter: regionalRestrictionFilterSchema
  })
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
  .optional();

export type MinimumAgeRestrictionSchema = z.infer<
  typeof minimumAgeRestrictionSchema
>;

const giveawayAudienceSchema = z.object({
  requireEmail: z.boolean(),
  regionalRestriction: regionalRestrictionSchema,
  minimumAgeRestriction: minimumAgeRestrictionSchema
});

export type GiveawayFormAudience = z.infer<typeof giveawayAudienceSchema>;

const giveawayFormTaskSchema = z
  .array(taskSchema)
  .min(1, 'At least one entry method is required')
  .max(25, 'Maximum of 25 entry methods are allowed');

const giveawayFormPrizeSchema = z
  .array(prizeSchema)
  .min(1, 'At least one prize is required')
  .max(10, 'Maximum of 10 prizes are allowed');

const giveawayFormTimingSchema = (validateEndDate: boolean) => {
  const endDate = validateEndDate
    ? z.date().refine((date) => date > new Date(), {
        message: 'End date must be in the future'
      })
    : z.date();
  const obj = z.object({
    startDate: z.date(),
    endDate,
    timeZone: z.string()
  });
  if (!validateEndDate) return obj;
  return obj.superRefine((data, ctx) => {
    const startDate = data.startDate;
    const endDate = data.endDate;
    if (startDate && endDate <= startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'End date must be after start date',
        path: ['endDate']
      });
    }
  });
};

export const giveawayFormSchema = (validateEndDate: boolean) =>
  z.object({
    setup: giveawayFormSetupSchema,
    terms: giveawayFormTermsSchema,
    timing: giveawayFormTimingSchema(validateEndDate),
    audience: giveawayAudienceSchema,
    tasks: giveawayFormTaskSchema,
    prizes: giveawayFormPrizeSchema
  });

export type GiveawayFormSchema = z.infer<ReturnType<typeof giveawayFormSchema>>;

export const giveawaySchema = (validateEndDate: boolean) =>
  giveawayFormSchema(validateEndDate).extend({
    status: z.nativeEnum(SweepstakesStatus),
    id: z.string()
  });

export type GiveawaySchema = z.infer<ReturnType<typeof giveawaySchema>>;

export const userParticipationSchema = z.object({
  entries: z.number().int().min(0),
  completedTasks: z.array(z.string())
});

export type UserParticipationSchema = z.infer<typeof userParticipationSchema>;

// Host Schema
export const giveawayHostSchema = z.object({
  id: z.string().optional(),
  slug: z.string(),
  name: z.string(),
  logo: z.string().optional()
});

export type GiveawayHostSchema = z.infer<typeof giveawayHostSchema>;

// Winner Information Schema
const giveawayWinnerSchema = z.object({
  prizeId: z.string(),
  prizeName: z.string(),
  winners: z.array(userProfileSchema)
});

export type GiveawayWinnerSchema = z.infer<typeof giveawayWinnerSchema>;

export const giveawayParticipationSchema = z.object({
  totalEntries: z.number().int().min(0),
  totalUsers: z.number().int().min(0)
});

export type GiveawayParticipationSchema = z.infer<
  typeof giveawayParticipationSchema
>;

export type GiveawayState =
  | 'active' // Default participation view
  | 'not-logged-in' // User needs to log in
  | 'email-required' // User needs to set an email
  | 'age-verification-required' // User needs to verify age for this sweepstakes
  | 'not-eligible' // User not eligible (age/region restrictions)
  | 'profile-incomplete'
  | 'winners-announced' // Winners have been announced
  | 'winners-pending' // Winners are pending announcement
  | 'closed' // Giveaway is closed
  | 'canceled' // Giveaway is cancelled
  | 'error'; // An error state

export const PREVIEW_GIVEAWAY_STATES: GiveawayState[] = [
  'active',
  'not-logged-in',
  'email-required',
  'age-verification-required',
  'not-eligible',
  'winners-announced'
];

// Helper function to convert state to display label
export const getStateDisplayLabel = (state: GiveawayState): string => {
  switch (state) {
    case 'active':
      return 'Active State';
    case 'not-logged-in':
      return 'Not Logged In';
    case 'email-required':
      return 'Email Required';
    case 'age-verification-required':
      return 'Age Verification Required';
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
  sweepstakes: giveawaySchema(false),
  host: giveawayHostSchema,
  winners: giveawayWinnerSchema.array(),
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
  winner: z
    .object({
      id: z.string(),
      updatedAt: z.date(),
      createdAt: z.date(),
      participant: sweepstakesParticipantSchema,
      taskCompletion: taskCompletionSchema
    })
    .optional()
});

export type SweepstakesPrizeSchema = z.infer<typeof sweepstakesPrizeSchema>;
