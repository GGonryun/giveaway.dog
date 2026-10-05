import { describe, it, expect } from 'vitest';
import refreshSweepstakes from '../refresh-sweepstakes';
import { signIn } from '@giveaway/testing-server/session';
import { nextCacheMock } from '@giveaway/testing-server/next-cache';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';

describe('refreshSweepstakes', () => {
  describe('when the input is valid', () => {
    it('returns success for an anonymous caller', async () => {
      const result = await refreshSweepstakes({ sweepstakesId: 'sw-1' });

      expect(expectOk(result)).toEqual({ success: true });
    });

    it('returns success for a signed in caller', async () => {
      signIn();

      const result = await refreshSweepstakes({ sweepstakesId: 'sw-1' });

      expect(expectOk(result)).toEqual({ success: true });
    });

    it('revalidates every cache tag tied to the sweepstakes in order', async () => {
      await refreshSweepstakes({ sweepstakesId: 'sw-42' });

      expect(nextCacheMock.revalidateTag.mock.calls).toEqual([
        ['sweepstakes-sw-42', 'max'],
        ['participant-sweepstake', 'max'],
        ['sweepstakes-sw-42-privacy', 'max'],
        ['sweepstakes-sw-42-referral', 'max'],
        ['sweepstakes-sw-42-host', 'max']
      ]);
    });

    it('does not wrap the handler in unstable_cache', async () => {
      await refreshSweepstakes({ sweepstakesId: 'sw-1' });

      expect(nextCacheMock.unstable_cache).not.toHaveBeenCalled();
    });

    it('uses the raw id verbatim, including a slug-like value', async () => {
      await refreshSweepstakes({ sweepstakesId: 'my-cool-slug' });

      expect(nextCacheMock.revalidateTag).toHaveBeenCalledWith(
        'sweepstakes-my-cool-slug',
        'max'
      );
    });
  });

  describe('when the input is invalid', () => {
    it('returns UNPROCESSABLE_CONTENT when sweepstakesId is missing', async () => {
      const result = await refreshSweepstakes(
        {} as unknown as Parameters<typeof refreshSweepstakes>[0]
      );

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toContain(
        'Input validation failed'
      );
    });

    it('does not revalidate anything when validation fails', async () => {
      await refreshSweepstakes({
        sweepstakesId: 7
      } as unknown as Parameters<typeof refreshSweepstakes>[0]);

      expect(nextCacheMock.revalidateTag).not.toHaveBeenCalled();
    });
  });
});
