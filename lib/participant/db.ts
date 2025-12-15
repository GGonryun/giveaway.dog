import { toUserSchema, USER_SCHEMA_SELECT_QUERY } from '@/schemas/user';
import { Prisma, PrismaClient } from '@prisma/client';
import {
  ResolvedFormFieldSchema,
  SweepstakesParticipantSchema
} from './schemas';
import {
  TASK_COMPLETIONS_SELECT_QUERY,
  TaskCompletionSchema,
  toTaskCompletion
} from '../task/completions';
import z from 'zod';
import { widetype } from '../widetype';
import { SweepstakesFormFieldSchema } from '../custom-fields/schemas';

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
  formValues: true
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

  const created = await db.sweepstakesParticipant.create({
    data: {
      userId,
      sweepstakesId
    },
    include: SWEEPSTAKES_PARTICIPANT_INCLUDE_QUERY
  });

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
  completions: participant.taskCompletions
    .map(toTaskCompletion)
    .sort(sortCompletionsByMostRecent),
  formValues: toParticipantFormValues(participant.formValues)
});

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

export const TEAM_PARTICIPANT_USER_SELECT_QUERY = {
  ...USER_SCHEMA_SELECT_QUERY,
  participation: {
    select: {
      taskCompletions: {
        select: TASK_COMPLETIONS_SELECT_QUERY
      }
    }
  }
} satisfies Prisma.UserSelect;

export const toTeamParticipant = (
  user: Prisma.UserGetPayload<{
    select: typeof TEAM_PARTICIPANT_USER_SELECT_QUERY;
  }>
) => ({
  id: user.id,
  user: toUserSchema(user),
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
