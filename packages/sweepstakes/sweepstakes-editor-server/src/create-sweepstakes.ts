'use server';

import { nanoid } from 'nanoid';
import { procedure } from '@giveaway/rpc-server/procedures';
import z from 'zod';
import { ApplicationError } from '@giveaway/util-errors';

import { findUserTeam } from '@giveaway/team-server/find-user-team';
import { getTemplateById } from '@giveaway/templates-model/data/static-templates';
import { Prisma, PrismaClient, TeamTier } from '@giveaway/db-model';
import { toStorableSweepstakesUpdate } from '@giveaway/sweepstakes-model/storable';
import { isUndefined, omitBy } from 'lodash';
import {
  TemplateInputSchema,
  toTemplateInputSchema
} from '@giveaway/templates-model/schemas/template';
import { replaceIdsDeep } from '@giveaway/util-collections/object';
import { TeamPermission } from '@giveaway/team-permissions';
import { SWEEPSTAKE_ID_SIZE, toNewSweepstakesData } from './lifecycle';

export const createSweepstakes = procedure()
  .authorization({ required: true })
  .input(
    z.object({
      slug: z.string(),
      templateId: z.string().optional(),
      timezone: z.string()
    })
  )
  .output(
    z.object({
      id: z.string()
    })
  )
  .handler(async ({ db, input, user }) => {
    const { team } = await findUserTeam({
      db,
      user,
      slug: input.slug,
      permission: TeamPermission.UPDATE_SWEEPSTAKES,
      tier: TeamTier.FREE
    });

    console.info('Creating sweepstakes for team:', team?.id);

    if (!team?.id) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'Team does not exist or you do not have access to it.'
      });
    }

    const base = toNewSweepstakesData({
      teamId: team.id,
      teamName: team.name,
      timezone: input.timezone
    });

    // Check for template (static or database)
    if (input.templateId) {
      return await createFromTemplate({
        db,
        teamId: team.id,
        templateId: input.templateId,
        base
      });
    }

    const created = await db.sweepstakes.create({
      data: base
    });
    return created;
  });

const createFromTemplate = async ({
  db,
  teamId,
  templateId,
  base
}: {
  db: PrismaClient;
  teamId: string;
  templateId: string;
  base: Prisma.SweepstakesCreateInput;
}) => {
  const template = await toTemplate({ db, templateId, teamId });
  const update = toStorableSweepstakesUpdate(template);
  const omitted = omitBy(update, isUndefined);

  return await db.sweepstakes.create({
    data: replaceIdsDeep({ ...base, ...omitted }, () =>
      nanoid(SWEEPSTAKE_ID_SIZE)
    )
  });
};

const toTemplate = async ({
  templateId,
  db,
  teamId
}: {
  db: PrismaClient;
  templateId: string;
  teamId: string;
}): Promise<TemplateInputSchema> => {
  const staticTemplate = getTemplateById(templateId);

  if (staticTemplate) {
    return staticTemplate;
  }

  // Check database templates
  const dbTemplate = await db.template.findFirst({
    where: {
      id: templateId,
      teamId
    }
  });

  if (!dbTemplate) {
    throw new ApplicationError({
      code: 'NOT_FOUND',
      message: 'Template not found or you do not have access.'
    });
  }

  return toTemplateInputSchema(dbTemplate);
};
