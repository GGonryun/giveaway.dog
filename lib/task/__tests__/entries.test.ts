import { describe, it, expect } from 'vitest';
import { toCompletionValue, toParticipantEntries } from '../entries';
import type { TaskCompletionSchema } from '../completions';
import type { TaskOf, TaskSchema, TaskType } from '../schemas';
import { TASK_TYPES, VALID_TASKS } from './fixtures-task-schemas';

const LEGACY_IMPORT_TYPES: TaskType[] = [
  'TWITTER_RETWEET_IMPORT',
  'TWITTER_LIKE_IMPORT'
];

const FLAT_VALUE_TYPES = TASK_TYPES.filter(
  (type) => !LEGACY_IMPORT_TYPES.includes(type)
);

const twitterProof = (twitterVerified: boolean) => ({
  source: 'twitter_import',
  twitterUserId: 'tw-1',
  twitterUsername: 'doglover',
  twitterVerified,
  importedAt: '2026-01-01T00:00:00.000Z',
  validatedBy: 'importer'
});

const legacyImport = (
  type: 'TWITTER_RETWEET_IMPORT' | 'TWITTER_LIKE_IMPORT',
  overrides: Partial<TaskOf<typeof type>> = {}
): TaskSchema => ({
  ...VALID_TASKS[type],
  value: 4,
  verifiedBonus: 3,
  ...overrides
});

const completion = (
  task: TaskSchema,
  proof: unknown = null
): TaskCompletionSchema => ({
  id: `completion-${task.id}`,
  completedAt: new Date('2026-01-01T00:00:00.000Z'),
  status: 'COMPLETED',
  proof,
  task,
  sweepstake: { id: 'sweep-1', name: 'Sweep' }
});

describe('toCompletionValue', () => {
  describe('for task types without bonus rules', () => {
    it.each(FLAT_VALUE_TYPES)('returns the task value for %s', (type) => {
      const task = { ...VALID_TASKS[type], value: 7 } as TaskSchema;

      expect(toCompletionValue({ task, proof: twitterProof(true) })).toBe(7);
    });

    it.each(FLAT_VALUE_TYPES)(
      'ignores a verified bonus on %s even with a verified twitter proof',
      (type) => {
        const task = {
          ...VALID_TASKS[type],
          value: 7,
          verifiedBonus: 3
        } as unknown as TaskSchema;

        expect(toCompletionValue({ task, proof: twitterProof(true) })).toBe(7);
      }
    );
  });

  describe.each(
    LEGACY_IMPORT_TYPES as ('TWITTER_RETWEET_IMPORT' | 'TWITTER_LIKE_IMPORT')[]
  )('for %s tasks', (type) => {
    it('adds the verified bonus when the proof shows a verified account', () => {
      const task = legacyImport(type);

      expect(toCompletionValue({ task, proof: twitterProof(true) })).toBe(7);
    });

    it('returns only the base value when the account is not verified', () => {
      const task = legacyImport(type);

      expect(toCompletionValue({ task, proof: twitterProof(false) })).toBe(4);
    });

    it('returns only the base value when there is no verified bonus', () => {
      const task = legacyImport(type, { verifiedBonus: null });

      expect(toCompletionValue({ task, proof: twitterProof(true) })).toBe(4);
    });

    it('returns only the base value when the verified bonus is zero', () => {
      const task = legacyImport(type, { verifiedBonus: 0 });

      expect(toCompletionValue({ task, proof: twitterProof(true) })).toBe(4);
    });

    it('returns only the base value when the proof is not a twitter import proof', () => {
      const task = legacyImport(type);

      expect(
        toCompletionValue({
          task,
          proof: { ...twitterProof(true), source: 'manual' }
        })
      ).toBe(4);
    });

    it('returns only the base value when there is no proof', () => {
      const task = legacyImport(type);

      expect(toCompletionValue({ task, proof: null })).toBe(4);
    });
  });

  it('throws for an unknown task type', () => {
    const task = {
      ...VALID_TASKS.BONUS_TASK,
      type: 'UNKNOWN'
    } as unknown as TaskSchema;

    expect(() => toCompletionValue({ task, proof: null })).toThrow(
      'Unexpected value: [object Object]'
    );
  });
});

describe('toParticipantEntries', () => {
  it('returns zero when there are no completions', () => {
    expect(toParticipantEntries([])).toBe(0);
  });

  it('sums the value of every completion including verified bonuses', () => {
    const completions = [
      completion({ ...VALID_TASKS.BONUS_TASK, value: 1 }),
      completion({ ...VALID_TASKS.VISIT_URL, value: 5 }),
      completion(legacyImport('TWITTER_LIKE_IMPORT'), twitterProof(true)),
      completion(legacyImport('TWITTER_RETWEET_IMPORT'), twitterProof(false))
    ];

    expect(toParticipantEntries(completions)).toBe(1 + 5 + 7 + 4);
  });

  it('counts completions regardless of their status', () => {
    const rejected = {
      ...completion({ ...VALID_TASKS.BONUS_TASK, value: 3 }),
      status: 'REJECTED' as const
    };

    expect(toParticipantEntries([rejected])).toBe(3);
  });

  it('throws when any completion has an unknown task type', () => {
    const broken = completion({
      ...VALID_TASKS.BONUS_TASK,
      type: 'UNKNOWN'
    } as unknown as TaskSchema);

    expect(() =>
      toParticipantEntries([completion(VALID_TASKS.BONUS_TASK), broken])
    ).toThrow('Unexpected value: [object Object]');
  });
});
