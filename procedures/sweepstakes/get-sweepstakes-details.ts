import { dates } from '@/lib/date';
import { ApplicationError } from '@/lib/errors';
import { procedure } from '@/lib/mrpc/procedures';
import { sweepstakesDetailsSchema } from '@/schemas/giveaway/public';
import z from 'zod';

const getSweepstakesDetails = procedure
  .authorization({
    required: true
  })
  .input(z.object({ id: z.string() }))
  .output(sweepstakesDetailsSchema)
  .handler(async ({ input, db }) => {
    const sweepstakes = await db.sweepstakes.findUnique({
      where: { id: input.id },
      include: {
        details: true,
        team: true,
        timing: true
      }
    });

    const totalTasks = await db.taskCompletion.count({
      where: {
        task: {
          sweepstakesId: input.id
        }
      }
    });

    const totalUsers = await db.taskCompletion.findMany({
      select: {
        userId: true
      },
      distinct: ['userId'],
      where: {
        task: {
          sweepstakesId: input.id
        }
      }
    });

    if (!sweepstakes) {
      throw new Error('Sweepstakes not found');
    }

    const parsed = sweepstakesDetailsSchema.safeParse({
      id: sweepstakes.id,
      name: sweepstakes.details?.name,
      status: sweepstakes.status,
      description: sweepstakes.details?.description,
      createdAt: sweepstakes.createdAt.toISOString(),
      endsAt: sweepstakes.timing?.endDate?.toISOString(),
      timeLeft: dates.hasExpired(sweepstakes.timing?.endDate)
        ? 'Ended'
        : dates.distanceToNow(sweepstakes.timing?.endDate),
      totalEntries: totalTasks,
      totalUsers: totalUsers.length,
      banner: sweepstakes.details?.banner ?? '',
      conversionRate: 0,
      botRate: 0,
      topSource: 'N/A'
    });

    if (!parsed.success) {
      throw new ApplicationError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to parse sweepstakes details'
      });
    }

    return parsed.data;
  });

export default getSweepstakesDetails;
