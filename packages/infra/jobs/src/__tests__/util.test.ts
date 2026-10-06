import { describe, it, expect, vi, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { isValidCronSecret, scheduleRandomlyAssignPrizesJob } from '../util';
import { prismaMock, asPrismaClient } from '@giveaway/testing-server/prisma';

const request = (headers: Record<string, string> = {}) =>
  new NextRequest('http://localhost:3000/api/cron/jobs', { headers });

describe('jobs util', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  describe('isValidCronSecret', () => {
    it('returns true when the authorization header carries the cron secret', () => {
      vi.stubEnv('CRON_SECRET', 's3cret');

      expect(
        isValidCronSecret(request({ authorization: 'Bearer s3cret' }))
      ).toBe(true);
    });

    it('returns false when the secret does not match', () => {
      vi.stubEnv('CRON_SECRET', 's3cret');

      expect(
        isValidCronSecret(request({ authorization: 'Bearer wrong' }))
      ).toBe(false);
    });

    it('returns false when the bearer prefix is missing', () => {
      vi.stubEnv('CRON_SECRET', 's3cret');

      expect(isValidCronSecret(request({ authorization: 's3cret' }))).toBe(
        false
      );
    });

    it('returns false when the authorization header is absent', () => {
      vi.stubEnv('CRON_SECRET', 's3cret');

      expect(isValidCronSecret(request())).toBe(false);
    });

    it('rejects the literal "Bearer undefined" when CRON_SECRET is not set', () => {
      vi.stubEnv('CRON_SECRET', undefined);

      expect(
        isValidCronSecret(request({ authorization: 'Bearer undefined' }))
      ).toBe(false);
    });

    it('rejects "Bearer " when CRON_SECRET is empty', () => {
      vi.stubEnv('CRON_SECRET', '');

      expect(isValidCronSecret(request({ authorization: 'Bearer ' }))).toBe(
        false
      );
    });

    it('rejects a header that only starts with the expected value', () => {
      vi.stubEnv('CRON_SECRET', 's3cret');

      expect(
        isValidCronSecret(request({ authorization: 'Bearer s3cret2' }))
      ).toBe(false);
    });
  });

  describe('scheduleRandomlyAssignPrizesJob', () => {
    it('upserts a pending RANDOMLY_ASSIGN_PRIZES job that runs now', async () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      const now = new Date('2026-03-04T05:06:07.000Z');
      vi.setSystemTime(now);
      prismaMock.sweepstakesJob.upsert.mockResolvedValue({});

      await scheduleRandomlyAssignPrizesJob({
        db: asPrismaClient(),
        sweepstakesId: 'sw-1'
      });

      expect(prismaMock.sweepstakesJob.upsert).toHaveBeenCalledWith({
        where: {
          sweepstakesId_type: {
            sweepstakesId: 'sw-1',
            type: 'RANDOMLY_ASSIGN_PRIZES'
          }
        },
        create: {
          sweepstakesId: 'sw-1',
          type: 'RANDOMLY_ASSIGN_PRIZES',
          status: 'PENDING',
          runAt: now
        },
        update: {
          status: 'PENDING',
          runAt: now
        }
      });
    });

    it('resolves to undefined', async () => {
      prismaMock.sweepstakesJob.upsert.mockResolvedValue({ id: 'job-1' });

      await expect(
        scheduleRandomlyAssignPrizesJob({
          db: asPrismaClient(),
          sweepstakesId: 'sw-1'
        })
      ).resolves.toBeUndefined();
    });

    it('propagates database errors', async () => {
      prismaMock.sweepstakesJob.upsert.mockRejectedValue(new Error('db down'));

      await expect(
        scheduleRandomlyAssignPrizesJob({
          db: asPrismaClient(),
          sweepstakesId: 'sw-1'
        })
      ).rejects.toThrow('db down');
    });
  });
});
