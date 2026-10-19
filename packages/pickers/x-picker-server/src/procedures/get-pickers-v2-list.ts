'use server';

import { procedure } from '@giveaway/rpc-server/procedures';
import z from 'zod';
import { findUserTeam } from '@giveaway/team-server/find-user-team';
import { TeamPermission } from '@giveaway/team-permissions';
import { TeamTier } from '@giveaway/db-model';
import {
  pickersV2ListSchema,
  listPickersV2FilterSchema
} from '@giveaway/x-picker-model/schemas/list';

export const getPickersV2List = procedure()
  .authorization({
    required: true
  })
  .input(
    listPickersV2FilterSchema.extend({
      slug: z.string()
    })
  )
  .output(pickersV2ListSchema)
  .handler(async ({ input, db, user }) => {
    const { team } = await findUserTeam({
      db,
      user,
      slug: input.slug,
      permission: TeamPermission.VIEW_PICKERS,
      tier: TeamTier.FREE
    });

    const twitterPickers = await db.twitterPicker.findMany({
      where: {
        teamId: team.id,
        status: input.status !== 'ALL' ? input.status : undefined
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const pickersFormatted = twitterPickers.map((picker) => {
      return {
        pickerId: picker.id,
        status: picker.status,
        type: 'TWITTER' as const,
        updatedAt: picker.updatedAt,
        name: picker.id
      };
    });

    return {
      pickers: pickersFormatted
    };
  });
