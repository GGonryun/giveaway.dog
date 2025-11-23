import { timezone } from '@/lib/time';
import * as dates from 'date-fns';
import {
  FormSweepstakesGetPayload,
  SweepstakesInputDesignBackgroundSchema,
  SweepstakesInputSchema,
  SweepstakesInputTaskSchema
} from './db';
import { compact } from 'lodash';
import { toJsonObject } from '@/lib/json';
import {
  DEFAULT_ALLOW_MULTIPLE_WINS,
  DEFAULT_MIN_QUALITY_SCORE,
  DEFAULT_MIN_TASK_COMPLETED,
  DEFAULT_SOLID_COLOR_DESIGN_BACKGROUND
} from './defaults';
import { parseUserSourceSchema } from '@/lib/user-source/schemas';

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
    requireEmail: data?.requireEmail || false,
    regionalRestriction: data?.regionalRestriction
      ? {
          regions: data?.regionalRestriction?.regions ?? [],
          filter: data?.regionalRestriction?.filter ?? undefined
        }
      : undefined,
    minimumAgeRestriction: data?.minimumAgeRestriction
      ? {
          value: data?.minimumAgeRestriction?.value ?? undefined,
          label: data?.minimumAgeRestriction?.label ?? undefined,
          required: data?.minimumAgeRestriction?.required ?? undefined,
          format: data?.minimumAgeRestriction?.format ?? undefined
        }
      : undefined
  };
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
      slug: undefined
    };

  return {
    visibility: data.visibility ?? 'PRIVATE',
    slug: data.slug ?? undefined
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
      externalPlatforms: []
    };

  return {
    minQualityScore:
      typeof data.minQualityScore === 'number'
        ? data.minQualityScore
        : DEFAULT_MIN_QUALITY_SCORE,
    minTasksCompleted: data.minTasksCompleted ?? DEFAULT_MIN_TASK_COMPLETED,
    allowMultipleWins: data.allowMultipleWins ?? DEFAULT_ALLOW_MULTIPLE_WINS,
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
