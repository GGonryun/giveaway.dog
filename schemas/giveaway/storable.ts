import {
  Prisma,
  SweepstakesStatus,
  SweepstakesTermsType
} from '@prisma/client';
import {
  SweepstakesInputSchema,
  SweepstakesInputTaskSchema,
  TeamSweepstakesGetPayload
} from './db';
import { compact } from 'lodash';
import { assertNever } from '@/lib/errors';
import { isStorablePrize, isStorableTask } from './is';
import {
  DEFAULT_ALLOW_MULTIPLE_WINS,
  DEFAULT_MIN_QUALITY_SCORE,
  DEFAULT_MIN_TASK_COMPLETED
} from './defaults';

import { createJobsForTask } from '@/lib/task/jobs';
import { DEFAULT_ALLOWED_IDENTITIES } from '@/lib/settings';

const toStorableDetails = (setup: SweepstakesInputSchema['setup']) => {
  return {
    create: {
      name: setup?.name,
      description: setup?.description,
      banner: setup?.banner
    }
  };
};

const toStorableTiming = (
  timing: SweepstakesInputSchema['timing']
): Prisma.SweepstakesTimingUncheckedCreateNestedOneWithoutSweepstakesInput => {
  return {
    create: {
      startDate: timing?.startDate,
      endDate: timing?.endDate,
      timeZone: timing?.timeZone
    }
  };
};

const toStorableTerms = (
  terms: SweepstakesInputSchema['terms']
):
  | Prisma.SweepstakesTermsUncheckedCreateNestedOneWithoutSweepstakesInput
  | undefined => {
  if (!terms?.type) return undefined;
  if (terms.type === SweepstakesTermsType.TEMPLATE) {
    return {
      create: {
        type: terms?.type,
        sponsorName: terms.sponsorName,
        sponsorAddress: terms.sponsorAddress,
        winnerSelectionMethod: terms.winnerSelectionMethod,
        notificationTimeframeDays: terms.notificationTimeframeDays,
        maxEntriesPerUser: terms.maxEntriesPerUser,
        claimDeadlineDays: terms.claimDeadlineDays,
        governingLawCountry: terms.governingLawCountry,
        privacyPolicyUrl: terms.privacyPolicyUrl,
        additionalTerms: terms.additionalTerms
      }
    };
  }

  if (terms.type === SweepstakesTermsType.CUSTOM) {
    return {
      create: {
        type: terms.type,
        text: terms.text
      }
    };
  }

  throw assertNever(terms.type);
};

const toStorableAudience = (
  audience: SweepstakesInputSchema['audience']
):
  | Prisma.SweepstakesAudienceUncheckedCreateNestedOneWithoutSweepstakesInput
  | undefined => {
  if (!audience) return undefined;
  return {
    create: {
      allowedIdentities:
        audience.allowedIdentities || DEFAULT_ALLOWED_IDENTITIES,
      requirePreEntryLogin: audience.requirePreEntryLogin || false,
      requireEmail: audience.requireEmail,
      regionalRestriction: audience.regionalRestriction
        ? {
            create: {
              filter: audience.regionalRestriction?.filter,
              regions: audience.regionalRestriction?.regions
            }
          }
        : undefined,
      minimumAgeRestriction: audience.minimumAgeRestriction
        ? {
            create: {
              value: audience.minimumAgeRestriction?.value,
              label: audience.minimumAgeRestriction?.label,
              required: audience.minimumAgeRestriction?.required,
              format: audience.minimumAgeRestriction?.format
            }
          }
        : undefined
    }
  };
};

const toStorablePrizes = (
  prizes: SweepstakesInputSchema['prizes']
): Prisma.PrizeUncheckedCreateNestedManyWithoutSweepstakesInput | undefined => {
  if (!prizes) return undefined;
  const compactPrizes = compact(prizes).filter(isStorablePrize);

  if (!compactPrizes.length) return undefined;

  return {
    createMany: {
      data: compactPrizes.map(({ id, name, quota }, index) => ({
        id,
        index,
        name,
        quota
      }))
    }
  };
};

const toStorableTasks = (
  tasks: SweepstakesInputSchema['tasks'],
  status?: SweepstakesStatus
): Prisma.TaskUncheckedCreateNestedManyWithoutSweepstakesInput | undefined => {
  if (!tasks) return undefined;
  const compacted = compact(tasks).filter(isStorableTask);

  if (!compacted.length) return undefined;

  return {
    create: compacted.map((task, index) => {
      const { id, ...config } = task;
      return {
        id,
        index,
        config,
        jobs: {
          create: createJobsForTask(task, status)
        }
      };
    })
  };
};

const toStorableDesign = (
  design: SweepstakesInputSchema['design']
):
  | Prisma.SweepstakesDesignUncheckedCreateNestedOneWithoutSweepstakesInput
  | undefined => {
  if (!design) return undefined;
  return {
    create: {
      data: {
        aspectRatio: design.aspectRatio || 'VIDEO',
        displayName: design.displayName ?? false,
        displayDescription: design.displayDescription ?? false,
        background: design.background
      }
    }
  };
};

export const toStorableVisibility = (
  visibility: SweepstakesInputSchema['visibility']
):
  | Prisma.SweepstakesVisibilityUncheckedCreateNestedOneWithoutSweepstakesInput
  | undefined => {
  if (!visibility) return undefined;
  return {
    create: {
      visibility: visibility.visibility,
      slug: visibility.slug || null
    }
  };
};

export const toStorableCriteria = (
  criteria: SweepstakesInputSchema['criteria']
):
  | Prisma.SweepstakesWinnerCriteriaUncheckedCreateNestedOneWithoutSweepstakesInput
  | undefined => {
  if (!criteria) return undefined;
  return {
    create: {
      minTasksCompleted:
        criteria.minTasksCompleted ?? DEFAULT_MIN_TASK_COMPLETED,
      minQualityScore: criteria.minQualityScore ?? DEFAULT_MIN_QUALITY_SCORE,
      allowMultipleWins:
        criteria.allowMultipleWins ?? DEFAULT_ALLOW_MULTIPLE_WINS,
      externalPlatforms: criteria.externalPlatforms || Prisma.JsonNull
    }
  };
};

export const toStorableSweepstakes = (
  sweepstakes: TeamSweepstakesGetPayload,
  input: SweepstakesInputSchema & { status?: SweepstakesStatus }
): Prisma.SweepstakesUncheckedCreateInput => {
  const status = input.status ?? sweepstakes.status;
  return {
    ...toStorableSweepstakesUpdate(input, status),
    id: sweepstakes.id,
    teamId: sweepstakes.teamId,
    status
  };
};

export const toStorableSweepstakesUpdate = (
  input: SweepstakesInputSchema,
  status?: SweepstakesStatus
) => {
  return {
    details: toStorableDetails(input.setup),
    timing: toStorableTiming(input.timing),
    terms: toStorableTerms(input.terms),
    audience: toStorableAudience(input.audience),
    prizes: toStorablePrizes(input.prizes),
    tasks: toStorableTasks(input.tasks, status),
    design: toStorableDesign(input.design),
    visibility: toStorableVisibility(input.visibility),
    criteria: toStorableCriteria(input.criteria)
  };
};
