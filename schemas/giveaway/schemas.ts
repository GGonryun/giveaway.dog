import { RegionalRestrictionFilter } from '@prisma/client';
import { assertNever } from '@/lib/errors';
import z from 'zod';
import { DEFAULT_MINIMUM_AGE } from './defaults';

export const baseTaskSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string().min(1, 'Title is required'),
  value: z.number().min(1, 'Minimum value is 1'),
  mandatory: z.boolean(),
  tasksRequired: z.number()
});

export const bonusTaskSchema = baseTaskSchema.extend({
  type: z.literal('BONUS_TASK')
});

export const visitUrlSchema = baseTaskSchema.extend({
  type: z.literal('VISIT_URL'),
  href: z.string().url()
});

export const taskSchema = z.discriminatedUnion('type', [
  bonusTaskSchema,
  visitUrlSchema
]);

export type TaskType = z.infer<typeof taskSchema>['type'];

export const TASK_GROUP: Record<TaskType, string> = {
  BONUS_TASK: 'Bonus Tasks',
  VISIT_URL: 'Visit URL Tasks'
};

export type TaskSchema = z.infer<typeof taskSchema>;

export type TaskOf<T extends TaskType> = Extract<TaskSchema, { type: T }>;

export const prizeSchema = z.object({
  id: z.string(),
  name: z.string().min(3).max(100),
  winners: z
    .number()
    .min(1, 'Minimum value is 1')
    .max(10, 'Maximum value is 10')
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
  banner: z.string().optional()
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

const giveawayFormTimingSchema = z
  .object({
    startDate: z.date().refine((date) => date > new Date(), {
      message: 'Start date must be in the future'
    }),
    endDate: z.date().refine((date) => date > new Date(), {
      message: 'End date must be in the future'
    }),
    timeZone: z.string()
  })
  .superRefine((data, ctx) => {
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

export const giveawayFormSchema = z.object({
  setup: giveawayFormSetupSchema,
  terms: giveawayFormTermsSchema,
  timing: giveawayFormTimingSchema,
  audience: giveawayAudienceSchema,
  tasks: giveawayFormTaskSchema,
  prizes: giveawayFormPrizeSchema
});

export type GiveawayFormSchema = z.infer<typeof giveawayFormSchema>;

// User Profile Schema
export const userProfileSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email().optional(),
  avatar: z.string().optional(),
  region: z.string().optional(),
  age: z.number().int().min(1).max(120).optional()
});

export type UserProfile = z.infer<typeof userProfileSchema>;

// User Participation Schema
export const userParticipationSchema = z.object({
  entries: z.number().int().min(0),
  completedTasks: z.array(z.string()) // Task IDs that user has completed
});

export type UserParticipation = z.infer<typeof userParticipationSchema>;

// Host Schema
export const giveawayHostSchema = z.object({
  id: z.string().optional(),
  slug: z.string(),
  name: z.string().min(1, 'Host name is required'),
  avatar: z.string().optional()
});

export type GiveawayHost = z.infer<typeof giveawayHostSchema>;

// Winner Information Schema
const giveawayWinnerSchema = z.object({
  prizeId: z.string(),
  prizeName: z.string().min(1, 'Prize name is required'),
  winners: z.array(userProfileSchema).min(1, 'At least one winner is required')
});

export type GiveawayWinner = z.infer<typeof giveawayWinnerSchema>;

// Giveaway Participation Data Schema
export const giveawayParticipationDataSchema = z.object({
  id: z.string(),
  totalEntries: z.number().int().min(0)
});

export type GiveawayParticipationData = z.infer<
  typeof giveawayParticipationDataSchema
>;

export type GiveawayState =
  | 'active' // Default participation view
  | 'not-logged-in' // User needs to log in
  | 'profile-incomplete' // User needs to complete profile
  | 'not-eligible' // User not eligible (age/region restrictions)
  | 'winners-announced'; // Winners have been announced

export const GIVEAWAY_STATES: GiveawayState[] = [
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
    case 'not-logged-in':
      return 'Not Logged In';
    case 'profile-incomplete':
      return 'Profile Incomplete';
    case 'not-eligible':
      return 'Not Eligible';
    case 'winners-announced':
      return 'Winners Announced';
    default:
      throw assertNever(state);
  }
};
