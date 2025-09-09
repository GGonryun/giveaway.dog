import { Prisma } from '@prisma/client';

import { timezone } from '@/lib/time';
import * as dates from 'date-fns';
import {
  FormSweepstakesGetPayload,
  SweepstakesInputSchema,
  SweepstakesInputTaskSchema
} from './db';
import { compact } from 'lodash';
import { toJsonObject } from '@/lib/json';

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

const toTaskInput = (
  data: FormSweepstakesGetPayload['tasks'][number]
): SweepstakesInputTaskSchema | undefined => {
  if (!data) return undefined;

  const config = toJsonObject(data.config);
  const base = {
    id: data.id,
    ...config
  };

  // TODO: we need better parsing here.
  return base;
};

export const toSweepstakesInput = (
  giveaway: FormSweepstakesGetPayload
): Omit<SweepstakesInputSchema, 'id'> => {
  return {
    setup: toSetup(giveaway.details),
    terms: toTermsInput(giveaway.terms),
    audience: toAudienceInput(giveaway.audience),
    timing: toTimingInput(giveaway.timing),
    prizes: toPrizesInput(giveaway.prizes),
    tasks: toTasksInput(giveaway.tasks)
  };
};
