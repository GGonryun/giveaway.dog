import { SweepstakesStatus } from '@prisma/client';
import z from 'zod';

export const sweepstakesDataSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.nativeEnum(SweepstakesStatus),
  entries: z.number(),
  uniqueEntrants: z.number(),
  conversionRate: z.number(),
  botRate: z.number(),
  timeLeft: z.string(),
  createdAt: z.string()
});

export type SweepstakesData = z.infer<typeof sweepstakesDataSchema>;

export const sweepstakesFilterStatusSchema = z
  .nativeEnum(SweepstakesStatus)
  .or(z.literal('ALL'));
export type SweepstakesFilterStatus = z.infer<
  typeof sweepstakesFilterStatusSchema
>;
export const SWEEPSTAKES_FILTER_STATUS_OPTIONS: Record<
  SweepstakesFilterStatus,
  string
> = {
  ALL: 'All',
  ACTIVE: 'Active',
  CANCELED: 'Canceled',
  DRAFT: 'Draft',
  PAUSED: 'Paused',
  COMPLETED: 'Completed'
};

export const sortFieldSchema = z.union([
  z.literal('name'),
  z.literal('createdAt')
]);
export type SortField = z.infer<typeof sortFieldSchema>;
export const sortDirectionSchema = z.union([
  z.literal('asc'),
  z.literal('desc')
]);
export type SortDirection = z.infer<typeof sortDirectionSchema>;
export const listSweepstakesFiltersSchema = z
  .object({
    search: z.string(),
    status: sweepstakesFilterStatusSchema,
    dateRange: z.string(),
    page: z.number(),
    size: z.number(),
    sortField: sortFieldSchema,
    sortDirection: sortDirectionSchema
  })
  .partial();
export type ListSweepstakesFilters = z.infer<
  typeof listSweepstakesFiltersSchema
>;

export const toSweepstakesFilter = (s: unknown): ListSweepstakesFilters => {
  const obj = s as Record<string, string>;
  return {
    search: obj.search || '',
    status: (obj.status as SweepstakesFilterStatus) || 'ALL',
    dateRange: obj.dateRange || '',
    page: obj.page ? parseInt(obj.page, 10) : 1,
    size: obj.size ? parseInt(obj.size, 10) : 10,
    sortField: (obj.sortField as SortField) || 'createdAt',
    sortDirection: (obj.sortDirection as SortDirection) || 'desc'
  };
};
