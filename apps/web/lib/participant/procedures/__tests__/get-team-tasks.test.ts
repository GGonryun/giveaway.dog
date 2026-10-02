import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getTeamTasks } from '../get-team-tasks';
import { prismaMock } from '@giveaway/testing-server/prisma';
import { signIn, TEST_USER } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';
import {
  bonusConfig,
  buildTaskRow
} from '../../__tests__/fixtures-participant-referrals-automation';

describe('getTeamTasks', () => {
  describe('when the caller is not signed in', () => {
    it('returns UNAUTHORIZED without querying', async () => {
      const result = await getTeamTasks({ slug: 'acme' });

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.task.findMany).not.toHaveBeenCalled();
    });
  });

  describe('when the caller is signed in', () => {
    beforeEach(() => {
      signIn();
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('rejects input without a slug', async () => {
      const result = await getTeamTasks(
        {} as unknown as Parameters<typeof getTeamTasks>[0]
      );

      expectFailure(result, 'UNPROCESSABLE_CONTENT');
    });

    it('queries tasks of sweepstakes owned by a team the caller belongs to', async () => {
      prismaMock.task.findMany.mockResolvedValue([]);

      await getTeamTasks({ slug: 'acme' });

      expect(prismaMock.task.findMany).toHaveBeenCalledWith({
        where: {
          sweepstakes: {
            team: {
              slug: 'acme',
              members: { some: { userId: TEST_USER.id } }
            }
          }
        }
      });
    });

    it('returns an empty list when the team has no tasks', async () => {
      prismaMock.task.findMany.mockResolvedValue([]);

      const result = await getTeamTasks({ slug: 'acme' });

      expect(expectOk(result)).toEqual([]);
    });

    it('parses stored task configs using the row id', async () => {
      prismaMock.task.findMany.mockResolvedValue([
        buildTaskRow({
          id: 'task-9',
          config: bonusConfig({ id: 'ignored', title: 'Daily bonus', value: 3 })
        })
      ]);

      const result = await getTeamTasks({ slug: 'acme' });

      expect(expectOk(result)).toEqual([
        {
          id: 'task-9',
          type: 'BONUS_TASK',
          title: 'Daily bonus',
          value: 3,
          mandatory: false,
          tasksRequired: 0
        }
      ]);
    });

    it('replaces unparseable tasks with an unknown bonus task', async () => {
      prismaMock.task.findMany.mockResolvedValue([
        buildTaskRow({ id: 'broken', config: { type: 'MYSTERY' } })
      ]);

      const result = await getTeamTasks({ slug: 'acme' });

      expect(expectOk(result)).toEqual([
        {
          type: 'BONUS_TASK',
          id: 'broken',
          title: 'Unknown Task',
          value: 1,
          mandatory: false,
          tasksRequired: 0
        }
      ]);
    });
  });
});
