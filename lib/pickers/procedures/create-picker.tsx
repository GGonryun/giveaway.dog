'use server';

import { procedure } from '@/lib/mrpc/procedures';
import z from 'zod';
import { findUserTeamQuery } from '@/procedures/sweepstakes/shared';
import { ApplicationError } from '@/lib/errors';
import {
  DEFAULT_PICKER_FORM,
  DEFAULT_PICKER_STORAGE as DEFAULT_PICKER_STORAGE_DATA,
  DEFAULT_PICKER_LOG,
  DEFAULT_PICKER_STATUS
} from '../data/defaults';
import { UNKNOWN_USER_NAME } from '@/lib/settings';
import { nanoid } from 'nanoid';

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
    const team = await db.team.findUnique({
      where: findUserTeamQuery({ slug: input.slug, userId: user.id })
    });

    if (!team?.id) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'Team does not exist or you do not have access to it.'
      });
    }

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
        storage: {
          create: {
            data: DEFAULT_PICKER_STORAGE_DATA
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
