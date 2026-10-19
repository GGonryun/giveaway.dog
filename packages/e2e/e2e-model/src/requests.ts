import { z } from 'zod';
import { omit } from 'lodash';
import {
  CompletionStatus,
  IdentityProvider,
  PrizeDrawResult,
  SweepstakesStatus,
  TeamRole,
  TeamTier,
  VisibilityType
} from '@giveaway/db-model';
import { sweepstakesFormFieldSchema } from '@giveaway/custom-fields-model/schemas';
import {
  DEFAULT_SWEEPSTAKES_PRIZE_NAME,
  DEFAULT_SWEEPSTAKES_PRIZE_QUOTA
} from '@giveaway/sweepstakes-model/defaults';
import {
  prizeSchema,
  regionalRestrictionFilterSchema,
  sweepstakesWinnerCriteriaSchema,
  termsTemplateSchema
} from '@giveaway/sweepstakes-model/schemas';
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
export const E2E_MAX_TERMS_LENGTH = 10_000;
export const E2E_MAX_FORM_FIELDS = 10;
export const E2E_MAX_REGIONS = 20;
export const E2E_MAX_ENTRIES = 50;
export const E2E_MAX_DRAWS = 50;
export const E2E_MAX_REFERRALS = 50;
export const E2E_MAX_FORM_VALUE_LENGTH = 200;
export const E2E_MAX_REASON_LENGTH = 500;
export const E2E_RUN_ID_LENGTH = 6;

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

export const e2eTermsRequestSchema = z.discriminatedUnion('type', [
  z
    .object({
      type: z.literal('CUSTOM'),
      text: z.string().min(1).max(E2E_MAX_TERMS_LENGTH)
    })
    .strict(),
  termsTemplateSchema
    .partial()
    .extend({
      type: z.literal('TEMPLATE'),
      additionalTerms: z.string().max(E2E_MAX_TERMS_LENGTH).nullish()
    })
    .strict()
]);

export type E2eTermsRequest = z.infer<typeof e2eTermsRequestSchema>;

export const e2eCriteriaRequestSchema = sweepstakesWinnerCriteriaSchema
  .omit({ externalPlatforms: true })
  .partial()
  .strict();

export type E2eCriteriaRequest = z.infer<typeof e2eCriteriaRequestSchema>;

const [
  usernameFieldSchema,
  ageFieldSchema,
  emailFieldSchema,
  twitterFieldSchema
] = sweepstakesFormFieldSchema.options;

export const e2eFormFieldRequestSchema = z.discriminatedUnion('type', [
  usernameFieldSchema.omit({ id: true }).strict(),
  ageFieldSchema.omit({ id: true }).strict(),
  emailFieldSchema.omit({ id: true }).strict(),
  twitterFieldSchema.omit({ id: true }).strict()
]);

export type E2eFormFieldRequest = z.infer<typeof e2eFormFieldRequestSchema>;

export const e2eAudienceRequestSchema = z
  .object({
    allowedIdentities: z
      .array(z.nativeEnum(IdentityProvider))
      .min(1)
      .max(Object.keys(IdentityProvider).length)
      .optional(),
    requirePreEntryLogin: z.boolean().optional(),
    regionalRestriction: z
      .object({
        regions: z
          .array(z.string().regex(/^(country|continent):[A-Z]{2}$/))
          .min(1)
          .max(E2E_MAX_REGIONS),
        filter: regionalRestrictionFilterSchema
      })
      .strict()
      .nullable()
      .optional(),
    formFields: z
      .array(e2eFormFieldRequestSchema)
      .max(E2E_MAX_FORM_FIELDS)
      .optional()
  })
  .strict();

export type E2eAudienceRequest = z.infer<typeof e2eAudienceRequestSchema>;

const indexSchema = z.number().int().min(0);

const reasonSchema = z.string().max(E2E_MAX_REASON_LENGTH);

export const e2eEntryRequestSchema = z
  .object({
    persona: e2ePersonaSchema,
    ns: e2eNamespaceSchema.optional(),
    completions: z
      .array(
        z
          .object({
            task: indexSchema,
            status: z
              .nativeEnum(CompletionStatus)
              .default(CompletionStatus.COMPLETED),
            proof: z.record(z.string(), z.unknown()).optional(),
            reason: reasonSchema.optional()
          })
          .strict()
      )
      .max(E2E_MAX_TASKS)
      .default([]),
    formValues: z
      .array(
        z
          .object({
            field: indexSchema,
            value: z.string().max(E2E_MAX_FORM_VALUE_LENGTH)
          })
          .strict()
      )
      .max(E2E_MAX_FORM_FIELDS)
      .default([]),
    quality: z.number().int().min(0).max(100).optional(),
    prize: indexSchema.optional()
  })
  .strict();

export type E2eEntryRequest = z.infer<typeof e2eEntryRequestSchema>;

export const e2eDrawRequestSchema = z
  .object({
    entry: indexSchema,
    prize: indexSchema,
    task: indexSchema.optional(),
    result: z.nativeEnum(PrizeDrawResult).default(PrizeDrawResult.WINNER),
    reason: reasonSchema.optional(),
    previous: indexSchema.optional()
  })
  .strict();

export type E2eDrawRequest = z.infer<typeof e2eDrawRequestSchema>;

export const e2eReferralRequestSchema = z
  .object({
    entry: indexSchema,
    task: indexSchema,
    referred: z.array(indexSchema).max(E2E_MAX_ENTRIES).default([])
  })
  .strict();

export type E2eReferralRequest = z.infer<typeof e2eReferralRequestSchema>;

type Ctx = z.RefinementCtx;

const issue = (ctx: Ctx, path: (string | number)[], message: string) =>
  ctx.addIssue({ code: z.ZodIssueCode.custom, path, message });

const checkIndex = (
  ctx: Ctx,
  path: (string | number)[],
  index: number,
  length: number,
  name: string
) => {
  if (index < length) return true;
  issue(ctx, path, `There is no ${name} at index ${index}`);
  return false;
};

const findDuplicate = <T>(values: T[]) => {
  const seen = new Set<T>();
  for (const [index, value] of values.entries()) {
    if (seen.has(value)) return index;
    seen.add(value);
  }
  return undefined;
};

export const toE2eEntryNamespace = (
  request: { ns: string },
  entry: { ns?: string }
) => entry.ns ?? request.ns;

type E2eSweepstakesData = {
  ns: string;
  tasks: E2eTaskRequest[];
  prizes: E2ePrizeRequest[];
  criteria?: E2eCriteriaRequest;
  audience?: E2eAudienceRequest;
  entries: E2eEntryRequest[];
  draws: E2eDrawRequest[];
  referrals: E2eReferralRequest[];
};

const refineEntries = (value: E2eSweepstakesData, ctx: Ctx) => {
  const runId = value.ns.slice(0, E2E_RUN_ID_LENGTH);
  const fields = value.audience?.formFields?.length ?? 0;
  const users = value.entries.map(
    (entry) => `${entry.persona}-${toE2eEntryNamespace(value, entry)}`
  );
  const duplicate = findDuplicate(users);
  if (duplicate !== undefined) {
    issue(
      ctx,
      ['entries', duplicate],
      'Each persona and namespace enters the giveaway at most once'
    );
  }

  value.entries.forEach((entry, index) => {
    const path = ['entries', index];
    if (entry.ns && !entry.ns.startsWith(runId)) {
      issue(ctx, [...path, 'ns'], `The namespace must start with ${runId}`);
    }

    entry.completions.forEach((completion, position) =>
      checkIndex(
        ctx,
        [...path, 'completions', position, 'task'],
        completion.task,
        value.tasks.length,
        'task'
      )
    );
    const task = findDuplicate(entry.completions.map((c) => c.task));
    if (task !== undefined) {
      issue(
        ctx,
        [...path, 'completions', task],
        'Each task has at most one completion for each entry'
      );
    }

    entry.formValues.forEach((formValue, position) =>
      checkIndex(
        ctx,
        [...path, 'formValues', position, 'field'],
        formValue.field,
        fields,
        'form field'
      )
    );
    const field = findDuplicate(entry.formValues.map((v) => v.field));
    if (field !== undefined) {
      issue(
        ctx,
        [...path, 'formValues', field],
        'Each form field has at most one value for each entry'
      );
    }

    if (entry.prize !== undefined) {
      checkIndex(
        ctx,
        [...path, 'prize'],
        entry.prize,
        value.prizes.length,
        'prize'
      );
      if (!value.criteria?.allowUserSelection) {
        issue(
          ctx,
          [...path, 'prize'],
          'A prize allocation needs criteria.allowUserSelection'
        );
      }
    }
  });
};

const refineDraws = (value: E2eSweepstakesData, ctx: Ctx) => {
  const previous = value.draws.flatMap((draw) =>
    draw.previous === undefined ? [] : [draw.previous]
  );
  const rerolled = findDuplicate(previous);
  if (rerolled !== undefined) {
    issue(ctx, ['draws'], 'Each draw is the previous draw of at most one draw');
  }

  value.draws.forEach((draw, index) => {
    const path = ['draws', index];
    checkIndex(
      ctx,
      [...path, 'prize'],
      draw.prize,
      value.prizes.length,
      'prize'
    );
    if (
      checkIndex(
        ctx,
        [...path, 'entry'],
        draw.entry,
        value.entries.length,
        'entry'
      )
    ) {
      const tasks = value.entries[draw.entry].completions.map((c) => c.task);
      if (
        draw.task === undefined
          ? tasks.length === 0
          : !tasks.includes(draw.task)
      ) {
        issue(ctx, [...path, 'task'], 'A draw needs a completion of its entry');
      }
    }

    if (draw.previous === undefined) return;
    if (draw.previous >= index) {
      issue(ctx, [...path, 'previous'], 'The previous draw must come first');
      return;
    }
    const before = value.draws[draw.previous];
    if (before.result !== PrizeDrawResult.DISQUALIFIED) {
      issue(
        ctx,
        [...path, 'previous'],
        'The previous draw of a re-roll must be DISQUALIFIED'
      );
    }
    if (before.prize !== draw.prize) {
      issue(
        ctx,
        [...path, 'prize'],
        'A re-roll draws the prize of its previous draw'
      );
    }
  });
};

const refineReferrals = (value: E2eSweepstakesData, ctx: Ctx) => {
  const pairs = value.referrals.map((r) => `${r.entry}-${r.task}`);
  const duplicate = findDuplicate(pairs);
  if (duplicate !== undefined) {
    issue(
      ctx,
      ['referrals', duplicate],
      'Each entry has at most one referral for each task'
    );
  }

  value.referrals.forEach((referral, index) => {
    const path = ['referrals', index];
    checkIndex(
      ctx,
      [...path, 'entry'],
      referral.entry,
      value.entries.length,
      'entry'
    );
    if (
      checkIndex(
        ctx,
        [...path, 'task'],
        referral.task,
        value.tasks.length,
        'task'
      ) &&
      value.tasks[referral.task].type !== 'REFERRAL_LINK'
    ) {
      issue(ctx, [...path, 'task'], 'A referral needs a REFERRAL_LINK task');
    }

    referral.referred.forEach((referred, position) => {
      checkIndex(
        ctx,
        [...path, 'referred', position],
        referred,
        value.entries.length,
        'entry'
      );
      if (referred === referral.entry) {
        issue(
          ctx,
          [...path, 'referred', position],
          'An entry cannot refer itself'
        );
      }
    });
    const twice = findDuplicate(referral.referred);
    if (twice !== undefined) {
      issue(
        ctx,
        [...path, 'referred', twice],
        'Each entry is referred at most once by a referral'
      );
    }
  });
};

export const refineE2eSweepstakesData = (
  value: E2eSweepstakesData,
  ctx: Ctx
) => {
  refineEntries(value, ctx);
  refineDraws(value, ctx);
  refineReferrals(value, ctx);
};

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
      .default([{ name: DEFAULT_SWEEPSTAKES_PRIZE_NAME }]),
    terms: e2eTermsRequestSchema.optional(),
    criteria: e2eCriteriaRequestSchema.optional(),
    audience: e2eAudienceRequestSchema.optional(),
    entries: z.array(e2eEntryRequestSchema).max(E2E_MAX_ENTRIES).default([]),
    draws: z.array(e2eDrawRequestSchema).max(E2E_MAX_DRAWS).default([]),
    referrals: z
      .array(e2eReferralRequestSchema)
      .max(E2E_MAX_REFERRALS)
      .default([])
  })
  .strict()
  .superRefine((value, ctx) => {
    refineE2eSweepstakesData(value, ctx);

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
  z.object({ view: z.literal('jobs'), id: e2eSweepstakesIdSchema }).strict(),
  z
    .object({ view: z.literal('completions'), id: e2eSweepstakesIdSchema })
    .strict(),
  z.object({ view: z.literal('draws'), id: e2eSweepstakesIdSchema }).strict(),
  z
    .object({
      view: z.literal('accounts'),
      persona: e2ePersonaSchema,
      ns: e2eNamespaceSchema
    })
    .strict()
]);

export type E2eRowsQuery = z.infer<typeof e2eRowsQuerySchema>;
