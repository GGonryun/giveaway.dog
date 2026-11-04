import { beforeEach, describe, expect, it } from 'vitest';
import { SweepstakesStatus, TeamTier } from '@giveaway/db-model';
import type { Prisma } from '@giveaway/db-model';
import { prismaMock } from '@giveaway/testing-server/prisma';
import { ApplicationError } from '@giveaway/util-errors';
import { assertSweepstakesDuration } from '../duration';

const DAY = 24 * 60 * 60 * 1000;
const START = new Date('2026-06-01T00:00:00.000Z');
const after = (days: number, ms = 0) =>
  new Date(START.getTime() + days * DAY + ms);
const db = prismaMock as unknown as Prisma.TransactionClient;
const MESSAGE =
  'A giveaway of a Free team runs for at most 7 days. Upgrade the team to run a longer giveaway.';

type Args = Parameters<typeof assertSweepstakesDuration>[0];

const check = ({
  status = SweepstakesStatus.ACTIVE,
  tier = TeamTier.FREE,
  timing
}: {
  status?: SweepstakesStatus;
  tier?: Args['tier'];
  timing: Args['timing'];
}) =>
  assertSweepstakesDuration({
    db,
    sweepstakes: { id: 'sweep-1', status },
    tier,
    timing
  });

const saved = (startDate: Date | null, endDate: Date | null) =>
  prismaMock.sweepstakesTiming.findUnique.mockResolvedValue({
    startDate,
    endDate
  } as never);

describe('assertSweepstakesDuration', () => {
  beforeEach(() => {
    saved(START, after(30));
  });

  it.each([
    ['no timing', undefined],
    ['no start date', { endDate: after(30) }],
    ['no end date', { startDate: START }],
    ['a null start date', { startDate: null, endDate: after(30) }],
    ['a null end date', { startDate: START, endDate: null }],
    ['an invalid start date', { startDate: 'soon', endDate: after(30) }],
    ['an invalid end date', { startDate: START, endDate: 'later' }]
  ])('accepts %s', async (_, timing) => {
    await expect(check({ timing })).resolves.toBeUndefined();
    expect(prismaMock.sweepstakesTiming.findUnique).not.toHaveBeenCalled();
  });

  it('accepts a giveaway within the limit without reading the saved dates', async () => {
    await expect(
      check({ timing: { startDate: START, endDate: after(7) } })
    ).resolves.toBeUndefined();
    expect(prismaMock.sweepstakesTiming.findUnique).not.toHaveBeenCalled();
  });

  it('reads dates sent as strings and numbers', async () => {
    await expect(
      check({
        timing: {
          startDate: START.toISOString(),
          endDate: after(8).getTime()
        }
      })
    ).rejects.toThrow(MESSAGE);
  });

  it('refuses a long draft without reading the saved dates', async () => {
    const error = await check({
      status: SweepstakesStatus.DRAFT,
      timing: { startDate: START, endDate: after(30) }
    }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApplicationError);
    expect(error).toMatchObject({ code: 'FORBIDDEN', message: MESSAGE });
    expect(prismaMock.sweepstakesTiming.findUnique).not.toHaveBeenCalled();
  });

  it('gives a giveaway without a team tier the Free limit', async () => {
    await expect(
      check({
        tier: null,
        status: SweepstakesStatus.DRAFT,
        timing: { startDate: START, endDate: after(7, 1) }
      })
    ).rejects.toThrow(MESSAGE);
  });

  it('accepts a long published giveaway whose dates did not change', async () => {
    await expect(
      check({ timing: { startDate: START, endDate: after(30) } })
    ).resolves.toBeUndefined();
    expect(prismaMock.sweepstakesTiming.findUnique).toHaveBeenCalledWith({
      where: { sweepstakesId: 'sweep-1' },
      select: { startDate: true, endDate: true }
    });
  });

  it.each([
    ['its start date changed', after(-1), after(30)],
    ['its end date changed', START, after(31)]
  ])(
    'refuses a long published giveaway when %s',
    async (_, startDate, endDate) => {
      await expect(check({ timing: { startDate, endDate } })).rejects.toThrow(
        MESSAGE
      );
    }
  );

  it.each([
    ['no saved timing', null],
    ['no saved start date', { startDate: null, endDate: after(30) }],
    ['no saved end date', { startDate: START, endDate: null }]
  ])('refuses a long published giveaway with %s', async (_, timing) => {
    prismaMock.sweepstakesTiming.findUnique.mockResolvedValue(timing as never);

    await expect(
      check({ timing: { startDate: START, endDate: after(30) } })
    ).rejects.toThrow(MESSAGE);
  });
});
