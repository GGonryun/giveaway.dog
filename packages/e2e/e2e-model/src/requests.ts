import { z } from 'zod';
import { omit } from 'lodash';
import {
  SweepstakesStatus,
  TeamRole,
  TeamTier,
  VisibilityType
} from '@giveaway/db-model';
import {
  DEFAULT_SWEEPSTAKES_PRIZE_NAME,
  DEFAULT_SWEEPSTAKES_PRIZE_QUOTA
} from '@giveaway/sweepstakes-model/defaults';
import { prizeSchema } from '@giveaway/sweepstakes-model/schemas';
import { toDefaultValues } from '@giveaway/task-model/defaults';
import {
  askQuestionTaskSchema,
  bonusCompleteProfileTaskSchema,
  bonusLimitedTaskSchema,
  bonusLoyaltyTaskSchema,
  bonusTaskSchema,
  bonusTimedTaskSchema,
  multipleChoiceTaskSchema,
  referralLinkTaskSchema,
  secretCodeTaskSchema,
  secretCodeV2TaskSchema,
  singleChoiceTaskSchema,
  submitMediaTaskSchema,
  TaskType,
  visitUrlTaskSchema
} from '@giveaway/task-model/schemas';
import { e2eNamespaceSchema, e2ePersonaSchema } from './personas';
import {
  E2E_TEAM_SLUG_MAX_LENGTH,
  e2eTeamSlugSchema,
  toE2eGiveawaySlugPrefix,
  toE2eTeamSlug
} from './naming';

export const E2E_MAX_TEAM_MEMBERS = 10;
export const E2E_MAX_GIVEAWAY_NAME_LENGTH = 80;
export const E2E_MIN_DESCRIPTION_LENGTH = 3;
export const E2E_MAX_DESCRIPTION_LENGTH = 10_000;
export const E2E_MAX_TASKS = 10;
export const E2E_MAX_PRIZES = 10;
export const E2E_MAX_OFFSET_SECONDS = 366 * 24 * 60 * 60;

const HOUR = 60 * 60;
const DAY = 24 * HOUR;

const offsetSchema = z
  .number()
  .int()
  .min(-E2E_MAX_OFFSET_SECONDS)
  .max(E2E_MAX_OFFSET_SECONDS);

export const e2eTeamRequestSchema = z
  .object({
    ns: e2eNamespaceSchema,
    suffix: z.string().regex(/^[a-z0-9]{1,11}$/),
    name: z.string().trim().min(3).max(20).optional(),
    owner: e2ePersonaSchema.default('host'),
    members: z
      .array(
        z
          .object({
            persona: e2ePersonaSchema,
            role: z.enum([
              TeamRole.ADMIN,
              TeamRole.MEMBER,
              TeamRole.GUEST,
              TeamRole.BLOCKED
            ])
          })
          .strict()
      )
      .max(E2E_MAX_TEAM_MEMBERS)
      .default([]),
    tier: z.nativeEnum(TeamTier).default(TeamTier.FREE)
  })
  .strict()
  .superRefine((value, ctx) => {
    if (
      toE2eTeamSlug(value.ns, value.suffix).length > E2E_TEAM_SLUG_MAX_LENGTH
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['suffix'],
        message: `e2e-<ns>-<suffix> must have at most ${E2E_TEAM_SLUG_MAX_LENGTH} characters`
      });
    }

    const personas = [value.owner, ...value.members.map((m) => m.persona)];
    if (new Set(personas).size !== personas.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['members'],
        message: 'Each persona joins the team at most once'
      });
    }
  });

export type E2eTeamRequest = z.infer<typeof e2eTeamRequestSchema>;

export type E2eTeamRequestInput = z.input<typeof e2eTeamRequestSchema>;

export const E2E_SWEEPSTAKES_PRESETS = [
  'draft',
  'scheduled',
  'running',
  'ended',
  'completed'
] as const;

export type E2eSweepstakesPreset = (typeof E2E_SWEEPSTAKES_PRESETS)[number];

type E2eOffsets = { startsIn: number; endsIn: number };

const DEFAULT_OFFSETS: Record<E2eSweepstakesPreset, E2eOffsets> = {
  draft: { startsIn: DAY, endsIn: 8 * DAY },
  scheduled: { startsIn: DAY, endsIn: 8 * DAY },
  running: { startsIn: -HOUR, endsIn: 7 * DAY },
  ended: { startsIn: -8 * DAY, endsIn: -HOUR },
  completed: { startsIn: -8 * DAY, endsIn: -HOUR }
};

const PRESET_RULES: Record<
  E2eSweepstakesPreset,
  (offsets: E2eOffsets) => string | undefined
> = {
  draft: () => undefined,
  scheduled: ({ startsIn }) =>
    startsIn > 0 ? undefined : 'A scheduled giveaway needs startsIn above 0',
  running: ({ startsIn, endsIn }) =>
    startsIn <= 0 && endsIn > 0
      ? undefined
      : 'A running giveaway needs startsIn at most 0 and endsIn above 0',
  ended: ({ endsIn }) =>
    endsIn <= 0 ? undefined : 'An ended giveaway needs endsIn at most 0',
  completed: ({ endsIn }) =>
    endsIn <= 0 ? undefined : 'A completed giveaway needs endsIn at most 0'
};

export const E2E_PRESET_STATUS: Record<
  E2eSweepstakesPreset,
  SweepstakesStatus
> = {
  draft: SweepstakesStatus.DRAFT,
  scheduled: SweepstakesStatus.ACTIVE,
  running: SweepstakesStatus.ACTIVE,
  ended: SweepstakesStatus.ACTIVE,
  completed: SweepstakesStatus.COMPLETED
};

export const toE2eSweepstakesOffsets = ({
  preset,
  startsIn,
  endsIn
}: {
  preset: E2eSweepstakesPreset;
  startsIn?: number;
  endsIn?: number;
}): E2eOffsets => ({
  startsIn: startsIn ?? DEFAULT_OFFSETS[preset].startsIn,
  endsIn: endsIn ?? DEFAULT_OFFSETS[preset].endsIn
});

export const toE2eSweepstakesTiming = (
  request: {
    preset: E2eSweepstakesPreset;
    startsIn?: number;
    endsIn?: number;
  },
  now: Date
) => {
  const { startsIn, endsIn } = toE2eSweepstakesOffsets(request);
  return {
    startDate: new Date(now.getTime() + startsIn * 1000),
    endDate: new Date(now.getTime() + endsIn * 1000)
  };
};

export const E2E_TASK_TYPES = [
  'BONUS_TASK',
  'BONUS_TIMED',
  'BONUS_LIMITED',
  'BONUS_LOYALTY',
  'BONUS_COMPLETE_PROFILE',
  'VISIT_URL',
  'ASK_QUESTION',
  'SINGLE_CHOICE',
  'MULTIPLE_CHOICE',
  'SECRET_CODE',
  'SECRET_CODE_V2',
  'REFERRAL_LINK',
  'SUBMIT_MEDIA'
] as const satisfies readonly TaskType[];

const hermeticTaskSchema = z.discriminatedUnion('type', [
  bonusTaskSchema.omit({ id: true }).strict(),
  bonusTimedTaskSchema.omit({ id: true }).strict(),
  bonusLimitedTaskSchema.omit({ id: true }).strict(),
  bonusLoyaltyTaskSchema.omit({ id: true }).strict(),
  bonusCompleteProfileTaskSchema.omit({ id: true }).strict(),
  visitUrlTaskSchema.omit({ id: true }).strict(),
  askQuestionTaskSchema.omit({ id: true }).strict(),
  singleChoiceTaskSchema.omit({ id: true }).strict(),
  multipleChoiceTaskSchema.omit({ id: true }).strict(),
  secretCodeTaskSchema.omit({ id: true }).strict(),
  secretCodeV2TaskSchema.omit({ id: true }).strict(),
  referralLinkTaskSchema.omit({ id: true }).strict(),
  submitMediaTaskSchema.omit({ id: true }).strict()
]);

export const e2eTaskRequestSchema = z
  .object({ type: z.enum(E2E_TASK_TYPES) })
  .passthrough()
  .transform(({ type, ...fields }) => ({
    ...omit(toDefaultValues(type), 'id'),
    ...fields
  }))
  .pipe(hermeticTaskSchema);

export type E2eTaskRequest = z.infer<typeof e2eTaskRequestSchema>;

export const e2ePrizeRequestSchema = prizeSchema
  .omit({ id: true })
  .extend({
    quota: prizeSchema.shape.quota
      .int()
      .default(DEFAULT_SWEEPSTAKES_PRIZE_QUOTA)
  })
  .strict();

export type E2ePrizeRequest = z.infer<typeof e2ePrizeRequestSchema>;

export const e2eSweepstakesRequestSchema = z
  .object({
    ns: e2eNamespaceSchema,
    team: e2eTeamSlugSchema,
    preset: z.enum(E2E_SWEEPSTAKES_PRESETS).default('running'),
    startsIn: offsetSchema.optional(),
    endsIn: offsetSchema.optional(),
    name: z
      .string()
      .trim()
      .min(1)
      .max(E2E_MAX_GIVEAWAY_NAME_LENGTH)
      .default('Giveaway'),
    description: z
      .string()
      .min(E2E_MIN_DESCRIPTION_LENGTH)
      .max(E2E_MAX_DESCRIPTION_LENGTH)
      .optional(),
    visibility: z.nativeEnum(VisibilityType).default(VisibilityType.UNLISTED),
    slug: z
      .string()
      .max(50)
      .regex(/^[a-z0-9-]+$/)
      .optional(),
    tasks: z
      .array(e2eTaskRequestSchema)
      .min(1)
      .max(E2E_MAX_TASKS)
      .default([{ type: 'BONUS_TASK' }]),
    prizes: z
      .array(e2ePrizeRequestSchema)
      .min(1)
      .max(E2E_MAX_PRIZES)
      .default([{ name: DEFAULT_SWEEPSTAKES_PRIZE_NAME }])
  })
  .strict()
  .superRefine((value, ctx) => {
    if (
      value.slug &&
      !value.slug.startsWith(toE2eGiveawaySlugPrefix(value.ns))
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['slug'],
        message: `The slug must start with ${toE2eGiveawaySlugPrefix(value.ns)}`
      });
    }

    const offsets = toE2eSweepstakesOffsets(value);
    if (offsets.endsIn <= offsets.startsIn) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endsIn'],
        message: 'endsIn must be above startsIn'
      });
    }

    const problem = PRESET_RULES[value.preset](offsets);
    if (problem) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['preset'],
        message: problem
      });
    }
  });

export type E2eSweepstakesRequest = z.infer<typeof e2eSweepstakesRequestSchema>;

export type E2eSweepstakesRequestInput = z.input<
  typeof e2eSweepstakesRequestSchema
>;

const e2eSweepstakesIdSchema = z.string().regex(/^[A-Za-z0-9_-]{1,32}$/);

export const e2eRowsQuerySchema = z.union([
  z.object({ view: z.literal('team'), slug: e2eTeamSlugSchema }).strict(),
  z
    .object({ view: z.literal('sweepstakes'), id: e2eSweepstakesIdSchema })
    .strict(),
  z
    .object({ view: z.literal('participants'), id: e2eSweepstakesIdSchema })
    .strict(),
  z.object({ view: z.literal('jobs'), id: e2eSweepstakesIdSchema }).strict()
]);

export type E2eRowsQuery = z.infer<typeof e2eRowsQuerySchema>;
