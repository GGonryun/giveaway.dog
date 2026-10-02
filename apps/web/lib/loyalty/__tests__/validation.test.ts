import { describe, it, expect } from 'vitest';
import { isLoyal } from '../validation';
import type { BonusLoyaltyTaskSchema } from '../../task/schemas';

const loyaltyTask = (loyaltyRequired: number): BonusLoyaltyTaskSchema => ({
  id: 'task-1',
  type: 'BONUS_LOYALTY',
  title: 'Loyal fan',
  value: 1,
  mandatory: false,
  tasksRequired: 0,
  loyaltyRequired
});

describe('isLoyal', () => {
  it('returns true when loyalty equals the requirement', () => {
    expect(isLoyal(3, loyaltyTask(3))).toBe(true);
  });

  it('returns true when loyalty exceeds the requirement', () => {
    expect(isLoyal(10, loyaltyTask(3))).toBe(true);
  });

  it('returns false when loyalty is below the requirement', () => {
    expect(isLoyal(2, loyaltyTask(3))).toBe(false);
  });

  it('returns false for zero loyalty with the minimum requirement of one', () => {
    expect(isLoyal(0, loyaltyTask(1))).toBe(false);
  });
});
