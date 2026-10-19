import { describe, it, expect, beforeEach } from 'vitest';
import type { AutomatedPostJob } from '@giveaway/db-model';
import { getAutomatedPostJobs } from '../get-automated-post-jobs';
import { prismaMock } from '@giveaway/testing-server/prisma';
import { signIn } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';
import {
  SWEEPSTAKES_ID,
  TEAM_SLUG
} from '@giveaway/testing-server/fixtures-procedures-sweepstakes-a';
import {
  describeTeamAccess,
  teamSweepstakes,
  teamSweepstakesQuery
} from '@giveaway/sweepstakes-access/testing/team-sweepstakes';

const input = { sweepstakesId: SWEEPSTAKES_ID, slug: TEAM_SLUG };

const RUN_AT = new Date('2026-05-01T10:00:00.000Z');
const CREATED_AT = new Date('2026-04-01T10:00:00.000Z');

const jobRow = (
  overrides: Partial<AutomatedPostJob> = {}
): AutomatedPostJob => ({
  id: 'job-1',
  sweepstakesId: SWEEPSTAKES_ID,
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
  describeTeamAccess(
    () => getAutomatedPostJobs(input),
    () => [prismaMock.automatedPostJob.findMany]
  );

  describe('when the caller is signed in', () => {
    beforeEach(() => {
      signIn();
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        teamSweepstakes() as never
      );
    });

    it.each(['sweepstakesId', 'slug'])(
      'rejects input without %s',
      async (key) => {
        const partial: Record<string, string> = { ...input };
        delete partial[key];

        const result = await getAutomatedPostJobs(
          partial as unknown as Parameters<typeof getAutomatedPostJobs>[0]
        );

        expect(
          expectFailure(result, 'UNPROCESSABLE_CONTENT').message
        ).toContain(key);
        expect(prismaMock.sweepstakes.findUnique).not.toHaveBeenCalled();
        expect(prismaMock.automatedPostJob.findMany).not.toHaveBeenCalled();
      }
    );

    it('loads the sweepstakes through the membership of the caller', async () => {
      prismaMock.automatedPostJob.findMany.mockResolvedValue([]);

      await getAutomatedPostJobs(input);

      expect(prismaMock.sweepstakes.findUnique).toHaveBeenCalledWith(
        teamSweepstakesQuery(TEAM_SLUG)
      );
    });

    it('lets a guest read the jobs', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        teamSweepstakes('GUEST') as never
      );
      prismaMock.automatedPostJob.findMany.mockResolvedValue([]);

      expect(expectOk(await getAutomatedPostJobs(input))).toEqual([]);
    });

    it('queries jobs by the id of the sweepstakes the caller can access', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        teamSweepstakes('OWNER', 'sweep-9') as never
      );
      prismaMock.automatedPostJob.findMany.mockResolvedValue([]);

      await getAutomatedPostJobs(input);

      expect(prismaMock.automatedPostJob.findMany).toHaveBeenCalledWith({
        where: { sweepstakesId: 'sweep-9' }
      });
    });

    it('returns an empty list when there are no jobs', async () => {
      prismaMock.automatedPostJob.findMany.mockResolvedValue([]);

      const result = await getAutomatedPostJobs(input);

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

      const result = await getAutomatedPostJobs(input);

      expect(expectOk(result)).toEqual([
        {
          id: 'job-1',
          sweepstakesId: SWEEPSTAKES_ID,
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
          sweepstakesId: SWEEPSTAKES_ID,
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

      const result = await getAutomatedPostJobs(input);

      const failure = expectFailure(result, 'VALIDATION_ERROR');
      expect(failure.message).toContain('integrationId');
    });
  });
});
