import crypto from 'crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import type { Prisma } from '@giveaway/db-model';
import { db, holdTableWrites } from '@giveaway/testing-integration/database';
import {
  createHost,
  createSweepstakes,
  createUser
} from '@giveaway/testing-integration/fixtures';
import {
  chatMessageEvent,
  subscriptionPayload
} from '@giveaway/testing-server/fixtures-twitch';
import { POST } from '../handler';

const m = vi.hoisted(() => {
  const store = new Map<string, unknown>();
  const counters = new Map<string, number>();
  return {
    store,
    counters,
    sendChatMessage: vi.fn(),
    redis: {
      get: async (key: string) => (store.has(key) ? store.get(key) : null),
      set: async (key: string, value: unknown, options?: { nx?: boolean }) => {
        if (options?.nx && store.has(key)) return null;
        store.set(key, value);
        return 'OK';
      },
      del: async (...keys: string[]) =>
        keys.filter((key) => store.delete(key)).length
    }
  };
});

vi.mock('@giveaway/cache/redis', () => ({ redis: m.redis }));

vi.mock('@giveaway/twitch-api/send-chat-message', () => ({
  sendChatMessage: m.sendChatMessage
}));

vi.mock('@giveaway/ratelimit/ratelimit', () => ({
  newVersionedRateLimiter: ({
    prefix,
    max
  }: {
    prefix: string;
    max: number;
  }) => ({
    limit: async (identifier: string) => {
      const key = `${prefix}:${identifier}`;
      const count = (m.counters.get(key) ?? 0) + 1;
      m.counters.set(key, count);
      return { success: count <= max };
    }
  })
}));

const SECRET = 'eventsub-secret';
const BROADCASTER_ID = 'broadcaster-1';
const CHATTER_ID = 'chatter-1';

const chatImportTask = (
  rateLimit?: Prisma.InputJsonObject
): Prisma.InputJsonObject => ({
  type: 'TWITCH_CHAT_IMPORT',
  title: 'Chat on Twitch',
  value: 1,
  mandatory: false,
  tasksRequired: 0,
  importingAccount: 'integration-1',
  channelUrl: 'https://www.twitch.tv/streamer',
  trigger: '!enter',
  ...(rateLimit ? { rateLimit } : {})
});

const setup = async ({
  rateLimit
}: { rateLimit?: Prisma.InputJsonObject } = {}) => {
  const { team } = await createHost();
  await db.integration.create({
    data: {
      provider: 'TWITCH',
      teamId: team.id,
      status: 'ACTIVE',
      account_id: BROADCASTER_ID,
      label: 'streamer'
    }
  });
  const sweepstakes = await createSweepstakes({
    teamId: team.id,
    tasks: [chatImportTask(rateLimit)]
  });
  return { sweepstakes, task: sweepstakes.tasks[0] };
};

const createChatter = () =>
  createUser({
    accounts: {
      create: {
        type: 'oauth',
        provider: 'twitch',
        providerAccountId: CHATTER_ID
      }
    }
  });

const delivery = (messageId: string) => {
  const raw = JSON.stringify({
    subscription: subscriptionPayload(),
    event: chatMessageEvent({ chatter_user_id: CHATTER_ID })
  });
  const timestamp = new Date().toISOString();
  return () =>
    new NextRequest('http://localhost:3000/api/twitch/webhooks', {
      method: 'POST',
      headers: {
        'Twitch-Eventsub-Message-Id': messageId,
        'Twitch-Eventsub-Message-Timestamp': timestamp,
        'Twitch-Eventsub-Message-Type': 'notification',
        'Twitch-Eventsub-Message-Signature':
          'sha256=' +
          crypto
            .createHmac('sha256', SECRET)
            .update(messageId + timestamp + raw)
            .digest('hex'),
        'Content-Type': 'application/json'
      },
      body: raw
    });
};

const entries = (taskId: string) =>
  db.taskCompletion.count({ where: { taskId } });

beforeEach(() => {
  vi.stubEnv('TWITCH_EVENTSUB_SECRET', SECRET);
  vi.spyOn(console, 'info').mockImplementation(() => undefined);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  m.store.clear();
  m.counters.clear();
  m.sendChatMessage.mockReset();
});

describe('POST /api/twitch/webhooks', () => {
  describe('when Twitch delivers the same chat message twice', () => {
    it('records one entry', async () => {
      const { task } = await setup();
      const request = delivery('message-1');

      expect((await POST(request())).status).toBe(200);
      expect((await POST(request())).status).toBe(200);

      expect(await entries(task.id)).toBe(1);
    });

    it.fails(
      'replies in the chat once (fails until #306 is fixed)',
      async () => {
        await setup();
        const request = delivery('message-1');

        await POST(request());
        await POST(request());

        expect(m.sendChatMessage).toHaveBeenCalledTimes(1);
        expect(m.sendChatMessage).toHaveBeenCalledWith(
          BROADCASTER_ID,
          '@viewer You have been added to the giveaway!'
        );
      }
    );

    it.fails(
      'records one entry for a task that allows an entry per message (fails until #306 is fixed)',
      async () => {
        const { task } = await setup({
          rateLimit: { max: 5, window: { value: 1, unit: 'h' } }
        });
        const request = delivery('message-1');

        await POST(request());
        await POST(request());

        expect(await entries(task.id)).toBe(1);
      }
    );

    it.fails(
      'records one entry when both deliveries for a chatter who already entered another task arrive at the same time (fails until #306 is fixed)',
      async () => {
        const { sweepstakes, task } = await setup();
        const chatter = await createChatter();
        await db.sweepstakesParticipant.create({
          data: { userId: chatter.id, sweepstakesId: sweepstakes.id }
        });
        const request = delivery('message-1');

        await holdTableWrites('TaskCompletion', { writers: 2 }, () =>
          Promise.all([POST(request()), POST(request())])
        );

        expect(await entries(task.id)).toBe(1);
      }
    );
  });

  describe('when the same chatter sends two different messages', () => {
    it('records an entry per message for a task that allows an entry per message', async () => {
      const { task } = await setup({
        rateLimit: { max: 5, window: { value: 1, unit: 'h' } }
      });

      await POST(delivery('message-1')());
      await POST(delivery('message-2')());

      expect(await entries(task.id)).toBe(2);
    });
  });
});
