import z from 'zod';

export const allocationStatisticsSchema = z.object({
  totalAllocations: z.number(),
  allocationsByPrize: z.array(
    z.object({
      prizeId: z.string(),
      prizeName: z.string(),
      allocationCount: z.number(),
      badge: z.union([
        z.literal('popular'),
        z.literal('unpopular'),
        z.literal('none')
      ])
    })
  )
});

export type AllocationStatisticsSchema = z.infer<
  typeof allocationStatisticsSchema
>;
