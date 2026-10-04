'use server';

import { procedure } from '@/lib/mrpc/procedures';
import z from 'zod';
import {
  DERIVED_TO_ACTUAL_STATUS_MAP,
  getSweepstakesTimingDescription,
  listSweepstakesDataSchema,
  listSweepstakesFiltersSchema,
  toDerivedSweepstakeStatus
} from '@/schemas/sweepstakes';
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_SWEEPSTAKES_NAME
} from '@giveaway/app-config/settings';
import { Prisma } from '@prisma/client';

const getSweepstakesList = procedure()
  .authorization({ required: true })
  .input(
    listSweepstakesFiltersSchema.extend({
      slug: z.string()
    })
  )
  .output(listSweepstakesDataSchema)
  .handler(async ({ input, user, db }) => {
    const page = input.page || 1;
    const searchQuery = input.search
      ? ({
          details: {
            name: {
              contains: input.search,
              mode: 'insensitive'
            }
          }
        } as const)
      : {};

    const timingQuery =
      input.status === 'SCHEDULED'
        ? {
            startDate: {
              gt: new Date()
            }
          }
        : input.status === 'RUNNING'
          ? {
              startDate: {
                lte: new Date()
              },
              endDate: {
                gte: new Date()
              }
            }
          : input.status === 'EXPIRED'
            ? {
                endDate: {
                  lt: new Date()
                }
              }
            : undefined;

    const statusQuery =
      input.status && input.status !== 'ALL'
        ? DERIVED_TO_ACTUAL_STATUS_MAP[input.status]
        : undefined;

    const teamQuery = {
      slug: input.slug,
      members: {
        some: {
          userId: user.id
        }
      }
    };

    const whereClause = {
      ...searchQuery,
      status: statusQuery,
      timing: timingQuery,
      team: teamQuery
    } satisfies Prisma.SweepstakesWhereInput;

    const orderBy =
      input.sortField === 'name'
        ? {
            details: {
              name: input.sortDirection
            }
          }
        : input.sortField
          ? {
              [input.sortField]: input.sortDirection
            }
          : undefined;

    const sweepstakes = await db.sweepstakes.findMany({
      where: whereClause,
      take: DEFAULT_PAGE_SIZE,
      skip: (page - 1) * DEFAULT_PAGE_SIZE,
      include: {
        details: true,
        timing: true,
        tasks: {
          include: {
            completions: {
              include: {
                participant: {
                  include: {
                    user: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy
    });

    const totalCount = await db.sweepstakes.count({
      where: whereClause
    });

    const totalPages = Math.ceil(totalCount / DEFAULT_PAGE_SIZE);

    return {
      sweepstakes: sweepstakes.map((s) => {
        const derivedStatus = toDerivedSweepstakeStatus(s);
        const timeLeft = getSweepstakesTimingDescription({
          status: derivedStatus,
          endDate: s.timing?.endDate,
          startDate: s.timing?.startDate
        });
        const entries = s.tasks.reduce(
          (acc, task) => acc + task.completions.length,
          0
        );
        const participants = new Set(
          s.tasks.flatMap((task) =>
            task.completions.map((completion) => completion.participant.user.id)
          )
        ).size;

        return {
          id: s.id,
          name: s.details?.name ?? DEFAULT_SWEEPSTAKES_NAME,
          status: derivedStatus,
          entries,
          participants,
          timeLeft,
          endsAt: s.timing?.endDate?.toISOString(),
          createdAt: s.createdAt.toISOString()
        };
      }),
      totalCount,
      currentPage: page,
      totalPages
    };
  });

export default getSweepstakesList;
