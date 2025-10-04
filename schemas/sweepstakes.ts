import { SweepstakesStatus } from '@prisma/client';
import z from 'zod';

export const sweepstakesDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.nativeEnum(SweepstakesStatus),
  entries: z.number(),
  uniqueEntrants: z.number(),
  conversionRate: z.number(),
  botRate: z.number(),
  timeLeft: z.string(),
  createdAt: z.string()
});

export type SweepstakesDataSchema = z.infer<typeof sweepstakesDataSchema>;

export const listSweepstakesDataSchema = z.object({
  sweepstakes: sweepstakesDataSchema.array(),
  totalCount: z.number(),
  currentPage: z.number(),
  totalPages: z.number()
});

export type ListSweepstakesDataSchema = z.infer<
  typeof listSweepstakesDataSchema
>;

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
  DRAFT: 'Draft',
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
    sortField: (obj.sortField as SortField) || 'createdAt',
    sortDirection: (obj.sortDirection as SortDirection) || 'desc'
  };
};

export const sweepstakesTabSchema = z.union([
  z.literal('preview'),
  z.literal('analytics'),
  z.literal('promotion'),
  z.literal('entries'),
  z.literal('participants'),
  z.literal('winners')
]);

export type SweepstakesTabSchema = z.infer<typeof sweepstakesTabSchema>;

export const SWEEPSTAKES_TAB_OPTIONS: Record<SweepstakesTabSchema, string> = {
  preview: 'Preview',
  analytics: 'Analytics',
  promotion: 'Promotion',
  entries: 'Entries',
  participants: 'Participants',
  winners: 'Winners'
};

export const isSweepstakesTab = (tab: string): tab is SweepstakesTabSchema => {
  return sweepstakesTabSchema.safeParse(tab).success;
};
