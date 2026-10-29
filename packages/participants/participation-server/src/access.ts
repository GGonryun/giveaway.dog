import 'server-only';

import { PrismaClient } from '@giveaway/db-model';
import { unstable_cache } from 'next/cache';
import { VISIBILITY_SELECT_QUERY } from './visibility';

export const SWEEPSTAKES_ACCESS_SELECT_QUERY = {
  id: true,
  timing: { select: { startDate: true, endDate: true } },
  ...VISIBILITY_SELECT_QUERY
} as const;

class SweepstakesNotFound extends Error {}

const loadSweepstakesAccess = async (
  db: PrismaClient,
  sweepstakesId: string
) => {
  const sweepstakes = await db.sweepstakes.findFirst({
    where: {
      OR: [{ id: sweepstakesId }, { visibility: { slug: sweepstakesId } }]
    },
    select: SWEEPSTAKES_ACCESS_SELECT_QUERY
  });

  if (!sweepstakes) {
    throw new SweepstakesNotFound();
  }

  return sweepstakes;
};

type SweepstakesAccess = Awaited<ReturnType<typeof loadSweepstakesAccess>>;

const toDate = (value: Date | string | null | undefined) =>
  value ? new Date(value) : null;

const toSweepstakesAccess = (
  sweepstakes: SweepstakesAccess
): SweepstakesAccess => ({
  ...sweepstakes,
  timing: sweepstakes.timing
    ? {
        startDate: toDate(sweepstakes.timing.startDate),
        endDate: toDate(sweepstakes.timing.endDate)
      }
    : null
});

export const sweepstakesAccessTags = (sweepstakesId: string) => [
  `sweepstakes-${sweepstakesId}`,
  `sweepstakes-${sweepstakesId}-privacy`,
  'participant-sweepstake'
];

export const findSweepstakesAccess = async ({
  db,
  sweepstakesId
}: {
  db: PrismaClient;
  sweepstakesId: string;
}) => {
  const cached = unstable_cache(
    (id: string) => loadSweepstakesAccess(db, id),
    [`sweepstakes-access-v1-${sweepstakesId}`],
    { tags: sweepstakesAccessTags(sweepstakesId), revalidate: 3600 }
  );

  try {
    return toSweepstakesAccess(await cached(sweepstakesId));
  } catch (error) {
    if (error instanceof SweepstakesNotFound) return null;
    throw error;
  }
};
