import { DeepNullable } from '@/lib/types';
import { ParticipantSweepstakesGetPayload } from './db';
import { GiveawayPrizeSchema } from './schemas';
import z from 'zod';
import { toUserSchema, UserSchema } from '../user';
import { toTaskInput } from './input';
import { Prisma } from '@prisma/client';
import { ApplicationError, assertNever } from '@/lib/errors';
import { taskSchema } from '@/lib/task/schemas';
import { DEFAULT_TEAM_LOGO } from '@/lib/team/data';
import { parseSocialLinks } from '../social-links';
import { DetailedUserTeam } from '../teams';
import {
  sweepstakesFormFieldSchema,
  SweepstakesFormFieldSchema
} from '@/lib/custom-fields/schemas';
import { size } from 'lodash';
import { SweepstakesParticipantSchema } from '@/lib/participant/schemas';

export const winnerSchema = z.object({
  prizeId: z.string(),
  prizeName: z.string().nullable()
});

export const userStatusSchema = z.enum(['active', 'blocked']);

export type UserStatusSchema = z.infer<typeof userStatusSchema>;

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

export const participantFormSchema = z
  .object({
    id: z.string(),
    label: z.string(),
    value: z.any().nullable(),
    isCustom: z.boolean() // this indicates if the value is a reference to user data
  })
  .array();

export type ParticipantFormSchema = z.infer<typeof participantFormSchema>;

export const toParticipantFormFields = (
  formFields: Prisma.SweepstakesFormFieldGetPayload<{}>[]
): SweepstakesFormFieldSchema[] =>
  formFields.map((field) => {
    const parse = sweepstakesFormFieldSchema.safeParse(field);
    if (!parse.success) {
      throw new ApplicationError({
        code: 'VALIDATION_ERROR',
        message: `Invalid form field data for field ID ${field.id}`,
        cause: parse.error
      });
    }
    return parse.data;
  });

export const toParticipantForm = (
  formFields: SweepstakesFormFieldSchema[],
  user?: UserSchema,
  values?: SweepstakesParticipantSchema['formValues']
): ParticipantFormSchema =>
  formFields.map((field) => ({
    id: field.id,
    label: field.label,
    ...toFieldValue(field, user, values)
  }));

const toFieldValue = (
  field: SweepstakesFormFieldSchema,
  user?: UserSchema,
  values?: SweepstakesParticipantSchema['formValues']
) => {
  const value = values?.[field.id] || null;
  switch (field.type) {
    case 'AGE':
      return { value, isCustom: true };

    case 'USERNAME':
      if (user?.name) {
        return { value: user.name, isCustom: false };
      }

      return { value, isCustom: true };

    case 'EMAIL':
      if (user?.email) {
        return { value: user.email, isCustom: false };
      }

      return { value, isCustom: true };

    case 'TWITTER':
      const link = user?.providers?.find(
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
  user?: UserSchema,
  values?: SweepstakesParticipantSchema['formValues']
) => {
  if (formFields.length > 0 && (!user || !values || size(values) === 0)) {
    return false;
  }

  const profile = toParticipantForm(formFields, user, values);
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
