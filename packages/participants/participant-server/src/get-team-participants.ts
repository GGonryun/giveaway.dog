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

type SortDirection = 'asc' | 'desc';

const TEAM_PARTICIPANT_SORT_SELECT_QUERY = ({ slug }: { slug: string }) =>
  ({
    id: true,
    quality: {
      select: { score: true },
      take: 1,
      orderBy: { updatedAt: 'desc' }
    },
    participation: {
      select: {
        taskCompletions: {
          select: { completedAt: true },
          where: { task: { sweepstakes: { team: { slug } } } },
          orderBy: { completedAt: 'desc' },
          take: 1
        }
      }
    }
  }) satisfies Prisma.UserSelect;

type TeamParticipantSortRow = Prisma.UserGetPayload<{
  select: ReturnType<typeof TEAM_PARTICIPANT_SORT_SELECT_QUERY>;
}>;

const SORT_KEYS = {
  qualityScore: (row: TeamParticipantSortRow) =>
    Math.min(Math.max(row.quality[0]?.score ?? 0, 0), 100),
  lastEntry: (row: TeamParticipantSortRow) =>
    Math.max(
      0,
      ...row.participation.flatMap((p) =>
        p.taskCompletions.map((c) => c.completedAt.getTime())
      )
    )
};

const byIdAscending = (a: { id: string }, b: { id: string }) =>
  a.id.localeCompare(b.id);

const sortedIds = (
  rows: TeamParticipantSortRow[],
  sortBy: keyof typeof SORT_KEYS,
  sortDirection: SortDirection
) => {
  const key = SORT_KEYS[sortBy];
  const sign = sortDirection === 'asc' ? 1 : -1;
  return rows
    .map((row) => ({ id: row.id, value: key(row) }))
    .sort((a, b) => sign * (a.value - b.value) || byIdAscending(a, b))
    .map((row) => row.id);
};

export const getTeamParticipants = procedure()
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
            gte: input.minQualityScore,
            lte: input.maxQualityScore
          }
        }
      };
    }

    const total = await db.user.count({ where: whereClause });

    const skip = (input.page - 1) * input.pageSize;

    const select = TEAM_PARTICIPANT_USER_SELECT_QUERY(input);

    const findPage = async () => {
      if (input.sortBy === 'name') {
        return db.user.findMany({
          where: whereClause,
          select,
          orderBy: [
            { name: { sort: input.sortDirection, nulls: 'last' } },
            { id: 'asc' }
          ],
          skip,
          take: input.pageSize
        });
      }

      const rows = await db.user.findMany({
        where: whereClause,
        select: TEAM_PARTICIPANT_SORT_SELECT_QUERY(input)
      });
      const pageIds = sortedIds(rows, input.sortBy, input.sortDirection).slice(
        skip,
        skip + input.pageSize
      );
      if (pageIds.length === 0) return [];

      const page = await db.user.findMany({
        where: { id: { in: pageIds } },
        select
      });
      const byId = new Map(page.map((user) => [user.id, user]));
      return pageIds.flatMap((id) => byId.get(id) ?? []);
    };

    const users = await findPage();

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
