import { describe, it, expect } from 'vitest';
import { HISTORY_PAGE_SIZE, WINNERS_PAGE_SIZE } from '../pagination';

describe('pagination constants', () => {
  it('uses a history page size of 20', () => {
    expect(HISTORY_PAGE_SIZE).toBe(20);
  });

  it('uses a winners page size of 25', () => {
    expect(WINNERS_PAGE_SIZE).toBe(25);
  });
});
