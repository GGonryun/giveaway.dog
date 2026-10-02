import type { Prisma } from '@prisma/client';

export const BASE_DATE = new Date('2024-01-01T00:00:00.000Z');

export const buildCriteriaRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'criteria-1',
  sweepstakesId: 'sw-1',
  minTasksCompleted: 0,
  minQualityScore: 0,
  allowMultipleWins: false,
  allowUserSelection: false,
  externalPlatforms: null,
  ...overrides
});

export const buildAllocation = (
  participantId: string,
  prizeId: string
): Prisma.SweepstakesAllocationGetPayload<{}> => ({
  id: `allocation-${participantId}-${prizeId}`,
  participantId,
  prizeId,
  createdAt: BASE_DATE,
  updatedAt: BASE_DATE
});
