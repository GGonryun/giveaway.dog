import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TeamRole } from '@prisma/client';
import verifyTwitchTrigger from '../verify-twitch-trigger';
import { prismaMock } from '@/test/prisma';
import { signIn, TEST_USER } from '@/test/session';
import { expectFailure, expectOk } from '@/test/result';
import {
  TEAM_ID,
  buildMembership,
  buildTeam
} from './fixtures-procedures-sweepstakes-b';

type Input = Parameters<typeof verifyTwitchTrigger>[0];

const input = (overrides: Partial<Input> = {}): Input => ({
  trigger: '!enter',
  teamId: TEAM_ID,
  ...overrides
});

const twitchConfig = (trigger: string) => ({
  type: 'TWITCH_CHAT_IMPORT',
  title: 'Chat on Twitch',
  value: 1,
  mandatory: false,
  tasksRequired: 0,
  importingAccount: 'account-1',
  channelUrl: 'https://www.twitch.tv/giveawaydog',
  trigger
});

const bonusConfig = {
  type: 'BONUS_TASK',
  title: 'Bonus',
  value: 1,
  mandatory: false,
  tasksRequired: 0
};

const task = ({
  id = 'task-1',
  config = twitchConfig('!enter'),
  sweepstakesId = 'sweep-2',
  details = { name: 'Other Giveaway' }
}: {
  id?: string;
  config?: Record<string, unknown> | null;
  sweepstakesId?: string;
  details?: { name: string | null } | null;
} = {}) => ({
  id,
  sweepstakesId,
  index: 0,
  config,
  sweepstakes: { id: sweepstakesId, details }
});

describe('verifyTwitchTrigger', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    prismaMock.team.findUnique.mockResolvedValue(buildTeam());
    prismaMock.task.findMany.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('access control', () => {
    it('returns UNAUTHORIZED when signed out', async () => {
      const result = await verifyTwitchTrigger(input());

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.team.findUnique).not.toHaveBeenCalled();
    });

    it('rejects input without a team id', async () => {
      signIn();

      const result = await verifyTwitchTrigger({
        trigger: '!enter'
      } as unknown as Input);

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
        /^Input validation failed: [\s\S]*"teamId"/
      );
    });

    it('verifies the caller belongs to the team by id', async () => {
      signIn();

      await verifyTwitchTrigger(input());

      expect(prismaMock.team.findUnique).toHaveBeenCalledWith({
        where: {
          id: TEAM_ID,
          members: { some: { userId: TEST_USER.id } }
        },
        include: { members: true }
      });
    });

    it('returns NOT_FOUND when the team is not accessible', async () => {
      signIn();
      prismaMock.team.findUnique.mockResolvedValue(null);

      const result = await verifyTwitchTrigger(input());

      expect(expectFailure(result, 'NOT_FOUND').message).toBe('Team not found');
      expect(prismaMock.task.findMany).not.toHaveBeenCalled();
    });

    it('returns FORBIDDEN for a blocked member', async () => {
      signIn();
      prismaMock.team.findUnique.mockResolvedValue(
        buildTeam({ members: [buildMembership({ role: TeamRole.BLOCKED })] })
      );

      const result = await verifyTwitchTrigger(input());

      expectFailure(result, 'FORBIDDEN');
      expect(prismaMock.task.findMany).not.toHaveBeenCalled();
    });

    it('allows a guest member', async () => {
      signIn();
      prismaMock.team.findUnique.mockResolvedValue(
        buildTeam({ members: [buildMembership({ role: TeamRole.GUEST })] })
      );

      const result = await verifyTwitchTrigger(input());

      expect(expectOk(result)).toEqual({ available: true });
    });
  });

  describe('task lookup', () => {
    beforeEach(() => {
      signIn();
    });

    it('searches tasks of active sweepstakes in the team', async () => {
      await verifyTwitchTrigger(input());

      expect(prismaMock.task.findMany).toHaveBeenCalledWith({
        where: { sweepstakes: { teamId: TEAM_ID, status: 'ACTIVE' } },
        include: { sweepstakes: { include: { details: true } } }
      });
    });

    it('excludes the sweepstakes being edited', async () => {
      await verifyTwitchTrigger(input({ sweepstakesId: 'sweep-1' }));

      expect(prismaMock.task.findMany.mock.calls[0][0].where).toEqual({
        sweepstakes: {
          teamId: TEAM_ID,
          status: 'ACTIVE',
          NOT: { id: 'sweep-1' }
        }
      });
    });
  });

  describe('conflict detection', () => {
    beforeEach(() => {
      signIn();
    });

    it('reports the trigger available when there are no tasks', async () => {
      const result = await verifyTwitchTrigger(input());

      expect(expectOk(result)).toEqual({ available: true });
    });

    it('reports a conflict with an identical trigger', async () => {
      prismaMock.task.findMany.mockResolvedValue([task()]);

      const result = await verifyTwitchTrigger(input());

      expect(expectOk(result)).toEqual({
        available: false,
        conflictingSweepstakesId: 'sweep-2',
        conflictingSweepstakesName: 'Other Giveaway'
      });
    });

    it('compares triggers case insensitively', async () => {
      prismaMock.task.findMany.mockResolvedValue([
        task({ config: twitchConfig('!ENTER') })
      ]);

      const result = await verifyTwitchTrigger(input({ trigger: '!Enter' }));

      expect(expectOk(result).available).toBe(false);
    });

    it('uses a placeholder name when the conflicting sweepstakes has no details', async () => {
      prismaMock.task.findMany.mockResolvedValue([task({ details: null })]);

      const result = await verifyTwitchTrigger(input());

      expect(expectOk(result).conflictingSweepstakesName).toBe(
        'Untitled Giveaway'
      );
    });

    it('uses a placeholder name when the conflicting sweepstakes name is empty', async () => {
      prismaMock.task.findMany.mockResolvedValue([
        task({ details: { name: '' } })
      ]);

      const result = await verifyTwitchTrigger(input());

      expect(expectOk(result).conflictingSweepstakesName).toBe(
        'Untitled Giveaway'
      );
    });

    it('ignores tasks with a different trigger', async () => {
      prismaMock.task.findMany.mockResolvedValue([
        task({ config: twitchConfig('!join') })
      ]);

      const result = await verifyTwitchTrigger(input());

      expect(expectOk(result)).toEqual({ available: true });
    });

    it('ignores tasks that are not twitch chat imports', async () => {
      prismaMock.task.findMany.mockResolvedValue([
        task({ config: bonusConfig })
      ]);

      const result = await verifyTwitchTrigger(input());

      expect(expectOk(result)).toEqual({ available: true });
    });

    it('skips the task currently being edited', async () => {
      prismaMock.task.findMany.mockResolvedValue([task({ id: 'task-1' })]);

      const result = await verifyTwitchTrigger(input({ taskId: 'task-1' }));

      expect(expectOk(result)).toEqual({ available: true });
    });

    it('still checks other tasks when a task id is provided', async () => {
      prismaMock.task.findMany.mockResolvedValue([
        task({ id: 'task-1' }),
        task({ id: 'task-2', sweepstakesId: 'sweep-3' })
      ]);

      const result = await verifyTwitchTrigger(input({ taskId: 'task-1' }));

      expect(expectOk(result)).toMatchObject({
        available: false,
        conflictingSweepstakesId: 'sweep-3'
      });
    });

    it('skips tasks whose config cannot be parsed', async () => {
      prismaMock.task.findMany.mockResolvedValue([
        task({ id: 'broken', config: { type: 'TWITCH_CHAT_IMPORT' } }),
        task({ id: 'task-2', sweepstakesId: 'sweep-3' })
      ]);

      const result = await verifyTwitchTrigger(input());

      expect(expectOk(result)).toMatchObject({
        available: false,
        conflictingSweepstakesId: 'sweep-3'
      });
    });

    it('reports available when the only matching task is unparseable', async () => {
      prismaMock.task.findMany.mockResolvedValue([
        task({ config: null, sweepstakesId: 'sweep-9' })
      ]);

      const result = await verifyTwitchTrigger(input());

      expect(expectOk(result)).toEqual({ available: true });
    });

    it('returns the first conflict found', async () => {
      prismaMock.task.findMany.mockResolvedValue([
        task({ id: 'task-a', sweepstakesId: 'sweep-a' }),
        task({ id: 'task-b', sweepstakesId: 'sweep-b' })
      ]);

      const result = await verifyTwitchTrigger(input());

      expect(expectOk(result).conflictingSweepstakesId).toBe('sweep-a');
    });
  });
});
