import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { processPostToDiscord } from '../process-post-to-discord';
import { prismaMock, asPrismaClient } from '@giveaway/testing-server/prisma';
import { SWEEPSTAKES_DISCORD_POST_SELECT_QUERY } from '@giveaway/automation-model/db';
import type { PostToDiscordJobSchema } from '@giveaway/automation-model/schemas';
import {
  bonusTaskConfig,
  discordPostSweepstakes,
  jsonResponse,
  storedTask
} from '@giveaway/discord-model/testing/fixtures-discord-procedures-workflows';

const m = vi.hoisted(() => ({ nanoid: vi.fn() }));

vi.mock('nanoid', async (importOriginal) => ({
  ...(await importOriginal<typeof import('nanoid')>()),
  nanoid: m.nanoid
}));

const NOW = new Date('2026-06-01T00:00:00.000Z');

const MESSAGE_URL = 'https://discord.com/channels/guild-1/channel-1/msg-1';

const buildJob = (
  request: Partial<PostToDiscordJobSchema['request']> = {}
): PostToDiscordJobSchema => ({
  id: 'job-1',
  sweepstakesId: 'sweep-1',
  runAt: NOW,
  type: 'POST_TO_DISCORD',
  status: 'PENDING',
  createdAt: NOW,
  updatedAt: NOW,
  response: null,
  request: {
    integrationId: 'integration-1',
    channelId: 'channel-1',
    roles: ['role-1'],
    tasks: [],
    ...request
  }
});

const run = (job: PostToDiscordJobSchema = buildJob()) =>
  processPostToDiscord({ db: asPrismaClient(), job });

const parsedFetchBody = (fetchMock: ReturnType<typeof vi.fn>) => {
  const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
  return JSON.parse(init.body as string);
};

describe('processPostToDiscord', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('DISCORD_BOT_TOKEN', 'bot-token');
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    fetchMock.mockReset();
    m.nanoid.mockReset();
    m.nanoid.mockReturnValue('task-abc');
    prismaMock.sweepstakes.findUnique.mockResolvedValue(
      discordPostSweepstakes({
        tasks: [
          storedTask('t-1', bonusTaskConfig),
          storedTask('t-2', bonusTaskConfig)
        ]
      })
    );
    prismaMock.integration.findFirst.mockResolvedValue({
      label: 'Acme Server',
      account_id: 'guild-1'
    });
    prismaMock.sweepstakesParticipant.count.mockResolvedValue(3);
    prismaMock.taskCompletion.count.mockResolvedValue(7);
    fetchMock.mockResolvedValue(
      jsonResponse({ id: 'msg-1', channel_id: 'channel-1' })
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe('when the post succeeds without an interaction task', () => {
    it('loads the sweepstakes with the discord post selection', async () => {
      await run();

      expect(prismaMock.sweepstakes.findUnique).toHaveBeenCalledWith({
        where: { id: 'sweep-1' },
        select: SWEEPSTAKES_DISCORD_POST_SELECT_QUERY
      });
    });

    it('loads the active discord integration of the sweepstakes team', async () => {
      await run();

      expect(prismaMock.integration.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'integration-1',
          teamId: 'team-1',
          provider: 'DISCORD',
          status: 'ACTIVE'
        },
        select: { label: true, account_id: true }
      });
    });

    it('posts the message to the requested channel with the bot token', async () => {
      await run();

      expect(fetchMock).toHaveBeenCalledWith(
        'https://discord.com/api/v10/channels/channel-1/messages',
        expect.objectContaining({
          method: 'POST',
          headers: {
            Authorization: 'Bot bot-token',
            'Content-Type': 'application/json'
          }
        })
      );
    });

    it('attaches only a view details link button', async () => {
      await run();

      expect(parsedFetchBody(fetchMock).components).toEqual([
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 5,
              label: 'View Details',
              url: 'https://giveaway.dog/browse/cool-giveaway'
            }
          ]
        }
      ]);
    });

    it('builds the embed using the job roles as eligible roles', async () => {
      await run();

      const [embed] = parsedFetchBody(fetchMock).embeds;
      expect(embed).toEqual(
        expect.objectContaining({
          title: 'New Giveaway!',
          timestamp: NOW.toISOString()
        })
      );
      expect(embed.description).toContain('**Eligible Roles:** <@&role-1>');
      expect(embed.description).toContain('**Participants:** 3');
      expect(embed.description).toContain('**Entries:** 7');
    });

    it('does not generate a task id or create a task', async () => {
      await run();

      expect(m.nanoid).not.toHaveBeenCalled();
      expect(prismaMock.sweepstakes.update).not.toHaveBeenCalled();
    });

    it('saves the message location right after the post, then marks the job as completed', async () => {
      await run();

      const response = {
        channelId: 'channel-1',
        messageId: 'msg-1',
        messageUrl: MESSAGE_URL
      };
      expect(prismaMock.automatedPostJob.update.mock.calls).toEqual([
        [{ where: { id: 'job-1' }, data: { response } }],
        [{ where: { id: 'job-1' }, data: { status: 'COMPLETED', response } }]
      ]);
    });

    it('resolves to undefined', async () => {
      await expect(run()).resolves.toBeUndefined();
    });

    it('logs the posted message id and the job id', async () => {
      await run();

      expect(console.info).toHaveBeenCalledWith(
        '[processPostToDiscord] Successfully posted message msg-1 for job job-1'
      );
    });
  });

  describe('when the job requests an interaction task', () => {
    const interactionJob = () => buildJob({ tasks: ['INTERACTION'] });

    it('adds a join button that carries the generated task id', async () => {
      await run(interactionJob());

      expect(parsedFetchBody(fetchMock).components).toEqual([
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 3,
              label: 'Join Giveaway',
              custom_id: 'task:enter:task-abc'
            },
            {
              type: 2,
              style: 5,
              label: 'Bonus Entries',
              url: 'https://giveaway.dog/browse/cool-giveaway'
            }
          ]
        }
      ]);
    });

    it('creates a discord interaction task appended after the existing tasks', async () => {
      await run(interactionJob());

      expect(m.nanoid).toHaveBeenCalledTimes(1);
      expect(prismaMock.sweepstakes.update).toHaveBeenCalledWith({
        where: { id: 'sweep-1' },
        data: {
          tasks: {
            create: {
              id: 'task-abc',
              index: 2,
              config: {
                type: 'DISCORD_INTERACTION_IMPORT',
                title: 'Interact on Discord',
                importingAccount: 'integration-1',
                roles: ['role-1'],
                link: MESSAGE_URL,
                value: 1,
                mandatory: false,
                tasksRequired: 0
              },
              jobs: { create: [] }
            }
          }
        }
      });
    });

    it('saves the task id with the message before it creates the task', async () => {
      await run(interactionJob());

      const [taskOrder] =
        prismaMock.sweepstakes.update.mock.invocationCallOrder;
      const [savedOrder, completedOrder] =
        prismaMock.automatedPostJob.update.mock.invocationCallOrder;
      expect(savedOrder).toBeLessThan(taskOrder);
      expect(taskOrder).toBeLessThan(completedOrder);
      expect(prismaMock.automatedPostJob.update).toHaveBeenNthCalledWith(1, {
        where: { id: 'job-1' },
        data: {
          response: {
            channelId: 'channel-1',
            messageId: 'msg-1',
            messageUrl: MESSAGE_URL,
            taskId: 'task-abc'
          }
        }
      });
    });

    it('creates the task and completes the job in one transaction', async () => {
      await run(interactionJob());

      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
      expect(prismaMock.$transaction.mock.invocationCallOrder[0]).toBeLessThan(
        prismaMock.sweepstakes.update.mock.invocationCallOrder[0]
      );
    });

    it('does not post again when the job already holds its message', async () => {
      const response = {
        channelId: 'channel-1',
        messageId: 'msg-old',
        messageUrl: 'https://discord.com/channels/guild-1/channel-1/msg-old',
        taskId: 'task-old',
        error: 'Write failed'
      };

      await run({ ...interactionJob(), response });

      expect(fetchMock).not.toHaveBeenCalled();
      expect(m.nanoid).not.toHaveBeenCalled();
      expect(prismaMock.integration.findFirst).not.toHaveBeenCalled();
      expect(prismaMock.sweepstakes.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            tasks: {
              create: expect.objectContaining({
                id: 'task-old',
                config: expect.objectContaining({ link: response.messageUrl })
              })
            }
          }
        })
      );
      expect(prismaMock.automatedPostJob.update.mock.calls).toEqual([
        [
          {
            where: { id: 'job-1' },
            data: {
              status: 'COMPLETED',
              response: {
                channelId: 'channel-1',
                messageId: 'msg-old',
                messageUrl: response.messageUrl,
                taskId: 'task-old'
              }
            }
          }
        ]
      ]);
    });

    it('creates the task on the id of the loaded sweepstakes record', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        discordPostSweepstakes({ id: 'sweep-from-db' })
      );

      await run(interactionJob());

      expect(prismaMock.sweepstakes.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'sweep-from-db' } })
      );
    });

    it('uses index zero when the sweepstakes has no tasks yet', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        discordPostSweepstakes({ tasks: [] })
      );

      await run(interactionJob());

      expect(prismaMock.sweepstakes.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            tasks: { create: expect.objectContaining({ index: 0 }) }
          }
        })
      );
    });
  });

  describe('when a lookup fails', () => {
    it('rethrows without a write to the job when the sweepstakes does not exist', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(null);

      await expect(run()).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'Sweepstakes not found'
      });
      expect(prismaMock.automatedPostJob.update).not.toHaveBeenCalled();
      expect(prismaMock.integration.findFirst).not.toHaveBeenCalled();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('rethrows when the sweepstakes has no team', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        discordPostSweepstakes({ teamId: null })
      );

      await expect(run()).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'Sweepstakes team not found'
      });
      expect(prismaMock.automatedPostJob.update).not.toHaveBeenCalled();
      expect(prismaMock.integration.findFirst).not.toHaveBeenCalled();
    });

    it('rethrows when the integration is not found', async () => {
      prismaMock.integration.findFirst.mockResolvedValue(null);

      await expect(run()).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'Discord integration not found'
      });
      expect(prismaMock.automatedPostJob.update).not.toHaveBeenCalled();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('rethrows when the integration has no guild id', async () => {
      prismaMock.integration.findFirst.mockResolvedValue({
        label: 'Acme Server',
        account_id: null
      });

      await expect(run()).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'Discord guild ID not found'
      });
      expect(prismaMock.automatedPostJob.update).not.toHaveBeenCalled();
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('when posting to discord fails', () => {
    it('rethrows the discord error without a write to the job', async () => {
      fetchMock.mockResolvedValue(jsonResponse({}, { status: 403 }));

      await expect(run()).rejects.toMatchObject({
        code: 'FORBIDDEN',
        message:
          'Bot does not have permission to send messages in this channel. Please check bot permissions.'
      });
      expect(prismaMock.automatedPostJob.update).not.toHaveBeenCalled();
    });

    it('rethrows when the bot token is not configured', async () => {
      vi.stubEnv('DISCORD_BOT_TOKEN', undefined);

      await expect(run()).rejects.toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Discord bot token is not configured'
      });
      expect(fetchMock).not.toHaveBeenCalled();
      expect(prismaMock.automatedPostJob.update).not.toHaveBeenCalled();
    });

    it('does not create the interaction task when the post fails', async () => {
      fetchMock.mockResolvedValue(jsonResponse({}, { status: 404 }));

      await expect(
        run(buildJob({ tasks: ['INTERACTION'] }))
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
      expect(prismaMock.sweepstakes.update).not.toHaveBeenCalled();
    });

    it('does not log a success message when the post fails', async () => {
      fetchMock.mockResolvedValue(jsonResponse({}, { status: 403 }));

      await expect(run()).rejects.toMatchObject({ code: 'FORBIDDEN' });
      expect(console.info).not.toHaveBeenCalledWith(
        expect.stringContaining('Successfully posted message')
      );
    });
  });

  describe('when a later write fails', () => {
    it('keeps the posted message saved when the task cannot be created', async () => {
      prismaMock.sweepstakes.update.mockRejectedValue(
        new Error('task create failed')
      );

      await expect(run(buildJob({ tasks: ['INTERACTION'] }))).rejects.toThrow(
        'task create failed'
      );
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(prismaMock.automatedPostJob.update.mock.calls).toEqual([
        [
          {
            where: { id: 'job-1' },
            data: {
              response: {
                channelId: 'channel-1',
                messageId: 'msg-1',
                messageUrl: MESSAGE_URL,
                taskId: 'task-abc'
              }
            }
          }
        ]
      ]);
    });

    it('rethrows when marking the job completed fails', async () => {
      prismaMock.automatedPostJob.update
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(new Error('completion write failed'));

      await expect(run()).rejects.toThrow('completion write failed');
      expect(prismaMock.automatedPostJob.update).toHaveBeenCalledTimes(2);
    });
  });

  describe('when a non-error value is thrown', () => {
    it('rethrows the original value without a write to the job', async () => {
      prismaMock.sweepstakes.findUnique.mockRejectedValue('kaboom');

      await expect(run()).rejects.toBe('kaboom');
      expect(prismaMock.automatedPostJob.update).not.toHaveBeenCalled();
    });
  });
});
