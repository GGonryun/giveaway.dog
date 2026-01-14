import { z } from 'zod';

export const giveawayFiltersSchema = z.object({
  minEntrants: z.number().int().min(0).optional(),
  maxEntrants: z.number().int().min(0).optional(),
  sortBy: z
    .enum(['entrants-desc', 'entrants-asc', 'ending-soon', 'newest'])
    .optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).optional()
});

export type GiveawayFilters = z.infer<typeof giveawayFiltersSchema>;

export const defaultFilters: GiveawayFilters = {
  sortBy: 'entrants-desc',
  page: 1
};

export const PAGE_SIZE = 20;
