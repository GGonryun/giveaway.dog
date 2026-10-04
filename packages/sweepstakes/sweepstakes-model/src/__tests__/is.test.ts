import { describe, it, expect } from 'vitest';
import { isStorablePrize, isStorableTask } from '../is';
import type {
  SweepstakesInputPrizeSchema,
  SweepstakesInputTaskSchema
} from '../db';

describe('isStorablePrize', () => {
  it('returns true for a prize with an id', () => {
    expect(isStorablePrize({ id: 'prize-1' })).toBe(true);
  });

  it('returns false for a prize with an empty id', () => {
    expect(isStorablePrize({ id: '', name: 'Prize' })).toBe(false);
  });

  it('returns false for a prize without an id', () => {
    expect(isStorablePrize({ name: 'Prize', quota: 1 })).toBe(false);
  });

  it.each([null, undefined])('returns false for a %s prize', (prize) => {
    expect(
      isStorablePrize(prize as unknown as SweepstakesInputPrizeSchema)
    ).toBe(false);
  });
});

describe('isStorableTask', () => {
  it('returns true for a task with an id', () => {
    expect(isStorableTask({ id: 'task-1', type: 'BONUS_TASK' })).toBe(true);
  });

  it('returns false for a task with an empty id', () => {
    expect(isStorableTask({ id: '', type: 'BONUS_TASK' })).toBe(false);
  });

  it('returns false for a task without an id', () => {
    expect(isStorableTask({ type: 'BONUS_TASK' })).toBe(false);
  });

  it.each([null, undefined])('returns false for a %s task', (task) => {
    expect(isStorableTask(task as unknown as SweepstakesInputTaskSchema)).toBe(
      false
    );
  });
});
