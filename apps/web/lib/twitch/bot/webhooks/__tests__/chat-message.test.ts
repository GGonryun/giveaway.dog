import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ZodError } from 'zod';
import { processChatMessage } from '../chat-message';
import { sendChatMessage } from '@/lib/twitch/api/send-chat-message';
import { ApplicationError } from '@/lib/errors';
import { prismaMock, knownRequestError } from '@/test/prisma';
import { chatMessageEvent } from '@/lib/twitch/__tests__/fixtures-twitch';

vi.hoisted(() => {
  vi.stubEnv('TWITCH_BOT_USER_ID', 'bot-1');
});

const redisMock = vi.hoisted(() => {
  const store = new Map<string, unknown>();
  return {
    store,
    get: vi.fn(async (key: string) => (store.has(key) ? store.get(key) : null)),
    set: vi.fn(async (key: string, value: unknown) => {
      store.set(key, value);
      return 'OK';
    }),
    del: vi.fn(async (key: string) => (store.delete(key) ? 1 : 0))
  };
});

const ratelimitMock = vi.hoisted(() => ({
  configs: [] as unknown[],
  limit: vi.fn()
}));

vi.mock('@/lib/redis', () => ({ redis: redisMock }));

vi.mock('@upstash/ratelimit', () => {
  class Ratelimit {
    static fixedWindow = (tokens: number, window: string) => ({
      algorithm: 'fixedWindow',
      tokens,
      window
    });
    static slidingWindow = (tokens: number, window: string) => ({
      algorithm: 'slidingWindow',
      tokens,
      window
    });
    limit = ratelimitMock.limit;
    constructor(config: unknown) {
      ratelimitMock.configs.push(config);
    }
  }
  return { Ratelimit };
});

vi.mock('@/lib/twitch/api/send-chat-message', () => ({
  sendChatMessage: vi.fn()
}));

const sendChatMessageMock = vi.mocked(sendChatMessage);

const NOW = new Date('2026-10-01T12:00:00.000Z');
const TASK_KEY = 'twitch:task:broadcaster-1:!enter';
const USER_KEY = 'twitch:user:chatter-1';
const TASK_TTL = { ex: 1800 };
const USER_TTL = { ex: 259200 };

const chatTaskConfig = (overrides: Record<string, unknown> = {}) => ({
  type: 'TWITCH_CHAT_IMPORT',
  title: 'Type !enter in chat',
  value: 1,
  mandatory: false,
  tasksRequired: 0,
  importingAccount: 'integration-1',
  channelUrl: 'https://twitch.tv/streamer',
  trigger: '!enter',
  rateLimit: null,
  ...overrides
});

const bonusTaskConfig = {
  type: 'BONUS_TASK',
  title: 'Bonus',
  value: 1,
  mandatory: false,
  tasksRequired: 0
};

const taskRecord = ({
  id = 'task-1',
  config = chatTaskConfig() as unknown,
  timing = null as { endDate: string | null } | null
} = {}) => ({
  id,
  sweepstakesId: 'sweepstakes-1',
  index: 0,
  config,
  sweepstakes: {
    id: 'sweepstakes-1',
    teamId: 'team-1',
    status: 'ACTIVE',
    timing
  }
});

const event = (text = '!enter', overrides: Record<string, unknown> = {}) =>
  chatMessageEvent({ message: { text, fragments: [] }, ...overrides });

const sentMessages = () =>
  sendChatMessageMock.mock.calls.map(([broadcaster, message]) => [
    broadcaster,
    message
  ]);

describe('processChatMessage', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    redisMock.store.clear();
    redisMock.get.mockClear();
    redisMock.set.mockClear();
    redisMock.del.mockClear();
    ratelimitMock.configs.length = 0;
    ratelimitMock.limit.mockReset().mockResolvedValue({ success: true });
    sendChatMessageMock.mockReset().mockResolvedValue(undefined);
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    prismaMock.integration.findFirst.mockResolvedValue({ teamId: 'team-1' });
    prismaMock.task.findMany.mockResolvedValue([taskRecord()]);
    prismaMock.user.findFirst.mockResolvedValue({
      id: 'user-9',
      name: 'Viewer',
      email: null
    });
    prismaMock.taskCompletion.findFirst.mockResolvedValue(null);
    prismaMock.taskCompletion.create.mockResolvedValue({ id: 'completion-1' });
    prismaMock.userScoringRequest.upsert.mockResolvedValue({});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('when the event is invalid', () => {
    it('throws a ZodError without touching the cache', async () => {
      await expect(processChatMessage({ message: {} })).rejects.toThrow(
        ZodError
      );
      expect(redisMock.get).not.toHaveBeenCalled();
    });
  });

  describe('when the event is valid', () => {
    it('logs the parsed event without unknown keys', async () => {
      await processChatMessage(event('hello there', { extra: 'dropped' }));

      expect(console.info).toHaveBeenCalledWith(
        'Processing Twitch chat message event:',
        chatMessageEvent({ message: { text: 'hello there', fragments: [] } })
      );
    });
  });

  describe('when the message comes from the bot', () => {
    it('ignores the message', async () => {
      await processChatMessage(event('!enter', { chatter_user_id: 'bot-1' }));

      expect(redisMock.get).not.toHaveBeenCalled();
      expect(prismaMock.integration.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('trigger extraction', () => {
    it('ignores a message without a command', async () => {
      await processChatMessage(event('hello there'));

      expect(redisMock.get).not.toHaveBeenCalled();
    });

    it('ignores a blank message', async () => {
      await processChatMessage(event('   '));

      expect(redisMock.get).not.toHaveBeenCalled();
    });

    it('ignores an exclamation mark inside a word', async () => {
      await processChatMessage(event('hey!enter'));

      expect(redisMock.get).not.toHaveBeenCalled();
    });

    it('uses the first command anywhere in the message', async () => {
      await processChatMessage(event('  hey   !enter !other'));

      expect(redisMock.get).toHaveBeenCalledWith(TASK_KEY);
    });

    it('splits words on any whitespace', async () => {
      await processChatMessage(event('hey\t!enter'));

      expect(redisMock.get).toHaveBeenCalledWith(TASK_KEY);
    });

    it('lowercases the command in the task cache key', async () => {
      await processChatMessage(event('!ENTER'));

      expect(redisMock.get).toHaveBeenCalledWith(TASK_KEY);
    });
  });

  describe('task lookup from the cache', () => {
    it('stops when the cache records that no task matches', async () => {
      redisMock.store.set(TASK_KEY, false);

      await processChatMessage(event());

      expect(prismaMock.integration.findFirst).not.toHaveBeenCalled();
      expect(prismaMock.user.findFirst).not.toHaveBeenCalled();
      expect(sendChatMessageMock).not.toHaveBeenCalled();
    });

    it('uses a cached task without querying the database for tasks', async () => {
      redisMock.store.set(TASK_KEY, taskRecord({ id: 'cached-task' }));

      await processChatMessage(event());

      expect(prismaMock.integration.findFirst).not.toHaveBeenCalled();
      expect(prismaMock.task.findMany).not.toHaveBeenCalled();
      expect(prismaMock.taskCompletion.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            task: { connect: { id: 'cached-task' } }
          })
        })
      );
    });

    it('does not re-check the end date of a cached task', async () => {
      redisMock.store.set(
        TASK_KEY,
        taskRecord({ timing: { endDate: '2026-09-01T00:00:00.000Z' } })
      );

      await processChatMessage(event());

      expect(prismaMock.taskCompletion.create).toHaveBeenCalled();
    });

    it('stops when the cached task is not a twitch chat task', async () => {
      redisMock.store.set(TASK_KEY, taskRecord({ config: bonusTaskConfig }));

      await processChatMessage(event());

      expect(prismaMock.user.findFirst).not.toHaveBeenCalled();
      expect(sendChatMessageMock).not.toHaveBeenCalled();
    });

    it('throws when the cached task config cannot be parsed', async () => {
      redisMock.store.set(TASK_KEY, taskRecord({ config: { type: 'NOPE' } }));

      const error = await processChatMessage(event()).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error).toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to parse task config'
      });
    });
  });

  describe('task lookup from the database', () => {
    it('looks up the active twitch integration for the broadcaster', async () => {
      await processChatMessage(event());

      expect(prismaMock.integration.findFirst).toHaveBeenCalledWith({
        where: {
          provider: 'TWITCH',
          account_id: 'broadcaster-1',
          status: 'ACTIVE'
        },
        select: { teamId: true }
      });
    });

    it.each([
      ['no integration exists', null],
      ['the integration has no team', { teamId: null }]
    ])('caches a miss when %s', async (_, integration) => {
      prismaMock.integration.findFirst.mockResolvedValue(integration);

      await processChatMessage(event());

      expect(prismaMock.task.findMany).not.toHaveBeenCalled();
      expect(redisMock.set).toHaveBeenCalledWith(TASK_KEY, false, TASK_TTL);
      expect(console.info).toHaveBeenCalledWith(
        '[Twitch] No active integration found for broadcaster broadcaster-1'
      );
    });

    it('queries the tasks of active sweepstakes for the team', async () => {
      await processChatMessage(event());

      expect(prismaMock.task.findMany).toHaveBeenCalledWith({
        where: { sweepstakes: { teamId: 'team-1', status: 'ACTIVE' } },
        include: { sweepstakes: { include: { timing: true } } }
      });
    });

    it('caches a miss when the team has no active tasks', async () => {
      prismaMock.task.findMany.mockResolvedValue([]);

      await processChatMessage(event());

      expect(redisMock.set).toHaveBeenCalledWith(TASK_KEY, false, TASK_TTL);
      expect(prismaMock.user.findFirst).not.toHaveBeenCalled();
    });

    it('does not report a missing trigger when the team has no active tasks', async () => {
      prismaMock.task.findMany.mockResolvedValue([]);

      await processChatMessage(event());

      expect(console.info).not.toHaveBeenCalledWith(
        '[Twitch] No valid task found for trigger: !enter'
      );
    });

    it('caches the matching task', async () => {
      const task = taskRecord();
      prismaMock.task.findMany.mockResolvedValue([task]);

      await processChatMessage(event());

      expect(redisMock.set).toHaveBeenCalledWith(TASK_KEY, task, TASK_TTL);
    });

    it('skips tasks that are not twitch chat tasks', async () => {
      prismaMock.task.findMany.mockResolvedValue([
        taskRecord({ id: 'bonus-task', config: bonusTaskConfig }),
        taskRecord({ id: 'chat-task' })
      ]);

      await processChatMessage(event());

      expect(prismaMock.taskCompletion.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            task: { connect: { id: 'chat-task' } }
          })
        })
      );
    });

    it('skips tasks that are not twitch chat tasks without a parse warning', async () => {
      prismaMock.task.findMany.mockResolvedValue([
        taskRecord({ id: 'bonus-task', config: bonusTaskConfig }),
        taskRecord({ id: 'chat-task' })
      ]);

      await processChatMessage(event());

      expect(console.warn).not.toHaveBeenCalled();
    });

    it('skips tasks with a different trigger and caches a miss', async () => {
      prismaMock.task.findMany.mockResolvedValue([
        taskRecord({ config: chatTaskConfig({ trigger: '!join' }) })
      ]);

      await processChatMessage(event());

      expect(redisMock.set).toHaveBeenCalledWith(TASK_KEY, false, TASK_TTL);
      expect(console.info).toHaveBeenCalledWith(
        '[Twitch] No valid task found for trigger: !enter'
      );
      expect(prismaMock.user.findFirst).not.toHaveBeenCalled();
    });

    it('matches the trigger regardless of case', async () => {
      prismaMock.task.findMany.mockResolvedValue([
        taskRecord({ config: chatTaskConfig({ trigger: '!Enter' }) })
      ]);

      await processChatMessage(event('!eNTER'));

      expect(prismaMock.taskCompletion.create).toHaveBeenCalled();
    });

    it('skips tasks whose sweepstakes has ended', async () => {
      prismaMock.task.findMany.mockResolvedValue([
        taskRecord({ timing: { endDate: '2026-10-01T11:59:59.999Z' } })
      ]);

      await processChatMessage(event());

      expect(prismaMock.taskCompletion.create).not.toHaveBeenCalled();
      expect(console.info).toHaveBeenCalledWith(
        '[Twitch] Task task-1 has expired (end date: 2026-10-01T11:59:59.999Z)'
      );
    });

    it('uses a later matching task when an earlier one has ended', async () => {
      prismaMock.task.findMany.mockResolvedValue([
        taskRecord({
          id: 'ended-task',
          timing: { endDate: '2026-09-30T00:00:00.000Z' }
        }),
        taskRecord({ id: 'open-task' })
      ]);

      await processChatMessage(event());

      expect(prismaMock.taskCompletion.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            task: { connect: { id: 'open-task' } }
          })
        })
      );
    });

    it('accepts a task whose sweepstakes ends exactly now', async () => {
      prismaMock.task.findMany.mockResolvedValue([
        taskRecord({ timing: { endDate: NOW.toISOString() } })
      ]);

      await processChatMessage(event());

      expect(prismaMock.taskCompletion.create).toHaveBeenCalled();
    });

    it('accepts a task whose sweepstakes has no end date', async () => {
      prismaMock.task.findMany.mockResolvedValue([
        taskRecord({ timing: { endDate: null } })
      ]);

      await processChatMessage(event());

      expect(prismaMock.taskCompletion.create).toHaveBeenCalled();
    });

    it('skips tasks whose config cannot be parsed', async () => {
      prismaMock.task.findMany.mockResolvedValue([
        taskRecord({
          id: 'broken-task',
          config: { type: 'TWITCH_CHAT_IMPORT' }
        }),
        taskRecord({ id: 'chat-task' })
      ]);

      await processChatMessage(event());

      expect(console.warn).toHaveBeenCalledWith(
        '[Twitch] Failed to parse task broken-task:',
        expect.any(ApplicationError)
      );
      expect(prismaMock.taskCompletion.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            task: { connect: { id: 'chat-task' } }
          })
        })
      );
    });

    it('uses the first matching task', async () => {
      prismaMock.task.findMany.mockResolvedValue([
        taskRecord({ id: 'first-task' }),
        taskRecord({ id: 'second-task' })
      ]);

      await processChatMessage(event());

      expect(prismaMock.taskCompletion.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            task: { connect: { id: 'first-task' } }
          })
        })
      );
    });
  });

  describe('user resolution', () => {
    it('uses a cached user without querying the database', async () => {
      redisMock.store.set(USER_KEY, { id: 'cached-user', name: 'Cached' });

      await processChatMessage(event());

      expect(prismaMock.user.findFirst).not.toHaveBeenCalled();
      expect(prismaMock.taskCompletion.findFirst).toHaveBeenCalledWith({
        where: {
          taskId: 'task-1',
          participant: { userId: 'cached-user', sweepstakesId: 'sweepstakes-1' }
        }
      });
    });

    it('looks up the user by their twitch account', async () => {
      await processChatMessage(event());

      expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
        where: {
          accounts: {
            some: { provider: 'twitch', providerAccountId: 'chatter-1' }
          }
        }
      });
    });

    it('caches only the id and name of an existing user for three days', async () => {
      await processChatMessage(event());

      expect(redisMock.set).toHaveBeenCalledWith(
        USER_KEY,
        { id: 'user-9', name: 'Viewer' },
        USER_TTL
      );
    });

    it('does not create a user that already exists', async () => {
      await processChatMessage(event());

      expect(prismaMock.user.create).not.toHaveBeenCalled();
    });

    describe('when the chatter has no account', () => {
      beforeEach(() => {
        prismaMock.user.findFirst.mockResolvedValue(null);
        prismaMock.user.create.mockResolvedValue({
          id: 'new-user',
          name: 'Viewer'
        });
      });

      it('creates an imported user with a twitch account', async () => {
        await processChatMessage(event());

        expect(prismaMock.user.create).toHaveBeenCalledWith({
          data: {
            name: 'Viewer',
            source: 'TWITCH_IMPORT',
            accounts: {
              create: {
                type: 'oauth',
                provider: 'twitch',
                providerAccountId: 'chatter-1',
                access_token: null,
                refresh_token: null,
                expires_at: null,
                token_type: 'bearer',
                scope: '',
                id_token: null,
                session_state: null,
                label: 'viewer'
              }
            }
          }
        });
      });

      it('caches the created user', async () => {
        await processChatMessage(event());

        expect(redisMock.set).toHaveBeenCalledWith(
          USER_KEY,
          { id: 'new-user', name: 'Viewer' },
          USER_TTL
        );
      });
    });
  });

  describe('entry without a rate limit', () => {
    it('checks for an existing completion by the user', async () => {
      await processChatMessage(event());

      expect(prismaMock.taskCompletion.findFirst).toHaveBeenCalledWith({
        where: {
          taskId: 'task-1',
          participant: { userId: 'user-9', sweepstakesId: 'sweepstakes-1' }
        }
      });
    });

    it('does not consult a rate limiter', async () => {
      await processChatMessage(event());

      expect(ratelimitMock.limit).not.toHaveBeenCalled();
    });

    describe('when the user has already entered', () => {
      beforeEach(() => {
        prismaMock.taskCompletion.findFirst.mockResolvedValue({
          id: 'completion-0'
        });
      });

      it('tells the user they are already entered', async () => {
        await processChatMessage(event());

        expect(sentMessages()).toEqual([
          ['broadcaster-1', '@viewer You are already entered in this giveaway!']
        ]);
      });

      it('does not create another completion', async () => {
        await processChatMessage(event());

        expect(prismaMock.taskCompletion.create).not.toHaveBeenCalled();
      });
    });

    describe('when the user has not entered yet', () => {
      it('creates a completed task completion with twitch proof', async () => {
        await processChatMessage(event());

        expect(prismaMock.taskCompletion.create).toHaveBeenCalledWith({
          data: {
            participant: {
              connectOrCreate: {
                where: {
                  userId_sweepstakesId: {
                    userId: 'user-9',
                    sweepstakesId: 'sweepstakes-1'
                  }
                },
                create: { userId: 'user-9', sweepstakesId: 'sweepstakes-1' }
              }
            },
            task: { connect: { id: 'task-1' } },
            status: 'COMPLETED',
            proof: {
              source: 'twitch_chat',
              twitchUserId: 'chatter-1',
              twitchUsername: 'viewer',
              broadcasterId: 'broadcaster-1',
              messageId: 'message-1',
              timestamp: '2026-10-01T12:00:00.000Z'
            }
          }
        });
      });

      it('requests a scoring update for the user', async () => {
        await processChatMessage(event());

        expect(prismaMock.userScoringRequest.upsert).toHaveBeenCalledWith({
          where: { userId: 'user-9' },
          create: { userId: 'user-9' },
          update: { updatedAt: NOW }
        });
      });

      it('tells the user they were added', async () => {
        await processChatMessage(event());

        expect(sentMessages()).toEqual([
          ['broadcaster-1', '@viewer You have been added to the giveaway!']
        ]);
      });

      it('resolves to undefined', async () => {
        await expect(processChatMessage(event())).resolves.toBeUndefined();
      });
    });
  });

  describe('entry with a rate limit', () => {
    beforeEach(() => {
      prismaMock.task.findMany.mockResolvedValue([
        taskRecord({
          config: chatTaskConfig({
            rateLimit: { max: 3, window: { value: 1, unit: 'm' } }
          })
        })
      ]);
    });

    it('builds a versioned fixed window limiter for the task', async () => {
      await processChatMessage(event());

      expect(ratelimitMock.configs.at(-1)).toEqual({
        redis: redisMock,
        limiter: { algorithm: 'fixedWindow', tokens: 3, window: '1 m' },
        analytics: true,
        prefix: 'twitch:entry:task-1:3-1-m'
      });
    });

    it('limits by the user id', async () => {
      await processChatMessage(event());

      expect(ratelimitMock.limit).toHaveBeenCalledWith('user-9');
    });

    it('does not check for an existing completion', async () => {
      await processChatMessage(event());

      expect(prismaMock.taskCompletion.findFirst).not.toHaveBeenCalled();
    });

    it('creates a completion when the limit allows it', async () => {
      await processChatMessage(event());

      expect(prismaMock.taskCompletion.create).toHaveBeenCalledTimes(1);
      expect(sentMessages()).toEqual([
        ['broadcaster-1', '@viewer You have been added to the giveaway!']
      ]);
    });

    describe('when the user exceeded the limit', () => {
      beforeEach(() => {
        ratelimitMock.limit.mockResolvedValue({ success: false });
      });

      it('tells the user to try again later', async () => {
        await processChatMessage(event());

        expect(sentMessages()).toEqual([
          ['broadcaster-1', '@viewer Try again later!']
        ]);
      });

      it('does not create a completion', async () => {
        await processChatMessage(event());

        expect(prismaMock.taskCompletion.create).not.toHaveBeenCalled();
      });
    });
  });

  describe('when recording the entry fails', () => {
    it('tells the user they are already entered on a unique constraint error', async () => {
      prismaMock.taskCompletion.create.mockRejectedValue(
        knownRequestError('P2002')
      );

      await processChatMessage(event());

      expect(sentMessages()).toEqual([
        ['broadcaster-1', '@viewer You are already entered in this giveaway!']
      ]);
      expect(prismaMock.userScoringRequest.upsert).not.toHaveBeenCalled();
    });

    it('treats a unique constraint error from the scoring upsert as already entered', async () => {
      prismaMock.userScoringRequest.upsert.mockRejectedValue(
        knownRequestError('P2002')
      );

      await processChatMessage(event());

      expect(sentMessages()).toEqual([
        ['broadcaster-1', '@viewer You are already entered in this giveaway!']
      ]);
    });

    describe('on a foreign key error', () => {
      beforeEach(() => {
        redisMock.store.set(USER_KEY, { id: 'deleted-user', name: 'Gone' });
        prismaMock.taskCompletion.create.mockRejectedValue(
          knownRequestError('P2003')
        );
      });

      it('clears the cached user', async () => {
        await processChatMessage(event());

        expect(redisMock.del).toHaveBeenCalledWith(USER_KEY);
        expect(redisMock.store.has(USER_KEY)).toBe(false);
      });

      it('asks the user to try again', async () => {
        await processChatMessage(event());

        expect(sentMessages()).toEqual([
          [
            'broadcaster-1',
            '@viewer We need to update your user profile, please try again!'
          ]
        ]);
      });
    });

    it('rethrows any other error without replying', async () => {
      prismaMock.taskCompletion.create.mockRejectedValue(
        knownRequestError('P2025')
      );

      await expect(processChatMessage(event())).rejects.toMatchObject({
        code: 'P2025'
      });
      expect(sendChatMessageMock).not.toHaveBeenCalled();
    });

    it('rethrows an error without a code', async () => {
      prismaMock.taskCompletion.create.mockRejectedValue(new Error('db down'));

      await expect(processChatMessage(event())).rejects.toThrow('db down');
    });
  });
});
