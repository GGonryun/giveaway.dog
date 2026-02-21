'use server';

import { procedure } from '@/lib/mrpc/procedures';
import z from 'zod';
import {
  findUserTeam,
  findUserTeamQuery
} from '@/procedures/sweepstakes/shared';
import { ApplicationError } from '@/lib/errors';
import {
  DEFAULT_PICKER_FORM,
  DEFAULT_PICKER_LOG,
  DEFAULT_PICKER_STATUS
} from '../data/defaults';
import { UNKNOWN_USER_NAME } from '@/lib/settings';
import { nanoid } from 'nanoid';
import { TeamPermission } from '@/lib/permissions';
import { TeamTier } from '@prisma/client';

export const createPicker = procedure()
  .authorization({
    required: true
  })
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
  .handler(async ({ db, input, user }) => {
    const { team } = await findUserTeam({
      db,
      user,
      slug: input.slug,
      permission: TeamPermission.UPDATE_PICKERS,
      tier: TeamTier.FREE
    });

    const created = await db.picker.create({
      data: {
        id: nanoid(10),
        teamId: team.id,
        status: DEFAULT_PICKER_STATUS,
        form: {
          create: {
            data: DEFAULT_PICKER_FORM
          }
        },
        logs: {
          create: DEFAULT_PICKER_LOG({
            user: {
              id: user.id,
              name: user.name || UNKNOWN_USER_NAME
            },
            team: {
              slug: team.slug,
              name: team.name
            },
            status: DEFAULT_PICKER_STATUS
          })
        }
      }
    });

    return created;
  });
