import { describe, it, expect } from 'vitest';
import { prismaMock } from '@giveaway/testing-server/prisma';
import { ApplicationError } from '@giveaway/util-errors';
import { assertSweepstakesEnded } from '../ended';
import { sweepstakesTiming } from '../testing/fixtures-sweepstakes-winners-email';

const HOUR = 60 * 60 * 1000;

const check = () =>
  assertSweepstakesEnded({ db: prismaMock as never, sweepstakesId: 'sw-1' });

describe('assertSweepstakesEnded', () => {
  it('reads the status and the timing of the sweepstakes', async () => {
    prismaMock.sweepstakes.findUnique.mockResolvedValue(
      sweepstakesTiming(-HOUR) as never
    );

    await check();

    expect(prismaMock.sweepstakes.findUnique).toHaveBeenCalledWith({
      where: { id: 'sw-1' },
      select: { status: true, timing: true }
    });
  });

  it.each([
    ['an ended', sweepstakesTiming(-HOUR)],
    ['a completed', sweepstakesTiming(HOUR, 'COMPLETED')]
  ])('accepts %s giveaway', async (_, sweepstakes) => {
    prismaMock.sweepstakes.findUnique.mockResolvedValue(sweepstakes as never);

    await expect(check()).resolves.toBeUndefined();
  });

  it.each([
    ['a running', sweepstakesTiming(HOUR)],
    ['a scheduled', sweepstakesTiming(3 * HOUR)],
    ['a draft', sweepstakesTiming(-HOUR, 'DRAFT')],
    ['an untimed', { status: 'ACTIVE', timing: null }],
    [
      'an endless',
      { status: 'ACTIVE', timing: { startDate: null, endDate: null } }
    ]
  ])('refuses %s giveaway', async (_, sweepstakes) => {
    prismaMock.sweepstakes.findUnique.mockResolvedValue(sweepstakes as never);

    const error = await check().catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApplicationError);
    expect(error).toMatchObject({
      code: 'PRECONDITION_FAILED',
      message: 'Winners can only be drawn after the giveaway ends'
    });
  });

  it('returns NOT_FOUND when the sweepstakes does not exist', async () => {
    prismaMock.sweepstakes.findUnique.mockResolvedValue(null);

    await expect(check()).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'Sweepstakes with ID sw-1 not found'
    });
  });
});
