import { describe, expect, it } from 'vitest';
import { prismaMock } from '@giveaway/testing-server/prisma';
import { PRIZE_LOCK_TIMEOUT_MS, withLockedPrizes } from '../prize-lock';

describe('withLockedPrizes', () => {
  it('locks the prizes of the sweepstakes before it runs the callback in the transaction', async () => {
    const order: string[] = [];
    prismaMock.$executeRaw.mockImplementation(async () => {
      order.push('lock');
      return 2;
    });

    const result = await withLockedPrizes({
      db: prismaMock as never,
      sweepstakesId: 'sweep-1',
      run: async (tx) => {
        order.push('run');
        expect(tx).toBe(prismaMock);
        return 'done';
      }
    });

    expect(result).toBe('done');
    expect(order).toEqual(['lock', 'run']);
    const [strings, ...values] = prismaMock.$executeRaw.mock.calls[0];
    expect(strings.join('?')).toBe(
      'SELECT id FROM "Prize" WHERE "sweepstakesId" = ? FOR UPDATE'
    );
    expect(values).toEqual(['sweep-1']);
  });

  it('gives the transaction time to wait for a concurrent draw', async () => {
    await withLockedPrizes({
      db: prismaMock as never,
      sweepstakesId: 'sweep-1',
      run: async () => undefined
    });

    expect(prismaMock.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      timeout: PRIZE_LOCK_TIMEOUT_MS
    });
    expect(PRIZE_LOCK_TIMEOUT_MS).toBe(15_000);
  });

  it('does not run the callback when the lock fails', async () => {
    prismaMock.$executeRaw.mockRejectedValue(new Error('lock timeout'));
    let ran = false;

    await expect(
      withLockedPrizes({
        db: prismaMock as never,
        sweepstakesId: 'sweep-1',
        run: async () => {
          ran = true;
        }
      })
    ).rejects.toThrow('lock timeout');
    expect(ran).toBe(false);
  });
});
