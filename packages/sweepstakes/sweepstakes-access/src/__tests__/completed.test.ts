import { describe, it, expect } from 'vitest';
import { SweepstakesStatus } from '@giveaway/db-model';
import { ApplicationError } from '@giveaway/util-errors';
import { assertNotCompleted } from '../completed';

describe('assertNotCompleted', () => {
  it('throws FORBIDDEN for a completed sweepstakes', () => {
    const error = (() => {
      try {
        assertNotCompleted({ status: SweepstakesStatus.COMPLETED });
      } catch (e) {
        return e;
      }
    })();

    expect(error).toBeInstanceOf(ApplicationError);
    expect(error).toMatchObject({
      code: 'FORBIDDEN',
      message: 'Completed sweepstakes cannot be modified.'
    });
  });

  it.each([SweepstakesStatus.DRAFT, SweepstakesStatus.ACTIVE])(
    'accepts a %s sweepstakes',
    (status) => {
      expect(() => assertNotCompleted({ status })).not.toThrow();
    }
  );
});
