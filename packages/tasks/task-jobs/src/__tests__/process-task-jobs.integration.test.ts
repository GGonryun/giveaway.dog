import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Prisma } from '@giveaway/db-model';
import { db, holdTableWrites } from '@giveaway/testing-integration/database';
import {
  createHost,
  createSweepstakes,
  createUser
} from '@giveaway/testing-integration/fixtures';
import {
  crashAtEveryWrite,
  crashes
} from '@giveaway/testing-integration/faults';
import { fakeNetwork, type FakeNetwork } from '@giveaway/testing-server/faults';
import { expectOk } from '@giveaway/testing-server/result';
import { processTaskJobs } from '../process-task-jobs';

const NOW = new Date('2026-10-01T12:00:00.000Z');
const MINUTE = 60_000;
const TWEET_ID = '1234567890';
const RETWEETERS = `https://scrapebadger.com/v1/twitter/tweets/tweet/${TWEET_ID}/retweeters`;

const retweetImportTask = (): Prisma.InputJsonObject => ({
  type: 'TWITTER_RETWEET_IMPORT_V2',
  title: 'Repost on X',
  value: 1,
  mandatory: false,
  tasksRequired: 0,
  tweetId: `https://x.com/giveawaydog/status/${TWEET_ID}`
});

const xUser = (id: string) => ({
  id,
  username: `user_${id}`,
  name: `User ${id}`,
  verified: false,
  created_at: '2020-01-01T00:00:00.000Z',
  followers_count: 10,
  following_count: 10,
  tweet_count: 10
});

let network: FakeNetwork;

const createImport = async ({
  status = 'ACTIVE'
}: { status?: 'ACTIVE' | 'COMPLETED' } = {}) => {
  network.clearRequests();
  const { team } = await createHost();
  const sweepstakes = await createSweepstakes({
    teamId: team.id,
    status,
    tasks: [retweetImportTask()]
  });
  const [task] = sweepstakes.tasks;
  const job = await db.taskJob.create({
    data: {
      taskId: task.id,
      runAt: new Date(Date.now() - MINUTE),
      data: { runs: 1 }
    }
  });
  return { sweepstakes, task, job };
};

const setupImport = async () => {
  const entry = await createImport();
  await createUser({
    accounts: {
      create: {
        type: 'oauth',
        provider: 'twitter',
        providerAccountId: 'x-existing'
      }
    }
  });
  return entry;
};

const sortByJson = <T>(items: T[]) =>
  items.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));

const importState = async ({
  sweepstakes
}: Awaited<ReturnType<typeof createImport>>) => {
  const jobs = await db.taskJob.findMany({
    where: { task: { sweepstakesId: sweepstakes.id } },
    select: { status: true, runAt: true, data: true }
  });
  const completions = await db.taskCompletion.findMany({
    where: { task: { sweepstakesId: sweepstakes.id } },
    select: {
      status: true,
      participant: {
        select: {
          user: {
            select: { accounts: { select: { providerAccountId: true } } }
          }
        }
      }
    }
  });
  return {
    jobs: sortByJson(jobs),
    completions: sortByJson(
      completions.map(({ status, participant }) => ({
        status,
        accounts: participant.user.accounts.map((a) => a.providerAccountId)
      }))
    ),
    participants: await db.sweepstakesParticipant.count({
      where: { sweepstakesId: sweepstakes.id }
    }),
    users: await db.user.count(),
    scoringRequests: await db.userScoringRequest.count(),
    sweepstakesJobs: await db.sweepstakesJob.findMany({
      where: { sweepstakesId: sweepstakes.id },
      select: { type: true, status: true }
    })
  };
};

const nextJobs = (taskId: string) =>
  db.taskJob.findMany({ where: { taskId, status: 'PENDING' } });

const completionsByAccount = async (taskId: string) => {
  const completions = await db.taskCompletion.findMany({
    where: { taskId },
    select: {
      participant: {
        select: {
          user: {
            select: { accounts: { select: { providerAccountId: true } } }
          }
        }
      }
    }
  });
  return completions
    .flatMap(({ participant }) =>
      participant.user.accounts.map((a) => a.providerAccountId)
    )
    .sort();
};

beforeEach(() => {
  vi.stubEnv('SCRAPEBADGER_API_KEY', 'scrapebadger-key');
  vi.spyOn(console, 'info').mockImplementation(() => undefined);
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  network = fakeNetwork();
  network.json(RETWEETERS, { data: [xUser('x-new'), xUser('x-existing')] });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('processTaskJobs', () => {
  describe('when the function stops after a write and the job runs again', () => {
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(NOW);
    });

    it('imports the retweeters and schedules the next run', async () => {
      const entry = await setupImport();

      expectOk(await processTaskJobs());

      expect(await importState(entry)).toEqual({
        jobs: [
          {
            status: 'COMPLETED',
            runAt: new Date(NOW.getTime() - MINUTE),
            data: { runs: 1 }
          },
          {
            status: 'PENDING',
            runAt: new Date(NOW.getTime() + 5 * MINUTE),
            data: { runs: 2, lastProcessedId: 'x-new' }
          }
        ],
        completions: [
          { status: 'COMPLETED', accounts: ['x-existing'] },
          { status: 'COMPLETED', accounts: ['x-new'] }
        ],
        participants: 2,
        users: 3,
        scoringRequests: 2,
        sweepstakesJobs: [{ type: 'RANDOMLY_ASSIGN_PRIZES', status: 'PENDING' }]
      });
    });

    it.fails(
      'runs a job again on the next cron run when the function stopped while the job was in progress (fails until #181 is fixed)',
      async () => {
        const startedAt = vi.getRealSystemTime();
        vi.setSystemTime(startedAt);
        const { task } = await setupImport();
        crashes.afterWrites(1);
        await processTaskJobs();
        crashes.reset();
        vi.setSystemTime(startedAt + 15 * MINUTE);

        expectOk(await processTaskJobs());

        expect(await completionsByAccount(task.id)).toEqual([
          'x-existing',
          'x-new'
        ]);
        expect(await nextJobs(task.id)).toHaveLength(1);
      }
    );

    it.fails(
      'reaches the same final state as a clean run after a stop at any write, once the job is pending again (fails until #301 is fixed)',
      async () => {
        const { writes, mismatches } = await crashAtEveryWrite({
          setup: setupImport,
          run: () => processTaskJobs(),
          recover: () =>
            db.taskJob.updateMany({
              where: { status: 'IN_PROGRESS' },
              data: { status: 'PENDING' }
            }),
          state: importState
        });

        expect(writes).toBeGreaterThan(1);
        expect(mismatches).toEqual([]);
      }
    );
  });

  describe('when two runs overlap', () => {
    it.fails(
      'processes each job once (fails until #299 is fixed)',
      async () => {
        const { task } = await setupImport();

        await holdTableWrites('TaskJob', { writers: 2 }, () =>
          Promise.all([processTaskJobs(), processTaskJobs()])
        );

        expect(network.requests(RETWEETERS)).toHaveLength(1);
        expect(await nextJobs(task.id)).toHaveLength(1);
        expect(await completionsByAccount(task.id)).toEqual([
          'x-existing',
          'x-new'
        ]);
      }
    );
  });

  describe('when one job of the run fails', () => {
    it('marks that job failed and still processes the next job', async () => {
      const broken = await createImport();
      await db.task.update({
        where: { id: broken.task.id },
        data: {
          config: {
            ...retweetImportTask(),
            tweetId: 'https://x.com/giveawaydog/status/404'
          }
        }
      });
      network.json(
        'https://scrapebadger.com/v1/twitter/tweets/tweet/404/retweeters',
        { detail: 'Tweet not found' },
        { status: 404 }
      );
      const working = await setupImport();

      expect(expectOk(await processTaskJobs())).toEqual({ processed: 2 });

      expect(
        await db.taskJob.findUnique({ where: { id: broken.job.id } })
      ).toMatchObject({ status: 'FAILED' });
      expect(
        await db.taskJob.findUnique({ where: { id: working.job.id } })
      ).toMatchObject({ status: 'COMPLETED' });
      expect(await nextJobs(working.task.id)).toHaveLength(1);
    });

    it.fails(
      'still processes the next job after deleting the job of a giveaway that has ended (fails until #300 is fixed)',
      async () => {
        const ended = await createImport({ status: 'COMPLETED' });
        const working = await setupImport();

        expectOk(await processTaskJobs());

        expect(
          await db.taskJob.findUnique({ where: { id: ended.job.id } })
        ).toBeNull();
        expect(
          await db.taskJob.findUnique({ where: { id: working.job.id } })
        ).toMatchObject({ status: 'COMPLETED' });
      }
    );
  });
});
