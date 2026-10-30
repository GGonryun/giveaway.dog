import { describe, expect, it } from 'vitest';
import {
  MAX_IMPORT_INTERVAL_MINUTES,
  toImportIdleRuns,
  toImportIntervalMinutes,
  toNextImportRunAt
} from '../import-schedule';

const NOW = new Date('2026-10-01T12:00:00.000Z');
const MINUTE = 60 * 1000;

describe('toImportIdleRuns', () => {
  it.each([
    [undefined, true, 0],
    [3, true, 0],
    [undefined, false, 1],
    [0, false, 1],
    [3, false, 4]
  ])(
    'turns %s idle scans into %s when foundNew is %s',
    (idleRuns, foundNew, expected) => {
      expect(toImportIdleRuns({ idleRuns, foundNew })).toBe(expected);
    }
  );
});

describe('toImportIntervalMinutes', () => {
  it.each([
    [10, 0, 10],
    [10, 1, 20],
    [10, 3, 80],
    [360, 2, 1440],
    [360, 1000, 1440],
    [2000, 0, 1440],
    [0, 5, 0]
  ])(
    'waits %i minutes doubled %i times as %i minutes',
    (baseMinutes, idleRuns, expected) => {
      expect(toImportIntervalMinutes({ baseMinutes, idleRuns })).toBe(expected);
    }
  );

  it('caps the interval at one day', () => {
    expect(MAX_IMPORT_INTERVAL_MINUTES).toBe(1440);
  });
});

describe('toNextImportRunAt', () => {
  it('schedules the run after the interval when there is no end date', () => {
    expect(
      toNextImportRunAt({ now: NOW, baseMinutes: 15, idleRuns: 2 })
    ).toEqual(new Date(NOW.getTime() + 60 * MINUTE));
  });

  it('keeps the interval when the end date is later', () => {
    expect(
      toNextImportRunAt({
        now: NOW,
        baseMinutes: 15,
        idleRuns: 0,
        endDate: new Date(NOW.getTime() + 16 * MINUTE)
      })
    ).toEqual(new Date(NOW.getTime() + 15 * MINUTE));
  });

  it('runs at the end date when the interval would skip it', () => {
    const endDate = new Date(NOW.getTime() + 14 * MINUTE);

    expect(
      toNextImportRunAt({ now: NOW, baseMinutes: 15, idleRuns: 0, endDate })
    ).toEqual(endDate);
  });

  it.each([
    ['at', 0],
    ['after', MINUTE]
  ])('schedules nothing %s the end date', (_label, elapsed) => {
    expect(
      toNextImportRunAt({
        now: NOW,
        baseMinutes: 15,
        idleRuns: 0,
        endDate: new Date(NOW.getTime() - elapsed)
      })
    ).toBeNull();
  });
});
