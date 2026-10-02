import { describe, it, expect, beforeEach } from 'vitest';
import type { AutomatedPostJob } from '@prisma/client';
import { getAutomatedPostJobs } from '../get-automated-post-jobs';
import { prismaMock } from '@giveaway/testing-server/prisma';
import { signIn } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';

const RUN_AT = new Date('2026-05-01T10:00:00.000Z');
const CREATED_AT = new Date('2026-04-01T10:00:00.000Z');

const jobRow = (
  overrides: Partial<AutomatedPostJob> = {}
): AutomatedPostJob => ({
  id: 'job-1',
  sweepstakesId: 'sweep-1',
  type: 'POST_TO_BLUESKY',
  status: 'PENDING',
  runAt: RUN_AT,
  createdAt: CREATED_AT,
  updatedAt: CREATED_AT,
  request: { integrationId: 'int-1', text: 'Hello' },
  response: null,
  ...overrides
});

describe('getAutomatedPostJobs', () => {
  describe('when the caller is not signed in', () => {
    it('returns UNAUTHORIZED without querying jobs', async () => {
      const result = await getAutomatedPostJobs({ sweepstakesId: 'sweep-1' });

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.automatedPostJob.findMany).not.toHaveBeenCalled();
    });
  });

  describe('when the caller is signed in', () => {
    beforeEach(() => {
      signIn();
    });

    it('rejects input without a sweepstakes id', async () => {
      const result = await getAutomatedPostJobs(
        {} as unknown as Parameters<typeof getAutomatedPostJobs>[0]
      );

      expectFailure(result, 'UNPROCESSABLE_CONTENT');
      expect(prismaMock.automatedPostJob.findMany).not.toHaveBeenCalled();
    });

    it('queries jobs by sweepstakes id only', async () => {
      prismaMock.automatedPostJob.findMany.mockResolvedValue([]);

      await getAutomatedPostJobs({ sweepstakesId: 'sweep-9' });

      expect(prismaMock.automatedPostJob.findMany).toHaveBeenCalledWith({
        where: { sweepstakesId: 'sweep-9' }
      });
    });

    it('returns an empty list when there are no jobs', async () => {
      prismaMock.automatedPostJob.findMany.mockResolvedValue([]);

      const result = await getAutomatedPostJobs({ sweepstakesId: 'sweep-1' });

      expect(expectOk(result)).toEqual([]);
    });

    it('returns each job parsed with request defaults applied', async () => {
      prismaMock.automatedPostJob.findMany.mockResolvedValue([
        jobRow(),
        jobRow({
          id: 'job-2',
          type: 'POST_TO_DISCORD',
          status: 'COMPLETED',
          request: { integrationId: 'guild-1', channelId: 'channel-1' },
          response: { messageId: 'msg-1' }
        })
      ]);

      const result = await getAutomatedPostJobs({ sweepstakesId: 'sweep-1' });

      expect(expectOk(result)).toEqual([
        {
          id: 'job-1',
          sweepstakesId: 'sweep-1',
          type: 'POST_TO_BLUESKY',
          status: 'PENDING',
          runAt: RUN_AT,
          createdAt: CREATED_AT,
          updatedAt: CREATED_AT,
          request: { integrationId: 'int-1', text: 'Hello', tasks: [] },
          response: null
        },
        {
          id: 'job-2',
          sweepstakesId: 'sweep-1',
          type: 'POST_TO_DISCORD',
          status: 'COMPLETED',
          runAt: RUN_AT,
          createdAt: CREATED_AT,
          updatedAt: CREATED_AT,
          request: {
            integrationId: 'guild-1',
            channelId: 'channel-1',
            roles: [],
            tasks: []
          },
          response: { messageId: 'msg-1' }
        }
      ]);
    });

    it('fails with VALIDATION_ERROR when a stored job is malformed', async () => {
      prismaMock.automatedPostJob.findMany.mockResolvedValue([
        jobRow(),
        jobRow({ id: 'job-2', request: { text: 'missing integration' } })
      ]);

      const result = await getAutomatedPostJobs({ sweepstakesId: 'sweep-1' });

      const failure = expectFailure(result, 'VALIDATION_ERROR');
      expect(failure.message).toContain('integrationId');
    });
  });
});
