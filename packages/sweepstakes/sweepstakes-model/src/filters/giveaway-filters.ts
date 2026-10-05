import { z } from 'zod';

export const browseStatusSchema = z.enum([
  'RUNNING',
  'SCHEDULED',
  'EXPIRED',
  'COMPLETED'
]);

export type BrowseStatus = z.infer<typeof browseStatusSchema>;

export const BROWSE_STATUS_LABELS: Record<BrowseStatus, string> = {
  RUNNING: 'Running',
  SCHEDULED: 'Scheduled',
  EXPIRED: 'Expired',
  COMPLETED: 'Completed'
};

export const ALL_BROWSE_STATUSES: BrowseStatus[] = [
  'RUNNING',
  'SCHEDULED',
  'EXPIRED',
  'COMPLETED'
];

export const giveawayFiltersSchema = z.object({
  minEntrants: z.number().int().min(0).optional(),
  maxEntrants: z.number().int().min(0).optional(),
  sortBy: z
    .enum(['entrants-desc', 'entrants-asc', 'ending-soon', 'newest'])
    .optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).optional(),
  showStatuses: z.array(browseStatusSchema).optional(),
  hideEntered: z.boolean().optional(),
  hosts: z.array(z.string()).optional()
});

export type GiveawayFilters = z.infer<typeof giveawayFiltersSchema>;

export const defaultFilters: GiveawayFilters = {
  sortBy: 'entrants-desc',
  page: 1
};

export const PAGE_SIZE = 20;
