import {
  toUserSchema,
  USER_SCHEMA_SELECT_QUERY
} from '@giveaway/user-model/user';
import { Prisma, PrismaClient } from '@prisma/client';
import {
  ResolvedFormFieldSchema,
  SweepstakesParticipantSchema
} from './schemas';
import {
  TASK_COMPLETIONS_SELECT_QUERY,
  TaskCompletionSchema,
  toTaskCompletion
} from '@giveaway/task-model/completions';
import z from 'zod';
import { widetype } from '@giveaway/util-types/widetype';
import { SweepstakesFormFieldSchema } from '@giveaway/custom-fields-model/schemas';
import {
  isProfileComplete,
  toParticipantForm,
  toParticipantFormFields
} from '@/schemas/giveaway/participant';
import { ApplicationError } from '@giveaway/util-errors';
import { toTaskSchema } from '@giveaway/task-model/schemas';
import { SweepstakesAllocationSchema } from '@giveaway/sweepstakes-model/schemas';

const PRIZE_ALLOCATION_SELECT_QUERY = {
  prize: {
    select: {
      name: true,
      id: true
    }
  }
} satisfies Prisma.SweepstakesAllocationSelect;

export const toParticipantFormValues = (
  formValues: Prisma.SweepstakesFormValueGetPayload<{}>[]
) =>
  formValues.reduce<Record<string, any>>((acc, curr) => {
    acc[curr.fieldId] = curr.value;
    return acc;
  }, {});

export const SWEEPSTAKES_PARTICIPANT_INCLUDE_QUERY = {
  user: {
    select: USER_SCHEMA_SELECT_QUERY
  },
  taskCompletions: {
    select: TASK_COMPLETIONS_SELECT_QUERY
  },
  formValues: true,
  allocations: { select: PRIZE_ALLOCATION_SELECT_QUERY }
} satisfies Prisma.SweepstakesParticipantInclude;

export type FindParticipantOptions = {
  db: PrismaClient;
  userId: string;
  sweepstakesId: string;
};

export const findOrCreateSweepstakesParticipant = async ({
  db,
  userId,
  sweepstakesId
}: FindParticipantOptions) => {
  const existing = await findSweepstakesParticipant({
    db,
    userId,
    sweepstakesId
  });

  if (existing) {
    return existing;
  }

  const user = await db.user.findFirst({
    where: { id: userId },
    select: USER_SCHEMA_SELECT_QUERY
  });

  if (!user) {
    throw new ApplicationError({
      code: 'NOT_FOUND',
      message: `User with ID ${userId} not found when creating sweepstakes participant`
    });
  }

  const sweepstakes = await db.sweepstakes.findUnique({
    where: { id: sweepstakesId },
    select: {
      audience: { select: { formFields: true } }
    }
  });

  if (!sweepstakes?.audience?.formFields) {
    throw new ApplicationError({
      code: 'NOT_FOUND',
      message: `Sweepstakes with ID ${sweepstakesId} not found when creating participant`
    });
  }

  const participantFormFields = toParticipantFormFields(
    sweepstakes.audience.formFields
  );
  const userSchema = toUserSchema(user);

  const values = toParticipantForm(participantFormFields, userSchema, {});

  const data = values
    .filter((fv) => fv.value !== null && fv.value !== undefined)
    .map((fv) => ({ fieldId: fv.id, value: String(fv.value) }));

  const isComplete = isProfileComplete(participantFormFields, userSchema, {});

  const created = await db.sweepstakesParticipant.create({
    data: {
      userId,
      sweepstakesId,
      formValues: {
        createMany: {
          data
        }
      }
    },
    include: SWEEPSTAKES_PARTICIPANT_INCLUDE_QUERY
  });

  if (isComplete) {
    // Auto-complete BONUS_COMPLETE_PROFILE task if it exists
    const allTasks = await db.task.findMany({
      where: {
        sweepstakesId
      }
    });

    // Find the BONUS_COMPLETE_PROFILE task by parsing its config
    const profileCompletionTask = allTasks.find((task) => {
      try {
        const taskConfig = toTaskSchema(task);
        return taskConfig.type === 'BONUS_COMPLETE_PROFILE';
      } catch {
        return false;
      }
    });

    if (profileCompletionTask) {
      // Check if already completed
      const existingCompletion = await db.taskCompletion.findFirst({
        where: {
          participantId: created.id,
          taskId: profileCompletionTask.id
        }
      });

      // Only create if not already completed
      if (!existingCompletion) {
        await db.taskCompletion.create({
          data: {
            participantId: created.id,
            taskId: profileCompletionTask.id,
            status: 'COMPLETED',
            proof: Prisma.JsonNull
          }
        });
      }
    }
  }

  return toSweepstakesParticipant(created);
};

export const findSweepstakesParticipant = async ({
  db,
  userId,
  sweepstakesId
}: FindParticipantOptions) => {
  const participant = await db.sweepstakesParticipant.findUnique({
    where: {
      userId_sweepstakesId: {
        userId,
        sweepstakesId
      }
    },
    include: SWEEPSTAKES_PARTICIPANT_INCLUDE_QUERY
  });

  if (!participant) {
    return null;
  }

  return toSweepstakesParticipant(participant);
};

export const sortCompletionsByMostRecent = (
  a: TaskCompletionSchema,
  b: TaskCompletionSchema
) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();

export const sortParticipantsByMostRecentCompletion = (
  a: SweepstakesParticipantSchema,
  b: SweepstakesParticipantSchema
) => {
  const mostRecentA =
    a.completions.length > 0
      ? a.completions.reduce((latest, tc) => {
          const tcDate = new Date(tc.completedAt).getTime();
          return tcDate > latest ? tcDate : latest;
        }, 0)
      : null;

  const mostRecentB =
    b.completions.length > 0
      ? b.completions.reduce((latest, tc) => {
          const tcDate = new Date(tc.completedAt).getTime();
          return tcDate > latest ? tcDate : latest;
        }, 0)
      : null;

  if (mostRecentA === null && mostRecentB === null) return 0;
  if (mostRecentA === null) return 1;
  if (mostRecentB === null) return -1;

  return mostRecentB - mostRecentA;
};

export const listSweepstakesParticipants = async ({
  db,
  sweepstakesId
}: {
  db: PrismaClient;
  sweepstakesId: string;
}) => {
  const participants = await db.sweepstakesParticipant.findMany({
    where: {
      sweepstakesId
    },
    include: SWEEPSTAKES_PARTICIPANT_INCLUDE_QUERY
  });

  return participants.map(toSweepstakesParticipant);
};

export const listTeamParticipants = async ({
  db,
  slug,
  userId
}: {
  db: PrismaClient;
  slug: string;
  userId: string;
}) => {
  const participants = await db.sweepstakesParticipant.findMany({
    where: {
      sweepstakes: {
        team: {
          slug,
          members: {
            some: { userId }
          }
        }
      }
    },
    include: SWEEPSTAKES_PARTICIPANT_INCLUDE_QUERY
  });

  return participants.map(toSweepstakesParticipant);
};

export const toSweepstakesParticipant = (
  participant: Prisma.SweepstakesParticipantGetPayload<{
    include: typeof SWEEPSTAKES_PARTICIPANT_INCLUDE_QUERY;
  }>
): SweepstakesParticipantSchema => ({
  id: participant.id,
  user: toUserSchema(participant.user),
  allocation: toAllocationSchema(participant.allocations),
  completions: participant.taskCompletions
    .map(toTaskCompletion)
    .sort(sortCompletionsByMostRecent),
  formValues: toParticipantFormValues(participant.formValues)
});

const toAllocationSchema = (
  allocation: Prisma.SweepstakesAllocationGetPayload<{
    select: typeof PRIZE_ALLOCATION_SELECT_QUERY;
  }> | null
): SweepstakesAllocationSchema | null => {
  if (!allocation) {
    return null;
  }

  if (!allocation.prize?.name || !allocation.prize?.id) {
    return null;
  }

  return {
    prize: {
      id: allocation.prize.id,
      name: allocation.prize.name
    }
  };
};

export const toSweepstakesEngagement = (
  completions: TaskCompletionSchema[],
  totalTasks: number | null
) => {
  if (totalTasks === null || totalTasks === 0) {
    return 0;
  }
  return Math.round((completions.length / totalTasks) * 100);
};

export const onlyParticipantsWithCompletions = (
  participant: SweepstakesParticipantSchema
) => participant.completions.length > 0;

export const TEAM_PARTICIPANT_USER_SELECT_QUERY = ({
  slug
}: {
  slug: string;
}) =>
  ({
    ...USER_SCHEMA_SELECT_QUERY,
    participation: {
      select: {
        taskCompletions: {
          select: TASK_COMPLETIONS_SELECT_QUERY,
          where: {
            task: {
              sweepstakes: {
                team: {
                  slug
                }
              }
            }
          }
        }
      }
    }
  }) satisfies Prisma.UserSelect;

export const toTeamParticipant = (
  user: Prisma.UserGetPayload<{
    select: ReturnType<typeof TEAM_PARTICIPANT_USER_SELECT_QUERY>;
  }>
): SweepstakesParticipantSchema => ({
  id: user.id,
  user: toUserSchema(user),
  allocation: null,
  completions: user.participation
    .flatMap((p) => p.taskCompletions)
    .map(toTaskCompletion),
  formValues: {} // no form values because a team participant is not tied to a specific sweepstakes
});

export const toParticipantProfile = (
  fields: SweepstakesFormFieldSchema[],
  values: SweepstakesParticipantSchema['formValues']
): ResolvedFormFieldSchema[] => {
  const resolved: ResolvedFormFieldSchema[] = [];

  for (const [fieldId, value] of widetype.entries(values)) {
    const field = fields.find((f) => f.id === fieldId);
    if (!field) {
      continue;
    }
    if (value === null || value === undefined) {
      continue;
    }
    resolved.push({
      fieldId,
      label: field.label,
      type: field.type,
      value: String(value)
    });
  }

  return resolved;
};

export const toTwitterLink = (
  fields: SweepstakesFormFieldSchema[],
  values: SweepstakesParticipantSchema['formValues']
): string | null => {
  const profile = toParticipantProfile(fields, values);
  return profile.find((f) => f.type === 'TWITTER')?.value || null;
};
