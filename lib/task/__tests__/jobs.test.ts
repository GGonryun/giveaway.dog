import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createJobsForTask } from '../jobs';
import type { TaskType } from '../schemas';
import { TASK_TYPES, VALID_TASKS } from './fixtures-task-schemas';

type JobTask = Parameters<typeof createJobsForTask>[0];

const NOW = new Date('2026-03-04T05:06:07.000Z');

const JOB_TYPES: TaskType[] = [
  'TWITTER_RETWEET_IMPORT',
  'TWITTER_RETWEET_IMPORT_V2',
  'TWITTER_LIKE_IMPORT',
  'BLUESKY_LIKE_IMPORT',
  'BLUESKY_REPOST_IMPORT'
];

const NO_JOB_TYPES = TASK_TYPES.filter((type) => !JOB_TYPES.includes(type));

const taskOf = (type: TaskType): JobTask => VALID_TASKS[type] as JobTask;

describe('createJobsForTask', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('when the sweepstakes is not active', () => {
    it.each([undefined, 'DRAFT', 'COMPLETED'] as const)(
      'returns no jobs for an import task when status is %s',
      (status) => {
        expect(
          createJobsForTask(taskOf('TWITTER_LIKE_IMPORT'), status)
        ).toEqual([]);
      }
    );
  });

  describe('when the sweepstakes is active', () => {
    it('returns no jobs when the task has no type', () => {
      const task = { id: 'task-1' } as JobTask;

      expect(createJobsForTask(task, 'ACTIVE')).toEqual([]);
    });

    it('returns no jobs when the task is missing entirely', () => {
      expect(
        createJobsForTask(undefined as unknown as JobTask, 'ACTIVE')
      ).toEqual([]);
    });

    it.each(NO_JOB_TYPES)('returns no jobs for %s tasks', (type) => {
      expect(createJobsForTask(taskOf(type), 'ACTIVE')).toEqual([]);
    });

    it.each(JOB_TYPES)(
      'schedules one immediate job with zero runs for %s tasks',
      (type) => {
        expect(createJobsForTask(taskOf(type), 'ACTIVE')).toEqual([
          { runAt: NOW, data: { runs: 0 } }
        ]);
      }
    );

    it('creates a fresh job object on every call', () => {
      const first = createJobsForTask(taskOf('BLUESKY_LIKE_IMPORT'), 'ACTIVE');
      const second = createJobsForTask(taskOf('BLUESKY_LIKE_IMPORT'), 'ACTIVE');

      expect(first[0]).not.toBe(second[0]);
      expect(first[0].runAt).not.toBe(second[0].runAt);
    });

    it('does not schedule jobs for discord and twitch chat imports', () => {
      expect(
        createJobsForTask(taskOf('DISCORD_INTERACTION_IMPORT'), 'ACTIVE')
      ).toEqual([]);
      expect(createJobsForTask(taskOf('TWITCH_CHAT_IMPORT'), 'ACTIVE')).toEqual(
        []
      );
    });

    it('throws for an unknown task type', () => {
      const task = { id: 'task-1', type: 'UNKNOWN_TYPE' } as unknown as JobTask;

      expect(() => createJobsForTask(task, 'ACTIVE')).toThrow(
        'Unexpected value: UNKNOWN_TYPE'
      );
    });
  });

  it('checks the status before the task type', () => {
    const task = { id: 'task-1', type: 'UNKNOWN_TYPE' } as unknown as JobTask;

    expect(createJobsForTask(task, 'DRAFT')).toEqual([]);
  });
});
