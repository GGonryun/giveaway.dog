import 'server-only';

import { procedure } from '@giveaway/rpc-server/procedures';
import { DEFAULT_SWEEPSTAKES_PRIZE_NAME } from '@giveaway/sweepstakes-model/defaults';
import z from 'zod';
import { allocationStatisticsSchema as allocationStatisticsSchema } from '@giveaway/allocation-model/schemas';

export const getSweepstakesAllocations = procedure(
  'allocation-server/getSweepstakesAllocations'
)
  .authorization({
    required: false
  })
  .input(
    z.object({
      sweepstakesId: z.string()
    })
  )
  .output(allocationStatisticsSchema)
  .cache(({ input }) => ({
    keyParts: [`sweepstakes-allocations-${input.sweepstakesId}`],
    tags: [`sweepstakes-${input.sweepstakesId}`, 'sweepstakes-allocations'],
    revalidate: 600 // Cache for 10 minutes
  }))
  .handler(async ({ db, input: { sweepstakesId } }) => {
    // Fetch total allocations
    const totalAllocations = await db.sweepstakesAllocation.count({
      where: {
        participant: {
          sweepstakesId
        }
      }
    });

    // Fetch allocations grouped by prize
    const allocationsByPrizeRaw = await db.sweepstakesAllocation.groupBy({
      by: ['prizeId'],
      where: {
        participant: {
          sweepstakesId
        }
      },
      _count: {
        prizeId: true
      }
    });

    const prizes = await db.prize.findMany({
      where: {
        sweepstakesId
      }
    });

    const allocationsByPrize = allocationsByPrizeRaw.map((allocation) => {
      const prize = prizes.find((p) => p.id === allocation.prizeId);
      return {
        prizeId: allocation.prizeId,
        prizeName: prize?.name ? prize.name : DEFAULT_SWEEPSTAKES_PRIZE_NAME,
        allocationCount: allocation._count.prizeId
      };
    });

    // Calculate popularity and assign badges
    const hasMultiplePrizes =
      allocationsByPrize.length > 1 && totalAllocations > 0;

    if (hasMultiplePrizes) {
      const maxCount = Math.max(
        ...allocationsByPrize.map((a) => a.allocationCount)
      );
      const minCount = Math.min(
        ...allocationsByPrize.map((a) => a.allocationCount)
      );

      const allocationsByPrizeWithBadges = allocationsByPrize.map(
        (allocation) => {
          let badge: 'popular' | 'unpopular' | 'none' = 'none';

          if (
            allocation.allocationCount === maxCount &&
            maxCount !== minCount
          ) {
            badge = 'popular';
          } else if (
            allocation.allocationCount === minCount &&
            maxCount !== minCount
          ) {
            badge = 'unpopular';
          }

          return {
            ...allocation,
            badge
          };
        }
      );

      return {
        totalAllocations,
        allocationsByPrize: allocationsByPrizeWithBadges
      };
    }

    // No badges if single prize or no allocations
    return {
      totalAllocations,
      allocationsByPrize: allocationsByPrize.map((a) => ({
        ...a,
        badge: 'none' as const
      }))
    };
  });
