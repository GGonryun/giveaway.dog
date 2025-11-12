'use server';

import { nanoid } from 'nanoid';
import { procedure } from '@/lib/mrpc/procedures';
import z from 'zod';
import { ApplicationError } from '@/lib/errors';

import {
  DEFAULT_CLAIM_DEADLINE_DAYS,
  DEFAULT_GOVERNING_LAW_COUNTRY_CODE,
  DEFAULT_NOTIFICATION_TIMEFRAME_DAYS,
  DEFAULT_SWEEPSTAKES_AUDIENCE,
  DEFAULT_SWEEPSTAKES_DESIGN,
  DEFAULT_SWEEPSTAKES_DETAILS,
  DEFAULT_SWEEPSTAKES_PRIZES,
  DEFAULT_SWEEPSTAKES_TASKS,
  DEFAULT_SWEEPSTAKES_TERMS,
  DEFAULT_SWEEPSTAKES_TIMING,
  DEFAULT_SWEEPSTAKES_VISIBILITY,
  DEFAULT_SWEEPSTAKES_WINNER_CRITERIA,
  DEFAULT_WINNER_SELECTION_METHOD
} from '@/schemas/giveaway/defaults';
import { findUserTeamQuery } from './shared';
import { getTemplateById } from '@/lib/templates/data/static-templates';
import { StaticTemplate } from '@/lib/templates/schemas/template';
import {
  Prisma,
  SweepstakesStatus,
  SweepstakesTermsType
} from '@prisma/client';
import { toStorableSweepstakesUpdate } from '@/schemas/giveaway/storable';
import { isUndefined, omitBy } from 'lodash';

const SWEEPSTAKE_ID_SIZE = 6;

export const createSweepstakes = procedure()
  .authorization({ required: true })
  .input(
    z.object({
      slug: z.string(),
      templateId: z.string().optional()
    })
  )
  .output(
    z.object({
      id: z.string()
    })
  )
  .handler(async ({ db, input, user }) => {
    const team = await db.team.findUnique({
      where: findUserTeamQuery({ slug: input.slug, userId: user.id })
    });

    console.info('Creating sweepstakes for team:', team?.id);

    if (!team?.id) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'Team does not exist or you do not have access to it.'
      });
    }

    const base = {
      id: nanoid(SWEEPSTAKE_ID_SIZE),
      teamId: team.id,
      status: SweepstakesStatus.DRAFT,
      details: {
        create: DEFAULT_SWEEPSTAKES_DETAILS
      },
      timing: {
        create: DEFAULT_SWEEPSTAKES_TIMING
      },
      audience: {
        create: DEFAULT_SWEEPSTAKES_AUDIENCE
      },
      terms: {
        create: { ...DEFAULT_SWEEPSTAKES_TERMS, sponsorName: team.name }
      },
      prizes: {
        createMany: { data: DEFAULT_SWEEPSTAKES_PRIZES }
      },
      tasks: {
        createMany: { data: DEFAULT_SWEEPSTAKES_TASKS }
      },
      design: {
        create: DEFAULT_SWEEPSTAKES_DESIGN
      },
      visibility: {
        create: DEFAULT_SWEEPSTAKES_VISIBILITY
      },
      criteria: {
        create: DEFAULT_SWEEPSTAKES_WINNER_CRITERIA
      }
    };

    const template = getTemplateById(input.templateId);
    if (template) {
      return await db.sweepstakes.create({
        data: {
          ...base,
          ...omitBy(
            toStorableSweepstakesUpdate({
              ...template,
              ...template.content
            }),
            isUndefined
          )
        }
      });
    }

    const created = await db.sweepstakes.create({
      data: base
    });
    return created;
  });
