import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Prisma } from '@prisma/client';
import {
  TASK_COMPLETIONS_SELECT_QUERY,
  taskCompletionSchema,
  toMostRecentCompletion,
  toTaskCompletion,
  type TaskCompletionSchema
} from '../completions';
import { DEFAULT_SWEEPSTAKES_NAME } from '@giveaway/app-config/settings';
import {
  storedTask,
  toStoredConfig,
  VALID_TASKS
} from './fixtures-task-schemas';

type CompletionRow = Parameters<typeof toTaskCompletion>[0];

const completionRow = (
  overrides: Partial<CompletionRow> = {},
  details: { name: string } | null = { name: 'Summer Giveaway' },
  config: Prisma.JsonValue = toStoredConfig(VALID_TASKS.VISIT_URL)
): CompletionRow => ({
  id: 'completion-1',
  completedAt: new Date('2026-05-01T10:00:00.000Z'),
  proof: { answer: 'yes' },
  status: 'COMPLETED',
  task: {
    ...storedTask(config, { id: 'task-9', sweepstakesId: 'sweep-7' }),
    sweepstakes: { details }
  },
  ...overrides
});

const completionAt = (iso: string, id = iso): TaskCompletionSchema => ({
  id,
  completedAt: new Date(iso),
  status: 'COMPLETED',
  proof: null,
  task: VALID_TASKS.BONUS_TASK,
  sweepstake: { id: 'sweep-1', name: 'Sweep' }
});

describe('taskCompletionSchema', () => {
  const valid = {
    id: 'completion-1',
    completedAt: '2026-05-01T10:00:00.000Z',
    status: 'PENDING',
    proof: { anything: true },
    task: VALID_TASKS.BONUS_TASK,
    sweepstake: { id: 'sweep-1', name: 'Sweep' }
  };

  it('coerces an ISO string completion date into a Date', () => {
    const parsed = taskCompletionSchema.parse(valid);

    expect(parsed.completedAt).toEqual(new Date('2026-05-01T10:00:00.000Z'));
  });

  it('coerces an epoch number completion date into a Date', () => {
    const parsed = taskCompletionSchema.parse({ ...valid, completedAt: 0 });

    expect(parsed.completedAt).toEqual(new Date(0));
  });

  it('rejects an unparseable completion date', () => {
    expect(
      taskCompletionSchema.safeParse({ ...valid, completedAt: 'not a date' })
        .success
    ).toBe(false);
  });

  it.each(['PENDING', 'COMPLETED', 'REJECTED'])(
    'accepts the %s status',
    (status) => {
      expect(taskCompletionSchema.safeParse({ ...valid, status }).success).toBe(
        true
      );
    }
  );

  it('rejects an unknown status', () => {
    expect(
      taskCompletionSchema.safeParse({ ...valid, status: 'APPROVED' }).success
    ).toBe(false);
  });

  it('accepts a missing proof', () => {
    const parsed = taskCompletionSchema.parse({ ...valid, proof: undefined });

    expect(parsed.proof).toBeUndefined();
  });

  it('rejects a task that does not match the task schema', () => {
    expect(
      taskCompletionSchema.safeParse({
        ...valid,
        task: { ...VALID_TASKS.BONUS_TASK, title: '' }
      }).success
    ).toBe(false);
  });

  it('requires the sweepstake name', () => {
    expect(
      taskCompletionSchema.safeParse({
        ...valid,
        sweepstake: { id: 'sweep-1' }
      }).success
    ).toBe(false);
  });
});

describe('TASK_COMPLETIONS_SELECT_QUERY', () => {
  it('selects the completion fields and the task with its sweepstakes name', () => {
    expect(TASK_COMPLETIONS_SELECT_QUERY).toEqual({
      id: true,
      completedAt: true,
      proof: true,
      task: {
        include: {
          sweepstakes: {
            select: { details: { select: { name: true } } }
          }
        }
      },
      status: true
    });
  });
});

describe('toTaskCompletion', () => {
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('maps a completion row with a parsed task and sweepstake summary', () => {
    const row = completionRow();

    expect(toTaskCompletion(row)).toEqual({
      id: 'completion-1',
      completedAt: new Date('2026-05-01T10:00:00.000Z'),
      status: 'COMPLETED',
      proof: { answer: 'yes' },
      task: { ...VALID_TASKS.VISIT_URL, id: 'task-9' },
      sweepstake: { id: 'sweep-7', name: 'Summer Giveaway' }
    });
  });

  it('keeps the completed at Date instance from the row', () => {
    const row = completionRow();

    expect(toTaskCompletion(row).completedAt).toBe(row.completedAt);
  });

  it('falls back to the default sweepstakes name when details are missing', () => {
    const row = completionRow({}, null);

    expect(toTaskCompletion(row).sweepstake).toEqual({
      id: 'sweep-7',
      name: DEFAULT_SWEEPSTAKES_NAME
    });
    expect(DEFAULT_SWEEPSTAKES_NAME).toBe('Untitled Sweepstakes');
  });

  it('keeps an empty sweepstakes name instead of using the default', () => {
    const row = completionRow({}, { name: '' });

    expect(toTaskCompletion(row).sweepstake.name).toBe('');
  });

  it('substitutes an unknown bonus task when the stored config is invalid', () => {
    const row = completionRow({}, { name: 'Sweep' }, { type: 'NOPE' });

    expect(toTaskCompletion(row).task).toEqual({
      type: 'BONUS_TASK',
      id: 'task-9',
      title: 'Unknown Task',
      value: 1,
      mandatory: false,
      tasksRequired: 0
    });
    expect(consoleError).toHaveBeenCalledTimes(1);
  });

  it('passes through a null proof', () => {
    const row = completionRow({ proof: null });

    expect(toTaskCompletion(row).proof).toBeNull();
  });
});

describe('toMostRecentCompletion', () => {
  it('returns null when there are no completions', () => {
    expect(toMostRecentCompletion([])).toBeNull();
  });

  it('returns the completion date of a single completion', () => {
    const only = completionAt('2026-01-01T00:00:00.000Z');

    expect(toMostRecentCompletion([only])).toBe(only.completedAt);
  });

  it('returns the latest completion date regardless of input order', () => {
    const latest = completionAt('2026-03-01T00:00:00.000Z');
    const completions = [
      completionAt('2026-01-01T00:00:00.000Z'),
      latest,
      completionAt('2026-02-01T00:00:00.000Z')
    ];

    expect(toMostRecentCompletion(completions)).toBe(latest.completedAt);
  });

  it('returns the first of several completions sharing the latest date', () => {
    const first = completionAt('2026-03-01T00:00:00.000Z', 'a');
    const second = completionAt('2026-03-01T00:00:00.000Z', 'b');

    expect(toMostRecentCompletion([first, second])).toBe(first.completedAt);
  });

  it('ignores completions with a null completion date', () => {
    const dated = completionAt('2026-01-01T00:00:00.000Z');
    const undated = {
      ...completionAt('2026-02-01T00:00:00.000Z'),
      completedAt: null
    } as unknown as TaskCompletionSchema;

    expect(toMostRecentCompletion([undated, dated])).toBe(dated.completedAt);
  });

  it('does not filter out undefined completion dates and fails to compare them', () => {
    const undated = {
      ...completionAt('2026-02-01T00:00:00.000Z'),
      completedAt: undefined
    } as unknown as TaskCompletionSchema;

    expect(() =>
      toMostRecentCompletion([
        undated,
        completionAt('2026-01-01T00:00:00.000Z')
      ])
    ).toThrow(TypeError);
  });

  it('returns null when every completion has a null completion date', () => {
    const undated = {
      ...completionAt('2026-02-01T00:00:00.000Z'),
      completedAt: null
    } as unknown as TaskCompletionSchema;

    expect(toMostRecentCompletion([undated])).toBeNull();
  });

  it('does not reorder the input array', () => {
    const completions = [
      completionAt('2026-01-01T00:00:00.000Z', 'old'),
      completionAt('2026-03-01T00:00:00.000Z', 'new')
    ];

    toMostRecentCompletion(completions);

    expect(completions.map((c) => c.id)).toEqual(['old', 'new']);
  });
});
