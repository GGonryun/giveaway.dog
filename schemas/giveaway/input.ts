import { Prisma } from '@prisma/client';

import { timezone } from '@/lib/time';
import * as dates from 'date-fns';
import {
  FullSweepstakesGetPayload,
  SweepstakesInputSchema,
  SweepstakesInputTaskSchema
} from './db';
import { compact } from 'lodash';

const toSetup = (
  data: FullSweepstakesGetPayload['details']
): SweepstakesInputSchema['setup'] => {
  return {
    name: data?.name ?? undefined,
    banner: data?.banner ?? undefined,
    description: data?.description ?? undefined
  };
};

const toTermsInput = (
  terms: FullSweepstakesGetPayload['terms']
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
  data: FullSweepstakesGetPayload['audience']
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
  data: FullSweepstakesGetPayload['timing']
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
  data: FullSweepstakesGetPayload['prizes']
): SweepstakesInputSchema['prizes'] => {
  if (!data) return [];

  return data.map((prize) => ({
    id: prize.id ?? undefined,
    name: prize.name ?? undefined,
    winners: prize.winners ?? undefined
  }));
};

const toTasksInput = (
  data: FullSweepstakesGetPayload['tasks']
): SweepstakesInputSchema['tasks'] => {
  if (!data) return [];

  return compact(data.map((task) => toTaskInput(task)));
};

const toTaskInput = (
  data: FullSweepstakesGetPayload['tasks'][number]
): SweepstakesInputTaskSchema | undefined => {
  if (!data) return undefined;

  const config = toJsonObject(data.config);
  const base = {
    id: data.id,
    ...config
  };

  // TODO: do we need some proper parsing here?
  return base;
};

// Prisma.JsonValue can be string, number, boolean, array, object, or null.
function toJsonObject(value: Prisma.JsonValue | null): Record<string, any> {
  if (!value) {
    return {};
  }

  if (typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, any>;
  }

  return {};
}

export const toSweepstakesInput = (
  giveaway: FullSweepstakesGetPayload
): SweepstakesInputSchema => {
  return {
    setup: toSetup(giveaway.details),
    terms: toTermsInput(giveaway.terms),
    audience: toAudienceInput(giveaway.audience),
    timing: toTimingInput(giveaway.timing),
    prizes: toPrizesInput(giveaway.prizes),
    tasks: toTasksInput(giveaway.tasks)
  };
};
