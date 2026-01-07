'use server';

import { procedure } from '@/lib/mrpc/procedures';
import { z } from 'zod';
import { WINNERS_PAGE_SIZE } from '@/lib/pagination';
import { winnerLeaderboardSchema } from '@/schemas/giveaway/winners';

const getWinnersLeaderboard = procedure()
  .authorization({
    required: false
  })
  .input(
    z
      .object({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(WINNERS_PAGE_SIZE),
        search: z.string().optional()
      })
      .optional()
  )
  .output(winnerLeaderboardSchema.array())
  .handler(async ({ db, input }) => {
    const page = input?.page ?? 1;
    const limit = input?.limit ?? WINNERS_PAGE_SIZE;
    const skip = (page - 1) * limit;
    const search = input?.search?.trim();

    // Use raw SQL to efficiently aggregate wins and paginate at database level
    const winnersWithCounts = search
      ? await db.$queryRaw<
          Array<{
            userId: string;
            userName: string | null;
            userEmail: string | null;
            userImage: string | null;
            winCount: bigint;
          }>
        >`
          SELECT
            u.id as "userId",
            u.name as "userName",
            u.email as "userEmail",
            u.image as "userImage",
            COUNT(DISTINCT d.id) as "winCount"
          FROM "User" u
          INNER JOIN "Participant" p ON p."userId" = u.id
          INNER JOIN "TaskCompletion" tc ON tc."participantId" = p.id
          INNER JOIN "PrizeDraw" d ON d."taskCompletionId" = tc.id
          INNER JOIN "Prize" pr ON pr.id = d."prizeId"
          INNER JOIN "Sweepstakes" s ON s.id = pr."sweepstakesId"
          INNER JOIN "SweepstakesVisibility" sv ON sv."sweepstakesId" = s.id
          WHERE d.result = 'WINNER'
            AND sv.visibility = 'PUBLIC'
            AND LOWER(u.name) LIKE LOWER(${`%${search}%`})
          GROUP BY u.id, u.name, u.email, u.image
          ORDER BY "winCount" DESC, u.id ASC
          LIMIT ${limit}
          OFFSET ${skip}
        `
      : await db.$queryRaw<
          Array<{
            userId: string;
            userName: string | null;
            userEmail: string | null;
            userImage: string | null;
            winCount: bigint;
          }>
        >`
          SELECT
            u.id as "userId",
            u.name as "userName",
            u.email as "userEmail",
            u.image as "userImage",
            COUNT(DISTINCT d.id) as "winCount"
          FROM "User" u
          INNER JOIN "Participant" p ON p."userId" = u.id
          INNER JOIN "TaskCompletion" tc ON tc."participantId" = p.id
          INNER JOIN "PrizeDraw" d ON d."taskCompletionId" = tc.id
          INNER JOIN "Prize" pr ON pr.id = d."prizeId"
          INNER JOIN "Sweepstakes" s ON s.id = pr."sweepstakesId"
          INNER JOIN "SweepstakesVisibility" sv ON sv."sweepstakesId" = s.id
          WHERE d.result = 'WINNER'
            AND sv.visibility = 'PUBLIC'
          GROUP BY u.id, u.name, u.email, u.image
          ORDER BY "winCount" DESC, u.id ASC
          LIMIT ${limit}
          OFFSET ${skip}
        `;

    // For each winner, fetch their individual wins
    const userIds = winnersWithCounts.map((w) => w.userId);

    if (userIds.length === 0) {
      return [];
    }

    const userWins = await db.user.findMany({
      where: {
        id: {
          in: userIds
        }
      },
      select: {
        id: true,
        participation: {
          select: {
            taskCompletions: {
              where: {
                draws: {
                  some: {
                    result: 'WINNER',
                    prize: {
                      sweepstakes: {
                        visibility: {
                          visibility: 'PUBLIC'
                        }
                      }
                    }
                  }
                }
              },
              select: {
                draws: {
                  where: {
                    result: 'WINNER',
                    prize: {
                      sweepstakes: {
                        visibility: {
                          visibility: 'PUBLIC'
                        }
                      }
                    }
                  },
                  select: {
                    createdAt: true,
                    prize: {
                      select: {
                        name: true,
                        sweepstakes: {
                          select: {
                            id: true,
                            details: {
                              select: {
                                name: true
                              }
                            },
                            visibility: {
                              select: {
                                slug: true
                              }
                            },
                            team: {
                              select: {
                                slug: true
                              }
                            }
                          }
                        }
                      }
                    }
                  },
                  orderBy: {
                    createdAt: 'desc'
                  }
                }
              }
            }
          }
        }
      }
    });

    // Map the wins data back to the aggregated results, maintaining sort order
    return winnersWithCounts.map((winner) => {
      const userData = userWins.find((u) => u.id === winner.userId);
      const wins = userData
        ? userData.participation.flatMap((p) =>
            p.taskCompletions.flatMap((tc) =>
              tc.draws.map((draw) => ({
                sweepstakesId: draw.prize.sweepstakes.id,
                sweepstakesName:
                  draw.prize.sweepstakes.details?.name ?? 'Unnamed Giveaway',
                sweepstakesSlug: draw.prize.sweepstakes.visibility?.slug ?? '',
                teamSlug: draw.prize.sweepstakes.team?.slug ?? '',
                prizeName: draw.prize.name,
                wonAt: draw.createdAt
              }))
            )
          )
        : [];

      return {
        userId: winner.userId,
        userName: winner.userName,
        userEmail: winner.userEmail,
        userImage: winner.userImage,
        winCount: Number(winner.winCount),
        wins
      };
    });
  });

export default getWinnersLeaderboard;
