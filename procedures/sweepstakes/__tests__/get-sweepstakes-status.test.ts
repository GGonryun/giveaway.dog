import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SweepstakesStatus } from '@prisma/client';
import getSweepstakesStatus from '../get-sweepstakes-status';
import { knownRequestError, prismaMock } from '@/test/prisma';
import { signIn, TEST_USER } from '@/test/session';
import { expectFailure, expectOk } from '@/test/result';

const NOW = new Date('2025-06-15T12:00:00.000Z');

const sweepstakes = (
  status: SweepstakesStatus,
  timing: { startDate: Date | null; endDate: Date | null } | null
) => ({ id: 'sweep-1', status, timing });

describe('getSweepstakesStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('returns UNAUTHORIZED when signed out', async () => {
    const result = await getSweepstakesStatus({ id: 'sweep-1' });

    expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
      'Invalid session'
    );
    expect(prismaMock.sweepstakes.findUnique).not.toHaveBeenCalled();
  });

  it('rejects input without an id', async () => {
    signIn();

    const result = await getSweepstakesStatus(
      {} as unknown as Parameters<typeof getSweepstakesStatus>[0]
    );

    expectFailure(result, 'UNPROCESSABLE_CONTENT');
  });

  it('queries the sweepstakes scoped to the caller with its timing', async () => {
    signIn();
    prismaMock.sweepstakes.findUnique.mockResolvedValue(
      sweepstakes(SweepstakesStatus.DRAFT, {
        startDate: null,
        endDate: null
      })
    );

    await getSweepstakesStatus({ id: 'sweep-1' });

    expect(prismaMock.sweepstakes.findUnique).toHaveBeenCalledWith({
      where: {
        id: 'sweep-1',
        team: { members: { some: { userId: TEST_USER.id } } }
      },
      include: { timing: true }
    });
  });

  it('returns NOT_FOUND when the sweepstakes does not exist', async () => {
    signIn();
    prismaMock.sweepstakes.findUnique.mockResolvedValue(null);

    const result = await getSweepstakesStatus({ id: 'sweep-404' });

    expect(expectFailure(result, 'NOT_FOUND').message).toBe(
      'Sweepstakes with ID sweep-404 not found'
    );
  });

  it('returns NOT_FOUND when the sweepstakes has no timing', async () => {
    signIn();
    prismaMock.sweepstakes.findUnique.mockResolvedValue(
      sweepstakes(SweepstakesStatus.ACTIVE, null)
    );

    const result = await getSweepstakesStatus({ id: 'sweep-1' });

    expect(expectFailure(result, 'NOT_FOUND').message).toBe(
      'Sweepstakes with ID sweep-1 not found'
    );
  });

  it('reports DRAFT for a draft sweepstakes', async () => {
    signIn();
    prismaMock.sweepstakes.findUnique.mockResolvedValue(
      sweepstakes(SweepstakesStatus.DRAFT, {
        startDate: new Date('2025-06-10T00:00:00.000Z'),
        endDate: new Date('2025-06-20T00:00:00.000Z')
      })
    );

    const result = await getSweepstakesStatus({ id: 'sweep-1' });

    expect(expectOk(result)).toEqual({ id: 'sweep-1', status: 'DRAFT' });
  });

  it('reports COMPLETED for a completed sweepstakes', async () => {
    signIn();
    prismaMock.sweepstakes.findUnique.mockResolvedValue(
      sweepstakes(SweepstakesStatus.COMPLETED, {
        startDate: new Date('2025-06-01T00:00:00.000Z'),
        endDate: new Date('2025-06-10T00:00:00.000Z')
      })
    );

    const result = await getSweepstakesStatus({ id: 'sweep-1' });

    expect(expectOk(result).status).toBe('COMPLETED');
  });

  it('reports SCHEDULED for an active sweepstakes starting later', async () => {
    signIn();
    prismaMock.sweepstakes.findUnique.mockResolvedValue(
      sweepstakes(SweepstakesStatus.ACTIVE, {
        startDate: new Date('2025-06-16T00:00:00.000Z'),
        endDate: new Date('2025-06-20T00:00:00.000Z')
      })
    );

    const result = await getSweepstakesStatus({ id: 'sweep-1' });

    expect(expectOk(result).status).toBe('SCHEDULED');
  });

  it('reports RUNNING for an active sweepstakes inside its window', async () => {
    signIn();
    prismaMock.sweepstakes.findUnique.mockResolvedValue(
      sweepstakes(SweepstakesStatus.ACTIVE, {
        startDate: new Date('2025-06-10T00:00:00.000Z'),
        endDate: new Date('2025-06-20T00:00:00.000Z')
      })
    );

    const result = await getSweepstakesStatus({ id: 'sweep-1' });

    expect(expectOk(result).status).toBe('RUNNING');
  });

  it('reports EXPIRED for an active sweepstakes past its end date', async () => {
    signIn();
    prismaMock.sweepstakes.findUnique.mockResolvedValue(
      sweepstakes(SweepstakesStatus.ACTIVE, {
        startDate: new Date('2025-06-01T00:00:00.000Z'),
        endDate: new Date('2025-06-15T11:59:59.000Z')
      })
    );

    const result = await getSweepstakesStatus({ id: 'sweep-1' });

    expect(expectOk(result).status).toBe('EXPIRED');
  });

  it('reports ERROR for an active sweepstakes without an end date', async () => {
    signIn();
    prismaMock.sweepstakes.findUnique.mockResolvedValue(
      sweepstakes(SweepstakesStatus.ACTIVE, { startDate: null, endDate: null })
    );

    const result = await getSweepstakesStatus({ id: 'sweep-1' });

    expect(expectOk(result).status).toBe('ERROR');
  });

  it('maps a prisma P2025 error to NOT_FOUND', async () => {
    signIn();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    prismaMock.sweepstakes.findUnique.mockRejectedValue(
      knownRequestError('P2025')
    );

    const result = await getSweepstakesStatus({ id: 'sweep-1' });

    expectFailure(result, 'NOT_FOUND');
  });
});
