import { date } from '@/lib/date';
import { Prisma, SweepstakesStatus } from '@prisma/client';
import z from 'zod';

export const expectedSweepstakesStatusSchema = z.union([
  z.literal('DRAFT'),
  z.literal('COMPLETED'),
  z.literal('RUNNING'),
  z.literal('SCHEDULED'),
  z.literal('EXPIRED')
]);

export const derivedSweepstakesStatusSchema =
  expectedSweepstakesStatusSchema.or(z.literal('ERROR'));

export const SWEEPSTAKE_TIMING_INCLUDE_QUERY = {
  timing: true
} satisfies Prisma.SweepstakesInclude;

export const toDerivedSweepstakeStatus = ({
  status,
  timing
}: Prisma.SweepstakesGetPayload<{
  include: typeof SWEEPSTAKE_TIMING_INCLUDE_QUERY;
}>): z.infer<typeof derivedSweepstakesStatusSchema> => {
  const now = new Date();

  if (status === 'DRAFT' || !timing) {
    return 'DRAFT';
  }

  if (status === 'COMPLETED') {
    return 'COMPLETED';
  }

  if (timing.endDate) {
    return date.hasExpired(timing.endDate) ? 'EXPIRED' : 'RUNNING';
  }

  if (timing.startDate && now < timing.startDate) {
    return 'SCHEDULED';
  }

  return 'ERROR';
};

export type DerivedSweepstakeStatus = z.infer<
  typeof derivedSweepstakesStatusSchema
>;

export const DERIVED_TO_ACTUAL_STATUS_MAP: Record<
  DerivedSweepstakeStatus,
  SweepstakesStatus
> = {
  DRAFT: 'DRAFT',
  COMPLETED: 'COMPLETED',
  RUNNING: 'ACTIVE',
  SCHEDULED: 'ACTIVE',
  EXPIRED: 'ACTIVE',
  ERROR: 'ACTIVE' // Map ERROR to ACTIVE as a fallback
};

export const EDITABLE_DERIVED_STATUS: Record<DerivedSweepstakeStatus, boolean> =
  {
    DRAFT: true,
    COMPLETED: false,
    RUNNING: true,
    SCHEDULED: true,
    EXPIRED: true,
    ERROR: true
  };

export const sweepstakesDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: derivedSweepstakesStatusSchema,
  entries: z.number(),
  participants: z.number(),
  timeLeft: z.string(),
  createdAt: z.string(),
  endsAt: z.string().nullish()
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

export const sweepstakesFilterStatusSchema = expectedSweepstakesStatusSchema.or(
  z.literal('ALL')
);
export type SweepstakesFilterStatus = z.infer<
  typeof sweepstakesFilterStatusSchema
>;
export const SWEEPSTAKES_FILTER_STATUS_OPTIONS: Record<
  SweepstakesFilterStatus,
  string
> = {
  ALL: 'All',
  RUNNING: 'Active',
  SCHEDULED: 'Scheduled',
  EXPIRED: 'Expired',
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
