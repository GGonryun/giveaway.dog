import { Prisma, SweepstakesTermsType } from '@prisma/client';
import { SweepstakesInputSchema, TeamSweepstakesGetPayload } from './db';
import { compact } from 'lodash';
import { assertNever } from '@/lib/errors';
import { isStorablePrize, isStorableTask } from './is';

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
      data: compactPrizes.map(({ id, name, winners }, index) => ({
        id,
        index,
        name,
        winners
      }))
    }
  };
};

const toStorableTasks = (
  tasks: SweepstakesInputSchema['tasks']
): Prisma.TaskUncheckedCreateNestedManyWithoutSweepstakesInput | undefined => {
  if (!tasks) return undefined;
  const compactTasks = compact(tasks).filter(isStorableTask);

  if (!compactTasks.length) return undefined;
  return {
    createMany: {
      // TODO: why doesn't config have all of the discriminated type properties.
      // Specifically, properties like 'href' for VISIT_URL tasks are missing.
      data: compactTasks.map(({ id, ...config }, index) => {
        return {
          id,
          index,
          config
        };
      })
    }
  };
};

export const toStorableSweepstakes = (
  sweepstakes: TeamSweepstakesGetPayload,
  input: SweepstakesInputSchema
): Prisma.SweepstakesUncheckedCreateInput => {
  return {
    id: sweepstakes.id,
    status: sweepstakes.status,
    teamId: sweepstakes.teamId,
    details: toStorableDetails(input.setup),
    timing: toStorableTiming(input.timing),
    terms: toStorableTerms(input.terms),
    audience: toStorableAudience(input.audience),
    prizes: toStorablePrizes(input.prizes),
    tasks: toStorableTasks(input.tasks)
  };
};
