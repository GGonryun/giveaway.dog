import { DeepNullable } from '@/lib/types';
import { ParticipantSweepstakesGetPayload } from './db';
import { GiveawayPrizeSchema } from './schemas';
import z from 'zod';
import { toUserSchema, USER_SCHEMA_SELECT_QUERY, userSchema } from '../user';
import { toTaskInput } from './input';
import { CompletionStatus, Prisma, TaskType, UserSource } from '@prisma/client';
import { ApplicationError, assertNever } from '@/lib/errors';
import { taskSchema } from '@/lib/task/schemas';
import { providerSchema } from '@/lib/integrations/schemas/providers';
import { DEFAULT_TEAM_LOGO } from '@/lib/team/data';
import { parseSocialLinks } from '../social-links';
import { DetailedUserTeam } from '../teams';
import { SweepstakesFormFieldSchema } from '@/lib/custom-fields/schemas';
import { size } from 'lodash';

export const taskCompletionSchema = z.object({
  completionId: z.string(),
  completedAt: z.date().nullable(),
  taskId: z.string(),
  taskName: z.string(),
  taskType: z.nativeEnum(TaskType),
  sweepstakeId: z.string(),
  sweepstakeName: z.string(),
  status: z.nativeEnum(CompletionStatus)
});
export type TaskCompletionSchema = z.infer<typeof taskCompletionSchema>;

export const winnerSchema = z.object({
  prizeId: z.string(),
  prizeName: z.string().nullable()
});

export const userStatusSchema = z.enum(['active', 'blocked']);

export type UserStatusSchema = z.infer<typeof userStatusSchema>;

export const sweepstakesParticipantSchema_old = z.object({
  id: z.string(),
  createdAt: z.date(),
  name: z.string().nullable(),
  email: z.string().nullable(),
  country: z.string(),
  entries: taskCompletionSchema.array(),
  lastEntryAt: z.string(),
  qualityScore: z.number(),
  engagement: z.number(),
  source: z.nativeEnum(UserSource),
  status: userStatusSchema,
  userAgent: z.string(),
  emailVerified: z.boolean(),
  providers: providerSchema.array()
});

export type SweepstakesParticipantSchema_old = z.infer<
  typeof sweepstakesParticipantSchema_old
>;

export const toSweepstakesPrizes = (
  prizes: ParticipantSweepstakesGetPayload['prizes']
): DeepNullable<GiveawayPrizeSchema>[] => {
  return prizes.map((p) => ({
    prizeId: p.id,
    prizeName: p.name ?? null,
    quota: p.quota,
    draws: toPrizeDraws(p.draws)
  }));
};

const toPrizeDraws = (
  draws: ParticipantSweepstakesGetPayload['prizes'][number]['draws']
): GiveawayPrizeSchema['draws'] => {
  return draws.map((draw) => {
    const raw = toTaskInput(draw.taskCompletion.task);
    const task = taskSchema.safeParse(raw);

    if (!task.success) {
      throw new ApplicationError({
        code: 'VALIDATION_ERROR',
        message: `Invalid task data for task ID ${draw.taskCompletion.task.id}`,
        cause: task.error
      });
    }

    return {
      id: draw.id,
      result: draw.result,
      disqualificationReason: draw.disqualificationReason,
      createdAt: draw.createdAt,
      updatedAt: draw.updatedAt,
      user: toUserSchema(draw.taskCompletion.participant.user),
      task: task.data
    };
  });
};

export const toSweepstakesHost = (
  team: Prisma.TeamGetPayload<{}> | DetailedUserTeam
) => {
  return {
    id: team.id,
    slug: team.slug,
    name: team.name,
    logo: team.logo || DEFAULT_TEAM_LOGO,
    links: parseSocialLinks(team.links)
  };
};

export const sweepstakesParticipantSchema = z.object({
  id: z.string(),
  user: userSchema,
  completions: z
    .object({
      id: z.string(),
      task: taskSchema,
      status: z.nativeEnum(CompletionStatus)
    })
    .array(),
  formValues: z.record(z.string(), z.any())
});

export type SweepstakesParticipantSchema = z.infer<
  typeof sweepstakesParticipantSchema
>;

export const PARTICIPANT_TASK_COMPLETIONS_SELECT_QUERY = {
  id: true,
  task: true,
  status: true
} satisfies Prisma.TaskCompletionSelect;

export const toParticipantTaskCompletions = (
  completions: Prisma.TaskCompletionGetPayload<{
    select: typeof PARTICIPANT_TASK_COMPLETIONS_SELECT_QUERY;
  }>[]
) =>
  completions.map((tc) => ({
    id: tc.id,
    task: taskSchema.parse(toTaskInput(tc.task)),
    status: tc.status
  }));

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
    select: PARTICIPANT_TASK_COMPLETIONS_SELECT_QUERY
  },
  formValues: true
} satisfies Prisma.SweepstakesParticipantInclude;

export const participantFormSchema = z
  .object({
    id: z.string(),
    label: z.string(),
    value: z.any().nullable(),
    isCustom: z.boolean() // this indicates if the value is a reference to user data
  })
  .array();

export type ParticipantFormSchema = z.infer<typeof participantFormSchema>;

export const toParticipantForm = (
  formFields: SweepstakesFormFieldSchema[],
  participant?: SweepstakesParticipantSchema
): ParticipantFormSchema =>
  formFields.map((field) => ({
    id: field.id,
    label: field.label,
    ...toFieldValue(field, participant)
  }));

const toFieldValue = (
  field: SweepstakesFormFieldSchema,
  participant?: SweepstakesParticipantSchema
) => {
  const value = participant?.formValues[field.id] || null;
  switch (field.type) {
    case 'AGE':
      return { value, isCustom: true };

    case 'USERNAME':
      if (participant?.user.name) {
        return { value: participant.user.name, isCustom: false };
      }

      return { value, isCustom: true };

    case 'EMAIL':
      if (!!participant?.user.email) {
        return { value: participant.user.email, isCustom: false };
      }

      return { value, isCustom: true };

    case 'TWITTER':
      const link = participant?.user.providers?.find(
        (provider) => provider.type === 'TWITTER'
      )?.link;

      if (link) {
        return { value: link, isCustom: false };
      }

      return { value, isCustom: true };
    default:
      throw assertNever(field);
  }
};

export const isProfileComplete = (
  formFields: SweepstakesFormFieldSchema[],
  participant?: SweepstakesParticipantSchema
) => {
  if (
    formFields.length > 0 &&
    (!participant ||
      !participant.formValues ||
      size(participant.formValues) === 0)
  ) {
    return false;
  }

  const profile = toParticipantForm(formFields, participant);
  const required = formFields.filter(isRequired);

  return required.every((field) => {
    const profileField = profile.find((pf) => pf.id === field.id);
    return (
      profileField && profileField.value !== null && profileField.value !== ''
    );
  });
};

const isRequired = (field: SweepstakesFormFieldSchema) => {
  switch (field.type) {
    case 'USERNAME':
    case 'TWITTER':
    case 'AGE':
      return field.required;
    case 'EMAIL':
      return true;
    default:
      throw assertNever(field);
  }
};
