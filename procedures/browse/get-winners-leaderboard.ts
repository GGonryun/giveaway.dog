'use server';

import { procedure } from '@/lib/mrpc/procedures';
import { z } from 'zod';
import { HISTORY_PAGE_SIZE } from '@/lib/pagination';
import { winnerLeaderboardSchema } from '@/schemas/giveaway/winners';

const getWinnersLeaderboard = procedure()
  .authorization({
    required: false
  })
  .input(
    z
      .object({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(HISTORY_PAGE_SIZE)
      })
      .optional()
  )
  .output(winnerLeaderboardSchema.array())
  .handler(async ({ db, input }) => {
    const page = input?.page ?? 1;
    const limit = input?.limit ?? HISTORY_PAGE_SIZE;
    const skip = (page - 1) * limit;

    const winners = await db.user.findMany({
      where: {
        participation: {
          some: {
            taskCompletions: {
              some: {
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
              }
            }
          }
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        participation: {
          where: {
            taskCompletions: {
              some: {
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
              }
            }
          },
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
      },
      orderBy: {
        participation: {
          _count: 'desc'
        }
      },
      skip,
      take: limit
    });

    return winners.map((user) => {
      const wins = user.participation.flatMap((p) =>
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
      );

      return {
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        userImage: user.image,
        winCount: wins.length,
        wins
      };
    });
  });

export default getWinnersLeaderboard;
