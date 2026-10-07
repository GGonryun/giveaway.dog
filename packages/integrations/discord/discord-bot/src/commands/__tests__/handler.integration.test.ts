import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Prisma } from '@giveaway/db-model';
import { db, holdTableWrites } from '@giveaway/testing-integration/database';
import {
  createHost,
  createSweepstakes,
  createUser
} from '@giveaway/testing-integration/fixtures';
import { crashAtEveryWrite } from '@giveaway/testing-integration/faults';
import { fakeNetwork } from '@giveaway/testing-server/faults';
import {
  buttonInteraction,
  discordMember
} from '@giveaway/discord-model/testing/fixtures-discord-model';
import { POST } from '../handler';
import { commitEntry } from '../../workflows/discord-interaction/steps/commit-entry';
import {
  DISCORD_TEST_PUBLIC_KEY,
  discordRequest
} from '../../testing/fixtures-discord-bot';

const m = vi.hoisted(() => ({ runs: [] as Promise<unknown>[] }));

vi.mock('workflow/api', () => ({
  start: async (
    workflow: (...args: unknown[]) => Promise<unknown>,
    args: unknown[]
  ) => {
    const run = workflow(...args);
    m.runs.push(run);
    return { runId: `run-${m.runs.length}` };
  }
}));

const DISCORD_USER_ID = 'discord-user-1';

const interactionTask = (): Prisma.InputJsonObject => ({
  type: 'DISCORD_INTERACTION_IMPORT',
  title: 'Interact on Discord',
  value: 1,
  mandatory: false,
  tasksRequired: 0,
  roles: [],
  link: 'https://discord.com/channels/1/2/3'
});

const setup = async () => {
  const { team } = await createHost();
  const sweepstakes = await createSweepstakes({
    teamId: team.id,
    tasks: [interactionTask()]
  });
  return { sweepstakes, task: sweepstakes.tasks[0] };
};

const createDiscordUser = () =>
  createUser({
    accounts: {
      create: {
        type: 'oauth',
        provider: 'discord',
        providerAccountId: DISCORD_USER_ID
      }
    }
  });

const press = (taskId: string) => {
  const body = JSON.stringify(buttonInteraction(`task:enter:${taskId}`));
  return () => discordRequest({ body });
};

const handle = async (request: () => ReturnType<typeof discordRequest>) => {
  const response = await POST(request());
  await Promise.allSettled(m.runs);
  return response;
};

const entryState = async ({ task }: Awaited<ReturnType<typeof setup>>) => ({
  completions: await db.taskCompletion.count({ where: { taskId: task.id } }),
  users: await db.user.count(),
  discordAccounts: await db.account.count({ where: { provider: 'discord' } }),
  scoringRequests: await db.userScoringRequest.count()
});

const commitInput = ({
  sweepstakes,
  task,
  existingUserId = null
}: Awaited<ReturnType<typeof setup>> & { existingUserId?: string | null }) => {
  const body = buttonInteraction(`task:enter:${task.id}`);
  return {
    body,
    taskId: task.id,
    sweepstakesId: sweepstakes.id,
    existingUserId,
    member: discordMember(),
    discordUserId: DISCORD_USER_ID
  };
};

beforeEach(() => {
  vi.stubEnv('DISCORD_BOT_PUBLIC_KEY', DISCORD_TEST_PUBLIC_KEY);
  vi.stubEnv('DISCORD_BOT_TOKEN', 'bot-token');
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  m.runs.length = 0;
  const network = fakeNetwork();
  network.on(
    'PATCH https://discord.com/api/v10/webhooks/',
    new Response(null, { status: 200 })
  );
  network.json('PATCH https://discord.com/api/v10/channels/', {
    id: 'message-1',
    channel_id: 'channel-1'
  });
});

describe('POST /api/discord/interactions', () => {
  describe('when Discord delivers the same button press twice', () => {
    it('records one entry and one new user', async () => {
      const entry = await setup();
      const request = press(entry.task.id);

      expect((await handle(request)).status).toBe(200);
      expect((await handle(request)).status).toBe(200);

      expect(await entryState(entry)).toEqual({
        completions: 1,
        users: 2,
        discordAccounts: 1,
        scoringRequests: 1
      });
    });

    it.fails(
      'records one entry when both presses of a participant are handled at the same time (fails until #307 is fixed)',
      async () => {
        const entry = await setup();
        const user = await createDiscordUser();
        await db.sweepstakesParticipant.create({
          data: { userId: user.id, sweepstakesId: entry.sweepstakes.id }
        });
        const request = press(entry.task.id);

        await holdTableWrites('TaskCompletion', { writers: 2 }, () =>
          Promise.all([handle(request), handle(request)])
        );

        expect(
          await db.taskCompletion.count({ where: { taskId: entry.task.id } })
        ).toBe(1);
      }
    );
  });

  describe('when the workflow runs the commitEntry step again after the function stopped', () => {
    it.fails(
      'keeps one entry for a new Discord user after a stop at any write (fails until #307 is fixed)',
      async () => {
        const { mismatches } = await crashAtEveryWrite({
          setup,
          run: (entry) => commitEntry(commitInput(entry)),
          state: entryState
        });

        expect(mismatches).toEqual([]);
      }
    );

    it.fails(
      'keeps one entry for a known Discord user after a stop at any write (fails until #307 is fixed)',
      async () => {
        const { mismatches } = await crashAtEveryWrite({
          setup: async () => {
            const entry = await setup();
            const user = await createDiscordUser();
            return { ...entry, existingUserId: user.id };
          },
          run: (entry) => commitEntry(commitInput(entry)),
          state: entryState
        });

        expect(mismatches).toEqual([]);
      }
    );
  });
});
