import z from 'zod';

export const DEFAULT_MINIMUM_AGE = 13;

const baseTaskSchema = z.object({
  type: z.string(),
  title: z.string(),
  value: z.number().min(1, 'Minimum value is 1'),
  mandatory: z.boolean(),
  tasksRequired: z.number()
});

const bonusTaskSchema = baseTaskSchema.extend({
  type: z.literal('bonus-task')
});

const visitUrlSchema = baseTaskSchema.extend({
  type: z.literal('visit-url'),
  href: z.string().url()
});

const taskSchema = z.discriminatedUnion('type', [
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

const prizeSchema = z.object({
  name: z.string().min(3).max(100),
  winners: z
    .number()
    .min(1, 'Minimum value is 1')
    .max(10, 'Maximum value is 10')
});

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
    terms: z.string()
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
    requirePreEntryLogin: z.boolean(),
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

export type GiveawayFormSchema = z.infer<typeof giveawaySchema>;

export const giveawayFormDefaultValues: DeepPartial<GiveawayFormSchema> = {
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
    requirePreEntryLogin: false,
    regionalRestriction: null,
    minimumAgeRestriction: null,
    requireEmail: true
  },
  tasks: [],
  prizes: []
};
