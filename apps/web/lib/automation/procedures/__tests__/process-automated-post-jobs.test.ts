import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { AutomatedPostJob } from '@prisma/client';
import { ApplicationError } from '@giveaway/util-errors';
import { processAutomatedPostJobs } from '../process-automated-post-jobs';
import { prismaMock } from '@giveaway/testing-server/prisma';
import { signIn } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';

const mocks = vi.hoisted(() => ({
  createTweet: vi.fn(),
  createSkeet: vi.fn(),
  processPostToDiscord: vi.fn(),
  nanoid: vi.fn()
}));

vi.mock('@/lib/integrations/procedures/create-tweet', () => ({
  createTweet: mocks.createTweet
}));

vi.mock('@giveaway/bluesky-api/create-skeet', () => ({
  createSkeet: mocks.createSkeet
}));

vi.mock('@/lib/discord/procedures/process-post-to-discord', () => ({
  processPostToDiscord: mocks.processPostToDiscord
}));

vi.mock('nanoid', () => ({ nanoid: mocks.nanoid }));

const NOW = new Date('2026-06-01T12:00:00.000Z');
const RUN_AT = new Date('2026-06-01T11:00:00.000Z');

const jobRow = (
  overrides: Partial<AutomatedPostJob> = {}
): AutomatedPostJob => ({
  id: 'job-1',
  sweepstakesId: 'sweep-1',
  type: 'POST_TO_TWITTER',
  status: 'PENDING',
  runAt: RUN_AT,
  createdAt: RUN_AT,
  updatedAt: RUN_AT,
  request: {
    integrationId: 'int-1',
    text: 'Win stuff',
    imageUrl: 'https://cdn.example.com/banner.png',
    tasks: ['REPOST', 'LIKE']
  },
  response: null,
  ...overrides
});

const twitterJob = (tasks: string[] = ['REPOST', 'LIKE']) =>
  jobRow({
    request: {
      integrationId: 'int-1',
      text: 'Win stuff',
      imageUrl: 'https://cdn.example.com/banner.png',
      tasks
    }
  });

const blueskyJob = (tasks: string[] = ['REPOST', 'LIKE']) =>
  jobRow({
    id: 'job-2',
    type: 'POST_TO_BLUESKY',
    request: { integrationId: 'bsky-int', text: 'Skeet text', tasks }
  });

const discordJob = () =>
  jobRow({
    id: 'job-3',
    type: 'POST_TO_DISCORD',
    request: { integrationId: 'guild-1', channelId: 'channel-1' }
  });

const sweepstakesRow = (teamId: string | null = 'team-1') => ({
  id: 'sweep-1',
  teamId,
  tasks: [{ id: 'task-a' }, { id: 'task-b' }]
});

const importJobs = { create: [{ runAt: NOW, data: { runs: 0 } }] };

const failedUpdate = (id: string, error: string) => ({
  where: { id },
  data: { status: 'FAILED', response: { error } }
});

describe('processAutomatedPostJobs', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mocks.createTweet.mockReset();
    mocks.createSkeet.mockReset();
    mocks.processPostToDiscord.mockReset();
    mocks.nanoid.mockReset();
    let counter = 0;
    mocks.nanoid.mockImplementation(() => `nano-${++counter}`);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('when selecting jobs', () => {
    it('runs without a session and reports zero processed jobs', async () => {
      prismaMock.automatedPostJob.findMany.mockResolvedValue([]);

      const result = await processAutomatedPostJobs();

      expect(expectOk(result)).toEqual({ processed: 0 });
    });

    it('fetches at most five due pending jobs, oldest first', async () => {
      prismaMock.automatedPostJob.findMany.mockResolvedValue([]);

      await processAutomatedPostJobs();

      expect(prismaMock.automatedPostJob.findMany).toHaveBeenCalledWith({
        where: { runAt: { lte: NOW }, status: { in: ['PENDING'] } },
        orderBy: { createdAt: 'asc' },
        take: 5
      });
    });

    it('logs how many jobs were found', async () => {
      prismaMock.automatedPostJob.findMany.mockResolvedValue([]);

      await processAutomatedPostJobs();

      expect(console.info).toHaveBeenCalledWith(
        'Found 0 automated post jobs to process'
      );
    });

    it('also runs for a signed in caller', async () => {
      signIn();
      prismaMock.automatedPostJob.findMany.mockResolvedValue([]);

      const result = await processAutomatedPostJobs();

      expect(expectOk(result)).toEqual({ processed: 0 });
    });

    it('returns INTERNAL_SERVER_ERROR when loading jobs fails', async () => {
      prismaMock.automatedPostJob.findMany.mockRejectedValue(
        new Error('connection lost')
      );

      const result = await processAutomatedPostJobs();

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'connection lost'
      );
    });
  });

  describe('when posting to twitter', () => {
    beforeEach(() => {
      prismaMock.automatedPostJob.findMany.mockResolvedValue([twitterJob()]);
      prismaMock.sweepstakes.findUnique.mockResolvedValue(sweepstakesRow());
      prismaMock.integration.findFirst.mockResolvedValue({ label: 'acme' });
      mocks.createTweet.mockResolvedValue({
        data: { id: '987', text: 'Win stuff', edit_history_tweet_ids: [] }
      });
    });

    it('loads the sweepstakes tasks and team', async () => {
      await processAutomatedPostJobs();

      expect(prismaMock.sweepstakes.findUnique).toHaveBeenCalledWith({
        where: { id: 'sweep-1' },
        select: { id: true, tasks: true, teamId: true }
      });
    });

    it('requires an active twitter integration on the sweepstakes team', async () => {
      await processAutomatedPostJobs();

      expect(prismaMock.integration.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'int-1',
          teamId: 'team-1',
          provider: 'TWITTER',
          status: 'ACTIVE'
        },
        select: { label: true }
      });
    });

    it('creates the tweet with the job text and image', async () => {
      await processAutomatedPostJobs();

      expect(mocks.createTweet).toHaveBeenCalledWith(prismaMock, {
        teamId: 'team-1',
        integrationId: 'int-1',
        text: 'Win stuff',
        imageUrl: 'https://cdn.example.com/banner.png'
      });
    });

    it('appends repost and like import tasks after the existing tasks', async () => {
      await processAutomatedPostJobs();

      expect(prismaMock.sweepstakes.update).toHaveBeenCalledWith({
        where: { id: 'sweep-1' },
        data: {
          tasks: {
            create: [
              {
                id: 'nano-1',
                index: 2,
                config: {
                  type: 'TWITTER_RETWEET_IMPORT',
                  title: 'Repost our sweepstakes',
                  tweetId: 'https://x.com/acme/status/987',
                  value: 1,
                  mandatory: false,
                  tasksRequired: 0,
                  importingAccount: 'int-1'
                },
                jobs: importJobs
              },
              {
                id: 'nano-2',
                index: 3,
                config: {
                  type: 'TWITTER_LIKE_IMPORT',
                  title: 'Like our post',
                  tweetId: 'https://x.com/acme/status/987',
                  value: 1,
                  mandatory: false,
                  tasksRequired: 0,
                  importingAccount: 'int-1'
                },
                jobs: importJobs
              }
            ]
          }
        }
      });
    });

    it('marks the job completed with the tweet id and url', async () => {
      const result = await processAutomatedPostJobs();

      expect(expectOk(result)).toEqual({ processed: 1 });
      expect(prismaMock.automatedPostJob.update).toHaveBeenCalledTimes(1);
      expect(prismaMock.automatedPostJob.update).toHaveBeenCalledWith({
        where: { id: 'job-1' },
        data: {
          status: 'COMPLETED',
          response: {
            tweetId: '987',
            tweetUrl: 'https://x.com/acme/status/987'
          }
        }
      });
    });

    it('adds only a like import task when only LIKE is requested', async () => {
      prismaMock.automatedPostJob.findMany.mockResolvedValue([
        twitterJob(['LIKE'])
      ]);

      await processAutomatedPostJobs();

      const call = prismaMock.sweepstakes.update.mock.calls[0][0];
      expect(call.data.tasks.create).toEqual([
        expect.objectContaining({
          id: 'nano-1',
          index: 2,
          config: expect.objectContaining({ type: 'TWITTER_LIKE_IMPORT' })
        })
      ]);
    });

    it('adds only a repost import task when only REPOST is requested', async () => {
      prismaMock.automatedPostJob.findMany.mockResolvedValue([
        twitterJob(['REPOST'])
      ]);

      await processAutomatedPostJobs();

      const call = prismaMock.sweepstakes.update.mock.calls[0][0];
      expect(call.data.tasks.create).toEqual([
        expect.objectContaining({
          index: 2,
          config: expect.objectContaining({ type: 'TWITTER_RETWEET_IMPORT' })
        })
      ]);
    });

    it('still updates the sweepstakes with no tasks when none are requested', async () => {
      prismaMock.automatedPostJob.findMany.mockResolvedValue([twitterJob([])]);

      await processAutomatedPostJobs();

      expect(prismaMock.sweepstakes.update).toHaveBeenCalledWith({
        where: { id: 'sweep-1' },
        data: { tasks: { create: [] } }
      });
      expect(mocks.nanoid).not.toHaveBeenCalled();
    });

    it('marks the job failed twice when the sweepstakes is missing', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(null);

      const result = await processAutomatedPostJobs();

      expect(expectOk(result)).toEqual({ processed: 1 });
      expect(prismaMock.automatedPostJob.update.mock.calls).toEqual([
        [failedUpdate('job-1', 'Sweepstakes not found')],
        [failedUpdate('job-1', 'Sweepstakes not found')]
      ]);
      expect(mocks.createTweet).not.toHaveBeenCalled();
    });

    it('marks the job failed when the sweepstakes has no team', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(sweepstakesRow(null));

      await processAutomatedPostJobs();

      expect(prismaMock.automatedPostJob.update).toHaveBeenLastCalledWith(
        failedUpdate('job-1', 'Sweepstakes team not found')
      );
      expect(prismaMock.integration.findFirst).not.toHaveBeenCalled();
    });

    it('marks the job failed when the twitter integration is missing', async () => {
      prismaMock.integration.findFirst.mockResolvedValue(null);

      await processAutomatedPostJobs();

      expect(prismaMock.automatedPostJob.update).toHaveBeenLastCalledWith(
        failedUpdate('job-1', 'Twitter integration not found')
      );
      expect(mocks.createTweet).not.toHaveBeenCalled();
    });

    it('overwrites a plain error message with a generic one in the final update', async () => {
      mocks.createTweet.mockRejectedValue(new Error('rate limited'));

      await processAutomatedPostJobs();

      expect(prismaMock.automatedPostJob.update.mock.calls).toEqual([
        [failedUpdate('job-1', 'rate limited')],
        [failedUpdate('job-1', 'An unknown error occurred...')]
      ]);
      expect(prismaMock.sweepstakes.update).not.toHaveBeenCalled();
    });

    it('records an unknown error message when a non-error value is thrown', async () => {
      mocks.createTweet.mockRejectedValue('boom');

      await processAutomatedPostJobs();

      expect(prismaMock.automatedPostJob.update).toHaveBeenNthCalledWith(
        1,
        failedUpdate('job-1', 'Unknown error occurred')
      );
    });

    it('logs the failure with the job id', async () => {
      const error = new ApplicationError({ code: 'NOT_FOUND', message: 'x' });
      mocks.createTweet.mockRejectedValue(error);

      await processAutomatedPostJobs();

      expect(console.error).toHaveBeenCalledWith(
        'Failed to process automated post job job-1',
        error
      );
    });
  });

  describe('when posting to bluesky', () => {
    beforeEach(() => {
      prismaMock.automatedPostJob.findMany.mockResolvedValue([blueskyJob()]);
      prismaMock.sweepstakes.findUnique.mockResolvedValue(sweepstakesRow());
      prismaMock.integration.findFirst.mockResolvedValue({
        label: 'acme.bsky.social',
        account_id: 'did:plc:abc123'
      });
      mocks.createSkeet.mockResolvedValue({
        uri: 'at://did:plc:abc123/app.bsky.feed.post/3kpost',
        cid: 'cid-1'
      });
    });

    it('loads the sweepstakes of the bluesky job', async () => {
      await processAutomatedPostJobs();

      expect(prismaMock.sweepstakes.findUnique).toHaveBeenCalledWith({
        where: { id: 'sweep-1' },
        select: { id: true, tasks: true, teamId: true }
      });
    });

    it('requires an active bluesky integration and selects its account id', async () => {
      await processAutomatedPostJobs();

      expect(prismaMock.integration.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'bsky-int',
          teamId: 'team-1',
          provider: 'BLUESKY',
          status: 'ACTIVE'
        },
        select: { label: true, account_id: true }
      });
    });

    it('creates the skeet for the team without passing the integration id', async () => {
      await processAutomatedPostJobs();

      expect(mocks.createSkeet).toHaveBeenCalledWith(prismaMock, {
        teamId: 'team-1',
        text: 'Skeet text',
        imageUrl: undefined
      });
    });

    it('passes the job image url to the skeet', async () => {
      prismaMock.automatedPostJob.findMany.mockResolvedValue([
        jobRow({
          id: 'job-2',
          type: 'POST_TO_BLUESKY',
          request: {
            integrationId: 'bsky-int',
            text: 'Skeet text',
            imageUrl: 'https://cdn.example.com/skeet.png',
            tasks: []
          }
        })
      ]);

      await processAutomatedPostJobs();

      expect(mocks.createSkeet).toHaveBeenCalledWith(prismaMock, {
        teamId: 'team-1',
        text: 'Skeet text',
        imageUrl: 'https://cdn.example.com/skeet.png'
      });
    });

    it('appends repost and like import tasks pointing to the new post', async () => {
      await processAutomatedPostJobs();

      const postUrl = 'https://bsky.app/profile/did:plc:abc123/post/3kpost';
      expect(prismaMock.sweepstakes.update).toHaveBeenCalledWith({
        where: { id: 'sweep-1' },
        data: {
          tasks: {
            create: [
              {
                id: 'nano-1',
                index: 2,
                config: {
                  type: 'BLUESKY_REPOST_IMPORT',
                  title: 'Repost on Bluesky',
                  postUrl,
                  value: 1,
                  mandatory: false,
                  tasksRequired: 0,
                  importingAccount: 'bsky-int'
                },
                jobs: importJobs
              },
              {
                id: 'nano-2',
                index: 3,
                config: {
                  type: 'BLUESKY_LIKE_IMPORT',
                  title: 'Like our Bluesky post',
                  postUrl,
                  value: 1,
                  mandatory: false,
                  tasksRequired: 0,
                  importingAccount: 'bsky-int'
                },
                jobs: importJobs
              }
            ]
          }
        }
      });
    });

    it('marks the job completed with the post uri and url', async () => {
      const result = await processAutomatedPostJobs();

      expect(expectOk(result)).toEqual({ processed: 1 });
      expect(prismaMock.automatedPostJob.update).toHaveBeenCalledWith({
        where: { id: 'job-2' },
        data: {
          status: 'COMPLETED',
          response: {
            postUri: 'at://did:plc:abc123/app.bsky.feed.post/3kpost',
            postUrl: 'https://bsky.app/profile/did:plc:abc123/post/3kpost'
          }
        }
      });
    });

    it('adds only a like import task when only LIKE is requested', async () => {
      prismaMock.automatedPostJob.findMany.mockResolvedValue([
        blueskyJob(['LIKE'])
      ]);

      await processAutomatedPostJobs();

      const call = prismaMock.sweepstakes.update.mock.calls[0][0];
      expect(call.data.tasks.create).toEqual([
        expect.objectContaining({
          index: 2,
          config: expect.objectContaining({ type: 'BLUESKY_LIKE_IMPORT' })
        })
      ]);
    });

    it('adds only a repost import task when only REPOST is requested', async () => {
      prismaMock.automatedPostJob.findMany.mockResolvedValue([
        blueskyJob(['REPOST'])
      ]);

      await processAutomatedPostJobs();

      const call = prismaMock.sweepstakes.update.mock.calls[0][0];
      expect(call.data.tasks.create).toEqual([
        expect.objectContaining({
          id: 'nano-1',
          index: 2,
          config: expect.objectContaining({ type: 'BLUESKY_REPOST_IMPORT' })
        })
      ]);
    });

    it('adds no tasks when none are requested', async () => {
      prismaMock.automatedPostJob.findMany.mockResolvedValue([blueskyJob([])]);

      await processAutomatedPostJobs();

      expect(prismaMock.sweepstakes.update).toHaveBeenCalledWith({
        where: { id: 'sweep-1' },
        data: { tasks: { create: [] } }
      });
    });

    it('marks the job failed when the sweepstakes is missing', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(null);

      await processAutomatedPostJobs();

      expect(prismaMock.automatedPostJob.update.mock.calls).toEqual([
        [failedUpdate('job-2', 'Sweepstakes not found')],
        [failedUpdate('job-2', 'Sweepstakes not found')]
      ]);
    });

    it('marks the job failed when the sweepstakes has no team', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(sweepstakesRow(null));

      await processAutomatedPostJobs();

      expect(prismaMock.automatedPostJob.update).toHaveBeenLastCalledWith(
        failedUpdate('job-2', 'Sweepstakes team not found')
      );
    });

    it('marks the job failed when the bluesky integration is missing', async () => {
      prismaMock.integration.findFirst.mockResolvedValue(null);

      await processAutomatedPostJobs();

      expect(prismaMock.automatedPostJob.update).toHaveBeenLastCalledWith(
        failedUpdate('job-2', 'Bluesky integration not found')
      );
      expect(mocks.createSkeet).not.toHaveBeenCalled();
    });

    it('records an unknown error message when a non-error value is thrown', async () => {
      mocks.createSkeet.mockRejectedValue(42);

      await processAutomatedPostJobs();

      expect(prismaMock.automatedPostJob.update.mock.calls).toEqual([
        [failedUpdate('job-2', 'Unknown error occurred')],
        [failedUpdate('job-2', 'An unknown error occurred...')]
      ]);
    });
  });

  describe('when posting to discord', () => {
    beforeEach(() => {
      prismaMock.automatedPostJob.findMany.mockResolvedValue([discordJob()]);
    });

    it('delegates to the discord processor with the parsed job', async () => {
      mocks.processPostToDiscord.mockResolvedValue(undefined);

      const result = await processAutomatedPostJobs();

      expect(expectOk(result)).toEqual({ processed: 1 });
      expect(mocks.processPostToDiscord).toHaveBeenCalledWith({
        db: prismaMock,
        job: {
          id: 'job-3',
          sweepstakesId: 'sweep-1',
          type: 'POST_TO_DISCORD',
          status: 'PENDING',
          runAt: RUN_AT,
          createdAt: RUN_AT,
          updatedAt: RUN_AT,
          request: {
            integrationId: 'guild-1',
            channelId: 'channel-1',
            roles: [],
            tasks: []
          },
          response: null
        }
      });
      expect(prismaMock.automatedPostJob.update).not.toHaveBeenCalled();
    });

    it('marks the job failed with the application error message', async () => {
      mocks.processPostToDiscord.mockRejectedValue(
        new ApplicationError({ code: 'NOT_FOUND', message: 'Channel gone' })
      );

      await processAutomatedPostJobs();

      expect(prismaMock.automatedPostJob.update).toHaveBeenCalledWith(
        failedUpdate('job-3', 'Channel gone')
      );
    });
  });

  describe('when a stored job is malformed', () => {
    it('marks the job failed with the validation message', async () => {
      prismaMock.automatedPostJob.findMany.mockResolvedValue([
        jobRow({ id: 'bad-job', request: null })
      ]);

      const result = await processAutomatedPostJobs();

      expect(expectOk(result)).toEqual({ processed: 1 });
      const [call] = prismaMock.automatedPostJob.update.mock.calls;
      expect(call[0].where).toEqual({ id: 'bad-job' });
      expect(call[0].data.status).toBe('FAILED');
      expect(JSON.parse(call[0].data.response.error)).toEqual([
        expect.objectContaining({ path: ['request'], code: 'invalid_type' })
      ]);
    });
  });

  describe('when processing several jobs', () => {
    it('continues after a failing job and counts every job', async () => {
      prismaMock.automatedPostJob.findMany.mockResolvedValue([
        discordJob(),
        jobRow({ id: 'bad-job', request: null }),
        discordJob()
      ]);
      mocks.processPostToDiscord
        .mockRejectedValueOnce(
          new ApplicationError({ code: 'NOT_FOUND', message: 'first failed' })
        )
        .mockResolvedValueOnce(undefined);

      const result = await processAutomatedPostJobs();

      expect(expectOk(result)).toEqual({ processed: 3 });
      expect(mocks.processPostToDiscord).toHaveBeenCalledTimes(2);
      expect(prismaMock.automatedPostJob.update).toHaveBeenCalledTimes(2);
    });

    it('returns a failure when recording a job failure itself fails', async () => {
      prismaMock.automatedPostJob.findMany.mockResolvedValue([
        discordJob(),
        discordJob()
      ]);
      mocks.processPostToDiscord.mockRejectedValue(
        new ApplicationError({ code: 'NOT_FOUND', message: 'nope' })
      );
      prismaMock.automatedPostJob.update.mockRejectedValue(
        new Error('db down')
      );

      const result = await processAutomatedPostJobs();

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'db down'
      );
      expect(mocks.processPostToDiscord).toHaveBeenCalledTimes(1);
    });
  });
});
