import z from 'zod';

export const DEFAULT_MINIMUM_AGE = 13;

const taskIntervalSchema = z.union([
  z.literal('daily'),
  z.literal('weekly'),
  z.literal('monthly')
]);
const baseTaskSchema = z.object({
  id: z.string(),
  icon: z.string(),
  title: z.string(),
  value: z.number(),
  mandatory: z.boolean(),
  actionsRequired: z.number().nullable()
});

const bonusTaskSchema = baseTaskSchema.extend({
  id: z.literal('bonus-task'),
  interval: taskIntervalSchema
});

const submitUrlSchema = baseTaskSchema.extend({
  id: z.literal('submit-url'),
  instructions: z.string().nullable(),
  domain: z.string().url().nullable(),
  unique: z.boolean(),
  interval: taskIntervalSchema
});

const taskSchema = z.discriminatedUnion('id', [
  bonusTaskSchema,
  submitUrlSchema
]);

export type TaskSchema = z.infer<typeof taskSchema>;

const prizeSchema = z.object({
  name: z.string(),
  winners: z.number(),
  value: z.number().nullable()
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
    name: z.string().min(1),
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
  })
  // tasks: z.array(taskSchema),
  // prizes: z.array(prizeSchema),
  // design: z.object({}),
  // automation: z.object({
  //   postEntryWebhook: z.string()
  // })
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
  }
  // tasks: [],
  // prizes: [],
  // design: {},
  // automation: {}
};
