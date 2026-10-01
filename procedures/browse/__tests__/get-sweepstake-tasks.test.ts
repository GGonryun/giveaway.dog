import { describe, it, expect } from 'vitest';
import { getSweepstakesTasks } from '../get-sweepstake-tasks';
import { prismaMock } from '@/test/prisma';
import { signIn } from '@/test/session';
import { nextCacheMock } from '@/test/next-cache';
import { expectFailure, expectOk } from '@/test/result';

type Input = Parameters<typeof getSweepstakesTasks>[0];

const taskRow = (id: string, config: unknown) => ({
  id,
  sweepstakesId: 'sw-1',
  index: 0,
  config
});

const sweepstakesWith = (tasks: ReturnType<typeof taskRow>[]) => ({
  id: 'sw-1',
  teamId: 'team-1',
  team: { id: 'team-1', name: 'Acme', slug: 'acme' },
  tasks
});

describe('getSweepstakesTasks', () => {
  describe('authorization', () => {
    it('returns UNAUTHORIZED for anonymous callers', async () => {
      const result = await getSweepstakesTasks({ sweepstakesId: 'sw-1' });

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.sweepstakes.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('when the caller is signed in', () => {
    it('looks the sweepstakes up by id or slug including team and tasks', async () => {
      signIn();
      prismaMock.sweepstakes.findFirst.mockResolvedValue(sweepstakesWith([]));

      await getSweepstakesTasks({ sweepstakesId: 'promo' });

      expect(prismaMock.sweepstakes.findFirst).toHaveBeenCalledWith({
        where: { OR: [{ id: 'promo' }, { visibility: { slug: 'promo' } }] },
        include: { team: true, tasks: true }
      });
    });

    it('returns NOT_FOUND when the sweepstakes does not exist', async () => {
      signIn();
      prismaMock.sweepstakes.findFirst.mockResolvedValue(null);

      const result = await getSweepstakesTasks({ sweepstakesId: 'missing' });

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'Sweepstakes with ID missing not found'
      );
    });

    it('returns NOT_FOUND when the sweepstakes has no team', async () => {
      signIn();
      prismaMock.sweepstakes.findFirst.mockResolvedValue({
        ...sweepstakesWith([]),
        teamId: null,
        team: null
      });

      const result = await getSweepstakesTasks({ sweepstakesId: 'sw-1' });

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'Sweepstakes with ID sw-1 not found'
      );
    });

    it('returns an empty list when the sweepstakes has no tasks', async () => {
      signIn();
      prismaMock.sweepstakes.findFirst.mockResolvedValue(sweepstakesWith([]));

      const result = await getSweepstakesTasks({ sweepstakesId: 'sw-1' });

      expect(expectOk(result)).toEqual([]);
    });

    it('parses each stored task config and uses the row id', async () => {
      signIn();
      prismaMock.sweepstakes.findFirst.mockResolvedValue(
        sweepstakesWith([
          taskRow('task-1', {
            id: 'ignored-config-id',
            type: 'BONUS_TASK',
            title: 'Say hi',
            value: 2,
            mandatory: true,
            tasksRequired: 0
          }),
          taskRow('task-2', {
            type: 'VISIT_URL',
            title: 'Visit us',
            value: 1,
            mandatory: false,
            tasksRequired: 1,
            href: 'https://example.com',
            label: 'Website'
          })
        ])
      );

      const result = await getSweepstakesTasks({ sweepstakesId: 'sw-1' });

      expect(expectOk(result)).toEqual([
        {
          id: 'task-1',
          type: 'BONUS_TASK',
          title: 'Say hi',
          value: 2,
          mandatory: true,
          tasksRequired: 0
        },
        {
          id: 'task-2',
          type: 'VISIT_URL',
          title: 'Visit us',
          value: 1,
          mandatory: false,
          tasksRequired: 1,
          href: 'https://example.com',
          label: 'Website'
        }
      ]);
    });

    it('strips config keys that are not part of the task schema', async () => {
      signIn();
      prismaMock.sweepstakes.findFirst.mockResolvedValue(
        sweepstakesWith([
          taskRow('task-1', {
            type: 'BONUS_TASK',
            title: 'Bonus',
            value: 1,
            mandatory: false,
            tasksRequired: 0,
            legacyField: 'stale'
          })
        ])
      );

      const result = await getSweepstakesTasks({ sweepstakesId: 'sw-1' });

      expect(expectOk(result)[0]).not.toHaveProperty('legacyField');
    });

    it('returns INTERNAL_SERVER_ERROR when a task config cannot be parsed', async () => {
      signIn();
      prismaMock.sweepstakes.findFirst.mockResolvedValue(
        sweepstakesWith([taskRow('task-1', { type: 'UNKNOWN_TYPE' })])
      );

      const result = await getSweepstakesTasks({ sweepstakesId: 'sw-1' });

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'Failed to parse task config'
      );
    });

    it('returns INTERNAL_SERVER_ERROR when a task config is null', async () => {
      signIn();
      prismaMock.sweepstakes.findFirst.mockResolvedValue(
        sweepstakesWith([taskRow('task-1', null)])
      );

      const result = await getSweepstakesTasks({ sweepstakesId: 'sw-1' });

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'Failed to parse task config'
      );
    });

    it('does not cache the call', async () => {
      signIn();
      prismaMock.sweepstakes.findFirst.mockResolvedValue(sweepstakesWith([]));

      await getSweepstakesTasks({ sweepstakesId: 'sw-1' });

      expect(nextCacheMock.unstable_cache).not.toHaveBeenCalled();
    });
  });

  describe('input validation', () => {
    it('returns UNPROCESSABLE_CONTENT when sweepstakesId is missing', async () => {
      signIn();

      const result = await getSweepstakesTasks({} as unknown as Input);

      expectFailure(result, 'UNPROCESSABLE_CONTENT');
      expect(prismaMock.sweepstakes.findFirst).not.toHaveBeenCalled();
    });
  });
});
