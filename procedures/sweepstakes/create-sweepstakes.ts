'use server';

import { nanoid } from 'nanoid';
import { SweepstakesStatus } from '@prisma/client';
import { procedure } from '@/lib/mrpc/procedures';
import z from 'zod';
import { ApplicationError } from '@/lib/errors';

import {
  DEFAULT_SWEEPSTAKES_AUDIENCE,
  DEFAULT_SWEEPSTAKES_DETAILS,
  DEFAULT_SWEEPSTAKES_PRIZES,
  DEFAULT_SWEEPSTAKES_TASKS,
  DEFAULT_SWEEPSTAKES_TERMS,
  DEFAULT_SWEEPSTAKES_TIMING
} from '@/schemas/giveaway/defaults';
import { findUserTeamQuery } from './shared';

export const createSweepstakes = procedure
  .authorization({ required: true })
  .input(
    z.object({
      slug: z.string()
    })
  )
  .output(
    z.object({
      id: z.string()
    })
  )
  .invalidate(async ({ input }) => [`sweepstakes-list-${input.slug}`])
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

    const created = await db.sweepstakes.create({
      data: {
        id: nanoid(6),
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
        }
      }
    });
    return created;
  });
