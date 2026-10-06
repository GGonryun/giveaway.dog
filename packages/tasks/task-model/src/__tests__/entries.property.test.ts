import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { assertProperty } from '@giveaway/testing-server/property';
import { toCompletionValue } from '../entries';
import type { TaskSchema } from '../schemas';
import { VALID_TASKS } from '../testing/fixtures-task-schemas';

const taskValue = fc.double({ min: 1, max: 1_000_000, noNaN: true });

const verifiedBonus = fc.option(
  fc.double({ min: 1, max: 1_000_000, noNaN: true }),
  { nil: null }
);

const taskArb = fc
  .record({
    task: fc.constantFrom(...Object.values(VALID_TASKS)),
    value: taskValue,
    verifiedBonus: fc.oneof(verifiedBonus, fc.constant(undefined))
  })
  .map(
    ({ task, value, verifiedBonus }): TaskSchema =>
      task.type === 'TWITTER_LIKE_IMPORT' ||
      task.type === 'TWITTER_RETWEET_IMPORT'
        ? { ...task, value, verifiedBonus }
        : { ...task, value }
  );

const twitterProof = (twitterVerified: boolean) =>
  fc.record({
    source: fc.constant('twitter_import'),
    twitterUserId: fc.string(),
    twitterUsername: fc.string(),
    twitterVerified: fc.constant(twitterVerified),
    importedAt: fc.string(),
    validatedBy: fc.string()
  });

const proofArb = fc.oneof(
  fc.record({ verified: fc.constant(true), proof: twitterProof(true) }),
  fc.record({
    verified: fc.constant(false),
    proof: fc.oneof(twitterProof(false), fc.anything())
  })
);

const bonusOf = (task: TaskSchema) =>
  'verifiedBonus' in task ? (task.verifiedBonus ?? 0) : 0;

describe('completion value properties', () => {
  it('[ENTRY-002] a completion is worth a finite number of entries of at least 1, for every task type and any proof', () => {
    assertProperty(
      fc.property(taskArb, proofArb, (task, { proof }) => {
        const value = toCompletionValue({ task, proof });

        expect(Number.isFinite(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(1);
      })
    );
  });

  it('[ENTRY-003] the verified bonus is added only when the proof is verified', () => {
    assertProperty(
      fc.property(taskArb, proofArb, (task, { verified, proof }) => {
        expect(toCompletionValue({ task, proof })).toBe(
          verified ? task.value + bonusOf(task) : task.value
        );
      })
    );
  });
});
