import { timezone } from '@/lib/time';
import * as dates from 'date-fns';
import {
  FormSweepstakesGetPayload,
  SweepstakesInputDesignBackgroundSchema,
  SweepstakesInputFormFieldSchema,
  SweepstakesInputSchema,
  SweepstakesInputTaskSchema
} from './db';
import { compact } from 'lodash';
import { toJsonObject } from '@giveaway/util-collections/json';
import {
  DEFAULT_ALLOW_MULTIPLE_WINS,
  DEFAULT_ALLOW_USER_SELECTION,
  DEFAULT_MIN_QUALITY_SCORE,
  DEFAULT_MIN_TASK_COMPLETED,
  DEFAULT_SOLID_COLOR_DESIGN_BACKGROUND
} from './defaults';
import { parseUserSourceSchema } from '@/lib/user-source/schemas';
import { DEFAULT_ALLOWED_IDENTITIES } from '@giveaway/app-config/settings';
import { parseAspectRatio } from '@giveaway/util-media/aspect-ratio/data';
import { Prisma } from '@prisma/client';

const toSetup = (
  data: FormSweepstakesGetPayload['details']
): SweepstakesInputSchema['setup'] => {
  return {
    name: data?.name ?? undefined,
    banner: data?.banner ?? undefined,
    description: data?.description ?? undefined
  };
};

const toTermsInput = (
  terms: FormSweepstakesGetPayload['terms']
): SweepstakesInputSchema['terms'] => {
  return {
    type: terms?.type ?? undefined,
    sponsorName: terms?.sponsorName ?? undefined,
    sponsorAddress: terms?.sponsorAddress ?? undefined,
    winnerSelectionMethod: terms?.winnerSelectionMethod ?? undefined,
    notificationTimeframeDays: terms?.notificationTimeframeDays ?? undefined,
    claimDeadlineDays: terms?.claimDeadlineDays ?? undefined,
    maxEntriesPerUser: terms?.maxEntriesPerUser ?? undefined,
    governingLawCountry: terms?.governingLawCountry ?? undefined,
    privacyPolicyUrl: terms?.privacyPolicyUrl ?? undefined,
    additionalTerms: terms?.additionalTerms ?? undefined,
    text: terms?.text ?? undefined
  };
};

const toAudienceInput = (
  data: FormSweepstakesGetPayload['audience']
): SweepstakesInputSchema['audience'] => {
  return {
    allowedIdentities: data?.allowedIdentities || DEFAULT_ALLOWED_IDENTITIES,
    regionalRestriction: data?.regionalRestriction
      ? {
          regions: data?.regionalRestriction?.regions ?? [],
          filter: data?.regionalRestriction?.filter ?? undefined
        }
      : undefined,
    requirePreEntryLogin: data?.requirePreEntryLogin || false,
    formFields: toFormFieldsInput(data?.formFields ?? [])
  };
};

const toFormFieldsInput = (
  data: Prisma.SweepstakesFormFieldGetPayload<{}>[]
): SweepstakesInputFormFieldSchema[] => {
  if (!data) return [];

  return data.map((field) => ({
    id: field.id ?? undefined,
    label: field.label ?? undefined,
    type: field.type ?? undefined,
    required: field.required ?? false,
    placeholder: field.placeholder ?? undefined,
    minimum: field.minimum ?? undefined,
    maximum: field.maximum ?? undefined,
    index: field.index ?? undefined
  }));
};

const toTimingInput = (
  data: FormSweepstakesGetPayload['timing']
): SweepstakesInputSchema['timing'] => {
  return {
    startDate: data?.startDate
      ? new Date(data.startDate as Date)
      : dates.startOfDay(dates.add(Date.now(), { days: 1 })),
    endDate: data?.endDate
      ? new Date(data.endDate as Date)
      : dates.startOfDay(dates.add(Date.now(), { days: 1, weeks: 1 })),
    timeZone: data?.timeZone || timezone.current()
  };
};

const toPrizesInput = (
  data: FormSweepstakesGetPayload['prizes']
): SweepstakesInputSchema['prizes'] => {
  if (!data) return [];

  return data.map((prize) => ({
    id: prize.id ?? undefined,
    name: prize.name ?? undefined,
    quota: prize.quota ?? undefined
  }));
};

const toTasksInput = (
  data: FormSweepstakesGetPayload['tasks']
): SweepstakesInputSchema['tasks'] => {
  if (!data) return [];

  return compact(data.map((task) => toTaskInput(task)));
};

export const toTaskInput = (
  data: FormSweepstakesGetPayload['tasks'][number]
): SweepstakesInputTaskSchema | undefined => {
  if (!data) return undefined;

  const config = toJsonObject(data.config);
  const base = {
    ...config,
    id: data.id
  };

  // TODO: we need better parsing here.
  return base;
};

const toDesignBackgroundInput = (
  data: any // TODO: fix type
): SweepstakesInputDesignBackgroundSchema => {
  switch (data?.type) {
    case 'color':
      return {
        type: data.type,
        color: data.color ?? DEFAULT_SOLID_COLOR_DESIGN_BACKGROUND.color
      };
    case 'gradient':
      return {
        type: 'gradient',
        format: data.format || 'linear',
        stops: Array.isArray(data.stops)
          ? data.stops.map((stop: any) => ({
              color: stop.color || '#000000',
              position: typeof stop.position === 'number' ? stop.position : 0
            }))
          : [],
        angle: typeof data.angle === 'number' ? data.angle : 90
      };
    default:
      return DEFAULT_SOLID_COLOR_DESIGN_BACKGROUND;
  }
};

export const toDesignInput = (
  data: FormSweepstakesGetPayload['design']
): SweepstakesInputSchema['design'] => {
  if (!data) return undefined;

  const config = toJsonObject(data.data);

  return {
    aspectRatio: parseAspectRatio(config.aspectRatio),
    displayName: config.displayName ?? true,
    displayDescription: config.displayDescription ?? true,
    background: toDesignBackgroundInput(config.background)
  };
};

const toVisibilityInput = (
  data: FormSweepstakesGetPayload['visibility']
): SweepstakesInputSchema['visibility'] => {
  if (!data)
    return {
      visibility: 'PRIVATE',
      slug: null
    };

  return {
    visibility: data.visibility ?? 'PRIVATE',
    slug: data.slug ?? null
  };
};

const toCriteriaInput = (
  data: FormSweepstakesGetPayload['criteria']
): SweepstakesInputSchema['criteria'] => {
  if (!data)
    return {
      minQualityScore: DEFAULT_MIN_QUALITY_SCORE,
      minTasksCompleted: DEFAULT_MIN_TASK_COMPLETED,
      allowMultipleWins: DEFAULT_ALLOW_MULTIPLE_WINS,
      allowUserSelection: DEFAULT_ALLOW_USER_SELECTION,
      externalPlatforms: null
    };

  return {
    minQualityScore:
      typeof data.minQualityScore === 'number'
        ? data.minQualityScore
        : DEFAULT_MIN_QUALITY_SCORE,
    minTasksCompleted: data.minTasksCompleted ?? DEFAULT_MIN_TASK_COMPLETED,
    allowMultipleWins: data.allowMultipleWins ?? DEFAULT_ALLOW_MULTIPLE_WINS,
    allowUserSelection: data.allowUserSelection ?? DEFAULT_ALLOW_USER_SELECTION,
    externalPlatforms: parseUserSourceSchema(data.externalPlatforms)
  };
};

export const toSweepstakesInput = (
  giveaway: FormSweepstakesGetPayload
): Omit<SweepstakesInputSchema, 'id'> => ({
  setup: toSetup(giveaway.details),
  terms: toTermsInput(giveaway.terms),
  audience: toAudienceInput(giveaway.audience),
  timing: toTimingInput(giveaway.timing),
  prizes: toPrizesInput(giveaway.prizes),
  tasks: toTasksInput(giveaway.tasks),
  design: toDesignInput(giveaway.design),
  visibility: toVisibilityInput(giveaway.visibility),
  criteria: toCriteriaInput(giveaway.criteria)
});
