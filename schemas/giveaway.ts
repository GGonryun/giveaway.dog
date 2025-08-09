import { assertNever } from '@/lib/errors';
import { DeepPartial } from '@/lib/types';
import z from 'zod';

export const DEFAULT_MINIMUM_AGE = 13;

export const baseTaskSchema = z.object({
  type: z.string(),
  title: z.string().min(1, 'Title is required'),
  value: z.number().min(1, 'Minimum value is 1'),
  mandatory: z.boolean(),
  tasksRequired: z.number()
});

export const bonusTaskSchema = baseTaskSchema.extend({
  type: z.literal('bonus-task')
});

export const visitUrlSchema = baseTaskSchema.extend({
  type: z.literal('visit-url'),
  href: z.string().url()
});

export const taskSchema = z.discriminatedUnion('type', [
  bonusTaskSchema,
  visitUrlSchema
]);

export type TaskType = z.infer<typeof taskSchema>['type'];

export const TASK_GROUP: Record<TaskType, string> = {
  'bonus-task': 'Bonus Tasks',
  'visit-url': 'Visit URL Tasks'
};

export type Task = z.infer<typeof taskSchema>;

export type TaskOf<T extends TaskType> = Extract<Task, { type: T }>;

export const prizeSchema = z.object({
  name: z.string().min(3).max(100),
  winners: z
    .number()
    .min(1, 'Minimum value is 1')
    .max(10, 'Maximum value is 10')
});

export type Prize = z.infer<typeof prizeSchema>;

export const regionalRestrictionFilterSchema = z.union([
  z.literal('include'),
  z.literal('exclude')
]);
export type RegionalRestrictionFilter = z.infer<
  typeof regionalRestrictionFilterSchema
>;

export const giveawaySchema = z.object({
  setup: z.object({
    name: z.string().min(3),
    description: z.string(),
    terms: z.string(),
    banner: z.string().optional()
  }),
  timing: z
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
    }),
  audience: z.object({
    requireEmail: z.boolean(),
    regionalRestriction: z
      .object({
        regions: z.string().array().min(1),
        filter: regionalRestrictionFilterSchema
      })
      .nullable(),
    minimumAgeRestriction: z
      .object({
        format: z.literal('checkbox'),
        value: z.number(),
        label: z.string(),
        required: z.boolean()
      })
      .nullable()
  }),
  tasks: z
    .array(taskSchema)
    .min(1, 'At least one entry method is required')
    .max(25, 'Maximum of 25 entry methods are allowed'),
  prizes: z
    .array(prizeSchema)
    .min(1, 'At least one prize is required')
    .max(10, 'Maximum of 10 prizes are allowed')
});

export type GiveawaySchema = z.infer<typeof giveawaySchema>;

export const giveawayDefaultValues: DeepPartial<GiveawaySchema> = {
  setup: {
    name: '',
    terms: ''
  },
  timing: {
    startDate: undefined,
    endDate: undefined,
    timeZone: undefined
  },
  audience: {
    regionalRestriction: null,
    minimumAgeRestriction: null,
    requireEmail: true
  },
  tasks: [],
  prizes: []
};

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
