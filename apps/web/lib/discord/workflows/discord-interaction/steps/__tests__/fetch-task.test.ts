import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchTask } from '../fetch-task';
import { prismaMock } from '@giveaway/testing-server/prisma';
import {
  bonusTaskConfig,
  discordInteractionTaskConfig
} from '@giveaway/discord-model/testing/fixtures-discord-procedures-workflows';

const NOW = new Date('2026-06-01T12:00:00.000Z');
const FUTURE = new Date('2026-06-02T12:00:00.000Z');
const PAST = new Date('2026-05-31T12:00:00.000Z');

const storedTaskWith = ({
  config = discordInteractionTaskConfig(),
  status = 'ACTIVE',
  timing = { endDate: FUTURE }
}: {
  config?: Record<string, unknown> | null;
  status?: string;
  timing?: { endDate?: Date | string | null } | null;
} = {}) => ({
  id: 'task-1',
  sweepstakesId: 'sweep-1',
  index: 0,
  config,
  sweepstakes: { id: 'sweep-1', status, timing }
});

describe('fetchTask', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('loads the task with its sweepstakes id, status and timing', async () => {
    prismaMock.task.findUnique.mockResolvedValue(storedTaskWith());

    await fetchTask({ taskId: 'task-1' });

    expect(prismaMock.task.findUnique).toHaveBeenCalledWith({
      where: { id: 'task-1' },
      include: {
        sweepstakes: {
          select: { id: true, status: true, timing: true }
        }
      }
    });
  });

  describe('when the task cannot be used', () => {
    it('returns an error when the task does not exist', async () => {
      prismaMock.task.findUnique.mockResolvedValue(null);

      const result = await fetchTask({ taskId: 'task-1' });

      expect(result).toEqual({
        status: 'error',
        content: 'This giveaway task no longer exists.'
      });
    });

    it('returns an error when the task is not a discord interaction task', async () => {
      prismaMock.task.findUnique.mockResolvedValue(
        storedTaskWith({ config: bonusTaskConfig })
      );

      const result = await fetchTask({ taskId: 'task-1' });

      expect(result).toEqual({
        status: 'error',
        content: 'This task is not a Discord interaction entry task.'
      });
    });

    it('returns an error when the sweepstakes is still a draft', async () => {
      prismaMock.task.findUnique.mockResolvedValue(
        storedTaskWith({ status: 'DRAFT' })
      );

      const result = await fetchTask({ taskId: 'task-1' });

      expect(result).toEqual({
        status: 'error',
        content: 'This giveaway is not yet active.'
      });
    });

    it('reports a draft before checking the end date', async () => {
      prismaMock.task.findUnique.mockResolvedValue(
        storedTaskWith({ status: 'DRAFT', timing: { endDate: PAST } })
      );

      const result = await fetchTask({ taskId: 'task-1' });

      expect(result).toEqual({
        status: 'error',
        content: 'This giveaway is not yet active.'
      });
    });

    it('throws when the stored task config cannot be parsed', async () => {
      prismaMock.task.findUnique.mockResolvedValue(
        storedTaskWith({ config: { type: 'DISCORD_INTERACTION_IMPORT' } })
      );

      await expect(fetchTask({ taskId: 'task-1' })).rejects.toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to parse task config'
      });
    });

    it('throws when the stored task has no config', async () => {
      prismaMock.task.findUnique.mockResolvedValue(
        storedTaskWith({ config: null })
      );

      await expect(fetchTask({ taskId: 'task-1' })).rejects.toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to parse task config'
      });
    });
  });

  describe('when the giveaway has ended', () => {
    it('reports a completed sweepstakes as ended even before its end date', async () => {
      prismaMock.task.findUnique.mockResolvedValue(
        storedTaskWith({ status: 'COMPLETED', timing: { endDate: FUTURE } })
      );

      const result = await fetchTask({ taskId: 'task-1' });

      expect(result).toEqual({ status: 'ended', sweepstakesId: 'sweep-1' });
    });

    it('reports a sweepstakes without timing as ended', async () => {
      prismaMock.task.findUnique.mockResolvedValue(
        storedTaskWith({ timing: null })
      );

      const result = await fetchTask({ taskId: 'task-1' });

      expect(result).toEqual({ status: 'ended', sweepstakesId: 'sweep-1' });
    });

    it('reports a sweepstakes without an end date as ended', async () => {
      prismaMock.task.findUnique.mockResolvedValue(
        storedTaskWith({ timing: { endDate: null } })
      );

      const result = await fetchTask({ taskId: 'task-1' });

      expect(result).toEqual({ status: 'ended', sweepstakesId: 'sweep-1' });
    });

    it('reports a sweepstakes whose end date has passed as ended', async () => {
      prismaMock.task.findUnique.mockResolvedValue(
        storedTaskWith({ timing: { endDate: PAST } })
      );

      const result = await fetchTask({ taskId: 'task-1' });

      expect(result).toEqual({ status: 'ended', sweepstakesId: 'sweep-1' });
    });

    it('reports the id of the related sweepstakes record when ended', async () => {
      prismaMock.task.findUnique.mockResolvedValue({
        ...storedTaskWith({ timing: { endDate: PAST } }),
        sweepstakesId: 'sweep-column',
        sweepstakes: { id: 'sweep-relation', status: 'ACTIVE', timing: null }
      });

      const result = await fetchTask({ taskId: 'task-1' });

      expect(result).toEqual({
        status: 'ended',
        sweepstakesId: 'sweep-relation'
      });
    });

    it('reports an end date one millisecond in the past as ended', async () => {
      prismaMock.task.findUnique.mockResolvedValue(
        storedTaskWith({
          timing: { endDate: new Date(NOW.getTime() - 1) }
        })
      );

      const result = await fetchTask({ taskId: 'task-1' });

      expect(result).toEqual({ status: 'ended', sweepstakesId: 'sweep-1' });
    });
  });

  describe('when the giveaway is running', () => {
    it('returns the task roles and sweepstakes id', async () => {
      prismaMock.task.findUnique.mockResolvedValue(
        storedTaskWith({
          config: discordInteractionTaskConfig({ roles: ['r-1', 'r-2'] })
        })
      );

      const result = await fetchTask({ taskId: 'task-1' });

      expect(result).toEqual({
        status: 'active',
        roles: ['r-1', 'r-2'],
        sweepstakesId: 'sweep-1'
      });
    });

    it('returns the id of the related sweepstakes record rather than the task column', async () => {
      prismaMock.task.findUnique.mockResolvedValue({
        ...storedTaskWith(),
        sweepstakesId: 'sweep-column',
        sweepstakes: {
          id: 'sweep-relation',
          status: 'ACTIVE',
          timing: { endDate: FUTURE }
        }
      });

      const result = await fetchTask({ taskId: 'task-1' });

      expect(result).toEqual(
        expect.objectContaining({
          status: 'active',
          sweepstakesId: 'sweep-relation'
        })
      );
    });

    it('returns an empty role list when the task has no roles', async () => {
      prismaMock.task.findUnique.mockResolvedValue(
        storedTaskWith({
          config: discordInteractionTaskConfig({ roles: undefined })
        })
      );

      const result = await fetchTask({ taskId: 'task-1' });

      expect(result).toEqual({
        status: 'active',
        roles: [],
        sweepstakesId: 'sweep-1'
      });
    });

    it('treats an end date equal to now as still running', async () => {
      prismaMock.task.findUnique.mockResolvedValue(
        storedTaskWith({ timing: { endDate: new Date(NOW) } })
      );

      const result = await fetchTask({ taskId: 'task-1' });

      expect(result).toEqual(expect.objectContaining({ status: 'active' }));
    });

    it('accepts an end date stored as an ISO string', async () => {
      prismaMock.task.findUnique.mockResolvedValue(
        storedTaskWith({ timing: { endDate: FUTURE.toISOString() } })
      );

      const result = await fetchTask({ taskId: 'task-1' });

      expect(result).toEqual(expect.objectContaining({ status: 'active' }));
    });

    it('does not consider the start date, so a scheduled giveaway is active', async () => {
      prismaMock.task.findUnique.mockResolvedValue(
        storedTaskWith({
          timing: {
            startDate: FUTURE,
            endDate: new Date('2026-07-01T00:00:00.000Z')
          } as unknown as { endDate: Date }
        })
      );

      const result = await fetchTask({ taskId: 'task-1' });

      expect(result).toEqual(expect.objectContaining({ status: 'active' }));
    });
  });
});
