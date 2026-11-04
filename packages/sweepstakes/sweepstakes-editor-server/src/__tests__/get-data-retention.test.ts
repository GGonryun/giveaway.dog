import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SweepstakesStatus, TeamTier } from '@giveaway/db-model';
import getDataRetention from '../get-data-retention';
import { prismaMock } from '@giveaway/testing-server/prisma';
import { signIn, signOut, TEST_USER } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date('2026-10-01T12:00:00.000Z');
const ENDED = new Date(NOW.getTime() - 10 * DAY);

type Stub = {
  status?: SweepstakesStatus;
  endDate?: Date | null;
  tier?: TeamTier | null;
  dataDeletedAt?: Date | null;
};

const stub = ({
  status = SweepstakesStatus.ACTIVE,
  endDate = ENDED,
  tier = TeamTier.FREE,
  dataDeletedAt = null
}: Stub = {}) =>
  prismaMock.sweepstakes.findUnique.mockResolvedValue({
    status,
    dataDeletedAt,
    timing: { endDate },
    team: tier ? { tier } : null
  } as never);

describe('getDataRetention', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    signIn();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('reads the sweepstakes of the caller', async () => {
    stub();

    await getDataRetention({ id: 'sweep-1' });

    expect(prismaMock.sweepstakes.findUnique).toHaveBeenCalledWith({
      where: {
        id: 'sweep-1',
        team: { members: { some: { userId: TEST_USER.id } } }
      },
      select: {
        status: true,
        dataDeletedAt: true,
        timing: { select: { endDate: true } },
        team: { select: { tier: true } }
      }
    });
  });

  it('[RETAIN-007] dates the deletion of an ended Free giveaway 90 days after its end', async () => {
    stub();

    expect(expectOk(await getDataRetention({ id: 'sweep-1' }))).toEqual({
      tier: TeamTier.FREE,
      deletesAt: new Date(ENDED.getTime() + 90 * DAY),
      deletedAt: null
    });
  });

  it('dates the deletion of an ended Pro giveaway one year after its end', async () => {
    stub({ tier: TeamTier.PRO, status: SweepstakesStatus.COMPLETED });

    expect(expectOk(await getDataRetention({ id: 'sweep-1' }))).toEqual({
      tier: TeamTier.PRO,
      deletesAt: new Date(ENDED.getTime() + 365 * DAY),
      deletedAt: null
    });
  });

  it.each<[string, Stub]>([
    ['an Elite giveaway', { tier: TeamTier.ELITE }],
    ['a running giveaway', { endDate: new Date(NOW.getTime() + DAY) }],
    ['a draft', { status: SweepstakesStatus.DRAFT }],
    ['a giveaway without an end date', { endDate: null }]
  ])('has no deletion date for %s', async (_, overrides) => {
    stub(overrides);

    expect(
      expectOk(await getDataRetention({ id: 'sweep-1' })).deletesAt
    ).toBeNull();
  });

  it('gives a giveaway without a team the retention of a Free team', async () => {
    stub({ tier: null });

    expect(expectOk(await getDataRetention({ id: 'sweep-1' })).tier).toBe(
      TeamTier.FREE
    );
  });

  it('returns the date of a deletion that happened', async () => {
    const deletedAt = new Date(NOW.getTime() - DAY);
    stub({ dataDeletedAt: deletedAt });

    expect(expectOk(await getDataRetention({ id: 'sweep-1' }))).toEqual({
      tier: TeamTier.FREE,
      deletesAt: null,
      deletedAt
    });
  });

  it('returns NOT_FOUND for a sweepstakes the caller cannot see', async () => {
    prismaMock.sweepstakes.findUnique.mockResolvedValue(null);

    expect(
      expectFailure(await getDataRetention({ id: 'sweep-404' }), 'NOT_FOUND')
        .message
    ).toBe('Sweepstakes with ID sweep-404 not found');
  });

  it('has no deletion date for a giveaway without a timing', async () => {
    prismaMock.sweepstakes.findUnique.mockResolvedValue({
      status: SweepstakesStatus.ACTIVE,
      dataDeletedAt: null,
      timing: null,
      team: { tier: TeamTier.FREE }
    } as never);

    expect(
      expectOk(await getDataRetention({ id: 'sweep-1' })).deletesAt
    ).toBeNull();
  });

  it('dates the deletion of a giveaway that ends right now', async () => {
    stub({ endDate: NOW });

    expect(
      expectOk(await getDataRetention({ id: 'sweep-1' })).deletesAt
    ).toEqual(new Date(NOW.getTime() + 90 * DAY));
  });

  it('returns UNAUTHORIZED when signed out', async () => {
    signOut();
    stub();

    expectFailure(await getDataRetention({ id: 'sweep-1' }), 'UNAUTHORIZED');
    expect(prismaMock.sweepstakes.findUnique).not.toHaveBeenCalled();
  });
});
