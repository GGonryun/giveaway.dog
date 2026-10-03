'use server';

import { procedure } from '@/lib/mrpc/procedures';
import z from 'zod';
import { ApplicationError } from '@giveaway/util-errors';
import { twitterV2PickerDrawSchema } from '../schemas/details';
import {
  getDisqualificationReason,
  selectRandomUnique
} from '../utils/picker-utils';

export const drawTwitterV2Picker = procedure()
  .authorization({
    required: true
  })
  .input(
    z.object({
      pickerId: z.string(),
      count: z.number().optional()
    })
  )
  .output(z.array(twitterV2PickerDrawSchema))
  .handler(async ({ db, input }) => {
    const picker = await db.twitterPicker.findUnique({
      where: { id: input.pickerId },
      include: {
        users: true,
        draws: true
      }
    });

    if (!picker) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'Picker not found'
      });
    }

    if (picker.status !== 'COMPLETE') {
      throw new ApplicationError({
        code: 'BAD_REQUEST',
        message: 'Picker must be in COMPLETE status to draw winners'
      });
    }

    const eligibleUsers = picker.users.filter((user) => {
      return !getDisqualificationReason(user, picker);
    });

    if (eligibleUsers.length === 0) {
      throw new ApplicationError({
        code: 'BAD_REQUEST',
        message: 'No eligible users to draw from'
      });
    }

    const existingWinnerIds = new Set(picker.draws.map((d) => d.userId));
    const availableUsers = eligibleUsers.filter(
      (u) => !existingWinnerIds.has(u.id)
    );

    if (availableUsers.length === 0) {
      throw new ApplicationError({
        code: 'BAD_REQUEST',
        message: 'All eligible users have already been drawn as winners'
      });
    }

    const winnersToSelect = input.count ?? picker.winners;
    const actualWinnersCount = Math.min(winnersToSelect, availableUsers.length);

    const selectedWinners = selectRandomUnique(
      availableUsers,
      actualWinnersCount
    );

    const createdDraws = await db.$transaction(
      selectedWinners.map((user) =>
        db.twitterPickerDraw.create({
          data: {
            pickerId: picker.id,
            userId: user.id
          }
        })
      )
    );

    return createdDraws;
  });
