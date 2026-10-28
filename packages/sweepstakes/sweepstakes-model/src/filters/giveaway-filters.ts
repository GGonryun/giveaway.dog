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

export type GiveawayFiltersQuery = Partial<
  Record<keyof GiveawayFilters, string>
>;

const sortBySchema = giveawayFiltersSchema.shape.sortBy.unwrap();

const parseCount = (value?: string): number | undefined => {
  if (!value || /\D/.test(value)) return undefined;
  const count = Number(value);
  return Number.isSafeInteger(count) ? count : undefined;
};

const parseList = (value?: string): string[] | undefined => {
  const items = value?.split(',').filter(Boolean) ?? [];
  return items.length > 0 ? items : undefined;
};

const parseStatuses = (value?: string): BrowseStatus[] | undefined => {
  const statuses = parseList(value)?.filter(
    (status): status is BrowseStatus =>
      browseStatusSchema.safeParse(status).success
  );
  return statuses && statuses.length > 0 ? statuses : undefined;
};

export const parseGiveawayFilters = (
  query: GiveawayFiltersQuery
): GiveawayFilters => {
  const sortBy = sortBySchema.safeParse(query.sortBy);

  return {
    minEntrants: parseCount(query.minEntrants),
    maxEntrants: parseCount(query.maxEntrants),
    sortBy: sortBy.success ? sortBy.data : undefined,
    search: query.search,
    page: parseCount(query.page) || 1,
    showStatuses: parseStatuses(query.showStatuses),
    hideEntered: query.hideEntered === 'true',
    hosts: parseList(query.hosts)
  };
};
