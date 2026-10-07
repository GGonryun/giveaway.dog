import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { TaskJobStatus } from '@prisma/client';
import { GET } from '../route';
import { prismaMock } from '@giveaway/testing-server/prisma';

const CRON_SECRET = 'cron-secret';
const NOW = new Date('2026-03-01T12:00:00.000Z');

const buildRequest = (headers: Record<string, string> = {}) =>
  new NextRequest('http://localhost:3000/api/jobs/process', { headers });

const authorizedRequest = () =>
  buildRequest({ authorization: `Bearer ${CRON_SECRET}` });

describe('GET /api/jobs/process', () => {
  beforeEach(() => {
    vi.stubEnv('CRON_SECRET', CRON_SECRET);
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    prismaMock.taskJob.findMany.mockResolvedValue([]);
    prismaMock.sweepstakesJob.findMany.mockResolvedValue([]);
    prismaMock.automatedPostJob.findMany.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  describe('when the cron secret is not valid', () => {
    it('returns 401 when the authorization header is missing', async () => {
      const res = await GET(buildRequest());

      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ error: 'Unauthorized' });
    });

    it('returns 401 when the bearer token does not match', async () => {
      const res = await GET(buildRequest({ authorization: 'Bearer nope' }));

      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ error: 'Unauthorized' });
    });

    it('returns 401 when the secret is sent without the Bearer prefix', async () => {
      const res = await GET(buildRequest({ authorization: CRON_SECRET }));

      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ error: 'Unauthorized' });
    });

    it('does not run any job processor', async () => {
      await GET(buildRequest());

      expect(prismaMock.taskJob.findMany).not.toHaveBeenCalled();
      expect(prismaMock.sweepstakesJob.findMany).not.toHaveBeenCalled();
      expect(prismaMock.automatedPostJob.findMany).not.toHaveBeenCalled();
    });

    it('rejects the literal "Bearer undefined" when CRON_SECRET is not configured', async () => {
      vi.stubEnv('CRON_SECRET', undefined);

      const res = await GET(
        buildRequest({ authorization: 'Bearer undefined' })
      );

      expect(res.status).toBe(401);
    });
  });

  describe('when the cron secret is valid', () => {
    it('returns each processor result under tasks, sweepstakes and posts', async () => {
      const res = await GET(authorizedRequest());

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({
        tasks: { ok: true, data: { processed: 0 } },
        sweepstakes: { processed: 0 },
        posts: { ok: true, data: { processed: 0 } }
      });
    });

    it('looks up at most five pending task jobs that are due, oldest first', async () => {
      await GET(authorizedRequest());

      expect(prismaMock.taskJob.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            runAt: { lte: NOW },
            status: { in: [TaskJobStatus.PENDING] }
          },
          orderBy: { createdAt: 'asc' },
          take: 5
        })
      );
    });

    it('looks up at most five pending sweepstakes jobs that are due, oldest first', async () => {
      await GET(authorizedRequest());

      expect(prismaMock.sweepstakesJob.findMany).toHaveBeenCalledWith({
        where: { runAt: { lte: NOW }, status: { in: ['PENDING'] } },
        orderBy: { createdAt: 'asc' },
        take: 5
      });
    });

    it('looks up at most five pending automated post jobs that are due, oldest first', async () => {
      await GET(authorizedRequest());

      expect(prismaMock.automatedPostJob.findMany).toHaveBeenCalledWith({
        where: { runAt: { lte: NOW }, status: { in: ['PENDING'] } },
        orderBy: { createdAt: 'asc' },
        take: 5
      });
    });

    it('runs the task, sweepstakes and post processors in that order', async () => {
      await GET(authorizedRequest());

      const [task] = prismaMock.taskJob.findMany.mock.invocationCallOrder;
      const [sweepstakes] =
        prismaMock.sweepstakesJob.findMany.mock.invocationCallOrder;
      const [posts] =
        prismaMock.automatedPostJob.findMany.mock.invocationCallOrder;
      expect(task).toBeLessThan(sweepstakes);
      expect(sweepstakes).toBeLessThan(posts);
    });

    it('reports a failing task processor as a failure result and keeps processing', async () => {
      prismaMock.taskJob.findMany.mockRejectedValue(new Error('db down'));

      const res = await GET(authorizedRequest());

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({
        tasks: {
          ok: false,
          data: { code: 'INTERNAL_SERVER_ERROR', message: 'db down' }
        },
        sweepstakes: { processed: 0 },
        posts: { ok: true, data: { processed: 0 } }
      });
    });

    it('reports a failing automated post processor as a failure result', async () => {
      prismaMock.automatedPostJob.findMany.mockRejectedValue(
        new Error('posts down')
      );

      const res = await GET(authorizedRequest());

      expect((await res.json()).posts).toEqual({
        ok: false,
        data: { code: 'INTERNAL_SERVER_ERROR', message: 'posts down' }
      });
    });

    it.fails(
      'still runs the post processor when the sweepstakes processor throws (fails until #300 is fixed)',
      async () => {
        prismaMock.sweepstakesJob.findMany.mockRejectedValue(
          new Error('sweepstakes down')
        );

        const res = await GET(authorizedRequest());

        expect(res.status).toBe(200);
        expect(prismaMock.automatedPostJob.findMany).toHaveBeenCalled();
        expect((await res.json()).posts).toEqual({
          ok: true,
          data: { processed: 0 }
        });
      }
    );
  });
});
