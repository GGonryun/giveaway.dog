'use server';

import { procedure } from '@giveaway/rpc-server/procedures';
import { SWEEPSTAKES_TASK_WHERE_QUERY } from '@giveaway/task-model/queries';

import z from 'zod';

import {
  sweepstakesParticipantSchema,
  teamParticipantsQuerySchema
} from '@giveaway/participant-model/schemas';
import {
  TEAM_PARTICIPANT_USER_SELECT_QUERY,
  toTeamParticipant
} from '@giveaway/participant-model/db';
import { Prisma } from '@giveaway/db-model';

export const getTeamParticipants = procedure(
  'participant-server/getTeamParticipants'
)
  .authorization({
    required: true
  })
  .input(teamParticipantsQuerySchema)
  .output(
    z.object({
      participants: sweepstakesParticipantSchema.array(),
      total: z.number(),
      page: z.number(),
      pageSize: z.number(),
      totalPages: z.number()
    })
  )
  .handler(async ({ db, input, user }) => {
    const ownedBySweepstakes = SWEEPSTAKES_TASK_WHERE_QUERY({
      slug: input.slug,
      userId: user.id
    });

    const whereClause: Prisma.UserWhereInput = {
      participation: {
        some: {
          taskCompletions: {
            some: {
              task: ownedBySweepstakes
            }
          }
        }
      }
    };

    if (input.search) {
      whereClause.OR = [
        { name: { contains: input.search, mode: 'insensitive' } },
        { email: { contains: input.search, mode: 'insensitive' } },
        { id: { contains: input.search, mode: 'insensitive' } }
      ];
    }

    if (input.sources && input.sources.length > 0) {
      whereClause.source = { in: input.sources };
    }

    if (
      input.minQualityScore !== undefined ||
      input.maxQualityScore !== undefined
    ) {
      whereClause.quality = {
        some: {
          score: {
            ...(input.minQualityScore !== undefined && {
              gte: input.minQualityScore
            }),
            ...(input.maxQualityScore !== undefined && {
              lte: input.maxQualityScore
            })
          }
        }
      };
    }

    const total = await db.user.count({ where: whereClause });

    const skip = (input.page - 1) * input.pageSize;

    const users = await db.user.findMany({
      where: whereClause,
      select: TEAM_PARTICIPANT_USER_SELECT_QUERY(input),
      skip,
      take: input.pageSize
    });

    const participants = users.map(toTeamParticipant);

    const totalPages = Math.ceil(total / input.pageSize);

    return {
      participants,
      total,
      page: input.page,
      pageSize: input.pageSize,
      totalPages
    };
  });
